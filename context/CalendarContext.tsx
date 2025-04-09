import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { FIREBASE_AUTH } from '@/firebaseConfig';

const auth = FIREBASE_AUTH;

import {
  syncCalendarEvent,
  getCalendarEvents,
  getPendingInvitations,
  respondToInvitation,
} from '@/services/firestore';
import type { CalendarEvent, EventInvitation } from '@/types/calendar';

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  pendingInvitations: EventInvitation[];
  currentUser: string | null;
  selectedDate: Date | null; // Added selectedDate property
  setSelectedDate: (date: Date | string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  setEvents: (events: CalendarEvent[]) => void;
  setAddEvent: (event: CalendarEvent) => Promise<void>;
  setUpdateEvent: (event: CalendarEvent) => Promise<void>;
  setDeleteEvent: (eventId: string) => Promise<void>;
  setPendingInvitations: (invitations: EventInvitation[]) => void;
  setCurrentUser: (user: string | null) => void;
  setRefreshEvents: (refresh: () => Promise<void>) => void;
  refreshEvents: () => Promise<void>;
  addEvent: (event: CalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  respondToEventInvitation: (
    invitationId: string,
    accept: boolean,
  ) => Promise<void>;
  setRespondToEventInvitation: (
    invitationId: string,
    accept: boolean,
  ) => Promise<void>;
}

const [events, setEvents] = useState<CalendarEvent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>(
  'idle',
);
const [pendingInvitations, setPendingInvitations] = useState<
  EventInvitation[]
>([]);


export const CalendarContext = createContext<CalendarContextType>({
  events: [],
  loading: false,
  error: null,
  syncStatus: 'idle',
  currentUser: null,
  pendingInvitations: [],
  selectedDate: null,
  setSelectedDate: () => { },
  setLoading: () => { },
  setError: () => { },
  setSyncStatus: () => { },
  setEvents: () => { },
  setPendingInvitations: () => { },
  setRefreshEvents: () => { },
  setAddEvent: async (event: CalendarEvent) => Promise.resolve(),
  setUpdateEvent: async (event: CalendarEvent) => Promise.resolve(),
  setDeleteEvent: async (eventId: string) => Promise.resolve(),
  setRespondToEventInvitation: async (invitationId: string, accept: boolean) => Promise.resolve(),
  setCurrentUser: () => { },
  refreshEvents: async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        setError('User not authenticated');
        return;
      }

      // Get events from local calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars[0];

      if (!defaultCalendar) {
        setError('No calendar found');
        return;
      }

      const localEvents = await Calendar.getEventsAsync(
        [defaultCalendar.id],
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      );

      // Get events from Firestore
      const firestoreEvents = await getCalendarEvents(user.email);

      // Merge events, preferring Firestore versions
      const mergedEvents: CalendarEvent[] = localEvents.map((localEvent) => {
        const firestoreEvent = firestoreEvents.find((fe) => fe.id === localEvent.id);
        if (firestoreEvent) return firestoreEvent;
        return {
          id: localEvent.id,
          title: localEvent.title,
          startDate: localEvent.startDate instanceof Date
            ? localEvent.startDate.toISOString()
            : localEvent.startDate,
          endDate: localEvent.endDate instanceof Date
            ? localEvent.endDate.toISOString()
            : localEvent.endDate,
          location: localEvent.location,
          notes: localEvent.notes,
          status: localEvent.status as 'tentative' | 'confirmed' | 'canceled',
          createdBy: user.email || 'unknown', // Ensure createdBy is always a string
        };
      });

      setEvents(mergedEvents);
      await AsyncStorage.setItem('cachedEvents', JSON.stringify(mergedEvents));
      setSyncStatus('idle');
    } catch (err) {
      console.error('Failed to refresh events:', err);
      setError('Failed to refresh events');
      setSyncStatus('error');

      // Try to load cached events
      try {
        const cachedEventsJson = await AsyncStorage.getItem('cachedEvents');
        if (cachedEventsJson) {
          setEvents(JSON.parse(cachedEventsJson));
        }
      } catch (cacheErr) {
        console.error('Failed to load cached events:', cacheErr);
      }
    }
  },
  addEvent: async () => { },
  updateEvent: async () => { },
  deleteEvent: async () => { },
  respondToEventInvitation: async () => { },
});

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currentUser = auth.currentUser?.email || null;

  const refreshEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSyncStatus('syncing');

      const user = auth.currentUser;
      if (!user?.email) {
        setError('User not authenticated');
        return;
      }

      // Get events from local calendar
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const defaultCalendar = calendars[0];

      if (!defaultCalendar) {
        setError('No calendar found');
        return;
      }

      const localEvents = await Calendar.getEventsAsync(
        [defaultCalendar.id],
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      );

      // Get events from Firestore
      const firestoreEvents = await getCalendarEvents(user.email);

      // Merge events, preferring Firestore versions
      const mergedEvents: CalendarEvent[] = localEvents.map((localEvent) => {
        const firestoreEvent = firestoreEvents.find(
          (fe) => fe.id === localEvent.id,
        );
        if (firestoreEvent) return firestoreEvent;
        return {
          id: localEvent.id,
          title: localEvent.title,
          startDate: localEvent.startDate instanceof Date
            ? localEvent.startDate.toISOString()
            : localEvent.startDate,
          endDate: localEvent.endDate instanceof Date
            ? localEvent.endDate.toISOString()
            : localEvent.endDate,
          location: localEvent.location,
          notes: localEvent.notes,
          status: localEvent.status as 'tentative' | 'confirmed' | 'canceled',
          createdBy: user.email || 'unknown', // Ensure createdBy is always a string
        };
      });

      setEvents(mergedEvents);
      await AsyncStorage.setItem('cachedEvents', JSON.stringify(mergedEvents));
      setSyncStatus('idle');
    } catch (err) {
      console.error('Failed to refresh events:', err);
      setError('Failed to refresh events');
      setSyncStatus('error');

      // Try to load cached events
      try {
        const cachedEventsJson = await AsyncStorage.getItem('cachedEvents');
        if (cachedEventsJson) {
          setEvents(JSON.parse(cachedEventsJson));
        }
      } catch (cacheErr) {
        console.error('Failed to load cached events:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
          setError('Calendar permissions not granted');
          return;
        }

        const { status: notificationStatus } =
          await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          setError('Notification permissions not granted');
          return;
        }
      } catch (err) {
        setError('Failed to request permissions');
        console.error('Permission Error:', err);
      }
    };

    void requestPermissions();
  }, []);

  const loadPendingInvitations = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user?.email) return;

      const invitations = await getPendingInvitations(user.email);
      setPendingInvitations(invitations);

      // Schedule notifications for pending invitations
      for (const invitation of invitations) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'New Event Invitation',
            body: `You've been invited to ${invitation.event.title}`,
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        void refreshEvents();
        void loadPendingInvitations();
      } else {
        setEvents([]);
        setPendingInvitations([]);
      }
    });

    return () => unsubscribe();
  }, [refreshEvents, loadPendingInvitations]);

  const addEvent = async (event: CalendarEvent) => {
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error('User not authenticated');

      // Add to local calendar
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const defaultCalendar = calendars[0];

      if (!defaultCalendar) {
        throw new Error('No calendar found');
      }

      const localEventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
      });

      // Sync with Firestore
      await syncCalendarEvent({
        ...event,
        id: localEventId,
        createdBy: user.email,
      });

      await refreshEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
      setError('Failed to add event');
    }
  };

  const updateEvent = async (event: CalendarEvent) => {
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error('User not authenticated');

      // Update in local calendar
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const defaultCalendar = calendars[0];

      if (!defaultCalendar) throw new Error('No calendar found');

      await Calendar.updateEventAsync(event.id, {
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
      });

      // Sync with Firestore
      await syncCalendarEvent({
        ...event,
        createdBy: user.email,
      });

      await refreshEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
      setError('Failed to update event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // Delete from local calendar
      await Calendar.deleteEventAsync(eventId);

      // Update state
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));

      // Update cache
      const cachedEventsJson = await AsyncStorage.getItem('cachedEvents');
      if (cachedEventsJson) {
        const cachedEvents = JSON.parse(cachedEventsJson);
        await AsyncStorage.setItem(
          'cachedEvents',
          JSON.stringify(
            cachedEvents.filter((e: CalendarEvent) => e.id !== eventId),
          ),
        );
      }
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event');
    }
  };

  const respondToEventInvitation = async (
    invitationId: string,
    accept: boolean,
  ) => {
    try {
      const user = auth.currentUser;
      if (!user?.email) throw new Error('User not authenticated');

      await respondToInvitation(
        invitationId,
        user.email,
        accept ? 'accepted' : 'declined',
      );

      // Update local state
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv.id !== invitationId),
      );

      if (accept) {
        await refreshEvents();
      }
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
      setError('Failed to respond to invitation');
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        events,
        loading,
        error,
        syncStatus,
        currentUser,
        pendingInvitations,
        selectedDate: null, // Add default value for selectedDate
        setSelectedDate: () => {}, // Add placeholder function
        setLoading,
        setError,
        setSyncStatus,
        setEvents,
        setPendingInvitations,
        setRefreshEvents: () => {}, // Add placeholder function
        setAddEvent: async () => {}, // Add placeholder function
        setUpdateEvent: async () => {}, // Add placeholder function
        setDeleteEvent: async () => {}, // Add placeholder function
        setRespondToEventInvitation: async () => {}, // Add placeholder function
        setCurrentUser: () => {}, // Add placeholder function
        refreshEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        respondToEventInvitation,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => useContext(CalendarContext);
