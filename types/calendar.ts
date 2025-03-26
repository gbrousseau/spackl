export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  status: 'tentative' | 'confirmed' | 'canceled';
  attendees?: Array<{
    email: string;
    status: 'accepted' | 'declined' | 'pending';
  }>;
  createdBy: string;
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
