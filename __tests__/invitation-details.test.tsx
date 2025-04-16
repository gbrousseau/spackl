import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import InvitationDetailsScreen from '../app/invitation/[id]';

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

interface MockInvitation {
  id: string;
  eventId: string;
  status: 'pending' | 'going' | 'interested' | 'not_interested';
  createdAt: Date;
}

describe('InvitationDetailsScreen', () => {
  const mockUser = {
    phoneNumber: '+1234567890',
    email: 'test@example.com',
  };

  const mockInvitation: MockInvitation = {
    id: 'test-invitation-1',
    eventId: 'test-event-1',
    status: 'pending',
    createdAt: new Date(),
  };

  const mockEvent: MockEvent = {
    id: 'test-event-1',
    title: 'Test Event',
    description: 'Test Description',
    startTime: new Date(),
    endTime: new Date(),
    location: 'Test Location',
    organizer: {
      name: 'Test Organizer',
      phoneNumber: '+0987654321',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: mockInvitation.id });
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: false });
    (getDoc as jest.Mock).mockImplementation(async (ref) => {
      if (ref.path.includes('invitations')) {
        return { exists: () => true, data: () => mockInvitation };
      }
      return { exists: () => true, data: () => mockEvent };
    });
    (doc as jest.Mock).mockReturnValue({});
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
  });

  it('renders loading state initially', () => {
    render(<InvitationDetailsScreen />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('displays invitation details once loaded', async () => {
    render(<InvitationDetailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
      expect(screen.getByText('Test Description')).toBeTruthy();
      expect(screen.getByText('Test Location')).toBeTruthy();
      expect(screen.getByText('From: Test Organizer')).toBeTruthy();
    });
  });

  it('handles status updates', async () => {
    render(<InvitationDetailsScreen />);
    await waitFor(() => {
      fireEvent.press(screen.getByText('Going'));
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), { status: 'going' });
    });
  });

  it('handles error states', async () => {
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Failed to load invitation'));
    render(<InvitationDetailsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Error loading invitation')).toBeTruthy();
    });
  });

  it('attempts multiple identifiers when loading invitation', async () => {
    render(<InvitationDetailsScreen />);
    await waitFor(() => {
      expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', mockUser.phoneNumber, 'invitations', mockInvitation.id);
      expect(doc).toHaveBeenCalledWith(expect.any(Object), 'users', mockUser.email, 'invitations', mockInvitation.id);
    });
  });
}); 