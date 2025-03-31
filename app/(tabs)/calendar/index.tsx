import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';

export default function CalendarScreen() {
  const { isDark } = useTheme();
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
  const markedDates = {
    [formattedDate]: {
      selected: true,
      marked: true,
      selectedColor: isDark ? '#f8fafc' : '#0f172a',
    },
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Calendar
        theme={{
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          calendarBackground: isDark ? '#0f172a' : '#f8fafc',
          textSectionTitleColor: isDark ? '#f8fafc' : '#0f172a',
          selectedDayBackgroundColor: isDark ? '#f8fafc' : '#0f172a',
          todayTextColor: isDark ? '#f8fafc' : '#0f172a',
          dayTextColor: isDark ? '#f8fafc' : '#0f172a',
          monthTextColor: isDark ? '#f8fafc' : '#0f172a',
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  text: {
    fontSize: 16,
    color: '#0f172a',
  },
  textLight: {
    color: '#f8fafc',
  },
});
