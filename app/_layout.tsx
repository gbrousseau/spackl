import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider } from '@/context/ThemeContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { GroupProvider } from '@/context/GroupContext';
import { ContactsProvider } from '@/context/ContactsContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ContactsProvider>
            <CalendarProvider>
              <GroupProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
              </GroupProvider>
            </CalendarProvider>
          </ContactsProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}