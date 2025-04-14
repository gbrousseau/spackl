import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { collection, doc, updateDoc, arrayUnion, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
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
    phoneNumber?: string;
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
        availability: Calendar.Availability.BUSY,
        status: Calendar.EventStatus.CONFIRMED,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [],
        recurrenceRule: null as any,
        allDay: false,
        endDate: eventDetails.endDate.toISOString(),
        location: eventDetails.location ?? '',
        notes: eventDetails.notes ?? '',
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
        // Omit attendees since it's not supported in the Event type
      });

      return {
        id: eventId,
        calendarId: defaultCalendar.id,
        ...eventDetails,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{
          relativeOffset: -30,
        }],
        recurrenceRule: null as any,
        allDay: false,
        availability: Calendar.Availability.BUSY,
        status: Calendar.EventStatus.CONFIRMED,
        location: eventDetails.location || ''
      } as any;
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
      } as any);

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

      // Create invitations for attendees
      if (event.attendees && event.attendees.length > 0) {
        await this.createInvitations(event);
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
      
      // Update invitations for attendees
      if (updatedEvent.attendees && updatedEvent.attendees.length > 0) {
        await this.updateInvitations(updatedEvent);
      }
    } catch (error) {
      console.error('Error updating Firestore event:', error);
      throw error;
    }
  }

  private cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters (spaces, dashes, parentheses, etc.)
    return phoneNumber.replace(/\D/g, '');
  }

  private async createInvitations(event: SavedEvent): Promise<void> {
    try {
      if (!event.attendees || event.attendees.length === 0) return;
      
      const invitationsCollection = collection(FIREBASE_FIRESTORE, 'invitations');
      
      // Create invitations for each attendee
      for (const attendee of event.attendees) {
        // Skip if no phone number is available
        if (!attendee.phoneNumber) continue;
        
        // Clean the phone number by removing special characters and spaces
        const cleanPhoneNumber = this.cleanPhoneNumber(attendee.phoneNumber);
        
        const invitationRef = doc(invitationsCollection, cleanPhoneNumber);
        const invitationDoc = await getDoc(invitationRef);
        
        const invitationData = {
          eventId: event.id,
          eventTitle: event.title,
          startDate: Timestamp.fromDate(event.startDate),
          endDate: Timestamp.fromDate(event.endDate),
          location: event.location || '',
          notes: event.notes || '',
          status: 'pending',
          createdBy: this.userId,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          attendeeName: attendee.name || '',
          attendeeEmail: attendee.email || '',
          originalPhoneNumber: attendee.phoneNumber, // Store the original phone number
        };
        
        if (invitationDoc.exists()) {
          // Update existing invitation
          await updateDoc(invitationRef, {
            invitations: arrayUnion(invitationData),
          });
        } else {
          // Create new invitation document
          await setDoc(invitationRef, {
            invitations: [invitationData],
          });
        }
      }
    } catch (error) {
      console.error('Error creating invitations:', error);
      // Don't throw the error to prevent event saving from failing
    }
  }

  private async updateInvitations(event: SavedEvent): Promise<void> {
    try {
      if (!event.attendees || event.attendees.length === 0) return;
      
      const invitationsCollection = collection(FIREBASE_FIRESTORE, 'invitations');
      
      // Update invitations for each attendee
      for (const attendee of event.attendees) {
        // Skip if no phone number is available
        if (!attendee.phoneNumber) continue;
        
        // Clean the phone number by removing special characters and spaces
        const cleanPhoneNumber = this.cleanPhoneNumber(attendee.phoneNumber);
        
        const invitationRef = doc(invitationsCollection, cleanPhoneNumber);
        const invitationDoc = await getDoc(invitationRef);
        
        if (!invitationDoc.exists()) {
          // Create new invitation if it doesn't exist
          await this.createInvitations(event);
          continue;
        }
        
        const invitations = invitationDoc.data().invitations || [];
        const updatedInvitations = invitations.map((invitation: any) => {
          if (invitation.eventId === event.id) {
            return {
              ...invitation,
              eventTitle: event.title,
              startDate: Timestamp.fromDate(event.startDate),
              endDate: Timestamp.fromDate(event.endDate),
              location: event.location || '',
              notes: event.notes || '',
              updatedAt: Timestamp.fromDate(new Date()),
              attendeeName: attendee.name || '',
              attendeeEmail: attendee.email || '',
              originalPhoneNumber: attendee.phoneNumber, // Update the original phone number
            };
          }
          return invitation;
        });
        
        await updateDoc(invitationRef, { invitations: updatedInvitations });
      }
    } catch (error) {
      console.error('Error updating invitations:', error);
      // Don't throw the error to prevent event updating from failing
    }
  }

  private serializeEvent(event: SavedEvent): any {
    // Create a clean object with no undefined values
    const cleanEvent: any = {
      id: event.id,
      title: event.title,
      startDate: Timestamp.fromDate(event.startDate),
      endDate: Timestamp.fromDate(event.endDate),
      lastModified: Timestamp.fromDate(event.lastModified),
      localCalendarId: event.localCalendarId,
    };
    
    // Only add optional fields if they are defined
    if (event.location) cleanEvent.location = event.location;
    if (event.notes) cleanEvent.notes = event.notes;
    
    // Clean attendees array to remove any undefined values
    if (event.attendees && event.attendees.length > 0) {
      cleanEvent.attendees = event.attendees.map(attendee => {
        const cleanAttendee: any = {};
        if (attendee.name) cleanAttendee.name = attendee.name;
        if (attendee.email) cleanAttendee.email = attendee.email;
        if (attendee.phoneNumber) cleanAttendee.phoneNumber = attendee.phoneNumber;
        if (attendee.status) cleanAttendee.status = attendee.status;
        return cleanAttendee;
      }).filter(attendee => Object.keys(attendee).length > 0);
    }
    
    return cleanEvent;
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      // Get the event from Firestore to access attendee information
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', this.userId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('Events document not found');
      }
      
      const events = eventDoc.data().events || [];
      const eventToDelete = events.find((event: SavedEvent) => event.id === eventId);
      
      if (!eventToDelete) {
        throw new Error('Event not found');
      }
      
      // Delete from local calendar if available
      if (Platform.OS !== 'web' && eventToDelete.localCalendarId) {
        try {
          await Calendar.deleteEventAsync(eventId);
        } catch (calendarError) {
          console.error('Error deleting from local calendar:', calendarError);
          // Continue with Firestore deletion even if local calendar deletion fails
        }
      }
      
      // Remove event from Firestore
      const updatedEvents = events.filter((event: SavedEvent) => event.id !== eventId);
      await updateDoc(eventRef, { events: updatedEvents });
      
      // Remove invitations for this event
      await this.deleteInvitations(eventId, eventToDelete.attendees || []);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
  
  private async deleteInvitations(eventId: string, attendees: Array<{ phoneNumber?: string }>): Promise<void> {
    try {
      if (!attendees || attendees.length === 0) return;
      
      const invitationsCollection = collection(FIREBASE_FIRESTORE, 'invitations');
      
      // Process each attendee with a phone number
      for (const attendee of attendees) {
        if (!attendee.phoneNumber) continue;
        
        // Clean the phone number
        const cleanPhoneNumber = this.cleanPhoneNumber(attendee.phoneNumber);
        
        const invitationRef = doc(invitationsCollection, cleanPhoneNumber);
        const invitationDoc = await getDoc(invitationRef);
        
        if (!invitationDoc.exists()) continue;
        
        const invitations = invitationDoc.data().invitations || [];
        
        // Filter out invitations for this event
        const updatedInvitations = invitations.filter((invitation: any) => 
          invitation.eventId !== eventId
        );
        
        if (updatedInvitations.length === 0) {
          // If no invitations left, delete the document
          await deleteDoc(invitationRef);
        } else {
          // Update with remaining invitations
          await updateDoc(invitationRef, { invitations: updatedInvitations });
        }
      }
    } catch (error) {
      console.error('Error deleting invitations:', error);
      // Don't throw the error to prevent event deletion from failing
    }
  }

  async getEvent(eventId: string): Promise<SavedEvent | null> {
    try {
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', this.userId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return null;
      }
      
      const events = eventDoc.data().events || [];
      const event = events.find((event: any) => event.id === eventId);
      
      if (!event) {
        return null;
      }
      
      // Convert Firestore Timestamps to Date objects
      return {
        id: event.id,
        title: event.title,
        startDate: event.startDate.toDate(),
        endDate: event.endDate.toDate(),
        lastModified: event.lastModified.toDate(),
        localCalendarId: event.localCalendarId,
        location: event.location,
        notes: event.notes,
        attendees: event.attendees?.map((attendee: any) => ({
          name: attendee.name,
          email: attendee.email,
          status: attendee.status,
          phoneNumber: attendee.phoneNumber
        }))
      };
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }
}