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
