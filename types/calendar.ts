import { addDays } from "date-fns/addDays";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  allDay?: boolean;
  calendarId?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  reminders?: Array<{
    method: 'email' | 'popup';
    minutesBefore: number;
  }>;
  color?: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  recurrenceInterval?: number;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceCount?: number;
  status: 'tentative' | 'confirmed' | 'canceled';
  attendees?: Array<{
    id: string;
    name: any;
    imageAvailable: any;
    image: any;
    email: string;
    status: 'accepted' | 'declined' | 'pending';
  }>;
  createdBy: string;
  organizer?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  isPrivate?: boolean;
  isShared?: boolean;
  isPublic?: boolean;
}

export interface EventInvitation {
  id: string;
  event: CalendarEvent;
  invitedBy: string;
  invitedEmail: string;
  status: 'accepted' | 'declined' | 'pending';
  createdAt: string;
}

export interface CalendarEventFormData
  extends Omit<CalendarEvent, 'id' | 'calendarId'> {
  id?: string;
  calendarId?: string;
}

interface CalendarAttendee {
  id?: string;
  name: string;
  email?: string;
  imageAvailable?: boolean;
  image?: ImageData;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  imageAvailable?: boolean;
  image?: ImageData;
  status?: string;
  type?: string;
  services?: string[];
  introduction?: string;
  description?: string;
}

export interface CalendarEventDetails {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes: string;
  attendees?: CalendarAttendee[];
}

export interface Event {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes: string;
  organizer: {
    name: string;
    email: string;
  };
  attendees: Participant[];
}

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: string) => void;
  isDark: boolean;
  disabled: boolean;
}

// Add this after the existing interfaces
interface ExpoCalendarEvent {
  id: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  location?: string;
  notes?: string;
  attendees?: {
    name?: string;
    email?: string;
  }[];
}

// Update the getEventDetails function
const getEventDetails = async (
  eventId: string,
): Promise<CalendarEventDetails | undefined> => {
  if (typeof window !== 'undefined') {
    // Return sample data for web platform
    return {
      id: eventId,
      title: 'Sample Event',
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      location: 'Sample Location',
      notes: 'Sample Notes',
      attendees: [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
        },
      ],
    };
  }
  return undefined;
};
