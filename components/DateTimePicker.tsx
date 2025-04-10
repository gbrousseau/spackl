import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react-native';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  isDark?: boolean;
}

export function DateTimePicker({ value, onChange, mode, isDark }: DateTimePickerProps) {
  const [show, setShow] = useState(false);

  // Ensure we have a valid date object
  const safeDate = value instanceof Date && !isNaN(value.getTime()) 
    ? value 
    : new Date();

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      onChange(selectedDate);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webPickerContainer, isDark && styles.webPickerContainerDark]}>
        {mode === 'date' ? (
          <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        ) : (
          <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        )}
        <input
          type={mode}
          value={
            mode === 'date'
              ? format(safeDate, 'yyyy-MM-dd')
              : format(safeDate, 'HH:mm')
          }
          onChange={(e) => {
            try {
              const newDate = new Date(safeDate);
              if (mode === 'date') {
                const [year, month, day] = e.target.value.split('-').map(Number);
                newDate.setFullYear(year, month - 1, day);
              } else {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                newDate.setHours(hours, minutes);
              }
              if (!isNaN(newDate.getTime())) {
                onChange(newDate);
              }
            } catch (error) {
              console.error('Error parsing date:', error);
            }
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: isDark ? '#f8fafc' : '#0f172a',
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            marginLeft: 8,
            flex: 1,
          }}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        style={[styles.pickerButton, isDark && styles.pickerButtonDark]}
        onPress={() => setShow(true)}>
        {mode === 'date' ? (
          <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        ) : (
          <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        )}
        <Text style={[styles.pickerText, isDark && styles.textLight]}>
          {mode === 'date'
            ? format(safeDate, 'MMM d, yyyy')
            : format(safeDate, 'h:mm a')}
        </Text>
        <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} />
      </Pressable>

      {show && (
        <RNDateTimePicker
          value={safeDate}
          mode={mode}
          is24Hour={false}
          onChange={handleChange}
          style={{ backgroundColor: 'white' }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  pickerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
    marginLeft: 8,
  },
  textLight: {
    color: '#f8fafc',
  },
  webPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webPickerContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
});