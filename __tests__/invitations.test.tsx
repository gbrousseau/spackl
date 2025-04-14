import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/config/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import InvitationsScreen from '@/app/(tabs)/invitations';
import * as ExpoCalendar from 'expo-calendar';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock contexts
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

// Mock expo-calendar
jest.mock('expo-calendar', () => ({
  requestCalendarPermissionsAsync: jest.fn(),
  getCalendarsAsync: jest.fn(),
  createEventAsync: jest.fn(),
}));

// Mock data
const mockUser = {
  phoneNumber: '+1234567890',
  email: 'test@example.com',
};

const mockInvitations = [
  {
    id: '1',
    eventId: 'event1',
    status: 'pending',
    event: {
      title: 'Test Event 1',
      description: 'Test Description 1',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      location: 'Test Location 1',
      organizer: {
        name: 'Test Organizer 1',
      },
    },
  },
  {
    id: '2',
    eventId: 'event2',
    status: 'going',
    event: {
      title: 'Test Event 2',
      description: 'Test Description 2',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      location: 'Test Location 2',
      organizer: {
        name: 'Test Organizer 2',
      },
    },
  },
  {
    id: '3',
    eventId: 'event3',
    status: 'interested',
    event: {
      title: 'Test Event 3',
      description: 'Test Description 3',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      location: 'Test Location 3',
      organizer: {
        name: 'Test Organizer 3',
      },
    },
  },
];

describe('InvitationsScreen', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: false });

    // Setup Firestore mocks
    (collection as jest.Mock).mockImplementation((db, ...path) => ({
      path: path.join('/'),
    }));

    (getDocs as jest.Mock).mockImplementation(async (ref) => ({
      docs: mockInvitations.map(invitation => ({
        id: invitation.id,
        data: () => invitation,
      })),
    }));
  });

  it('renders loading state initially', async () => {
    render(<InvitationsScreen />);
    
    // Check for loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('displays invitations grouped by status', async () => {
    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      // Check for pending invitations
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.getByText('Test Event 1')).toBeTruthy();
      expect(screen.getByText('Test Organizer 1')).toBeTruthy();

      // Check for going invitations
      expect(screen.getByText('Going')).toBeTruthy();
      expect(screen.getByText('Test Event 2')).toBeTruthy();
      expect(screen.getByText('Test Organizer 2')).toBeTruthy();

      // Check for interested invitations
      expect(screen.getByText('Interested')).toBeTruthy();
      expect(screen.getByText('Test Event 3')).toBeTruthy();
      expect(screen.getByText('Test Organizer 3')).toBeTruthy();
    });
  });

  it('handles invitation click', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Click on an invitation
    fireEvent.press(screen.getByText('Test Event 1'));

    // Verify router was called with correct path
    expect(mockPush).toHaveBeenCalledWith('/invitation/1');
  });

  it('handles error state when loading fails', async () => {
    // Mock getDocs to throw an error
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Failed to load invitations'));

    render(<InvitationsScreen />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load invitations')).toBeTruthy();
    });

    // Check for retry button
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('attempts multiple identifiers when loading invitations', async () => {
    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Verify collection was called with both phone number and email
    expect(collection).toHaveBeenCalledWith(
      FIREBASE_FIRESTORE,
      'users',
      mockUser.phoneNumber,
      'invitations'
    );
    expect(collection).toHaveBeenCalledWith(
      FIREBASE_FIRESTORE,
      'users',
      mockUser.email,
      'invitations'
    );
  });

  it('displays empty state when no invitations exist', async () => {
    // Mock getDocs to return empty array
    (getDocs as jest.Mock).mockImplementationOnce(async () => ({
      docs: [],
    }));

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });

    // Check for empty state message
    expect(screen.getByText('You don\'t have any event invitations yet')).toBeTruthy();
    expect(screen.getByTestId('empty-state-icon')).toBeTruthy();
  });

  it('handles calendar permission denied', async () => {
    // Mock calendar permission to be denied
    (ExpoCalendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Click on an invitation
    fireEvent.press(screen.getByText('Test Event 1'));

    // Check for permission alert
    await waitFor(() => {
      expect(screen.getByText('Calendar Permission Required')).toBeTruthy();
    });
  });

  it('adds event to calendar when status is set to going', async () => {
    // Mock calendar permission to be granted
    (ExpoCalendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    // Mock getCalendarsAsync to return a default calendar
    (ExpoCalendar.getCalendarsAsync as jest.Mock).mockResolvedValueOnce([
      { id: 'default-calendar', isPrimary: true },
    ]);

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Click on an invitation
    fireEvent.press(screen.getByText('Test Event 1'));

    // Wait for calendar event to be created
    await waitFor(() => {
      expect(ExpoCalendar.createEventAsync).toHaveBeenCalledWith(
        'default-calendar',
        expect.objectContaining({
          title: 'Test Event 1',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });
  });

  it('sorts invitations by date (newest first)', async () => {
    const mockInvitationsWithDates = [
      {
        id: '1',
        eventId: 'event1',
        status: 'pending',
        event: {
          title: 'Older Event',
          startTime: new Date('2023-01-01').toISOString(),
          endTime: new Date('2023-01-02').toISOString(),
        },
      },
      {
        id: '2',
        eventId: 'event2',
        status: 'pending',
        event: {
          title: 'Newer Event',
          startTime: new Date('2023-02-01').toISOString(),
          endTime: new Date('2023-02-02').toISOString(),
        },
      },
    ];

    (getDocs as jest.Mock).mockImplementationOnce(async () => ({
      docs: mockInvitationsWithDates.map(invitation => ({
        id: invitation.id,
        data: () => invitation,
      })),
    }));

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      const invitations = screen.getAllByTestId('invitation-card');
      expect(invitations[0].props.children[0].props.children).toBe('Newer Event');
      expect(invitations[1].props.children[0].props.children).toBe('Older Event');
    });
  });

  it('handles dark mode styling', async () => {
    // Mock dark mode
    (useTheme as jest.Mock).mockReturnValueOnce({ isDarkMode: true });

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Check for dark mode styles
    const invitationCard = screen.getByTestId('invitation-card');
    expect(invitationCard.props.style).toContainEqual(
      expect.objectContaining({
        backgroundColor: expect.stringMatching(/dark/i),
      })
    );
  });

  it('handles network error when loading invitations', async () => {
    // Mock getDocs to throw a network error
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<InvitationsScreen />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    // Check for retry button
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('updates invitation status and adds to calendar', async () => {
    // Mock calendar permission to be granted
    (ExpoCalendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });

    // Mock getCalendarsAsync to return a default calendar
    (ExpoCalendar.getCalendarsAsync as jest.Mock).mockResolvedValueOnce([
      { id: 'default-calendar', isPrimary: true },
    ]);

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Click on an invitation
    fireEvent.press(screen.getByText('Test Event 1'));

    // Wait for calendar event to be created
    await waitFor(() => {
      expect(ExpoCalendar.createEventAsync).toHaveBeenCalledWith(
        'default-calendar',
        expect.objectContaining({
          title: 'Test Event 1',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    // Check for success message
    expect(screen.getByText('Event added to your calendar')).toBeTruthy();
  });

  it('handles calendar permission denied gracefully', async () => {
    // Mock calendar permission to be denied
    (ExpoCalendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    render(<InvitationsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
    });

    // Click on an invitation
    fireEvent.press(screen.getByText('Test Event 1'));

    // Check for permission alert
    await waitFor(() => {
      expect(screen.getByText('Calendar Permission Required')).toBeTruthy();
    });

    // Check that calendar event was not created
    expect(ExpoCalendar.createEventAsync).not.toHaveBeenCalled();
  });
}); 