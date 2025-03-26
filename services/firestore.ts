import { auth, firestore } from '@/config/firebase';
import type { CalendarEvent, EventInvitation } from '@/types/calendar';
import type { DocumentData } from '@firebase/firestore-types';

export async function syncUserProfile(email: string, displayName: string) {
  try {
    await firestore().collection('users').doc(email).set({
      email,
      displayName,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to sync user profile:', err);
    throw err;
  }
}

export async function getUserProfile(email: string) {
  try {
    const doc = await firestore().collection('users').doc(email).get();
    return doc.data() as DocumentData | undefined;
  } catch (err) {
    console.error('Failed to get user profile:', err);
    throw err;
  }
}

export async function syncCalendarEvent(event: CalendarEvent) {
  try {
    const user = auth().currentUser;
    if (!user?.email) throw new Error('User not authenticated');

    // Save event to Firestore
    await firestore()
      .collection('users')
      .doc(user.email)
      .collection('calendar')
      .doc(event.id)
      .set({
        ...event,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Create invitations for attendees
    if (event.attendees?.length) {
      const batch = firestore().batch();

      for (const attendee of event.attendees) {
        if (attendee.email === user.email) continue;

        const invitationRef = firestore()
          .collection('users')
          .doc(attendee.email)
          .collection('invitations')
          .doc();

        batch.set(invitationRef, {
          id: invitationRef.id,
          event,
          invitedBy: user.email,
          invitedEmail: attendee.email,
          status: 'pending',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to sync calendar event:', err);
    throw err;
  }
}

export async function getCalendarEvents(
  email: string,
): Promise<CalendarEvent[]> {
  try {
    const snapshot = await firestore()
      .collection('users')
      .doc(email)
      .collection('calendar')
      .get();

    return snapshot.docs.map((doc) => doc.data() as CalendarEvent);
  } catch (err) {
    console.error('Failed to get calendar events:', err);
    throw err;
  }
}

export async function getPendingInvitations(
  email: string,
): Promise<EventInvitation[]> {
  try {
    const snapshot = await firestore()
      .collection('users')
      .doc(email)
      .collection('invitations')
      .where('status', '==', 'pending')
      .get();

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

export async function respondToInvitation(
  invitationId: string,
  email: string,
  status: 'accepted' | 'declined',
) {
  try {
    const invitationRef = firestore()
      .collection('users')
      .doc(email)
      .collection('invitations')
      .doc(invitationId);

    const invitationDoc = await invitationRef.get();
    if (!invitationDoc.exists) throw new Error('Invitation not found');

    const invitation = invitationDoc.data() as EventInvitation;

    // Update invitation status
    await invitationRef.update({
      status,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // If accepted, add event to user's calendar
    if (status === 'accepted') {
      await firestore()
        .collection('users')
        .doc(email)
        .collection('calendar')
        .doc(invitation.event.id)
        .set({
          ...invitation.event,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    }
  } catch (err) {
    console.error('Failed to respond to invitation:', err);
    throw err;
  }
}
