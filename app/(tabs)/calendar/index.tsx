import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function CalendarScreen() {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.text, isDark && styles.textLight]}>Calendar View</Text>
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