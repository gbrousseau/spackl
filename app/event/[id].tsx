import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  Edit,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import type { CalendarEvent } from '@/types/calendar';
import { FIREBASE_AUTH } from '@/firebaseConfig';

const auth = FIREBASE_AUTH;

export default function EventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const { events, updateEvent, deleteEvent } = useCalendar();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        router.replace('/sign-in');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      const foundEvent = events.find((e) => e.id === id);
      if (foundEvent) {
        setEvent(foundEvent);
      }
    }
  }, [id, events, isAuthenticated]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!event) return;

    try {
      await updateEvent(event);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update event:', err);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      await deleteEvent(event.id);
      router.back();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  if (!event) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <Text style={[styles.text, isDark && styles.textLight]}>
          Event not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft
            size={24}
            color={isDark ? '#94a3b8' : '#64748b'}
          />
        </Pressable>
        <Text style={[styles.title, isDark && styles.textLight]}>
          Event Details
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          {isEditing ? (
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={event.title}
              onChangeText={(text) =>
                setEvent((prev) => prev ? { ...prev, title: text } : null)
              }
              placeholder="Event title"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            />
          ) : (
            <Text style={[styles.eventTitle, isDark && styles.textLight]}>
              {event.title}
            </Text>
          )}

          <View style={styles.detailRow}>
            <Calendar
              size={20}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              {new Date(event.startDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock
              size={20}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
            <Text style={[styles.detailText, isDark && styles.textMuted]}>
              {new Date(event.startDate).toLocaleTimeString()} -{' '}
              {new Date(event.endDate).toLocaleTimeString()}
            </Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <MapPin
                size={20}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              {isEditing ? (
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={event.location}
                  onChangeText={(text) =>
                    setEvent((prev) =>
                      prev ? { ...prev, location: text } : null
                    )
                  }
                  placeholder="Location"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                />
              ) : (
                <Text style={[styles.detailText, isDark && styles.textMuted]}>
                  {event.location}
                </Text>
              )}
            </View>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <View style={styles.detailRow}>
              <Users
                size={20}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              <Text style={[styles.detailText, isDark && styles.textMuted]}>
                {event.attendees.length} attendee
                {event.attendees.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {event.notes && (
            <View style={styles.notesSection}>
              {isEditing ? (
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={event.notes}
                  onChangeText={(text) =>
                    setEvent((prev) =>
                      prev ? { ...prev, notes: text } : null
                    )
                  }
                  placeholder="Notes"
                  placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                  multiline
                />
              ) : (
                <Text style={[styles.notes, isDark && styles.textMuted]}>
                  {event.notes}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        {isEditing ? (
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Save Changes</Text>
          </Pressable>
        ) : (
          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
                isDark && styles.secondaryButtonDark,
              ]}
              onPress={handleEdit}
            >
              <Edit size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
                isDark && styles.secondaryButtonDark,
              ]}
              onPress={handleDelete}
            >
              <Share2 size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerDark: {
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  cardDark: {
    backgroundColor: '#334155',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
  },
  text: {
    fontSize: 16,
    color: '#0f172a',
    marginTop: 16,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerDark: {
    borderTopColor: '#334155',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
  },
  secondaryButtonDark: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  inputDark: {
    borderColor: '#334155',
  },
  notesSection: {
    marginTop: 16,
  },
  notes: {
    fontSize: 16,
    color: '#0f172a',
  },
});
