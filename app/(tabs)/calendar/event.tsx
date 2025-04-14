import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { addDays } from 'date-fns';
import { Users, Save, Trash2, Search, X, UserPlus, User } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { DateTimePicker } from '@/components/DateTimePicker';
import { useEventSync } from '@/hooks/useEventSync';
import { EventService } from '@/services/EventService';
import { FIREBASE_AUTH } from '@/firebaseConfig';

type Participant = {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  imageAvailable?: boolean;
  image?: { uri: string };
};

export default function EventScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { refreshEvents } = useCalendar();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const calendarId = typeof params.calendarId === 'string' ? params.calendarId : null;
  const forceNew = typeof params.forceNew === 'string' ? params.forceNew === 'true' : false;
  const selectedDateParam = typeof params.selectedDate === 'string' ? params.selectedDate : null;
  const { saveEvent, updateEvent, loading: isSaving, deleteEvent } = useEventSync();
  
  // Get the current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Create a date object for the selected date with current time
  const getSelectedDateWithCurrentTime = () => {
    if (selectedDateParam) {
      const selectedDate = new Date(selectedDateParam);
      selectedDate.setHours(currentHour, currentMinute, 0, 0);
      return selectedDate;
    }
    return now;
  };
  
  // Create a date object for the end time (1 hour after start)
  const getEndDateWithOffset = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    return endDate;
  };
  
  const [event, setEvent] = useState({
    title: '',
    startDate: getSelectedDateWithCurrentTime(),
    endDate: getEndDateWithOffset(getSelectedDateWithCurrentTime()),
    location: '',
    notes: '',
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contacts, setContacts] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to reset form state
  const resetFormState = () => {
    const startDate = getSelectedDateWithCurrentTime();
    const endDate = getEndDateWithOffset(startDate);
    
    setEvent({
      title: '',
      startDate: startDate,
      endDate: endDate,
      location: '',
      notes: '',
    });
    setParticipants([]);
    setSearchQuery('');
    setError(null);
  };

  const loadEvent = async () => {
    if (forceNew) {
      setLoading(false);
      return;
    }

    if (!id || !calendarId) {
      setLoading(false);
      return;
    }

    if (Platform.OS === 'web') {
      setEvent({
        title: 'Sample Event',
        startDate: new Date(),
        endDate: addDays(new Date(), 1),
        location: 'Sample Location',
        notes: 'Sample Notes',
      });
      setParticipants([
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        setError('Calendar permission was denied');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendar = calendars.find(cal => cal.id === calendarId);
      
      if (!calendar) {
        setError('Calendar not found');
        setLoading(false);
        return;
      }

      try {
        // Get event from local calendar
        const eventDetails = await Calendar.getEventAsync(id);
        
        if (!eventDetails) {
          setError('Event not found');
          router.back();
          return;
        }

        // Set basic event details from local calendar
        setEvent({
          title: eventDetails.title,
          startDate: new Date(eventDetails.startDate),
          endDate: new Date(eventDetails.endDate),
          location: eventDetails.location || '',
          notes: eventDetails.notes || '',
        });

        // Try to get attendees from local calendar first
        if ('attendees' in eventDetails) {
          setParticipants((eventDetails.attendees as Array<{email?: string, name?: string, phoneNumber?: string}>).map(attendee => ({
            id: attendee.email || attendee.name || '',
            name: attendee.name || attendee.email || '',
            email: attendee.email || '',
            phoneNumber: attendee.phoneNumber || '',
          })));
        }

        // Also fetch event details from Firestore to get the complete attendee list
        try {
          const currentUser = FIREBASE_AUTH.currentUser;
          if (!currentUser) {
            console.warn('No authenticated user found, skipping Firestore fetch');
            return;
          }
          
          const eventService = new EventService(currentUser.uid);
          const firestoreEvent = await eventService.getEvent(id);
          
          if (firestoreEvent && firestoreEvent.attendees && firestoreEvent.attendees.length > 0) {
            // Update participants with Firestore data
            setParticipants(firestoreEvent.attendees.map((attendee: {name?: string, email?: string, phoneNumber?: string}) => ({
              id: attendee.email || attendee.name || '',
              name: attendee.name || attendee.email || '',
              email: attendee.email || '',
              phoneNumber: attendee.phoneNumber || '',
            })));
          }
        } catch (firestoreErr) {
          console.error('Error fetching event from Firestore:', firestoreErr);
          // Continue with local calendar data if Firestore fetch fails
        }
      } catch (eventErr) {
        console.error('Error loading event:', eventErr);
        setError('Event not found');
        router.back();
      }
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (Platform.OS === 'web') {
      setContacts([
        {
          id: '1',
          name: 'Geoff Brousseau',
          email: 'imaweinerdog@gmail.com',
          phoneNumber: '818-481-0612',
          imageAvailable: false
        },
        {
          id: '2',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '555-123-4567',
          imageAvailable: false
        },
        {
          id: '3',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phoneNumber: '555-987-6543',
          imageAvailable: false
        },
        {
          id: '4',
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phoneNumber: '555-456-7890',
          imageAvailable: false
        },
        {
          id: '5',
          name: 'Sarah Williams',
          email: 'sarah.williams@example.com',
          phoneNumber: '555-789-0123',
          imageAvailable: false
        },
        {
          id: '6',
          name: 'David Brown',
          email: 'david.brown@example.com',
          phoneNumber: '555-234-5678',
          imageAvailable: false
        },
        {
          id: '7',
          name: 'Emily Davis',
          email: 'emily.davis@example.com',
          phoneNumber: '555-678-9012',
          imageAvailable: false
        },
        {
          id: '8',
          name: 'Robert Wilson',
          email: 'robert.wilson@example.com',
          phoneNumber: '555-345-6789',
          imageAvailable: false
        },
        {
          id: '9',
          name: 'Lisa Anderson',
          email: 'lisa.anderson@example.com',
          phoneNumber: '555-890-1234',
          imageAvailable: false
        },
        {
          id: '10',
          name: 'James Taylor',
          email: 'james.taylor@example.com',
          phoneNumber: '555-567-8901',
          imageAvailable: false
        }
      ]);
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Contacts permission was denied');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      // Filter contacts to only include those with a phone number
      const contactsWithPhone = data.filter(contact => 
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      );

      const formattedContacts = contactsWithPhone.map(contact => ({
        id: contact.id || `contact-${Math.random().toString(36).substring(2, 9)}`,
        name: contact.name || 'No Name',
        email: contact.emails?.[0]?.email,
        phoneNumber: contact.phoneNumbers?.[0]?.number,
        imageAvailable: contact.imageAvailable,
        image: contact.image?.uri ? { uri: contact.image.uri } : undefined,
      }));

      setContacts(formattedContacts);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  useEffect(() => {
    loadEvent();
    loadContacts();
  }, [id, calendarId]);

  const handleDeleteEvent = async () => {
    if (!id || !calendarId) {
      setError('Invalid event or calendar ID');
      return;
    }

    if (Platform.OS === 'web') {
      console.log('Deleting events not supported on web');
      router.back();
      return;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        setError('Calendar permission was denied');
        return;
      }

      Alert.alert(
        'Delete Event',
        'Are you sure you want to delete this event?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Use EventService to delete the event (this will also remove invitations)
                await deleteEvent(id);
                
                // Reset form state
                resetFormState();
                
                // Refresh the calendar view
                await refreshEvents(new Date());
                router.back();
              } catch (err) {
                console.error('Error deleting event:', err);
                setError('Failed to delete event');
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error accessing calendar:', err);
      setError('Failed to access calendar');
    }
  };

  const handleSaveEvent = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          setError('Calendar permission was denied');
          return;
        }
      }

      const eventDetails = {
        title: event.title || 'New Event',
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        notes: event.notes,
        attendees: participants.map(participant => ({
          name: participant.name,
          email: participant.email,
          phoneNumber: participant.phoneNumber,
          status: 'pending',
        })),
      };

      if (forceNew || !id) {
        const savedEvent = await saveEvent(eventDetails);
        if (!savedEvent) {
          throw new Error('Failed to save event');
        }
      } else {
        const updatedEvent = await updateEvent(id, eventDetails);
        if (!updatedEvent) {
          throw new Error('Failed to update event');
        }
      }

      // Reset form state
      resetFormState();
      
      await refreshEvents(new Date());
      
      // Send notifications to participants if available
      if (Platform.OS !== 'web' && participants.length > 0) {
        try {
          await sendEventNotification(participants, {
            title: event.title,
            startDate: event.startDate,
            location: event.location,
          });
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
          // Continue with navigation even if notifications fail
        }
      }

      router.back();
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event');
    }
  };

  const addParticipant = (contact: Participant) => {
    if (!participants.find(p => p.id === contact.id)) {
      setParticipants([...participants, contact]);
    }
    setSearchQuery('');
  };

  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const filteredContacts = contacts.filter(contact => {
    if (participants.some(p => p.id === contact.id)) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(' ');
    const searchString = `${contact.name} ${contact.email || ''}`.toLowerCase();
    return searchTerms.every(term => searchString.includes(term));
  });

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <Text style={[styles.loadingText, isDark && styles.textLight]}>Loading event details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Event Title</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark, isDark && styles.textLight]}
            value={event.title}
            onChangeText={(text) => setEvent({ ...event, title: text })}
            placeholder="Enter event title"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Start</Text>
          <View style={[styles.dateTimeContainer, isDark && styles.dateTimeContainerDark]}>
            <DateTimePicker
              value={event.startDate}
              onChange={(date) => {
                setEvent(prev => ({
                  ...prev,
                  startDate: date,
                  endDate: date > prev.endDate ? date : prev.endDate,
                }));
              }}
              mode="date"
              isDark={isDark}
            />
          </View>
          <View style={[styles.timeContainer, isDark && styles.timeContainerDark]}>
            <DateTimePicker
              value={event.startDate}
              onChange={(date) => {
                setEvent(prev => ({
                  ...prev,
                  startDate: date,
                  endDate: date > prev.endDate ? date : prev.endDate,
                }));
              }}
              mode="time"
              isDark={isDark}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>End</Text>
          <View style={[styles.dateTimeContainer, isDark && styles.dateTimeContainerDark]}>
            <DateTimePicker
              value={event.endDate}
              onChange={(date) => {
                setEvent(prev => ({
                  ...prev,
                  endDate: date,
                  startDate: date < prev.startDate ? date : prev.startDate,
                }));
              }}
              mode="date"
              isDark={isDark}
            />
          </View>
          <View style={[styles.timeContainer, isDark && styles.timeContainerDark]}>
            <DateTimePicker
              value={event.endDate}
              onChange={(date) => {
                setEvent(prev => ({
                  ...prev,
                  endDate: date,
                  startDate: date < prev.startDate ? date : prev.startDate,
                }));
              }}
              mode="time"
              isDark={isDark}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Location</Text>
          <LocationAutocomplete
            value={event.location}
            onLocationSelect={(location) => setEvent({ ...event, location })}
            isDark={isDark}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, isDark && styles.textLight]}>Participants</Text>
            <Pressable
              style={styles.addParticipantButton}
              onPress={() => {
                setShowContactPicker(true);
                setSearchQuery('');
              }}>
              <UserPlus size={20} color="#0891b2" />
              <Text style={styles.addParticipantText}>Add</Text>
            </Pressable>
          </View>

          {participants.length > 0 ? (
            <View style={[styles.participantsList, isDark && styles.participantsListDark]}>
              {participants.map((participant) => (
                <View key={participant.id} style={[styles.participantItem, isDark && styles.participantItemDark]}>
                  {participant.imageAvailable && participant.image ? (
                    <Image
                      source={{ uri: participant.image.uri }}
                      style={styles.participantImage}
                    />
                  ) : (
                    <View style={[styles.participantImagePlaceholder, isDark && styles.participantImagePlaceholderDark]}>
                      <User size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </View>
                  )}
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, isDark && styles.textLight]}>{participant.name}</Text>
                    {participant.email && (
                      <Text style={[styles.participantEmail, isDark && styles.textMuted]}>{participant.email}</Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeParticipantButton}
                    onPress={() => removeParticipant(participant.id)}>
                    <X size={16} color="#ef4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.noParticipants, isDark && styles.noParticipantsDark]}>
              <Users size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.noParticipantsText, isDark && styles.textMuted]}>No participants added</Text>
            </View>
          )}
        </View>

        {showContactPicker && (
          <View style={[styles.contactPicker, isDark && styles.contactPickerDark]}>
            <View style={styles.searchContainer}>
              <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.searchInput, isDark && styles.textLight]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search contacts..."
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </Pressable>
              )}
            </View>

            <ScrollView 
              style={styles.contactsList}
              contentContainerStyle={styles.contactsListContent}
              showsVerticalScrollIndicator={true}
              bounces={true}>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <Pressable
                    key={contact.id}
                    style={[styles.contactItem, isDark && styles.contactItemDark]}
                    onPress={() => addParticipant(contact)}>
                    {contact.imageAvailable && contact.image ? (
                      <Image
                        source={{ uri: contact.image.uri }}
                        style={styles.contactImage}
                      />
                    ) : (
                      <View style={[styles.contactImagePlaceholder, isDark && styles.contactImagePlaceholderDark]}>
                        <User size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                      </View>
                    )}
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, isDark && styles.textLight]}>{contact.name}</Text>
                      {contact.email && (
                        <Text style={[styles.contactEmail, isDark && styles.textMuted]}>{contact.email}</Text>
                      )}
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={styles.noContactsMessage}>
                  <Text style={[styles.noContactsText, isDark && styles.textMuted]}>
                    {searchQuery.trim() 
                      ? 'No contacts found matching your search'
                      : 'No more contacts available to add'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark, isDark && styles.textLight]}
            value={event.notes}
            onChangeText={(text) => setEvent({ ...event, notes: text })}
            placeholder="Add notes"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          {id && (
            <Pressable 
              style={[styles.deleteButton, isDark && styles.deleteButtonDark]} 
              onPress={handleDeleteEvent}>
              <Trash2 size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete Event</Text>
            </Pressable>
          )}

          <Pressable 
            style={[styles.saveButton, isSaving && styles.buttonDisabled]} 
            onPress={handleSaveEvent}
            disabled={isSaving}>
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : id ? 'Save Changes' : 'Create Event'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  dateTimeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    marginBottom: 12,
  },
  dateTimeContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  timeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  timeContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
  },
  addParticipantText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 6,
  },
  participantsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  participantsListDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  participantItemDark: {
    backgroundColor: '#0f172a',
  },
  participantImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantImagePlaceholderDark: {
    backgroundColor: '#1e293b',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#0f172a',
  },
  participantEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  removeParticipantButton: {
    padding: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  noParticipants: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  noParticipantsDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  noParticipantsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  contactPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  contactPickerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
    marginRight: 12,
  },
  contactsList: {
    maxHeight: 300,
  },
  contactsListContent: {
    padding: 12,
    overflow: 'scroll',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactItemDark: {
    backgroundColor: '#0f172a',
  },
  contactImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contactImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactImagePlaceholderDark: {
    backgroundColor: '#0f172a',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  contactEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
    width: '100%',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    flex: 1,
  },
  deleteButtonDark: {
    backgroundColor: '#450a0a',
  },
  deleteButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    flex: 1,
    shadowColor: '#0891b2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
  noContactsMessage: {
    padding: 24,
    alignItems: 'center',
  },
  noContactsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

function sendEventNotification(participants: Participant[], eventDetails: { title: string; startDate: Date; location: string; }) {
  // This is a placeholder implementation
  // In a real app, you would use a notification service like Firebase Cloud Messaging
  console.log('Sending notifications to participants:', participants);
  console.log('Event details:', eventDetails);
  
  // Return a resolved promise to indicate success
  return Promise.resolve();
}
