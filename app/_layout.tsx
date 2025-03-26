import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CalendarProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </CalendarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
