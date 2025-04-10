import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import * as ExpoCalendar from 'expo-calendar';

type InvitationStatus = 'pending' | 'going' | 'interested' | 'not_interested';

interface EventInvitation {
  id: string;
  eventId: string;
  title: string;
  description: string;
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

export default function InvitationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<EventInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInvitation(id as string);
    }
  }, [id]);

  const loadInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const invitationRef = doc(FIREBASE_FIRESTORE, 'eventInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);

      if (!invitationDoc.exists()) {
        setError('Invitation not found');
        return;
      }

      const invitationData = invitationDoc.data();
      
      // Get the event details
      const eventRef = doc(FIREBASE_FIRESTORE, 'events', invitationData.eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        setError('Event not found');
        return;
      }

      const eventData = eventDoc.data();
      setInvitation({
        id: invitationId,
        eventId: invitationData.eventId,
        title: eventData.title,
        description: eventData.description || '',
        startDate: eventData.startDate.toDate(),
        endDate: eventData.endDate.toDate(),
        location: eventData.location || '',
        organizer: {
          name: eventData.organizerName || 'Unknown',
          email: eventData.organizerEmail || '',
        },
        status: invitationData.status || 'pending',
        createdAt: invitationData.createdAt.toDate(),
      });
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const updateInvitationStatus = async (status: InvitationStatus) => {
    if (!invitation) return;

    try {
      setError(null);
      
      // Update the invitation status in Firestore
      const invitationRef = doc(FIREBASE_FIRESTORE, 'eventInvitations', invitation.id);
      await updateDoc(invitationRef, {
        status,
        updatedAt: new Date(),
      });

      // Update the local state
      setInvitation(prev => prev ? { ...prev, status } : null);

      // If the user is going or interested, add the event to their calendar
      if (status === 'going' || status === 'interested') {
        await addEventToCalendar(invitation);
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

      // Get the default calendar
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary);
      
      if (!defaultCalendar) {
        Alert.alert('Error', 'No default calendar found');
        return;
      }

      // Add the event to the calendar
      await ExpoCalendar.createEventAsync(defaultCalendar.id, {
        title: invitation.title,
        startDate: invitation.startDate,
        endDate: invitation.endDate,
        location: invitation.location,
        notes: `Invited by: ${invitation.organizer.name} (${invitation.organizer.email})`,
        alarms: [{ relativeOffset: -60 }], // 1 hour before
      });

      Alert.alert('Success', 'Event added to your calendar');
    } catch (err) {
      console.error('Error adding event to calendar:', err);
      Alert.alert('Error', 'Failed to add event to your calendar');
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

  if (error || !invitation) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Invitation not found'}</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
        </Pressable>
        <Text style={[styles.title, isDark && styles.textLight]}>Event Invitation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.eventTitle, isDark && styles.textLight]}>
            {invitation.title}
          </Text>

          {invitation.description && (
            <Text style={[styles.description, isDark && styles.textMuted]}>
              {invitation.description}
            </Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <CalendarIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.detailText, isDark && styles.textMuted]}>
                {format(invitation.startDate, 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.detailText, isDark && styles.textMuted]}>
                {format(invitation.startDate, 'h:mm a')} - {format(invitation.endDate, 'h:mm a')}
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
                Organized by {invitation.organizer.name}
              </Text>
            </View>
          </View>

          <View style={styles.responseContainer}>
            <Text style={[styles.responseTitle, isDark && styles.textLight]}>
              Your Response
            </Text>

            <View style={styles.responseButtons}>
              <Pressable
                style={[
                  styles.responseButton,
                  invitation.status === 'going' && styles.responseButtonActive,
                  isDark && styles.responseButtonDark
                ]}
                onPress={() => updateInvitationStatus('going')}
              >
                <CheckCircle
                  size={20}
                  color={invitation.status === 'going' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.responseButtonText,
                    invitation.status === 'going' && styles.responseButtonTextActive,
                    isDark && styles.textMuted
                  ]}
                >
                  Going
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.responseButton,
                  invitation.status === 'interested' && styles.responseButtonActive,
                  isDark && styles.responseButtonDark
                ]}
                onPress={() => updateInvitationStatus('interested')}
              >
                <Clock
                  size={20}
                  color={invitation.status === 'interested' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.responseButtonText,
                    invitation.status === 'interested' && styles.responseButtonTextActive,
                    isDark && styles.textMuted
                  ]}
                >
                  Interested
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.responseButton,
                  invitation.status === 'not_interested' && styles.responseButtonActive,
                  isDark && styles.responseButtonDark
                ]}
                onPress={() => updateInvitationStatus('not_interested')}
              >
                <XCircle
                  size={20}
                  color={invitation.status === 'not_interested' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.responseButtonText,
                    invitation.status === 'not_interested' && styles.responseButtonTextActive,
                    isDark && styles.textMuted
                  ]}
                >
                  Not Interested
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardDark: {
    backgroundColor: '#1e293b',
  },
  eventTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    marginBottom: 24,
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
  responseContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  responseTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 16,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  responseButtonDark: {
    backgroundColor: '#334155',
  },
  responseButtonActive: {
    backgroundColor: '#0891b2',
  },
  responseButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  responseButtonTextActive: {
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0891b2',
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
    marginTop: 12,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 