import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Calendar, CheckCircle, XCircle, Clock, ChevronRight, Users, MapPin } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import * as ExpoCalendar from 'expo-calendar';

type InvitationStatus = 'pending' | 'going' | 'interested' | 'not_interested';

interface EventData {
  title: string;
  startDate: { toDate: () => Date };
  endDate: { toDate: () => Date };
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
}

interface EventInvitation {
  id: string;
  eventId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  organizer: {
    name: string;
    email: string;
  };
  status: InvitationStatus;
  createdAt: Date;
}

interface UserInvitations {
  email: string;
  events: EventInvitation[];
  updatedAt: Date;
}

interface GroupedInvitations {
  pending: EventInvitation[];
  going: EventInvitation[];
  interested: EventInvitation[];
  not_interested: EventInvitation[];
}

function mapJsonToEventInvitation(json: any, id: string): EventInvitation {
  return {
    id,
    eventId: json.eventId,
    title: json.eventTitle || '',
    startDate: new Date(
      json.startDate && typeof json.startDate.seconds === 'number'
        ? json.startDate.seconds * 1000
        : Date.now()
    ),
    endDate: new Date(
      json.endDate && typeof json.endDate.seconds === 'number'
        ? json.endDate.seconds * 1000
        : Date.now()
    ),
    location: json.location || '',
    organizer: {
      name: json.organize?.name || 'Unknown',
      email: json.organize?.email || '',
    },
    status: json.status as InvitationStatus,
    createdAt: new Date(
      json.createdAt && typeof json.createdAt.seconds === 'number'
        ? json.createdAt.seconds * 1000
        : Date.now()
    ),
  };
}

// Main component for the Invitations screen
export default function InvitationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<GroupedInvitations>({
    pending: [],
    going: [],
    interested: [],
    not_interested: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get invitations in priority order
      let userInvitationsDoc = null;
      let documentId = null;

      // First try: user's phone number
      if (user.phoneNumber) {
        const phoneRef = doc(FIREBASE_FIRESTORE, 'users', user.phoneNumber, 'invitations', 'all');
        userInvitationsDoc = await getDoc(phoneRef);
        if (userInvitationsDoc.exists()) {
          documentId = user.phoneNumber;
        }
      }

      // Second try: user's email
      if (!userInvitationsDoc?.exists() && user.email) {
        const emailRef = doc(FIREBASE_FIRESTORE, 'users', user.email, 'invitations', 'all');
        userInvitationsDoc = await getDoc(emailRef);
        if (userInvitationsDoc.exists()) {
          documentId = user.email;
        }
      }

      // Third try: fallback phone number
      if (!userInvitationsDoc?.exists()) {
        const fallbackRef = doc(FIREBASE_FIRESTORE, 'users', '8184810612', 'invitations', 'all');
        userInvitationsDoc = await getDoc(fallbackRef);
        if (userInvitationsDoc.exists()) {
          documentId = '8184810612';
        }
      }

      const loadedInvitations: GroupedInvitations = {
        pending: [],
        going: [],
        interested: [],
        not_interested: [],
      };

      if (userInvitationsDoc?.exists()) {
        const rawData = userInvitationsDoc.data();
        const invitations = rawData.invitations || [];

        // Process each invitation
        for (const invitation of invitations) {
          const mappedInvitation = mapJsonToEventInvitation(invitation, invitation.id);
          loadedInvitations[mappedInvitation.status].push(mappedInvitation);
        }
      }

      // Sort each category by date (newest first)
      Object.keys(loadedInvitations).forEach(status => {
        loadedInvitations[status as InvitationStatus].sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      });

      setInvitations(loadedInvitations);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const updateInvitationStatus = async (invitationId: string, status: InvitationStatus) => {
    if (!user?.email) return;

    try {
      setError(null);
      
      // Get the user's invitations document
      const userInvitationsRef = doc(FIREBASE_FIRESTORE, 'invitations', user.email);
      const userInvitationsDoc = await getDoc(userInvitationsRef);

      if (!userInvitationsDoc.exists()) {
        throw new Error('No invitations found');
      }

      const userData = userInvitationsDoc.data() as UserInvitations;
      
      // Update the status of the specific invitation
      const updatedEvents = userData.events.map(event => 
        event.id === invitationId ? { ...event, status } : event
      );

      // Update Firestore
      await updateDoc(userInvitationsRef, {
        events: updatedEvents,
        updatedAt: new Date(),
      });

      // Update local state
      setInvitations(prev => {
        const newInvitations = { ...prev };
        
        // Find the invitation in any category
        let foundInvitation: EventInvitation | undefined;
        let oldStatus: InvitationStatus | undefined;
        
        Object.entries(prev).forEach(([status, invitations]) => {
          const index = invitations.findIndex((inv: EventInvitation) => inv.id === invitationId);
          if (index !== -1) {
            foundInvitation = invitations[index];
            oldStatus = status as InvitationStatus;
            newInvitations[status as InvitationStatus] = invitations.filter((inv: EventInvitation) => inv.id !== invitationId);
          }
        });

        if (foundInvitation && oldStatus) {
          // Add to the new category
          newInvitations[status].push({
            ...foundInvitation,
            status,
          });
        }

        return newInvitations;
      });

      // If the user is going or interested, add the event to their calendar
      if (status === 'going' || status === 'interested') {
        const invitation = [...invitations.pending, ...invitations.going, ...invitations.interested, ...invitations.not_interested]
          .find(inv => inv.id === invitationId);
        
        if (invitation) {
          await addEventToCalendar(invitation);
        }
      }

      Alert.alert('Success', `You have marked yourself as ${status.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating invitation status:', err);
      setError('Failed to update invitation status');
      Alert.alert('Error', 'Failed to update your response');
    }
  };

  const addEventToCalendar = async (invitation: EventInvitation) => {
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Calendar Permission Required',
          'Please allow calendar access to add this event to your calendar.',
          [{ text: 'OK' }]
        );
        return;
      }

      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary);
      
      if (!defaultCalendar) {
        Alert.alert('Error', 'No default calendar found');
        return;
      }

      await ExpoCalendar.createEventAsync(defaultCalendar.id, {
        title: invitation.title,
        startDate: invitation.startDate,
        endDate: invitation.endDate,
        location: invitation.location,
        notes: `Invited by: ${invitation.organizer.name}`,
      });

      Alert.alert('Success', 'Event added to your calendar');
    } catch (err) {
      console.error('Error adding event to calendar:', err);
      Alert.alert('Error', 'Failed to add event to your calendar');
    }
  };

  const viewInvitationDetails = (invitation: EventInvitation) => {
    router.push({
      pathname: '/invitation/[id]',
      params: { id: invitation.id }
    });
  };

  const renderInvitationCard = (invitation: EventInvitation) => (
    <Pressable
      key={invitation.id}
      testID="invitation-card"
      style={[styles.invitationCard, isDark && styles.invitationCardDark]}
      onPress={() => viewInvitationDetails(invitation)}
    >
      <View style={styles.invitationHeader}>
        <Text style={[styles.invitationTitle, isDark && styles.textLight]}>
          {invitation.title}
        </Text>
        <View style={styles.statusContainer}>
          {invitation.status === 'going' && (
            <CheckCircle size={16} color="#10b981" />
          )}
          {invitation.status === 'not_interested' && (
            <XCircle size={16} color="#ef4444" />
          )}
          {invitation.status === 'interested' && (
            <Clock size={16} color="#f59e0b" />
          )}
          {invitation.status === 'pending' && (
            <Clock size={16} color="#64748b" />
          )}
        </View>
      </View>

      <View style={styles.invitationDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.detailText, isDark && styles.textMuted]}>
            {format(invitation.startDate, 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        
        {invitation.location && (
          <View style={styles.detailRow}>
            <Users size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              {invitation.location}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.invitationFooter}>
        <Text style={[styles.organizerText, isDark && styles.textMuted]}>
          From: {invitation.organizer.name || 'Organizer'}
        </Text>
        <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
      </View>
    </Pressable>
  );

  const renderInvitationSection = (title: string, invitations: EventInvitation[], status: InvitationStatus) => {
    if (invitations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          {title} ({invitations.length})
        </Text>
        {invitations.map(renderInvitationCard)}
      </View>
    );
  };

  const saveInvitationToFirestore = async (eventData: any, attendeeEmail: string) => {
    try {
      // Get or create the user's invitations document
      const userInvitationsRef = doc(FIREBASE_FIRESTORE, 'invitations', attendeeEmail);
      const userInvitationsDoc = await getDoc(userInvitationsRef);

      const newInvitation: EventInvitation = {
        id: crypto.randomUUID(), // Generate a unique ID for the invitation
        eventId: eventData.id,
        title: eventData.title,
        startDate: eventData.startDate.toDate(),
        endDate: eventData.endDate.toDate(),
        location: eventData.location || '',
        organizer: {
          name: eventData.organizerName || 'Unknown',
          email: eventData.organizerEmail || '',
        },
        status: 'pending',
        createdAt: new Date(),
      };

      if (userInvitationsDoc.exists()) {
        // Update existing document
        const userData = userInvitationsDoc.data() as UserInvitations;
        await updateDoc(userInvitationsRef, {
          events: [...userData.events, newInvitation],
          updatedAt: new Date(),
        });
      } else {
        // Create new document
        const userInvitations: UserInvitations = {
          email: attendeeEmail,
          events: [newInvitation],
          updatedAt: new Date(),
        };
        await setDoc(userInvitationsRef, userInvitations);
      }

      console.log('Invitation saved for user:', attendeeEmail);
      return newInvitation.id;
    } catch (error) {
      console.error('Error saving invitation:', error);
      throw error;
    }
  };

  // Function to send an invitation to a user
  const sendInvitation = async (eventId: string, attendeeEmail: string) => {
    try {
      // Get the event details
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }
      
      const eventData = eventDoc.data();
      
      // Save the invitation to Firestore
      await saveInvitationToFirestore(eventData, attendeeEmail);
      
      Alert.alert('Success', `Invitation sent to ${attendeeEmail}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar testID="empty-state-icon" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
      <Text style={[styles.emptyStateText, isDark && styles.textMuted]}>
        You don't have any event invitations yet
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator testID="loading-indicator" size="large" color="#0891b2" />
          <Text style={[styles.loadingText, isDark && styles.textLight]}>Loading invitations...</Text>
        </View>
      </View>
    );
  }

  const totalInvitations = Object.values(invitations).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textLight]}>Invitations</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          {totalInvitations === 0 
            ? 'You have no invitations' 
            : `${totalInvitations} invitation${totalInvitations === 1 ? '' : 's'}`}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator testID="loading-indicator" size="large" color="#0891b2" />
            <Text style={[styles.loadingText, isDark && styles.textLight]}>Loading invitations...</Text>
          </View>
        ) : totalInvitations === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderInvitationSection('Unread', invitations.pending, 'pending')}
            {renderInvitationSection('Going', invitations.going, 'going')}
            {renderInvitationSection('Interested', invitations.interested, 'interested')}
            {renderInvitationSection('Not Going', invitations.not_interested, 'not_interested')}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#ef4444',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  invitationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  invitationCardDark: {
    backgroundColor: '#1e293b',
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    flex: 1,
  },
  statusContainer: {
    marginLeft: 8,
  },
  invitationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  invitationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  organizerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 