import * as ExpoCalendar from 'expo-calendar';

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  url?: string;
  status?: 'tentative' | 'confirmed' | 'canceled';
  organizer?: string;
  attendees?: Array<{
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
  }>;
  recurrenceRule?: ExpoCalendar.RecurrenceRule;
}

export interface CalendarEventFormData extends Omit<CalendarEvent, 'id' | 'calendarId'> {
  id?: string;
  calendarId?: string;
} 