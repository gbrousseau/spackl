import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRouter, useSegments } from 'expo-router';

function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);

      if (!segments.length) return;

      const inAuthGroup = segments[0] === '(auth)';
      if (!user && !inAuthGroup) {
        router.replace('/welcome');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }
    });

    return unsubscribe;
  }, [segments]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <CalendarProvider>
          <Slot />
        </CalendarProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default RootLayout;