import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    enabled: boolean;
    eventReminders: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'private' | 'contacts';
    shareCalendar: boolean;
    showEmail: boolean;
  };
  calendar?: {
    defaultView: 'day' | 'week' | 'month';
    defaultReminder: number; // minutes
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  };
  language?: string;
  timezone?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UserSettingsService {
  private readonly COLLECTION = 'userSettings';
  
  constructor(private userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
  }

  private validateSettings(settings: Partial<UserSettings>): void {
    if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
      throw new ValidationError('Invalid theme value');
    }

    if (settings.privacy?.profileVisibility && 
        !['public', 'private', 'contacts'].includes(settings.privacy.profileVisibility)) {
      throw new ValidationError('Invalid profile visibility value');
    }

    if (settings.calendar?.defaultView && 
        !['day', 'week', 'month'].includes(settings.calendar.defaultView)) {
      throw new ValidationError('Invalid calendar view value');
    }

    if (settings.calendar?.weekStartsOn !== undefined && 
        (settings.calendar.weekStartsOn < 0 || settings.calendar.weekStartsOn > 6)) {
      throw new ValidationError('Invalid week start value');
    }

    if (settings.calendar?.defaultReminder !== undefined && 
        (settings.calendar.defaultReminder < 0 || settings.calendar.defaultReminder > 10080)) { // Max 1 week
      throw new ValidationError('Invalid reminder value');
    }
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      this.validateSettings(settings);

      const docRef = doc(FIREBASE_FIRESTORE, this.COLLECTION, this.userId);
      const docSnap = await getDoc(docRef);

      const timestamp = new Date();
      const settingsWithMeta = {
        ...settings,
        lastModified: timestamp,
      };

      if (!docSnap.exists()) {
        // Create new settings document
        await setDoc(docRef, {
          ...settingsWithMeta,
          createdAt: timestamp,
        });
      } else {
        // Update existing settings
        await updateDoc(docRef, settingsWithMeta);
      }

      console.log('Settings saved successfully:', {
        userId: this.userId,
        timestamp: timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(
        error instanceof Error 
          ? `Failed to save settings: ${error.message}`
          : 'Failed to save settings'
      );
    }
  }

  async getSettings(): Promise<UserSettings | null> {
    try {
      const docRef = doc(FIREBASE_FIRESTORE, this.COLLECTION, this.userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as UserSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw new Error('Failed to get user settings');
    }
  }
}