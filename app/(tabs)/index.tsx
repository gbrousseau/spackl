import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import { format, parseISO, startOfDay, endOfDay, addDays, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, Plus, CircleAlert as AlertCircle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';

export default function CalendarScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { events, loading, error, refreshEvents, clearError } = useCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEvents, setShowEvents] = useState(false);
  const [fabAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    refreshEvents(currentMonth);
  }, [currentMonth, refreshEvents]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowEvents(true);
  };

  const handleAddEvent = () => {
    Animated.sequence([
      Animated.timing(fabAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/calendar/event?forceNew=true');
    });
  };

  const renderCalendarDay = useCallback((date: Date) => {
    const dayEvents = events.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isPastDate = isPast(date) && !isToday(date);

    return (
      <Pressable
        key={date.toISOString()}
        style={[
          styles.calendarDay,
          !isCurrentMonth && styles.outsideMonth,
          isSelected && styles.selectedDay,
          isDark && styles.calendarDayDark,
          isSelected && isDark && styles.selectedDayDark,
        ]}
        onPress={() => !isPastDate && handleDateSelect(date)}
        disabled={isPastDate}>
        <Text
          style={[
            styles.dayText,
            isToday(date) && styles.todayText,
            isSelected && styles.selectedDayText,
            !isCurrentMonth && styles.outsideMonthText,
            isDark && styles.textLight,
            isPastDate && styles.pastDateText,
          ]}>
          {format(date, 'd')}
        </Text>
        {dayEvents.length > 0 && (
          <View style={[
            styles.eventDot,
            isDark && styles.eventDotDark,
            isSelected && styles.selectedEventDot
          ]} />
        )}
      </Pressable>
    );
  }, [events, selectedDate, currentMonth, isDark]);

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const monthEnd = endOfMonth(currentMonth);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ 
      start: calendarStart,
      end: calendarEnd 
    });

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach(day => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <AlertCircle size={48} color="#ef4444" style={styles.errorIcon} />
        <Text style={[styles.errorText, isDark && styles.textLight]}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            clearError();
            refreshEvents(currentMonth);
          }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const selectedDateEvents = events.filter(event => 
    isSameDay(new Date(event.startDate), selectedDate)
  );

  if (showEvents) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.backButton}
              onPress={() => setShowEvents(false)}>
              <ArrowLeft size={24} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
            <Pressable
              style={styles.addButton}
              onPress={handleAddEvent}>
              <Plus size={24} color="#ffffff" />
            </Pressable>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.selectedMonth, isDark && styles.textLight]}>
              {format(selectedDate, 'MMMM yyyy')}
            </Text>
            <Text style={[styles.selectedDay, isDark && styles.textMuted]}>
              {format(selectedDate, 'EEEE, d')}
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.eventsList}>
          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.emptyStateTitle, isDark && styles.textLight]}>
                Nothing scheduled
              </Text>
              <Text style={[styles.emptyStateSubtitle, isDark && styles.textMuted]}>
                Tap + to create a new event
              </Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <Pressable
                key={event.id}
                style={[styles.eventCard, isDark && styles.eventCardDark]}
                onPress={() => router.push(`/calendar/event?id=${event.id}&calendarId=${event.calendarId}`)}>
                <View style={styles.eventTime}>
                  <Text style={[styles.timeText, isDark && { color: '#38bdf8' }]}>
                    {format(new Date(event.startDate), 'HH:mm')}
                  </Text>
                  {event.status === 'tentative' && (
                    <Text style={styles.tentativeTag}>Tentative</Text>
                  )}
                </View>
                <View style={styles.eventDetails}>
                  <Text style={[styles.eventTitle, isDark && styles.textLight]}>
                    {event.title}
                  </Text>
                  {event.location && (
                    <View style={styles.eventMetaInfo}>
                      <MapPin size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                      <Text style={[styles.eventLocation, isDark && styles.textMuted]}>
                        {event.location}
                      </Text>
                    </View>
                  )}
                  <View style={styles.eventMetaInfo}>
                    <Users size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text style={[styles.eventParticipants, isDark && styles.textMuted]}>
                      {event.attendees?.length 
                        ? `${event.attendees.length} participant${event.attendees.length === 1 ? '' : 's'}`
                        : 'No participants'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.monthSelector}>
          <Pressable
            onPress={() => setCurrentMonth(prev => subMonths(prev, 1))}
            style={styles.monthButton}>
            <ChevronLeft size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
          <Text style={[styles.monthText, isDark && styles.textLight]}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <Pressable
            onPress={() => setCurrentMonth(prev => addMonths(prev, 1))}
            style={styles.monthButton}>
            <ChevronRight size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.calendar, isDark && styles.calendarDark]}>
        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text
              key={day}
              style={[styles.weekDayText, isDark && styles.textMuted]}>
              {day}
            </Text>
          ))}
        </View>
        {generateCalendarDays().map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map(date => renderCalendarDay(date))}
          </View>
        ))}
      </View>

      <Animated.View 
        style={[
          styles.fab,
          isDark && styles.fabDark,
          {
            transform: [{ scale: fabAnim }]
          }
        ]}>
        <Pressable
          style={styles.fabButton}
          onPress={handleAddEvent}>
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </Animated.View>
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  calendar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748b',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  calendarDayDark: {
    backgroundColor: '#1e293b',
  },
  dayText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  outsideMonth: {
    opacity: 0.5,
  },
  outsideMonthText: {
    color: '#94a3b8',
  },
  selectedDay: {
    backgroundColor: '#0891b2',
  },
  selectedDayDark: {
    backgroundColor: '#0e7490',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  todayText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#0891b2',
  },
  pastDateText: {
    color: '#94a3b8',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0891b2',
    marginTop: 4,
  },
  eventDotDark: {
    backgroundColor: '#38bdf8',
  },
  selectedEventDot: {
    backgroundColor: '#ffffff',
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventCardDark: {
    backgroundColor: '#1e293b',
  },
  eventTime: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  timeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0891b2',
  },
  tentativeTag: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#9333ea',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  eventMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  eventParticipants: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 16,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  textLight: {
    color: '#f8fafc',
  },
  subtitleDark: {
    color: '#94a3b8',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  dateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  calendarDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  textMuted: {
    color: '#94a3b8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    width: 80,
  },
  selectedMonth: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  selectedDay: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0891b2',
    borderRadius: 28,
    width: 56,
    height: 56,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabDark: {
    backgroundColor: '#0e7490',
    shadowColor: '#000',
    shadowOpacity: 0.35,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});