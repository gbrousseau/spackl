import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { CalendarEvent } from '@/types/calendar';

export const getDefaultCalendarSource = async () => {
  
  if (Platform.OS === 'ios') {
    return await Calendar.getDefaultCalendarAsync();
  }
  return (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(
    (calendar) =>
      calendar.accessLevel === Calendar.CalendarAccessLevel.OWNER,
  )[0];
};

export const createCalendar = async () => {
  try {
    const defaultCalendarSource = await getDefaultCalendarSource();
    return await Calendar.createCalendarAsync({
      title: 'Spackl Calendar',
      color: '#0891b2',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource?.sourceId,
      source: defaultCalendarSource?.source,
      name: 'spackl_calendar',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
      ownerAccount: defaultCalendarSource?.ownerAccount,
    });
  } catch (error) {
    console.error('Failed to create calendar', error);
    throw error;
  }
};

export const getOrCreateCalendar = async () => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission not granted');
  }

  try {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    const spacklCalendar = calendars.find(
      (cal) => cal.name === 'spackl_calendar',
    );

    if (spacklCalendar) {
      return spacklCalendar.id;
    }

    return await createCalendar();
  } catch (error) {
    console.error('Failed to get or create calendar', error);
    throw error;
  }
};

export const syncEventToDevice = async (event: CalendarEvent) => {
  const calendarId = await getOrCreateCalendar();

  const eventToCreate = {
    title: event.title,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    allDay: event.allDay || false,
    location: event.location,
    notes: event.notes,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: [], // Add default reminders if needed
    availability:
      event.status === 'tentative'
        ? Calendar.Availability.TENTATIVE
        : Calendar.Availability.BUSY,
    url: event.url,
  };

  try {
    if (event.id && event.id.startsWith('local_')) {
      // This is a local event, update it
      await Calendar.updateEventAsync(
        event.id.replace('local_', ''),
        eventToCreate,
      );
      return event.id;
    } else {
      // Create new event
      const localEventId = await Calendar.createEventAsync(
        calendarId,
        eventToCreate,
      );
      return `local_${localEventId}`;
    }
  } catch (error) {
    console.error('Failed to sync event to device', error);
    throw error;
  }
};

export const deleteEventFromDevice = async (eventId: string) => {
  if (!eventId.startsWith('local_')) {
    return; // Not a local event
  }

  try {
    await Calendar.deleteEventAsync(eventId.replace('local_', ''));
  } catch (error) {
    console.error('Failed to delete event from device', error);
    throw error;
  }
};

export const getLocalCalendarEvents = async (
  startDate: Date,
  endDate: Date,
) => {
  const calendarId = await getOrCreateCalendar();

  try {
    const events = await Calendar.getEventsAsync(
      [calendarId],
      startDate,
      endDate,
    );

    return events.map(
      (event) =>
        ({
          id: `local_${event.id}`,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          location: event.location,
          notes: event.notes,
          url: event.url,
          organizer: '',
          calendarId,
          status:
            event.availability === Calendar.Availability.TENTATIVE
              ? 'tentative'
              : 'confirmed',
          createdBy: '', // Add a default or appropriate value for createdBy
        }) as CalendarEvent,
    );
  } catch (error) {
    console.error('Failed to get local calendar events', error);
    throw error;
  }
};
