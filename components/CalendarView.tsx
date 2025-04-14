import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

type Event = {
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
};

type CalendarViewProps = {
  calendar: {
    sharedByName: string;
    events: Event[];
  };
  isVisible: boolean;
  onClose: () => void;
};

export function CalendarView({ calendar, isVisible, onClose }: CalendarViewProps) {
  const { isDark } = useTheme();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const renderEventItem = ({ item: event }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, isDark && styles.eventCardDark]}
      onPress={() => setSelectedEvent(event)}
    >
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, isDark && styles.textLight]}>
          {event.title}
        </Text>
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={isDark ? '#94a3b8' : '#64748b'}
        />
      </View>
      <Text style={[styles.eventTime, isDark && styles.textMuted]}>
        {format(parseISO(event.startDate), 'MMM d, yyyy h:mm a')} -{' '}
        {format(parseISO(event.endDate), 'h:mm a')}
      </Text>
      {event.location && (
        <Text style={[styles.eventLocation, isDark && styles.textMuted]}>
          {event.location}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEventDetails = () => {
    if (!selectedEvent) return null;

    return (
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                Event Details
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={styles.closeButton}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailTitle, isDark && styles.textLight]}>
              {selectedEvent.title}
            </Text>

            <View style={styles.detailRow}>
              <MaterialIcons
                name="access-time"
                size={20}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
              <Text style={[styles.detailText, isDark && styles.textMuted]}>
                {format(parseISO(selectedEvent.startDate), 'MMM d, yyyy h:mm a')} -{' '}
                {format(parseISO(selectedEvent.endDate), 'h:mm a')}
              </Text>
            </View>

            {selectedEvent.location && (
              <View style={styles.detailRow}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
                <Text style={[styles.detailText, isDark && styles.textMuted]}>
                  {selectedEvent.location}
                </Text>
              </View>
            )}

            {selectedEvent.notes && (
              <View style={styles.detailRow}>
                <MaterialIcons
                  name="notes"
                  size={20}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
                <Text style={[styles.detailText, isDark && styles.textMuted]}>
                  {selectedEvent.notes}
                </Text>
              </View>
            )}

            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <View style={styles.attendeesContainer}>
                <Text style={[styles.attendeesTitle, isDark && styles.textLight]}>
                  Attendees
                </Text>
                {selectedEvent.attendees.map((attendee, index) => (
                  <View key={index} style={styles.attendeeRow}>
                    <MaterialIcons
                      name="person"
                      size={20}
                      color={isDark ? '#94a3b8' : '#64748b'}
                    />
                    <Text style={[styles.attendeeText, isDark && styles.textMuted]}>
                      {attendee.name || attendee.email}
                    </Text>
                    {attendee.status && (
                      <Text
                        style={[
                          styles.attendeeStatus,
                          attendee.status === 'accepted' && styles.statusAccepted,
                          attendee.status === 'declined' && styles.statusDeclined,
                          isDark && styles.textMuted,
                        ]}
                      >
                        ({attendee.status})
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.content, isDark && styles.contentDark]}>
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.textLight]}>
              {calendar.sharedByName}'s Calendar
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons
                name="close"
                size={24}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={calendar.events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
      {renderEventDetails()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  containerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  contentDark: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
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
  eventCardDark: {
    backgroundColor: '#1e293b',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    flex: 1,
  },
  eventTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  eventLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  detailTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  attendeesContainer: {
    marginTop: 16,
  },
  attendeesTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendeeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  attendeeStatus: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  statusAccepted: {
    color: '#059669',
  },
  statusDeclined: {
    color: '#dc2626',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 