import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { collection, query, where, getDocs, Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import { subDays, addDays } from 'date-fns';

interface SyncStatus {
  added: number;
  updated: number;
  errors: string[];
  lastSyncTimestamp: Date;
}

interface FirestoreEvent {
  id: string;
  title: string;
  startDate: Timestamp;
  endDate: Timestamp;
  location?: string;
  notes?: string;
  attendees?: Array<{
    email?: string;
    name?: string;
    status?: string;
  }>;
  lastModified: Timestamp;
  localCalendarId?: string;
}

export class CalendarSyncService {
  private userId: string;
  private readonly PAST_DAYS = 30;
  private readonly FUTURE_DAYS = 365;
  private readonly COLLECTION = 'events';

  constructor(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.userId = userId;
  }

  async synchronize(): Promise<SyncStatus> {
    if (Platform.OS === 'web') {
      return {
        added: 0,
        updated: 0,
        errors: ['Calendar sync not supported on web platform'],
        lastSyncTimestamp: new Date(),
      };
    }

    const status: SyncStatus = {
      added: 0,
      updated: 0,
      errors: [],
      lastSyncTimestamp: new Date(),
    };

    try {
      // Request calendar permissions
      const { status: permissionStatus } = await Calendar.requestCalendarPermissionsAsync();
      if (permissionStatus !== 'granted') {
        throw new Error('Calendar permission denied');
      }

      // Get date range for sync
      const startDate = subDays(new Date(), this.PAST_DAYS);
      const endDate = addDays(new Date(), this.FUTURE_DAYS);

      // Get Firestore events
      const firestoreEvents = await this.getFirestoreEvents(startDate, endDate);
      
      // Get local calendar events
      const localEvents = await this.getLocalEvents(startDate, endDate);

      // Get default calendar for new events
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary && cal.allowsModifications);
      
      if (!defaultCalendar) {
        throw new Error('No writable calendar found');
      }

      // Create a map of local events by ID for faster lookup
      const localEventMap = new Map(
        localEvents.map(event => [event.id, event])
      );

      // Process Firestore events
      for (const firestoreEvent of firestoreEvents) {
        try {
          const localEvent = localEventMap.get(firestoreEvent.id);

          if (!localEvent) {
            // Create new local event
            const eventId = await this.createLocalEvent(defaultCalendar.id, firestoreEvent);
            if (eventId) {
              status.added++;
              // Update Firestore event with local calendar ID
              await this.updateFirestoreEventCalendarId(firestoreEvent.id, defaultCalendar.id);
            }
          } else {
            // Update existing local event if modified
            const firestoreModified = firestoreEvent.lastModified.toDate();
            const localModified = new Date(localEvent.lastModifiedDate);

            if (firestoreModified > localModified) {
              await this.updateLocalEvent(localEvent.id, firestoreEvent);
              status.updated++;
            }
          }
        } catch (error) {
          console.error('Error processing event:', error);
          status.errors.push(`Failed to process event ${firestoreEvent.id}: ${error.message}`);
        }
      }

      // Process local events that aren't in Firestore
      for (const localEvent of localEvents) {
        try {
          const firestoreEvent = firestoreEvents.find(e => e.id === localEvent.id);
          
          if (!firestoreEvent) {
            // Create new Firestore event
            await this.createFirestoreEvent(localEvent);
            status.added++;
          }
        } catch (error) {
          console.error('Error processing local event:', error);
          status.errors.push(`Failed to process local event ${localEvent.id}: ${error.message}`);
        }
      }

      // Save last sync timestamp
      await this.saveLastSyncTimestamp(status.lastSyncTimestamp);

    } catch (error) {
      console.error('Calendar sync error:', error);
      status.errors.push(`Sync failed: ${error.message}`);
    }

    return status;
  }

  private async getFirestoreEvents(startDate: Date, endDate: Date): Promise<FirestoreEvent[]> {
    try {
      const eventsRef = collection(FIREBASE_FIRESTORE, this.COLLECTION);
      const q = query(
        eventsRef,
        where('userId', '==', this.userId),
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('endDate', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirestoreEvent[];
    } catch (error) {
      console.error('Error fetching Firestore events:', error);
      throw new Error('Failed to fetch Firestore events');
    }
  }

  private async getLocalEvents(startDate: Date, endDate: Date): Promise<Calendar.Event[]> {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const events: Calendar.Event[] = [];

      for (const calendar of calendars) {
        const calendarEvents = await Calendar.getEventsAsync(
          [calendar.id],
          startDate,
          endDate
        );
        events.push(...calendarEvents);
      }

      return events;
    } catch (error) {
      console.error('Error fetching local events:', error);
      throw new Error('Failed to fetch local events');
    }
  }

  private async createLocalEvent(calendarId: string, event: FirestoreEvent): Promise<string | null> {
    try {
      return await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate: event.startDate.toDate(),
        endDate: event.endDate.toDate(),
        location: event.location,
        notes: event.notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{
          relativeOffset: -30,
        }],
        availability: Calendar.Availability.BUSY,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          status: attendee.status as any,
        })),
      });
    } catch (error) {
      console.error('Error creating local event:', error);
      throw error;
    }
  }

  private async updateLocalEvent(eventId: string, event: FirestoreEvent): Promise<void> {
    try {
      await Calendar.updateEventAsync(eventId, {
        title: event.title,
        startDate: event.startDate.toDate(),
        endDate: event.endDate.toDate(),
        location: event.location,
        notes: event.notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availability: Calendar.Availability.BUSY,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          status: attendee.status as any,
        })),
      });
    } catch (error) {
      console.error('Error updating local event:', error);
      throw error;
    }
  }

  private async createFirestoreEvent(event: Calendar.Event): Promise<void> {
    try {
      const eventRef = doc(collection(FIREBASE_FIRESTORE, this.COLLECTION));
      await setDoc(eventRef, {
        id: event.id,
        userId: this.userId,
        title: event.title,
        startDate: Timestamp.fromDate(new Date(event.startDate)),
        endDate: Timestamp.fromDate(new Date(event.endDate)),
        location: event.location,
        notes: event.notes,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          status: attendee.status,
        })),
        lastModified: Timestamp.fromDate(new Date()),
        localCalendarId: event.calendarId,
      });
    } catch (error) {
      console.error('Error creating Firestore event:', error);
      throw error;
    }
  }

  private async updateFirestoreEventCalendarId(eventId: string, calendarId: string): Promise<void> {
    try {
      const eventRef = doc(FIREBASE_FIRESTORE, this.COLLECTION, eventId);
      await updateDoc(eventRef, {
        localCalendarId: calendarId,
        lastModified: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating Firestore event calendar ID:', error);
      throw error;
    }
  }

  private async saveLastSyncTimestamp(timestamp: Date): Promise<void> {
    try {
      const userRef = doc(FIREBASE_FIRESTORE, 'users', this.userId);
      await updateDoc(userRef, {
        lastCalendarSync: Timestamp.fromDate(timestamp),
      });
    } catch (error) {
      console.error('Error saving sync timestamp:', error);
      // Non-critical error, don't throw
    }
  }
}