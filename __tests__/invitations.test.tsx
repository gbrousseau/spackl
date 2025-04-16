import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InvitationsScreen from '../app/(tabs)/invitations';

// Mock dependencies
jest.mock('expo-router');
jest.mock('firebase/firestore');
jest.mock('../context/AuthContext');
jest.mock('../context/ThemeContext');

interface MockEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  organizer: {
    name: string;
    phoneNumber: string;
  };
}

interface MockEvents {
  [key: string]: MockEvent;
}

describe('InvitationsScreen', () => {
  const mockUser = {
    phoneNumber: '+1234567890',
    email: 'test@example.com',
  };

  const mockInvitations = [
    {
      id: 'test-invitation-1',
      eventId: 'test-event-1',
      status: 'pending',
      createdAt: new Date(),
    },
    {
      id: 'test-invitation-2',
      eventId: 'test-event-2',
      status: 'going',
      createdAt: new Date(),
    },
  ];

  const mockEvents: MockEvents = {
    'test-event-1': {
      id: 'test-event-1',
      title: 'Test Event 1',
      description: 'Test Description 1',
      startTime: new Date(),
      endTime: new Date(),
      location: 'Test Location 1',
      organizer: {
        name: 'Test Organizer 1',
        phoneNumber: '+0987654321',
      },
    },
    'test-event-2': {
      id: 'test-event-2',
      title: 'Test Event 2',
      description: 'Test Description 2',
      startTime: new Date(),
      endTime: new Date(),
      location: 'Test Location 2',
      organizer: {
        name: 'Test Organizer 2',
        phoneNumber: '+0987654322',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: false });
    (getDoc as jest.Mock).mockImplementation(async (ref) => {
      const eventId = ref.path.split('/').pop() as string;
      return { exists: () => true, data: () => mockEvents[eventId] };
    });
    (doc as jest.Mock).mockReturnValue({});
  });

  it('renders loading state initially', () => {
    render(<InvitationsScreen />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('displays invitations once loaded', async () => {
    render(<InvitationsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeTruthy();
      expect(screen.getByText('Test Event 2')).toBeTruthy();
    });
  });

  it('handles invitation clicks', async () => {
    render(<InvitationsScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByText('Test Event 1'));
      expect(useRouter().push).toHaveBeenCalledWith(`/invitation/${mockInvitations[0].id}`);
    });
  });

  it('handles error states', async () => {
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Failed to load invitations'));
    render(<InvitationsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Error loading invitations')).toBeTruthy();
    });
  });
}); 