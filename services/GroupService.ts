import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import { Contact } from '@/context/ContactsContext';

export interface Group {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface GroupEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  groupIds: string[];
  contactIds: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class GroupService {
  private readonly GROUPS_COLLECTION = 'groups';
  private readonly EVENTS_COLLECTION = 'events';
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.userId = userId;
  }

  async createGroup(name: string, description?: string): Promise<Group> {
    try {
      const groupRef = doc(collection(FIREBASE_FIRESTORE, this.GROUPS_COLLECTION));
      const timestamp = new Date();
      
      const group: Group = {
        id: groupRef.id,
        name,
        description,
        contactIds: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: this.userId,
      };

      await setDoc(groupRef, {
        ...group,
        createdAt: Timestamp.fromDate(timestamp),
        updatedAt: Timestamp.fromDate(timestamp),
      });

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  async addContactsToGroup(groupId: string, contacts: Contact[]): Promise<void> {
    try {
      const groupRef = doc(FIREBASE_FIRESTORE, this.GROUPS_COLLECTION, groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const group = groupDoc.data() as Group;
      const newContactIds = contacts.map(contact => contact.id);
      const updatedContactIds = [...new Set([...group.contactIds, ...newContactIds])];

      await updateDoc(groupRef, {
        contactIds: updatedContactIds,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      // Update all events that include this group
      await this.updateEventsForGroupChange(groupId, updatedContactIds);
    } catch (error) {
      console.error('Error adding contacts to group:', error);
      throw new Error('Failed to add contacts to group');
    }
  }

  async removeContactsFromGroup(groupId: string, contactIds: string[]): Promise<void> {
    try {
      const groupRef = doc(FIREBASE_FIRESTORE, this.GROUPS_COLLECTION, groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const group = groupDoc.data() as Group;
      const updatedContactIds = group.contactIds.filter(id => !contactIds.includes(id));

      await updateDoc(groupRef, {
        contactIds: updatedContactIds,
        updatedAt: Timestamp.fromDate(new Date()),
      });

      // Update all events that include this group
      await this.updateEventsForGroupChange(groupId, updatedContactIds);
    } catch (error) {
      console.error('Error removing contacts from group:', error);
      throw new Error('Failed to remove contacts from group');
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const groupRef = doc(FIREBASE_FIRESTORE, this.GROUPS_COLLECTION, groupId);
      
      // Get all events that include this group
      const events = await this.getEventsByGroup(groupId);
      
      // Remove group from all events
      await Promise.all(events.map(event => {
        const eventRef = doc(FIREBASE_FIRESTORE, this.EVENTS_COLLECTION, event.id);
        return updateDoc(eventRef, {
          groupIds: event.groupIds.filter(id => id !== groupId),
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }));

      // Delete the group
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  async createEvent(event: Omit<GroupEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<GroupEvent> {
    try {
      const eventRef = doc(collection(FIREBASE_FIRESTORE, this.EVENTS_COLLECTION));
      const timestamp = new Date();

      // Get all contacts from selected groups
      const groupContacts = await this.getContactsFromGroups(event.groupIds);
      const allContactIds = [...new Set([...event.contactIds, ...groupContacts])];

      const newEvent: GroupEvent = {
        id: eventRef.id,
        ...event,
        contactIds: allContactIds,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: this.userId,
      };

      await setDoc(eventRef, {
        ...newEvent,
        createdAt: Timestamp.fromDate(timestamp),
        updatedAt: Timestamp.fromDate(timestamp),
      });

      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  private async updateEventsForGroupChange(groupId: string, updatedContactIds: string[]): Promise<void> {
    try {
      const events = await this.getEventsByGroup(groupId);

      await Promise.all(events.map(async event => {
        const eventRef = doc(FIREBASE_FIRESTORE, this.EVENTS_COLLECTION, event.id);
        
        // Get all contacts from other groups in the event
        const otherGroupContacts = await this.getContactsFromGroups(
          event.groupIds.filter(id => id !== groupId)
        );

        // Combine contacts from updated group and other groups
        const allContactIds = [...new Set([
          ...event.contactIds,
          ...updatedContactIds,
          ...otherGroupContacts
        ])];

        await updateDoc(eventRef, {
          contactIds: allContactIds,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }));
    } catch (error) {
      console.error('Error updating events for group change:', error);
      throw new Error('Failed to update events');
    }
  }

  private async getEventsByGroup(groupId: string): Promise<GroupEvent[]> {
    try {
      const eventsRef = collection(FIREBASE_FIRESTORE, this.EVENTS_COLLECTION);
      const querySnapshot = await getDocs(
        query(eventsRef, where('groupIds', 'array-contains', groupId))
      );

      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as GroupEvent[];
    } catch (error) {
      console.error('Error getting events by group:', error);
      throw new Error('Failed to get events');
    }
  }

  private async getContactsFromGroups(groupIds: string[]): Promise<string[]> {
    try {
      const groups = await Promise.all(
        groupIds.map(id => getDoc(doc(FIREBASE_FIRESTORE, this.GROUPS_COLLECTION, id)))
      );

      return [...new Set(
        groups
          .filter(doc => doc.exists())
          .flatMap(doc => (doc.data() as Group).contactIds)
      )];
    } catch (error) {
      console.error('Error getting contacts from groups:', error);
      throw new Error('Failed to get group contacts');
    }
  }
}