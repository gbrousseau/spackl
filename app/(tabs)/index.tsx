import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Plus,
  CircleAlert as AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import type { CalendarEvent } from '@/types/calendar';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

const auth = FIREBASE_AUTH;
export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEvents, setShowEvents] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
  const router = useRouter();
  const { theme } = useTheme();
  const { events, loading, error, refreshEvents } = useCalendar();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsAuthenticated(!!user);
      if (!user) {
        router.replace('/sign-in');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshEvents();
    }
  }, [isAuthenticated, refreshEvents]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowEvents(false);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedDate((prev) => subMonths(prev, 1));
    setShowEvents(false);
  }, []);

  const handleNextMonth = useCallback(() => {
    setSelectedDate((prev) => addMonths(prev, 1));
    setShowEvents(false);
  }, []);

  const handleDayPress = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowEvents(true);
  }, []);

  const handleAddEvent = useCallback(() => {
    router.push('/add-event');
  }, [router]);

  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      router.push(`/event/${event.id}`);
    },
    [router],
  );

  const renderCalendarHeader = useCallback(() => {
    return (
      <View style={styles.calendarHeader}>
        <Pressable onPress={handlePrevMonth} style={styles.headerButton}>
          <ChevronLeft
            size={24}
            color={theme === 'dark' ? '#94a3b8' : '#64748b'}
          />
        </Pressable>
        <Text style={[styles.monthText, theme === 'dark' && styles.textLight]}>
          {format(selectedDate, 'MMMM yyyy')}
        </Text>
        <Pressable onPress={handleNextMonth} style={styles.headerButton}>
          <ChevronRight
            size={24}
            color={theme === 'dark' ? '#94a3b8' : '#64748b'}
          />
        </Pressable>
      </View>
    );
  }, [selectedDate, theme, handlePrevMonth, handleNextMonth]);

  const renderCalendarDays = useCallback(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.daysRow}>
        {days.map((day) => (
          <View key={day} style={styles.dayCell}>
            <Text
              style={[styles.dayText, theme === 'dark' && styles.textMuted]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [theme]);

  const renderCalendarGrid = useCallback(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <View style={styles.calendarGrid}>
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentMonth = isSameMonth(date, selectedDate);
          const isCurrentDay = isToday(date);
          const isPastDay = isPast(date) && !isCurrentDay;

          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.startDate), date),
          );

          return (
            <Pressable
              key={date.toISOString()}
              style={[
                styles.dateCell,
                !isCurrentMonth && styles.otherMonthCell,
                isSelected && styles.selectedCell,
                theme === 'dark' && styles.dateCellDark,
              ]}
              onPress={() => handleDayPress(date)}
            >
              <Text
                style={[
                  styles.dateText,
                  isPastDay && styles.pastDateText,
                  isCurrentDay && styles.currentDateText,
                  isSelected && styles.selectedDateText,
                  theme === 'dark' && styles.textLight,
                ]}
              >
                {format(date, 'd')}
              </Text>
              {dayEvents.length > 0 && (
                <View
                  style={[
                    styles.eventDot,
                    isSelected && styles.selectedEventDot,
                    theme === 'dark' && styles.eventDotDark,
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }, [selectedDate, events, theme, handleDayPress]);

  const renderEventsList = useCallback(() => {
    const dayEvents = events.filter((event) =>
      isSameDay(new Date(event.startDate), selectedDate),
    );

    if (dayEvents.length === 0) {
      return (
        <View style={styles.noEventsContainer}>
          <CalendarIcon
            size={48}
            color={theme === 'dark' ? '#94a3b8' : '#64748b'}
          />
          <Text
            style={[styles.noEventsText, theme === 'dark' && styles.textMuted]}
          >
            No events scheduled
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.eventsList}>
        {dayEvents.map((event) => (
          <Pressable
            key={event.id}
            style={[styles.eventCard, theme === 'dark' && styles.eventCardDark]}
            onPress={() => handleEventPress(event)}
          >
            <View style={styles.eventHeader}>
              <Text
                style={[styles.eventTime, theme === 'dark' && styles.textLight]}
              >
                {format(new Date(event.startDate), 'h:mm a')}
              </Text>
              {event.status === 'tentative' && (
                <AlertCircle
                  size={16}
                  color={theme === 'dark' ? '#94a3b8' : '#64748b'}
                />
              )}
            </View>
            <Text
              style={[styles.eventTitle, theme === 'dark' && styles.textLight]}
            >
              {event.title}
            </Text>
            {event.location && (
              <View style={styles.eventDetail}>
                <MapPin
                  size={16}
                  color={theme === 'dark' ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.eventDetailText,
                    theme === 'dark' && styles.textMuted,
                  ]}
                >
                  {event.location}
                </Text>
              </View>
            )}
            {event.attendees && event.attendees.length > 0 && (
              <View style={styles.eventDetail}>
                <Users
                  size={16}
                  color={theme === 'dark' ? '#94a3b8' : '#64748b'}
                />
                <Text
                  style={[
                    styles.eventDetailText,
                    theme === 'dark' && styles.textMuted,
                  ]}
                >
                  {event.attendees.length} attendee
                  {event.attendees.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    );
  }, [events, selectedDate, theme, handleEventPress]);

  if (!isAuthenticated) {
    return (
      <View
        style={[styles.container, theme === 'dark' && styles.containerDark]}
      >
        <ActivityIndicator
          size="large"
          color={theme === 'dark' ? '#94a3b8' : '#64748b'}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, theme === 'dark' && styles.textLight]}>
          Calendar
        </Text>
      </View>

      <View style={styles.calendar}>
        {renderCalendarHeader()}
        {renderCalendarDays()}
        {renderCalendarGrid()}
      </View>

      {showEvents && (
        <View
          style={[
            styles.eventsContainer,
            theme === 'dark' && styles.eventsContainerDark,
          ]}
        >
          <View style={styles.eventsHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => setShowEvents(false)}
              hitSlop={8}
            >
              <ArrowLeft
                size={24}
                color={theme === 'dark' ? '#94a3b8' : '#64748b'}
              />
            </Pressable>
            <Text
              style={[styles.eventsDate, theme === 'dark' && styles.textLight]}
            >
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme === 'dark' ? '#94a3b8' : '#64748b'}
              />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            renderEventsList()
          )}
        </View>
      )}

      <Pressable
        style={[styles.fab, theme === 'dark' && styles.fabDark]}
        onPress={handleAddEvent}
      >
        <Plus size={24} color="#fff" />
      </Pressable>
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  calendar: {
    paddingHorizontal: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#64748b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  dateCellDark: {
    backgroundColor: '#1e293b',
  },
  otherMonthCell: {
    opacity: 0.5,
  },
  selectedCell: {
    backgroundColor: '#3b82f6',
  },
  dateText: {
    fontSize: 16,
    color: '#0f172a',
  },
  pastDateText: {
    color: '#94a3b8',
  },
  currentDateText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  selectedDateText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  eventDotDark: {
    backgroundColor: '#60a5fa',
  },
  selectedEventDot: {
    backgroundColor: '#fff',
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  eventsContainerDark: {
    backgroundColor: '#1e293b',
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  eventsDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
  },
  noEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventCardDark: {
    backgroundColor: '#334155',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#0f172a',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabDark: {
    backgroundColor: '#60a5fa',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});
