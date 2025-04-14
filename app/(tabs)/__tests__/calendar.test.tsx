import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import CalendarScreen from '../calendar/event';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import * as Calendar from 'expo-calendar';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

// Mock the required hooks and modules
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/context/CalendarContext', () => ({
  useCalendar: jest.fn(),
}));

jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  getEventsAsync: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('CalendarScreen', () => {
  const mockUser = {
    uid: 'test-uid',
    phoneNumber: '+1234567890',
  };

  const mockEvents = [
    {
      id: '1',
      title: 'Team Meeting',
      startDate: new Date(2024, 1, 15, 14, 30),
      endDate: new Date(2024, 1, 15, 15, 30),
      location: 'Conference Room A',
      calendarId: 'default',
      notes: 'Weekly team sync',
      organizer: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      attendees: [
        {
          name: 'Alice Smith',
          email: 'alice@example.com',
          status: 'accepted'
        }
      ],
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Lunch with David',
      startDate: new Date(2024, 1, 15, 12, 0),
      endDate: new Date(2024, 1, 15, 13, 0),
      location: 'Cafe Downtown',
      calendarId: 'default',
      notes: 'Monthly catch-up',
      status: 'confirmed'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });
    (useCalendar as jest.Mock).mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      refreshEvents: jest.fn(),
      clearError: jest.fn(),
    });
    (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Calendar.getCalendarsAsync as jest.Mock).mockResolvedValue([
      { id: 'default', title: 'Default Calendar', isPrimary: true }
    ]);
    (Calendar.getEventsAsync as jest.Mock).mockResolvedValue(mockEvents);
  });

  it('renders loading state initially', () => {
    (useCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: true,
      error: null,
      refreshEvents: jest.fn(),
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<CalendarScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays calendar events', async () => {
    const { getByText } = render(<CalendarScreen />);
    
    await waitFor(() => {
      expect(getByText('Team Meeting')).toBeTruthy();
      expect(getByText('Lunch with David')).toBeTruthy();
    });
  });

  it('handles calendar permission denied', async () => {
    (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    
    const { getByText } = render(<CalendarScreen />);
    
    await waitFor(() => {
      expect(getByText('Calendar permission was denied')).toBeTruthy();
    });
  });

  it('refreshes calendar events', async () => {
    const { getByTestId } = render(<CalendarScreen />);
    
    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(useCalendar().refreshEvents).toHaveBeenCalled();
    });
  });

  it('navigates to event details', async () => {
    const { getByText } = render(<CalendarScreen />);
    
    await waitFor(() => {
      expect(getByText('Team Meeting')).toBeTruthy();
    });

    fireEvent.press(getByText('Team Meeting'));

    await waitFor(() => {
      expect(getByText('Event Details')).toBeTruthy();
    });
  });

  it('handles shared calendar events', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        events: mockEvents,
        status: 'accepted',
        sharedAt: { toDate: () => new Date() },
      }),
    });

    const { getByText } = render(<CalendarScreen />);
    
    await waitFor(() => {
      expect(getByText('Shared Events')).toBeTruthy();
      expect(getByText('Team Meeting')).toBeTruthy();
    });
  });

  it('handles web platform differently', () => {
    Platform.OS = 'web';
    
    const { getByText } = render(<CalendarScreen />);
    
    expect(getByText('Calendar')).toBeTruthy();
    expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled();
  });

  it('displays error message when events fail to load', async () => {
    (useCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: false,
      error: 'Failed to load events',
      refreshEvents: jest.fn(),
      clearError: jest.fn(),
    });

    const { getByText } = render(<CalendarScreen />);
    
    await waitFor(() => {
      expect(getByText('Failed to load events')).toBeTruthy();
    });
  });

  it('allows clearing error message', async () => {
    const clearError = jest.fn();
    (useCalendar as jest.Mock).mockReturnValue({
      events: [],
      loading: false,
      error: 'Failed to load events',
      refreshEvents: jest.fn(),
      clearError,
    });

    const { getByTestId } = render(<CalendarScreen />);
    
    const clearButton = getByTestId('clear-error-button');
    fireEvent.press(clearButton);

    expect(clearError).toHaveBeenCalled();
  });
}); 