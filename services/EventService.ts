import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { collection, doc, updateDoc, arrayUnion, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

export interface EventDetails {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  attendees?: Array<{
    name?: string;
    email?: string;
    status?: string;
  }>;
}

export interface SavedEvent extends EventDetails {
  id: string;
  localCalendarId: string;
  lastModified: Date;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class EventService {
  private userId: string;
  private readonly MAX_TITLE_LENGTH = 100;
  private readonly MAX_NOTES_LENGTH = 1000;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.userId = userId;
  }

  private validateEventDetails(eventDetails: EventDetails): void {
    if (!eventDetails.title?.trim()) {
      throw new ValidationError('Event title is required');
    }

    if (eventDetails.title.length > this.MAX_TITLE_LENGTH) {
      throw new ValidationError(`Event title cannot exceed ${this.MAX_TITLE_LENGTH} characters`);
    }

    if (!eventDetails.startDate || !(eventDetails.startDate instanceof Date)) {
      throw new ValidationError('Valid start date is required');
    }

    if (!eventDetails.endDate || !(eventDetails.endDate instanceof Date)) {
      throw new ValidationError('Valid end date is required');
    }

    if (eventDetails.endDate < eventDetails.startDate) {
      throw new ValidationError('End date cannot be before start date');
    }

    if (eventDetails.notes && eventDetails.notes.length > this.MAX_NOTES_LENGTH) {
      throw new ValidationError(`Notes cannot exceed ${this.MAX_NOTES_LENGTH} characters`);
    }

    if (eventDetails.attendees?.length) {
      eventDetails.attendees.forEach((attendee, index) => {
        if (attendee.email && !this.isValidEmail(attendee.email)) {
          throw new ValidationError(`Invalid email for attendee ${index + 1}`);
        }
      });
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async saveEvent(eventDetails: EventDetails): Promise<SavedEvent> {
    try {
      // Validate event details before proceeding
      this.validateEventDetails(eventDetails);

      // Step 1: Save to local calendar
      const localEvent = await this.saveToLocalCalendar(eventDetails);
      if (!localEvent) {
        throw new Error('Failed to save event to local calendar');
      }

      // Step 2: Save to Firestore
      const firestoreEvent = await this.saveToFirestore({
        ...eventDetails,
        id: localEvent.id,
        localCalendarId: localEvent.calendarId,
        lastModified: new Date(),
      });

      console.log('Event saved successfully:', {
        id: firestoreEvent.id,
        title: firestoreEvent.title,
        startDate: firestoreEvent.startDate,
      });

      return firestoreEvent;
    } catch (error) {
      console.error('Error saving event:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(
        error instanceof Error 
          ? `Failed to save event: ${error.message}`
          : 'Failed to save event'
      );
    }
  }

  async updateEvent(eventId: string, eventDetails: Partial<EventDetails>): Promise<SavedEvent> {
    try {
      if (!eventId) {
        throw new ValidationError('Event ID is required for updates');
      }

      // Get existing event from Firestore
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', this.userId);
      const eventDoc = await getDoc(eventRef);
      const existingEvent = eventDoc.data()?.events?.find((e: SavedEvent) => e.id === eventId);

      if (!existingEvent) {
        throw new Error('Event not found');
      }

      // Validate the merged event details
      const mergedEventDetails = {
        ...existingEvent,
        ...eventDetails,
      };
      this.validateEventDetails(mergedEventDetails);

      // Update local calendar
      const updatedLocalEvent = await this.updateLocalCalendarEvent(
        eventId,
        existingEvent.localCalendarId,
        mergedEventDetails
      );

      if (!updatedLocalEvent) {
        throw new Error('Failed to update local calendar event');
      }

      // Update Firestore
      const updatedEvent: SavedEvent = {
        ...mergedEventDetails,
        lastModified: new Date(),
      };

      await this.updateFirestoreEvent(eventId, updatedEvent);

      console.log('Event updated successfully:', {
        id: eventId,
        title: updatedEvent.title,
        startDate: updatedEvent.startDate,
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(
        error instanceof Error 
          ? `Failed to update event: ${error.message}`
          : 'Failed to update event'
      );
    }
  }

  private async saveToLocalCalendar(eventDetails: EventDetails): Promise<Calendar.Event | null> {
    if (Platform.OS === 'web') {
      // Return mock data for web platform
      return {
        id: Date.now().toString(),
        calendarId: 'default',
        title: eventDetails.title,
        startDate: eventDetails.startDate.toISOString(),
        endDate: eventDetails.endDate.toISOString(),
        location: eventDetails.location,
        notes: eventDetails.notes,
      };
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission was denied');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary && cal.allowsModifications);

      if (!defaultCalendar) {
        throw new Error('No writable calendar found');
      }

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: eventDetails.title,
        startDate: eventDetails.startDate,
        endDate: eventDetails.endDate,
        location: eventDetails.location,
        notes: eventDetails.notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{
          relativeOffset: -30,
        }],
        availability: Calendar.Availability.BUSY,
        attendees: eventDetails.attendees?.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          status: attendee.status as any,
        })),
      });

      return {
        id: eventId,
        calendarId: defaultCalendar.id,
        ...eventDetails,
      };
    } catch (error) {
      console.error('Error saving to local calendar:', error);
      return null;
    }
  }

  private async updateLocalCalendarEvent(
    eventId: string,
    calendarId: string,
    eventDetails: EventDetails
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Mock success for web platform
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission was denied');
      }

      await Calendar.updateEventAsync(eventId, {
        title: eventDetails.title,
        startDate: eventDetails.startDate,
        endDate: eventDetails.endDate,
        location: eventDetails.location,
        notes: eventDetails.notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availability: Calendar.Availability.BUSY,
        attendees: eventDetails.attendees?.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          status: attendee.status as any,
        })),
      });

      return true;
    } catch (error) {
      console.error('Error updating local calendar event:', error);
      return false;
    }
  }

  private async saveToFirestore(event: SavedEvent): Promise<SavedEvent> {
    try {
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', this.userId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        // Create new document with events array
        await setDoc(eventRef, {
          events: [this.serializeEvent(event)],
        });
      } else {
        // Add event to existing events array
        await updateDoc(eventRef, {
          events: arrayUnion(this.serializeEvent(event)),
        });
      }

      return event;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  }

  private async updateFirestoreEvent(eventId: string, updatedEvent: SavedEvent): Promise<void> {
    try {
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', this.userId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error('Events document not found');
      }

      const events = eventDoc.data().events;
      const updatedEvents = events.map((event: SavedEvent) =>
        event.id === eventId ? this.serializeEvent(updatedEvent) : event
      );

      await updateDoc(eventRef, { events: updatedEvents });
    } catch (error) {
      console.error('Error updating Firestore event:', error);
      throw error;
    }
  }

  private serializeEvent(event: SavedEvent): any {
    return {
      ...event,
      startDate: Timestamp.fromDate(event.startDate),
      endDate: Timestamp.fromDate(event.endDate),
      lastModified: Timestamp.fromDate(event.lastModified),
    };
  }
}