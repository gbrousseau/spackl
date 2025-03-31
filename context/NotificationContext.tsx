import { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

/**
 * Send a notification to participants about an event.
 * @param participants - List of participants with their names and optional emails.
 * @param eventDetails - Details of the event including title, start date, and optional location.
 */
type NotificationContextType = {
  isEnabled: boolean;
  notificationPermission: boolean;
  toggleNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  sendEventNotification: (
    participants: { name: string; email?: string }[],
    eventDetails: {
      title: string;
      startDate: Date;
      location?: string;
    },
  ) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  isEnabled: false,
  toggleNotifications: async () => { },
  requestPermissions: async () => false,
  sendEventNotification: async () => { },
  notificationPermission: false,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      setIsEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const isGranted = status === 'granted';
      await AsyncStorage.setItem('notificationsEnabled', String(isGranted));
      setIsEnabled(isGranted);
      return isGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const toggleNotifications = async () => {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    try {
      if (!isEnabled) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }
      } else {
        await AsyncStorage.setItem('notificationsEnabled', 'false');
        setIsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const sendEventNotification = async (
    participants: { name: string; email?: string }[],
    eventDetails: {
      title: string;
      startDate: Date;
      location?: string;
    },
  ) => {
    if (!isEnabled || Platform.OS === 'web') {
      return;
    }

    try {
      const formattedDate = format(
        eventDetails.startDate,
        'MMM d, yyyy h:mm a',
      );
      const participantNames = participants.map((p) => p.name).join(', ');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Event Update: ${eventDetails.title}`,
          body: `The event has been updated!\n\nDate: ${formattedDate}\n${eventDetails.location ? `Location: ${eventDetails.location}\n` : ''}Participants: ${participantNames}`,
          data: { eventDetails },
        },
        trigger: null, // Send immediately
      });

      // Schedule a reminder notification 30 minutes before the event
      const reminderTime = new Date(
        eventDetails.startDate.getTime() - 30 * 60000,
      );
      if (reminderTime > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${eventDetails.title}`,
            body: `Event starting in 30 minutes\n${eventDetails.location ? `Location: ${eventDetails.location}` : ''}`,
            data: { eventDetails },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderTime,
          },
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        isEnabled,
        notificationPermission: isEnabled,
        toggleNotifications,
        requestPermissions,
        sendEventNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

export { NotificationContext };
