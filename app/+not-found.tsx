import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function NotFoundScreen() {
  const { isDark } = useTheme();
  
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.text, isDark && styles.textLight]}>
          Oops! We can&apos;t find that page.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, isDark && styles.textLight]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  textLight: {
    color: '#f8fafc',
  },
  link: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#3b82f6',
  },
});
