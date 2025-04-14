import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import * as Calendar from 'expo-calendar';
import { MaterialIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { CalendarView } from './CalendarView';

type SharedCalendar = {
  sharedBy: string;
  sharedByPhone: string;
  sharedByName: string;
  sharedAt: string;
  lastUpdated: string;
  events: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
    notes?: string;
    attendees?: Array<{
      name?: string;
      email?: string;
      status?: string;
    }>;
  }>;
};

export function SharedCalendars() {
  const { isDark } = useTheme();
  const { user, phoneInfo } = useAuth();
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<SharedCalendar | null>(null);

  const loadSharedCalendars = async () => {
    try {
      if (!user || !phoneInfo?.phoneNumber) return;

      const sharedCalendarsRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', phoneInfo.phoneNumber);
      const sharedCalendarsDoc = await getDoc(sharedCalendarsRef);

      if (sharedCalendarsDoc.exists()) {
        const data = sharedCalendarsDoc.data();
        const calendars: SharedCalendar[] = [];

        for (const [sharedBy, calendarData] of Object.entries(data)) {
          if (sharedBy === 'metadata') continue;

          const userRef = doc(FIREBASE_FIRESTORE, 'users', sharedBy);
          const userDoc = await getDoc(userRef);
          const userName = userDoc.exists() ? userDoc.data().displayName : 'Unknown User';

          calendars.push({
            sharedBy,
            sharedByPhone: calendarData.sharedByPhone,
            sharedByName: userName,
            sharedAt: calendarData.sharedAt,
            lastUpdated: calendarData.lastUpdated,
            events: calendarData.events || [],
          });
        }

        setSharedCalendars(calendars);
      }
    } catch (error) {
      console.error('Error loading shared calendars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSharedCalendars();
  }, [user, phoneInfo]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSharedCalendars();
  };

  const handleAcceptCalendar = async (calendar: SharedCalendar) => {
    try {
      if (!phoneInfo?.phoneNumber) return;
      
      const cleanPhoneNumber = phoneInfo.phoneNumber.replace(/\D/g, '');
      const sharedCalendarsRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
      
      await updateDoc(sharedCalendarsRef, {
        [`${calendar.sharedByPhone}.status`]: 'accepted'
      });

      // Import events to local calendar
      await importEventsToCalendar(calendar);
      
      loadSharedCalendars();
    } catch (err) {
      console.error('Error accepting calendar:', err);
      Alert.alert('Error', 'Failed to accept calendar');
    }
  };

  const handleRejectCalendar = async (calendar: SharedCalendar) => {
    try {
      if (!phoneInfo?.phoneNumber) return;
      
      const cleanPhoneNumber = phoneInfo.phoneNumber.replace(/\D/g, '');
      const sharedCalendarsRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
      
      await updateDoc(sharedCalendarsRef, {
        [`${calendar.sharedByPhone}.status`]: 'rejected'
      });
      
      loadSharedCalendars();
    } catch (err) {
      console.error('Error rejecting calendar:', err);
      Alert.alert('Error', 'Failed to reject calendar');
    }
  };

  const importEventsToCalendar = async (calendar: SharedCalendar) => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Calendar permission is required to import events');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.isPrimary);

      if (!defaultCalendar) {
        Alert.alert('Error', 'No calendar found to import events');
        return;
      }

      for (const event of calendar.events) {
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: event.title,
          startDate: parseISO(event.startDate),
          endDate: parseISO(event.endDate),
          location: event.location,
          notes: event.notes,
          timeZone: 'UTC',
        });
      }

      Alert.alert('Success', 'Events imported successfully');
    } catch (err) {
      console.error('Error importing events:', err);
      Alert.alert('Error', 'Failed to import events');
    }
  };

  const renderCalendarCard = ({ item: calendar }: { item: SharedCalendar }) => (
    <TouchableOpacity
      style={[styles.calendarCard, isDark && styles.calendarCardDark]}
      onPress={() => setSelectedCalendar(calendar)}
    >
      <View style={styles.calendarHeader}>
        <Text style={[styles.calendarTitle, isDark && styles.textLight]}>
          {calendar.sharedByName}'s Calendar
        </Text>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={isDark ? '#94a3b8' : '#64748b'}
        />
      </View>
      <Text style={[styles.calendarSubtitle, isDark && styles.textMuted]}>
        {calendar.sharedByPhone}
      </Text>
      <View style={styles.calendarFooter}>
        <Text style={[styles.calendarDate, isDark && styles.textMuted]}>
          Shared {format(new Date(calendar.sharedAt), 'MMM d, yyyy')}
        </Text>
        <Text style={[styles.calendarDate, isDark && styles.textMuted]}>
          Updated {format(new Date(calendar.lastUpdated), 'MMM d, yyyy')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={isDark ? '#94a3b8' : '#64748b'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <FlatList
        data={sharedCalendars}
        renderItem={renderCalendarCard}
        keyExtractor={(item) => item.sharedBy}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="calendar-today"
              size={48}
              color={isDark ? '#94a3b8' : '#64748b'}
            />
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>
              No calendars shared with you yet
            </Text>
          </View>
        }
      />
      {selectedCalendar && (
        <CalendarView
          calendar={selectedCalendar}
          isVisible={!!selectedCalendar}
          onClose={() => setSelectedCalendar(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  listContent: {
    padding: 16,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarCardDark: {
    backgroundColor: '#1e293b',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
  },
  calendarSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 