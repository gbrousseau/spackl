import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

export interface NotificationPreferences {
  pushEnabled: boolean;
  eventReminders: boolean;
  reminderTimes: number[]; // minutes before event
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lastUpdated: Date;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: false,
  eventReminders: false,
  reminderTimes: [30, 60, 1440], // 30 mins, 1 hour, 24 hours
  soundEnabled: true,
  vibrationEnabled: true,
  lastUpdated: new Date(),
};

export class NotificationService {
  private userId: string;
  private readonly STORAGE_KEY = '@notification_preferences';
  private readonly COLLECTION = 'userNotifications';

  constructor(userId: string) {
    this.userId = userId;
  }

  async initialize(): Promise<NotificationPreferences> {
    if (Platform.OS === 'web') {
      return DEFAULT_PREFERENCES;
    }

    try {
      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Load preferences
      const prefs = await this.loadPreferences();
      
      // Request permissions if enabled
      if (prefs.pushEnabled) {
        const permissionGranted = await this.requestPermissions();
        if (!permissionGranted) {
          // Update preferences if permissions were denied
          const updatedPrefs = {
            ...prefs,
            pushEnabled: false,
            eventReminders: false,
          };
          await this.savePreferences(updatedPrefs);
          return updatedPrefs;
        }
      }

      return prefs;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  private async loadPreferences(): Promise<NotificationPreferences> {
    try {
      // Try loading from Firestore first
      const docRef = doc(FIREBASE_FIRESTORE, this.COLLECTION, this.userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated.toDate(),
        } as NotificationPreferences;
      }

      // Fall back to local storage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        // Sync to Firestore
        await this.savePreferences(prefs);
        return prefs;
      }

      // Use defaults if no preferences found
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  private async savePreferences(prefs: NotificationPreferences): Promise<void> {
    try {
      // Update timestamp
      prefs.lastUpdated = new Date();

      // Save to Firestore
      const docRef = doc(FIREBASE_FIRESTORE, this.COLLECTION, this.userId);
      await setDoc(docRef, prefs);

      // Save to local storage
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));

      console.log('Notification preferences saved successfully:', {
        userId: this.userId,
        pushEnabled: prefs.pushEnabled,
        eventReminders: prefs.eventReminders,
        timestamp: prefs.lastUpdated,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });

      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async togglePushNotifications(enabled: boolean): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      let granted = false;

      if (enabled) {
        granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      const prefs = await this.loadPreferences();
      const newPrefs: NotificationPreferences = {
        ...prefs,
        pushEnabled: enabled,
        // Disable event reminders if push notifications are disabled
        eventReminders: enabled ? prefs.eventReminders : false,
      };

      await this.savePreferences(newPrefs);

      if (!enabled) {
        // Cancel all scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      return true;
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      return false;
    }
  }

  async toggleEventReminders(enabled: boolean): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const prefs = await this.loadPreferences();
      
      // Cannot enable event reminders if push notifications are disabled
      if (enabled && !prefs.pushEnabled) {
        return false;
      }

      const newPrefs: NotificationPreferences = {
        ...prefs,
        eventReminders: enabled,
      };

      await this.savePreferences(newPrefs);

      if (!enabled) {
        // Cancel all scheduled event reminders
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      return true;
    } catch (error) {
      console.error('Error toggling event reminders:', error);
      return false;
    }
  }

  async checkNotificationStatus(): Promise<{
    systemEnabled: boolean;
    permissionsGranted: boolean;
  }> {
    if (Platform.OS === 'web') {
      return {
        systemEnabled: false,
        permissionsGranted: false,
      };
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return {
        systemEnabled: true, // Assuming notifications are enabled at system level
        permissionsGranted: status === 'granted',
      };
    } catch (error) {
      console.error('Error checking notification status:', error);
      return {
        systemEnabled: false,
        permissionsGranted: false,
      };
    }
  }
}