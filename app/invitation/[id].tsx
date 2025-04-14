import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar as CalendarIcon, MapPin, Users, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import * as Calendar from 'expo-calendar';

type InvitationStatus = 'pending' | 'going' | 'interested' | 'not_interested';

interface EventInvitation {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: InvitationStatus;
  organizer: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

export default function InvitationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<EventInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadInvitation();
  }, [id]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get invitation from different identifiers
      let invitationDoc = null;
      let documentId = null;

      // First try: user's phone number
      if (user?.phoneNumber) {
        const phoneRef = doc(FIREBASE_FIRESTORE, 'invitations', user.phoneNumber);
        invitationDoc = await getDoc(phoneRef);
        if (invitationDoc.exists()) {
          documentId = user.phoneNumber;
        }
      }

      // Second try: user's email
      if (!invitationDoc?.exists() && user?.email) {
        const emailRef = doc(FIREBASE_FIRESTORE, 'invitations', user.email);
        invitationDoc = await getDoc(emailRef);
        if (invitationDoc.exists()) {
          documentId = user.email;
        }
      }

      // Third try: fallback phone number
      if (!invitationDoc?.exists()) {
        const fallbackRef = doc(FIREBASE_FIRESTORE, 'invitations', '8184810612');
        invitationDoc = await getDoc(fallbackRef);
        if (invitationDoc.exists()) {
          documentId = '8184810612';
        }
      }

      if (!invitationDoc?.exists()) {
        setError('Invitation not found');
        return;
      }

      const invitationData = invitationDoc.data();
      const invitations = invitationData.invitations || [];
      const targetInvitation = invitations.find((inv: any) => inv.id === id);
      
      if (!targetInvitation) {
        setError('Invitation not found');
        return;
      }
      
      // Get event details
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', targetInvitation.eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        setError('Event not found');
        return;
      }

      const eventData = eventDoc.data();
      
      const formattedInvitation: EventInvitation = {
        id: targetInvitation.id,
        eventId: targetInvitation.eventId,
        title: eventData.title || 'Untitled Event',
        description: eventData.description || '',
        startDate: eventData.startDate?.toDate?.() || new Date(),
        endDate: eventData.endDate?.toDate?.() || new Date(),
        location: eventData.location || '',
        status: targetInvitation.status || 'pending',
        organizer: {
          name: eventData.organizer?.name || 'Unknown Organizer',
          email: eventData.organizer?.email || '',
        },
        createdAt: targetInvitation.createdAt?.toDate?.() || new Date(),
      };

      setInvitation(formattedInvitation);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: InvitationStatus) => {
    try {
      setUpdatingStatus(true);
      setError(null);

      // Try to update invitation in different identifiers
      let success = false;

      // First try: user's phone number
      if (user?.phoneNumber) {
        const phoneRef = doc(FIREBASE_FIRESTORE, 'invitations', user.phoneNumber);
        await updateDoc(phoneRef, { status: newStatus });
        success = true;
      }

      // Second try: user's email
      if (!success && user?.email) {
        const emailRef = doc(FIREBASE_FIRESTORE, 'invitations', user.email);
        await updateDoc(emailRef, { status: newStatus });
        success = true;
      }

      // Third try: fallback phone number
      if (!success) {
        const fallbackRef = doc(FIREBASE_FIRESTORE, 'invitations', '8184810612');
        await updateDoc(fallbackRef, { status: newStatus });
        success = true;
      }

      if (success && invitation) {
        setInvitation({ ...invitation, status: newStatus });

        // Add to calendar if going or interested
        if (newStatus === 'going' || newStatus === 'interested') {
          try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            if (status === 'granted') {
              const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
              const defaultCalendar = calendars.find(cal => cal.isPrimary);

              if (defaultCalendar) {
                await Calendar.createEventAsync(defaultCalendar.id, {
                  title: invitation.title,
                  startDate: invitation.startDate,
                  endDate: invitation.endDate,
                  location: invitation.location,
                  notes: `Organized by: ${invitation.organizer.name}\n${invitation.description}`,
                });
              }
            }
          } catch (calendarErr) {
            console.error('Error adding to calendar:', calendarErr);
          }
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={[styles.loadingText, isDark && styles.textLight]}>Loading invitation...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.centerContainer, isDark && styles.centerContainerDark]}>
          <XCircle size={48} color={isDark ? '#ef4444' : '#dc2626'} />
          <Text style={[styles.errorText, isDark && styles.textLight]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, isDark && styles.retryButtonDark]}
            onPress={loadInvitation}
          >
            <Text style={[styles.retryButtonText, isDark && styles.textLight]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.centerContainer, isDark && styles.centerContainerDark]}>
          <XCircle size={48} color={isDark ? '#ef4444' : '#dc2626'} />
          <Text style={[styles.errorText, isDark && styles.textLight]}>Invitation not found</Text>
          <Pressable
            style={[styles.retryButton, isDark && styles.retryButtonDark]}
            onPress={() => router.back()}
          >
            <Text style={[styles.retryButtonText, isDark && styles.textLight]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>{invitation.title}</Text>
        
        {invitation.description && (
          <Text style={[styles.description, isDark && styles.textMuted]}>
            {invitation.description}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              {invitation.startDate.toLocaleDateString()} at {invitation.startDate.toLocaleTimeString()}
            </Text>
          </View>

          {invitation.location && (
            <View style={styles.detailRow}>
              <MapPin size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.detailText, isDark && styles.textMuted]}>
                {invitation.location}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Users size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              Organized by: {invitation.organizer.name}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Text style={[styles.statusTitle, isDark && styles.textLight]}>Your Response</Text>
          <View style={styles.statusButtons}>
            <Pressable
              style={[
                styles.statusButton,
                invitation.status === 'going' && styles.statusButtonActive,
                isDark && styles.statusButtonDark,
              ]}
              onPress={() => updateStatus('going')}
              disabled={updatingStatus}
            >
              <CheckCircle size={20} color={invitation.status === 'going' ? '#ffffff' : '#10b981'} />
              <Text
                style={[
                  styles.statusButtonText,
                  invitation.status === 'going' && styles.statusButtonTextActive,
                  isDark && styles.textLight,
                ]}
              >
                Going
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.statusButton,
                invitation.status === 'interested' && styles.statusButtonActive,
                isDark && styles.statusButtonDark,
              ]}
              onPress={() => updateStatus('interested')}
              disabled={updatingStatus}
            >
              <Clock size={20} color={invitation.status === 'interested' ? '#ffffff' : '#f59e0b'} />
              <Text
                style={[
                  styles.statusButtonText,
                  invitation.status === 'interested' && styles.statusButtonTextActive,
                  isDark && styles.textLight,
                ]}
              >
                Interested
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.statusButton,
                invitation.status === 'not_interested' && styles.statusButtonActive,
                isDark && styles.statusButtonDark,
              ]}
              onPress={() => updateStatus('not_interested')}
              disabled={updatingStatus}
            >
              <XCircle size={20} color={invitation.status === 'not_interested' ? '#ffffff' : '#ef4444'} />
              <Text
                style={[
                  styles.statusButtonText,
                  invitation.status === 'not_interested' && styles.statusButtonTextActive,
                  isDark && styles.textLight,
                ]}
              >
                Not Going
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    padding: 24,
  },
  centerContainerDark: {
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsContainerDark: {
    backgroundColor: '#1e293b',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
  },
  statusContainer: {
    marginTop: 'auto',
  },
  statusTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  statusButtonDark: {
    backgroundColor: '#1e293b',
  },
  statusButtonActive: {
    backgroundColor: '#0891b2',
  },
  statusButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 8,
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  retryButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  retryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0891b2',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 