import { useState, useCallback } from 'react';
import { UserSettingsService, UserSettings } from '@/services/UserSettingsService';
import { useAuth } from '@/context/AuthContext';

export function useUserSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const settingsService = user ? new UserSettingsService(user.uid) : null;

  const saveSettings = useCallback(async (settings: Partial<UserSettings>): Promise<boolean> => {
    if (!settingsService) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await settingsService.saveSettings(settings);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [settingsService]);

  const getSettings = useCallback(async (): Promise<UserSettings | null> => {
    if (!settingsService) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const settings = await settingsService.getSettings();
      return settings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get settings';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [settingsService]);

  return {
    saveSettings,
    getSettings,
    loading,
    error,
  };
}