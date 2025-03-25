import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '@/services/firebase';
import { syncCalendarEvents, loadFromLocal, loadFromFirebase } from '@/services/firebase';

interface CalendarAttendee {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface ExpoCalendarEvent extends Calendar.Event {
  attendees?: CalendarAttendee[];
  organizerEmail?: string;
}

export interface CalendarEvent {

  id: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  allDay?: boolean;
  location?: string;
  notes?: string;
  url?: string;
  timeZone?: string;
  organizer?: {
    name?: string;
    email?: string;
  };
  attendees?: CalendarAttendee[];
  calendarId: string;
  availability?: 'busy' | 'free' | 'tentative';
  status?: 'confirmed' | 'tentative' | 'cancelled';
  recurrenceRule?: string;
}

interface CalendarContextType {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshEvents: (date: Date) => Promise<void>;
  clearError: () => void;
  currentUser: {
    email: string;
    name: string;
  };
  syncStatus: 'synced' | 'syncing' | 'error';
}

const CalendarContext = createContext<CalendarContextType>({
  events: [],
  loading: false,
  error: null,
  refreshEvents: async () => {},
  clearError: () => {},
  currentUser: {
    email: '',
    name: '',
  },
  syncStatus: 'synced',
});

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [currentUser] = useState({
    email: auth.currentUser?.email || 'current.user@example.com',
    name: auth.currentUser?.displayName || 'Current User',
  });

  const loadInitialState = useCallback(async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // Try loading from local storage first
      const localState = await loadFromLocal(auth.currentUser.uid);
      if (localState?.calendar?.events) {
        setEvents(localState.calendar.events);
      }

      // Then try to sync with Firebase
      const firebaseState = await loadFromFirebase(auth.currentUser.uid);
      if (firebaseState?.calendar?.events) {
        setEvents(firebaseState.calendar.events);
      }
    } catch (error) {
      console.error('Error loading initial state:', error);
      setError('Failed to load saved events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  const refreshEvents = useCallback(async (date: Date) => {
    if (!auth.currentUser) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setSyncStatus('syncing');
    setError(null);

    try {
      if (Platform.OS === 'web') {
        const mockEvents: CalendarEvent[] = [
          {
            id: '1',
            title: 'Team Meeting',
            startDate: new Date(2024, 1, 15, 14, 30),
            endDate: new Date(2024, 1, 15, 15, 30),
            location: 'Conference Room A',
            calendarId: 'default',
            notes: 'Weekly team sync',
            organizer: {
              name: 'John Doe',
              email: 'john@example.com'
            },
            attendees: [
              {
                name: 'Alice Smith',
                email: 'alice@example.com',
                status: 'accepted'
              }
            ],
            status: 'confirmed'
          },
          {
            id: '2',
            title: 'Lunch with David',
            startDate: new Date(2024, 1, 15, 12, 0),
            endDate: new Date(2024, 1, 15, 13, 0),
            location: 'Cafe Downtown',
            calendarId: 'default',
            notes: 'Monthly catch-up',
            status: 'confirmed'
          }
        ];
        setEvents(mockEvents);
        await syncCalendarEvents(auth.currentUser.uid, mockEvents);
        setSyncStatus('synced');
        return;
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission was denied');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const allEvents = await Promise.all(
        calendars.map(async (calendar) => {
          const calendarEvents = await Calendar.getEventsAsync(
            [calendar.id],
            start,
            end
          );

          return calendarEvents.map((event: ExpoCalendarEvent) => ({
            id: event.id,
            title: event.title,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            location: event.location,
            notes: event.notes,
            calendarId: calendar.id,
            allDay: event.allDay,
            timeZone: event.timeZone,
            availability: event.availability as 'busy' | 'free' | 'tentative',
            organizer: event.organizerEmail ? {
              email: event.organizerEmail,
              name: event.organizerEmail.split('@')[0]
            } : undefined,
            attendees: event.attendees?.map((attendee: CalendarAttendee) => ({
              email: attendee.email,
              name: attendee.name,
              status: attendee.status,
              role: attendee.role
            })),
            status: event.status as 'confirmed' | 'tentative' | 'cancelled',
            url: event.url,
            recurrenceRule: event.recurrenceRule ? String(event.recurrenceRule) : undefined
          }));
        })
      );

      const transformedEvents = allEvents.flat().sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Save to local storage
      await AsyncStorage.setItem(
        `calendar_events_${format(date, 'yyyy-MM')}`,
        JSON.stringify(transformedEvents)
      );

      // Sync with Firebase
      await syncCalendarEvents(auth.currentUser.uid, transformedEvents);

      setEvents(transformedEvents);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setSyncStatus('error');
      
      try {
        // Try to load from local storage as fallback
        const cachedEvents = await AsyncStorage.getItem(
          `calendar_events_${format(date, 'yyyy-MM')}`
        );
        if (cachedEvents) {
          setEvents(JSON.parse(cachedEvents));
          setError('Using cached events - Unable to fetch latest calendar data');
        } else {
          throw new Error('Failed to load calendar events');
        }
      } catch (cacheErr) {
        setError('Failed to load calendar events');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <CalendarContext.Provider value={{
      events,
      loading,
      error,
      refreshEvents,
      clearError,
      currentUser,
      syncStatus,
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => useContext(CalendarContext);