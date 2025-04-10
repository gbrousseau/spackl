import { useState, useCallback } from 'react';
import { CalendarSyncService } from '@/services/CalendarSyncService';
import { useAuth } from '@/context/AuthContext';

export function useCalendarSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { user } = useAuth();

  const sync = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setSyncing(true);
    setError(null);

    try {
      const syncService = new CalendarSyncService(user.uid);
      const status = await syncService.synchronize();

      setLastSync(status.lastSyncTimestamp);

      if (status.errors.length > 0) {
        setError(status.errors.join(', '));
      }

      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calendar sync failed';
      setError(errorMessage);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [user]);

  return {
    sync,
    syncing,
    error,
    lastSync,
  };
}