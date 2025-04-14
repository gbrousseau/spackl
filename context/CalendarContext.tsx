import { createContext, useContext, useState, useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarEvent {
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
  attendees?: Array<{
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  }>;
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
}

const CalendarContext = createContext<CalendarContextType>({
  events: [],
  loading: false,
  error: null,
  refreshEvents: async () => {},
  clearError: () => {},
});

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEvents = useCallback(async (date: Date) => {
    setLoading(true);
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

          return calendarEvents.map(event => ({
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
            attendees: (event as any).attendees?.map((attendee: any) => ({
              email: attendee.email,
              name: attendee.name,
              status: attendee.status,
              role: attendee.role
            })),
            status: event.status as 'confirmed' | 'tentative' | 'cancelled',
            url: event.url,
            recurrenceRule: event.recurrenceRule
          }));
        })
      );

      const transformedEvents = allEvents.flat().sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      await AsyncStorage.setItem(
        `calendar_events_${format(date, 'yyyy-MM')}`,
        JSON.stringify(transformedEvents)
      );

      setEvents(transformedEvents as unknown as CalendarEvent[]);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      
      try {
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
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => useContext(CalendarContext);