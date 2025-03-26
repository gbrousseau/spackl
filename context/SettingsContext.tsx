import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { AppState } from '@/services/firebase';
import { auth } from '@/services/firebase';
import {
  syncAppSettings,
  loadFromLocal,
  loadFromFirebase,
} from '@/services/firebase';

interface SettingsContextType {
  settings: AppState['settings'];
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<AppState['settings']>) => Promise<void>;
  clearError: () => void;
  syncStatus: 'synced' | 'syncing' | 'error';
}

const defaultSettings: AppState['settings'] = {
  theme: 'system',
  notifications: true,
  defaultView: 'month',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: false,
  error: null,
  updateSettings: async () => {},
  clearError: () => {},
  syncStatus: 'synced',
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] =
    useState<AppState['settings']>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>(
    'synced',
  );

  const loadInitialSettings = useCallback(async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // Try loading from local storage first
      const localState = await loadFromLocal(auth.currentUser.uid);
      if (localState?.settings) {
        setSettings({ ...defaultSettings, ...localState.settings });
      }

      // Then try to sync with Firebase
      const firebaseState = await loadFromFirebase(auth.currentUser.uid);
      if (firebaseState?.settings) {
        setSettings({ ...defaultSettings, ...firebaseState.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialSettings();
  }, [loadInitialSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AppState['settings']>) => {
      if (!auth.currentUser) {
        setError('User not authenticated');
        return;
      }

      setSyncStatus('syncing');
      try {
        const updatedSettings = {
          ...settings,
          ...newSettings,
        };

        setSettings(updatedSettings);
        await syncAppSettings(auth.currentUser.uid, updatedSettings);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Error updating settings:', error);
        setError('Failed to update settings');
        setSyncStatus('error');
      }
    },
    [settings],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateSettings,
        clearError,
        syncStatus,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
