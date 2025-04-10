import { useState, useCallback } from 'react';
import { EventService, EventDetails, SavedEvent } from '@/services/EventService';
import { useAuth } from '@/context/AuthContext';

export function useEventSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const eventService = user ? new EventService(user.uid) : null;

  const saveEvent = useCallback(async (eventDetails: EventDetails): Promise<SavedEvent | null> => {
    if (!eventService) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const savedEvent = await eventService.saveEvent(eventDetails);
      return savedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [eventService]);

  const updateEvent = useCallback(async (
    eventId: string,
    eventDetails: Partial<EventDetails>
  ): Promise<SavedEvent | null> => {
    if (!eventService) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedEvent = await eventService.updateEvent(eventId, eventDetails);
      return updatedEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [eventService]);

  return {
    saveEvent,
    updateEvent,
    loading,
    error,
  };
}