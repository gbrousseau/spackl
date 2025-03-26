import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function CalendarLayout() {
  const { isDark } = useTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="event"
        options={{
          presentation: 'modal',
          headerTitle: 'Event Details',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
          },
          headerTitleStyle: {
            color: isDark ? '#f8fafc' : '#0f172a',
          },
          headerTintColor: isDark ? '#f8fafc' : '#0f172a',
        }}
      />
    </Stack>
  );
}
