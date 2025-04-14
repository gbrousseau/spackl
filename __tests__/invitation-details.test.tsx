import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/config/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import InvitationDetailsScreen from '@/app/invitation/[id]';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock contexts
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

// Mock data
const mockUser = {
  phoneNumber: '+1234567890',
  email: 'test@example.com',
};

const mockInvitation = {
  id: '1',
  eventId: 'event1',
  status: 'pending',
};

const mockEvent = {
  id: 'event1',
  title: 'Test Event',
  description: 'Test Description',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  location: 'Test Location',
  organizer: {
    name: 'Test Organizer',
  },
};

describe('InvitationDetailsScreen', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '1' });
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: false });

    // Setup Firestore mocks
    (doc as jest.Mock).mockImplementation((db, ...path) => ({
      path: path.join('/'),
    }));

    (getDoc as jest.Mock).mockImplementation(async (ref) => {
      if (ref.path.includes('invitations')) {
        return { exists: () => true, data: () => mockInvitation };
      }
      if (ref.path.includes('events')) {
        return { exists: () => true, data: () => mockEvent };
      }
      return { exists: () => false };
    });
  });

  it('renders loading state initially', async () => {
    render(<InvitationDetailsScreen />);
    
    // Check for loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('displays invitation details when loaded', async () => {
    render(<InvitationDetailsScreen />);

    // Wait for loading to complete and check for event details
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
      expect(screen.getByText('Test Description')).toBeTruthy();
      expect(screen.getByText('Test Location')).toBeTruthy();
      expect(screen.getByText('Test Organizer')).toBeTruthy();
    });
  });

  it('updates invitation status to going', async () => {
    render(<InvitationDetailsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    });

    const goingButton = screen.getByText('Going');
    fireEvent.press(goingButton);

    // Verify updateDoc was called with correct parameters
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { status: 'going' }
    );
  });

  it('updates invitation status to interested', async () => {
    render(<InvitationDetailsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    });

    const interestedButton = screen.getByText('Interested');
    fireEvent.press(interestedButton);

    // Verify updateDoc was called with correct parameters
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { status: 'interested' }
    );
  });

  it('updates invitation status to not_interested', async () => {
    render(<InvitationDetailsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    });

    const notInterestedButton = screen.getByText('Not Going');
    fireEvent.press(notInterestedButton);

    // Verify updateDoc was called with correct parameters
    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      { status: 'not_interested' }
    );
  });

  it('handles error state when loading fails', async () => {
    // Mock getDoc to throw an error
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Failed to load invitation'));

    render(<InvitationDetailsScreen />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load invitation details')).toBeTruthy();
    });

    // Check for retry button
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('attempts multiple identifiers when loading invitation', async () => {
    render(<InvitationDetailsScreen />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeTruthy();
    });

    // Verify doc was called with both phone number and email
    expect(doc).toHaveBeenCalledWith(
      FIREBASE_FIRESTORE,
      'users',
      mockUser.phoneNumber,
      'invitations',
      '1'
    );
    expect(doc).toHaveBeenCalledWith(
      FIREBASE_FIRESTORE,
      'users',
      mockUser.email,
      'invitations',
      '1'
    );
  });
}); 