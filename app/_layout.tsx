import { Slot } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';

const RootLayout = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <CalendarProvider>
            <Slot />
          </CalendarProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default RootLayout;