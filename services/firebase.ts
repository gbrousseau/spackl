import { initializeApp } from 'firebase/app';

// Define CalendarEvent type
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    // events: CalendarEvent[]; // Removed invalid line
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export interface AppState {
  calendar: {
    events: CalendarEvent[];
    lastSync: string;
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    defaultCalendar?: string;
    defaultView: 'month' | 'week' | 'day';
    [key: string]: any;
  };
  [key: string]: any;
}

export const syncWithFirebase = async (
  userId: string,
  state: Partial<AppState>,
) => {
  try {
    const userDoc = doc(db, 'users', userId);
    await setDoc(userDoc, state, { merge: true });
    await AsyncStorage.setItem(`appState_${userId}`, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error syncing with Firebase:', error);
    return false;
  }
};

export const loadFromFirebase = async (
  userId: string,
): Promise<Partial<AppState> | null> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<AppState>;
      await AsyncStorage.setItem(`appState_${userId}`, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error loading from Firebase:', error);
    return null;
  }
};

export const loadFromLocal = async (
  userId: string,
): Promise<Partial<AppState> | null> => {
  try {
    const localData = await AsyncStorage.getItem(`appState_${userId}`);
    if (localData) {
      return JSON.parse(localData);
    }
    return null;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

export const syncCalendarEvents = async (
  userId: string,
  events: CalendarEvent[],
) => {
  const state: Partial<AppState> = {
    calendar: {
      events,
      lastSync: new Date().toISOString(),
    },
  };
  return syncWithFirebase(userId, state);
};

export const syncAppSettings = async (
  userId: string,
  settings: AppState['settings'],
) => {
  const state: Partial<AppState> = {
    settings,
  };
  return syncWithFirebase(userId, state);
};

export { db, auth };
