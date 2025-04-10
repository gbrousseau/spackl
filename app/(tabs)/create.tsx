import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Users, Save } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { DateTimePicker } from '@/components/DateTimePicker';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { addDays } from 'date-fns';

export default function CreateEventScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [event, setEvent] = useState({
    title: '',
    startDate: new Date(),
    endDate: addDays(new Date(), 1),
    location: '',
    notes: '',
  });

  const handleSave = () => {
    // TODO: Implement event creation
    router.back();
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.form}>
        <Text style={[styles.title, isDark && styles.textLight]}>Create New Event</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Event Title</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Calendar size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={event.title}
              onChangeText={(text) => setEvent({ ...event, title: text })}
              placeholder="Enter event title"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
              <View style={[styles.divider, isDark && styles.dividerDark]} />
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

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
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
              <View style={[styles.divider, isDark && styles.dividerDark]} />
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
          <Text style={[styles.label, isDark && styles.textLight]}>Notes</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark, styles.textArea]}>
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={event.notes}
              onChangeText={(text) => setEvent({ ...event, notes: text })}
              placeholder="Add notes"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>Create Event</Text>
        </Pressable>
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
  form: {
    padding: 20,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  textArea: {
    minHeight: 100,
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
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerDark: {
    backgroundColor: '#334155',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  textLight: {
    color: '#f8fafc',
  },
});