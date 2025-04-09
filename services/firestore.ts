import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '@/firebaseConfig';
import type { CalendarEvent, EventInvitation } from '@/types/calendar';
import type { DocumentData } from '@firebase/firestore-types';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';

const auth = FIREBASE_AUTH;
const firestore = getFirestore();

export async function syncUserProfile(email: string, displayName: string) {
  try {
    await setDoc(doc(collection(firestore, 'users'), email), {
      email,
      displayName,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to sync user profile:', err);
    throw err;
  }
}

export async function getUserProfile(email: string) {
  try {
    const docRef = doc(collection(firestore, 'users'), email);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as DocumentData | undefined;
  } catch (err) {
    console.error('Failed to get user profile:', err);
    throw err;
  }
}

export async function syncCalendarEvent(event: CalendarEvent) {
  try {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('User not authenticated');

    // Save event to Firestore
    await setDoc(doc(collection(firestore, 'users', user.email, 'calendar'), event.id), {
      ...event,
      updatedAt: serverTimestamp(),
    });

    // Create invitations for attendees
    if (event.attendees?.length) {
      const batch = writeBatch(firestore);

      for (const attendee of event.attendees) {
        if (attendee.email === user.email) continue;

        const invitationRef = doc(collection(firestore, 'users', attendee.email, 'invitations'));

        batch.set(invitationRef, {
          id: invitationRef.id,
          event,
          invitedBy: user.email,
          invitedEmail: attendee.email,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to sync calendar event:', err);
    throw err;
  }
}

export async function getCalendarEvents(email: string): Promise<CalendarEvent[]> {
  try {
    const q = query(collection(firestore, 'users', email, 'calendar'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as CalendarEvent);
  } catch (err) {
    console.error('Failed to get calendar events:', err);
    throw err;
  }
}

export async function getPendingInvitations(email: string): Promise<EventInvitation[]> {
  try {
    const q = query(collection(firestore, 'users', email, 'invitations'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        event: data.event,
        invitedBy: data.invitedBy,
        invitedEmail: data.invitedEmail,
        status: data.status,
        createdAt: data.createdAt.toDate(),
      } as EventInvitation;
    });
  } catch (err) {
    console.error('Failed to get pending invitations:', err);
    throw err;
  }
}

export async function respondToInvitation(invitationId: string, email: string, status: 'accepted' | 'declined') {
  try {
    const invitationRef = doc(collection(firestore, 'users', email, 'invitations'), invitationId);
    const invitationDoc = await getDoc(invitationRef);
    if (!invitationDoc.exists()) throw new Error('Invitation not found');

    const invitation = invitationDoc.data() as EventInvitation;

    // Update invitation status
    await updateDoc(invitationRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    // If accepted, add event to user's calendar
    if (status === 'accepted') {
      await setDoc(doc(collection(firestore, 'users', email, 'calendar'), invitation.event.id), {
        ...invitation.event,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Failed to respond to invitation:', err);
    throw err;
  }
}
