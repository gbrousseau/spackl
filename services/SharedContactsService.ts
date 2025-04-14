import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

export type SharingPermission = 'view' | 'edit' | 'full';
export type SharingDuration = 'permanent' | '24h' | '7d' | '30d';

export interface SharedContact {
  id: string;
  contactId: string;
  permission: SharingPermission;
  duration: SharingDuration;
  sharedAt: Date;
  expiresAt?: Date;
}

export class SharedContactsService {
  private readonly SHARED_CONTACTS_COLLECTION = 'shared_contacts';
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    this.userId = userId;
  }

  private getSharedContactsCollection() {
    return collection(FIREBASE_FIRESTORE, 'users', this.userId, this.SHARED_CONTACTS_COLLECTION);
  }

  async shareContact(
    contactId: string,
    permission: SharingPermission,
    duration: SharingDuration
  ): Promise<SharedContact> {
    try {
      const sharedContactRef = doc(this.getSharedContactsCollection());
      const timestamp = new Date();
      
      const sharedContact: SharedContact = {
        id: sharedContactRef.id,
        contactId,
        permission,
        duration,
        sharedAt: timestamp,
      };

      // Calculate expiration date if not permanent
      if (duration !== 'permanent') {
        const expiresAt = new Date(timestamp);
        switch (duration) {
          case '24h':
            expiresAt.setHours(expiresAt.getHours() + 24);
            break;
          case '7d':
            expiresAt.setDate(expiresAt.getDate() + 7);
            break;
          case '30d':
            expiresAt.setDate(expiresAt.getDate() + 30);
            break;
        }
        sharedContact.expiresAt = expiresAt;
      }

      await setDoc(sharedContactRef, {
        ...sharedContact,
        sharedAt: Timestamp.fromDate(sharedContact.sharedAt),
        expiresAt: sharedContact.expiresAt ? Timestamp.fromDate(sharedContact.expiresAt) : null,
      });

      return sharedContact;
    } catch (error) {
      console.error('Error sharing contact:', error);
      throw new Error('Failed to share contact');
    }
  }

  async getSharedContacts(): Promise<SharedContact[]> {
    try {
      const sharedContactsRef = this.getSharedContactsCollection();
      const sharedContactsQuery = query(sharedContactsRef);
      const sharedContactsSnapshot = await getDocs(sharedContactsQuery);
      
      return sharedContactsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          sharedAt: data.sharedAt.toDate(),
          expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
        } as SharedContact;
      });
    } catch (error) {
      console.error('Error getting shared contacts:', error);
      throw new Error('Failed to get shared contacts');
    }
  }

  async removeSharedContact(sharedContactId: string): Promise<void> {
    try {
      const sharedContactRef = doc(this.getSharedContactsCollection(), sharedContactId);
      await deleteDoc(sharedContactRef);
    } catch (error) {
      console.error('Error removing shared contact:', error);
      throw new Error('Failed to remove shared contact');
    }
  }

  async updateSharedContact(
    sharedContactId: string,
    updates: Partial<Omit<SharedContact, 'id' | 'contactId' | 'sharedAt'>>
  ): Promise<void> {
    try {
      const sharedContactRef = doc(this.getSharedContactsCollection(), sharedContactId);
      const updateData: any = { ...updates };

      if (updates.expiresAt) {
        updateData.expiresAt = Timestamp.fromDate(updates.expiresAt);
      }

      await updateDoc(sharedContactRef, updateData);
    } catch (error) {
      console.error('Error updating shared contact:', error);
      throw new Error('Failed to update shared contact');
    }
  }
} 