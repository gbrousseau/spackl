import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Save,
  Trash2,
  Search,
  X,
  UserPlus,
  User,
  ChevronDown,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import { useNotifications } from '@/context/NotificationContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Image as ContactImage } from 'expo-contacts';

const EventScreen = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const { sendEventNotification } = useNotifications();
  const { events } = useCalendar();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 1));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Contacts.Contact[]>(
    [],
  );
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.title) {
      setTitle(params.title as string);
    }
    if (params.description) {
      setDescription(params.description as string);
    }
    if (params.location) {
      setLocation(params.location as string);
    }
  }, [params]);

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title for the event');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const defaultCalendar =
        calendars.find((cal) => cal.isPrimary) || calendars[0];

      if (!defaultCalendar) {
        throw new Error('No calendar found');
      }

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title,
        notes: description,
        location,
        startDate,
        endDate,
        alarms: [
          {
            relativeOffset: -30, // 30 minutes before
          },
        ],
      });

      // Schedule notification
      await sendEventNotification(
        selectedContacts.map((contact) => ({
          name: contact.name || 'Unknown',
          email: contact.emails?.[0]?.email,
        })),
        {
          title,
          startDate,
          location,
        },
      );

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendSharingInvite = async (contact: Contacts.Contact) => {
    const phoneNumber = contact.phoneNumbers?.[0]?.number;
    if (!phoneNumber) {
      return;
    }

    const message = `Join me for ${title} on ${format(startDate, 'PPp')}${location ? ` at ${location}` : ''}`;
    // TODO: Implement sharing logic
  };

  const handlePickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Permission to access contacts was denied');
      return;
    }

    setShowContactPicker(true);
  };

  const handleContactSelect = async (contact: Contacts.Contact) => {
    if (contact.id) {
      setSelectedContacts((prev) => [...prev, contact]);
    }
    setShowContactPicker(false);
  };

  const removeContact = (contactId: string | undefined) => {
    if (contactId) {
      setSelectedContacts((prev) =>
        prev.filter((contact) => contact.id !== contactId),
      );
    }
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View
          style={[styles.inputContainer, isDark && styles.inputContainerDark]}
        >
          <TextInput
            style={[styles.input, isDark && styles.textLight]}
            placeholder="Event Title"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View
          style={[styles.inputContainer, isDark && styles.inputContainerDark]}
        >
          <TextInput
            style={[styles.input, isDark && styles.textLight]}
            placeholder="Description"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <LocationAutocomplete
          value={location}
          onLocationSelect={setLocation}
          isDark={isDark}
          disabled={isLoading}
        />

        <View style={styles.dateTimeContainer}>
          <Pressable
            style={[styles.dateTimePicker, isDark && styles.dateTimePickerDark]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
              {format(startDate, 'PP')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.dateTimePicker, isDark && styles.dateTimePickerDark]}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
              {format(startDate, 'p')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dateTimeContainer}>
          <Pressable
            style={[styles.dateTimePicker, isDark && styles.dateTimePickerDark]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
              {format(endDate, 'PP')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.dateTimePicker, isDark && styles.dateTimePickerDark]}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.dateTimeText, isDark && styles.textLight]}>
              {format(endDate, 'p')}
            </Text>
          </Pressable>
        </View>

        {(showStartDatePicker || showEndDatePicker) && (
          <DateTimePicker
            value={showStartDatePicker ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowStartDatePicker(false);
                setShowEndDatePicker(false);
              }
              if (selectedDate) {
                if (showStartDatePicker) {
                  setStartDate(selectedDate);
                } else {
                  setEndDate(selectedDate);
                }
              }
            }}
          />
        )}

        {(showStartTimePicker || showEndTimePicker) && (
          <DateTimePicker
            value={showStartTimePicker ? startDate : endDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowStartTimePicker(false);
                setShowEndTimePicker(false);
              }
              if (selectedDate) {
                if (showStartTimePicker) {
                  setStartDate(selectedDate);
                } else {
                  setEndDate(selectedDate);
                }
              }
            }}
          />
        )}

        <View style={styles.contactsSection}>
          <View style={styles.contactsHeader}>
            <Users size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.contactsTitle, isDark && styles.textLight]}>
              Invite People
            </Text>
          </View>

          <ScrollView horizontal style={styles.selectedContacts}>
            <Pressable
              style={[
                styles.addContactButton,
                isDark && styles.addContactButtonDark,
              ]}
              onPress={handlePickContact}
            >
              <UserPlus size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>

            {selectedContacts.map((contact) => (
              <View key={contact.id} style={styles.contactChip}>
                {contact.imageAvailable && contact.image ? (
                  <Image
                    source={{ uri: (contact.image as ContactImage).uri }}
                    style={styles.contactImage}
                  />
                ) : (
                  <User size={20} color="#ffffff" />
                )}
                <Text style={styles.contactName}>{contact.name}</Text>
                <Pressable
                  style={styles.removeContact}
                  onPress={() => removeContact(contact.id)}
                >
                  <X size={16} color="#ffffff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Save Event</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerDark: {
    backgroundColor: '#1e293b',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  textLight: {
    color: '#f8fafc',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimePicker: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTimePickerDark: {
    backgroundColor: '#1e293b',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#0f172a',
  },
  contactsSection: {
    gap: 12,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  selectedContacts: {
    flexDirection: 'row',
  },
  addContactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addContactButtonDark: {
    backgroundColor: '#1e293b',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
  },
  contactImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  contactName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  removeContact: {
    padding: 2,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#0891b2',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventScreen;
