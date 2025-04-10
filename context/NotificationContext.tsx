import { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { NotificationService, NotificationPreferences } from '@/services/NotificationService';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextType {
  isEnabled: boolean;
  eventRemindersEnabled: boolean;
  loading: boolean;
  error: string | null;
  toggleNotifications: () => Promise<void>;
  toggleEventReminders: () => Promise<void>;
  scheduleEventReminder: (eventId: string, title: string, startDate: Date, location?: string) => Promise<void>;
  cancelEventReminders: (eventId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  isEnabled: false,
  eventRemindersEnabled: false,
  loading: true,
  error: null,
  toggleNotifications: async () => {},
  toggleEventReminders: async () => {},
  scheduleEventReminder: async () => {},
  cancelEventReminders: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const notificationService = user ? new NotificationService(user.uid) : null;

  useEffect(() => {
    if (notificationService) {
      initializeNotifications();
    }
  }, [notificationService]);

  const initializeNotifications = async () => {
    if (!notificationService || Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    try {
      const prefs = await notificationService.initialize();
      setPreferences(prefs);
      setError(null);
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError('Failed to initialize notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationService || Platform.OS === 'web' || loading) {
      return;
    }

    setLoading(true);
    try {
      const status = await notificationService.checkNotificationStatus();
      
      if (!status.systemEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      const newEnabled = !preferences?.pushEnabled;
      const success = await notificationService.togglePushNotifications(newEnabled);
      
      if (success) {
        setPreferences(prev => prev ? {
          ...prev,
          pushEnabled: newEnabled,
          eventReminders: newEnabled ? prev.eventReminders : false,
        } : null);
        setError(null);
      } else {
        if (newEnabled) {
          Alert.alert(
            'Permission Required',
            'Please allow notifications in your device settings to enable this feature.',
            [{ text: 'OK' }]
          );
        }
        setError('Failed to toggle notifications');
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
      setError('Failed to toggle notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventReminders = async () => {
    if (!notificationService || Platform.OS === 'web' || loading || !preferences?.pushEnabled) {
      return;
    }

    setLoading(true);
    try {
      const newEnabled = !preferences.eventReminders;
      const success = await notificationService.toggleEventReminders(newEnabled);
      
      if (success) {
        setPreferences(prev => prev ? {
          ...prev,
          eventReminders: newEnabled,
        } : null);
        setError(null);
      } else {
        setError('Failed to toggle event reminders');
      }
    } catch (err) {
      console.error('Error toggling event reminders:', err);
      setError('Failed to toggle event reminders');
    } finally {
      setLoading(false);
    }
  };

  const scheduleEventReminder = async (
    eventId: string,
    title: string,
    startDate: Date,
    location?: string
  ) => {
    if (!notificationService || Platform.OS === 'web' || !preferences?.eventReminders) {
      return;
    }

    try {
      await notificationService.scheduleEventReminder(eventId, title, startDate, location);
      setError(null);
    } catch (err) {
      console.error('Error scheduling event reminder:', err);
      setError('Failed to schedule reminder');
    }
  };

  const cancelEventReminders = async (eventId: string) => {
    if (!notificationService || Platform.OS === 'web') {
      return;
    }

    try {
      await notificationService.cancelEventReminders(eventId);
      setError(null);
    } catch (err) {
      console.error('Error canceling event reminders:', err);
      setError('Failed to cancel reminders');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        isEnabled: preferences?.pushEnabled ?? false,
        eventRemindersEnabled: preferences?.eventReminders ?? false,
        loading,
        error,
        toggleNotifications,
        toggleEventReminders,
        scheduleEventReminder,
        cancelEventReminders,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);