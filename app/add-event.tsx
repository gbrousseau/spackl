import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { MapPin, Users, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import type { CalendarEvent } from '@/types/calendar';

export default function AddEventScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { addEvent } = useCalendar();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [attendees, setAttendees] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [attendeeInput, setAttendeeInput] = useState('');

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a !== email));
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      return;
    }

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: title.trim(),
      location: location.trim(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      attendees: attendees.map((email) => ({
        email,
        status: 'pending',
      })),
      status: 'confirmed',
    };

    try {
      await addEvent(event);
      router.back();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft
            size={24}
            color={theme === 'dark' ? '#94a3b8' : '#64748b'}
          />
        </Pressable>
        <Text style={[styles.title, theme === 'dark' && styles.textLight]}>
          New Event
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={[styles.input, theme === 'dark' && styles.inputDark]}
          placeholder="Event title"
          placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[
            styles.input,
            styles.textArea,
            theme === 'dark' && styles.inputDark,
          ]}
          placeholder="Description"
          placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <View style={styles.inputGroup}>
          <MapPin size={20} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              theme === 'dark' && styles.inputDark,
            ]}
            placeholder="Location"
            placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.dateTimeSection}>
          <Text
            style={[styles.sectionTitle, theme === 'dark' && styles.textLight]}
          >
            Date & Time
          </Text>
          <Pressable
            style={[
              styles.dateTimePicker,
              theme === 'dark' && styles.dateTimePickerDark,
            ]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text
              style={[
                styles.dateTimeText,
                theme === 'dark' && styles.textLight,
              ]}
            >
              Starts: {format(startDate, 'PPp')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.dateTimePicker,
              theme === 'dark' && styles.dateTimePickerDark,
            ]}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text
              style={[
                styles.dateTimeText,
                theme === 'dark' && styles.textLight,
              ]}
            >
              Ends: {format(endDate, 'PPp')}
            </Text>
          </Pressable>
        </View>

        {(showStartDatePicker || showEndDatePicker) && (
          <DateTimePicker
            value={showStartDatePicker ? startDate : endDate}
            mode="datetime"
            onChange={(event, date) => {
              if (showStartDatePicker) {
                setShowStartDatePicker(false);
                if (date) {
                  setStartDate(date);
                  if (date > endDate) {
                    setEndDate(date);
                  }
                }
              } else {
                setShowEndDatePicker(false);
                if (date && date >= startDate) {
                  setEndDate(date);
                }
              }
            }}
          />
        )}

        <View style={styles.attendeesSection}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
            <Text
              style={[
                styles.sectionTitle,
                theme === 'dark' && styles.textLight,
              ]}
            >
              Attendees
            </Text>
          </View>
          <View style={styles.attendeeInputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.attendeeInput,
                theme === 'dark' && styles.inputDark,
              ]}
              placeholder="Add attendee email"
              placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
              value={attendeeInput}
              onChangeText={setAttendeeInput}
              onSubmitEditing={handleAddAttendee}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={[
                styles.addButton,
                !attendeeInput.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddAttendee}
              disabled={!attendeeInput.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
          {attendees.map((email) => (
            <View
              key={email}
              style={[
                styles.attendeeChip,
                theme === 'dark' && styles.attendeeChipDark,
              ]}
            >
              <Text
                style={[
                  styles.attendeeEmail,
                  theme === 'dark' && styles.textLight,
                ]}
              >
                {email}
              </Text>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveAttendee(email)}
                hitSlop={8}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.createButton,
            !title.trim() && styles.createButtonDisabled,
          ]}
          onPress={handleCreateEvent}
          disabled={!title.trim()}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#334155',
    color: '#f8fafc',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputWithIcon: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 0,
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  dateTimePicker: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateTimePickerDark: {
    backgroundColor: '#334155',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#0f172a',
  },
  attendeesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendeeInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  attendeeInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  attendeeChipDark: {
    backgroundColor: '#334155',
  },
  attendeeEmail: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textLight: {
    color: '#f8fafc',
  },
});
