import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function LegalLayout() {
  const { isDark } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        },
        headerTintColor: isDark ? '#f8fafc' : '#0f172a',
        headerShadowVisible: false,
      }}
    />
  );
}