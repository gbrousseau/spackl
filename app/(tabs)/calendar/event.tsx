import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Save, Trash2, Search, X, UserPlus, User, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import { useNotifications } from '@/context/NotificationContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Participant = {
  id: string;
  name: string;
  email?: string;
  imageAvailable?: boolean;
  image?: { uri: string };
};

export default function EventScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { refreshEvents } = useCalendar();
  const { sendEventNotification } = useNotifications();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const calendarId = typeof params.calendarId === 'string' ? params.calendarId : null;
  
  const [event, setEvent] = useState({
    title: '',
    startDate: new Date(),
    endDate: addDays(new Date(), 1),
    location: '',
    notes: '',
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contacts, setContacts] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const loadEvent = async () => {
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

      // First check if the calendar exists
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendar = calendars.find(cal => cal.id === calendarId);
      
      if (!calendar) {
        setError('Calendar not found');
        setLoading(false);
        return;
      }

      try {
        const eventDetails = await Calendar.getEventAsync(id);
        
        if (!eventDetails) {
          setError('Event not found');
          router.back(); // Navigate back if event doesn't exist
          return;
        }

        setEvent({
          title: eventDetails.title,
          startDate: new Date(eventDetails.startDate),
          endDate: new Date(eventDetails.endDate),
          location: eventDetails.location || '',
          notes: eventDetails.notes || '',
        });

        if (eventDetails.attendees) {
          setParticipants(eventDetails.attendees.map(attendee => ({
            id: attendee.email || attendee.name,
            name: attendee.name || attendee.email || '',
            email: attendee.email,
          })));
        }
      } catch (eventErr) {
        console.error('Error loading event:', eventErr);
        setError('Event not found');
        router.back(); // Navigate back if event doesn't exist
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
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
        },
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
        fields: [Contacts.Fields.Emails, Contacts.Fields.Image],
      });

      const formattedContacts = data.map(contact => ({
        id: contact.id,
        name: contact.name || 'No Name',
        email: contact.emails?.[0]?.email,
        imageAvailable: contact.imageAvailable,
        image: contact.image,
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
                await Calendar.deleteEventAsync(id);
                await refreshEvents(new Date()); // Refresh events after deletion
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

        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find(calendar => 
          calendar.isPrimary && calendar.allowsModifications
        );

        if (!defaultCalendar) {
          setError('No writable calendar found');
          return;
        }

        const eventDetails = {
          title: event.title || 'New Event',
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          notes: event.notes,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          availability: 'busy' as const,
          status: 'confirmed' as const,
          alarms: [{
            relativeOffset: -30,
          }],
        };

        if (id) {
          await Calendar.updateEventAsync(id, eventDetails);
        } else {
          await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
        }

        await refreshEvents(new Date());
      }
      
      // Send notifications to participants
      await sendEventNotification(participants, {
        title: event.title,
        startDate: event.startDate,
        location: event.location,
      });

      router.back();
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event');
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEvent(prev => {
        const newDate = new Date(selectedDate);
        const currentStart = new Date(prev.startDate);
        
        // Preserve the time from the current start date
        newDate.setHours(currentStart.getHours());
        newDate.setMinutes(currentStart.getMinutes());
        
        return {
          ...prev,
          startDate: newDate,
          // If end date is before new start date, update it
          endDate: newDate > prev.endDate ? newDate : prev.endDate,
        };
      });
    }
    setShowStartDatePicker(false);
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEvent(prev => {
        const newDate = new Date(prev.startDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        
        return {
          ...prev,
          startDate: newDate,
          // If end time is before new start time on the same day, update it
          endDate: newDate > prev.endDate ? newDate : prev.endDate,
        };
      });
    }
    setShowStartTimePicker(false);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEvent(prev => {
        const newDate = new Date(selectedDate);
        const currentEnd = new Date(prev.endDate);
        
        // Preserve the time from the current end date
        newDate.setHours(currentEnd.getHours());
        newDate.setMinutes(currentEnd.getMinutes());
        
        return {
          ...prev,
          endDate: newDate,
          // If start date is after new end date, update it
          startDate: newDate < prev.startDate ? newDate : prev.startDate,
        };
      });
    }
    setShowEndDatePicker(false);
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEvent(prev => {
        const newDate = new Date(prev.endDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        
        return {
          ...prev,
          endDate: newDate,
          // If start time is after new end time on the same day, update it
          startDate: newDate < prev.startDate ? newDate : prev.startDate,
        };
      });
    }
    setShowEndTimePicker(false);
  };

  const renderDateTimePicker = (
    isStart: boolean,
    isDate: boolean,
    show: boolean,
    onChange: (event: any, date?: Date) => void
  ) => {
    if (!show) return null;

    return (
      <DateTimePicker
        value={isStart ? event.startDate : event.endDate}
        mode={isDate ? 'date' : 'time'}
        is24Hour={false}
        onChange={onChange}
        style={{ backgroundColor: 'white' }}
      />
    );
  };

  const addParticipant = (contact: Participant) => {
    if (!participants.find(p => p.id === contact.id)) {
      setParticipants([...participants, contact]);
    }
    setShowContactPicker(false);
  };

  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const filteredContacts = contacts.filter(contact => {
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

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, isDark && styles.textLight]}>Start</Text>
            <View style={[styles.dateTimeContainer, isDark && styles.dateTimeContainerDark]}>
              <Pressable
                style={styles.dateTimePicker}
                onPress={() => setShowStartDatePicker(true)}>
                <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
                  {format(event.startDate, 'MMM d, yyyy')}
                </Text>
                <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
              <Pressable
                style={[styles.dateTimePicker, styles.timePickerBorder]}
                onPress={() => setShowStartTimePicker(true)}>
                <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
                  {format(event.startDate, 'h:mm a')}
                </Text>
                <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>
            {renderDateTimePicker(true, true, showStartDatePicker, onStartDateChange)}
            {renderDateTimePicker(true, false, showStartTimePicker, onStartTimeChange)}
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, isDark && styles.textLight]}>End</Text>
            <View style={[styles.dateTimeContainer, isDark && styles.dateTimeContainerDark]}>
              <Pressable
                style={styles.dateTimePicker}
                onPress={() => setShowEndDatePicker(true)}>
                <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
                  {format(event.endDate, 'MMM d, yyyy')}
                </Text>
                <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
              <Pressable
                style={[styles.dateTimePicker, styles.timePickerBorder]}
                onPress={() => setShowEndTimePicker(true)}>
                <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
                  {format(event.endDate, 'h:mm a')}
                </Text>
                <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>
            {renderDateTimePicker(false, true, showEndDatePicker, onEndDateChange)}
            {renderDateTimePicker(false, false, showEndTimePicker, onEndTimeChange)}
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
              onPress={() => setShowContactPicker(true)}>
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
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </Pressable>
              )}
            </View>

            <ScrollView style={styles.contactsList}>
              {filteredContacts.map((contact) => (
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
              ))}
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
            style={styles.saveButton} 
            onPress={handleSaveEvent}>
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    color: '#ef4444',
    fontSize: 14,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 100,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dateTimeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dateTimeContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  dateTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  timePickerBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dateTimeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
    marginLeft: 8,
  },
  addParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  addParticipantText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 4,
  },
  participantsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  participantsListDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  participantItemDark: {
    backgroundColor: '#0f172a',
  },
  participantImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  participantImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    color: '#0f172a',
  },
  participantEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  removeParticipantButton: {
    padding: 4,
  },
  noParticipants: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    alignItems: 'center',
  },
  noParticipantsDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  noParticipantsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  contactPicker: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    maxHeight: 300,
  },
  contactPickerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
    marginRight: 8,
  },
  contactsList: {
    padding: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactItemDark: {
    backgroundColor: '#0f172a',
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    flex: 1,
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
  }
});