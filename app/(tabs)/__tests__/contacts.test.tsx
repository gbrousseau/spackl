import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import ContactsScreen from '../contacts';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';

// Mock the required hooks and modules
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('expo-contacts', () => ({
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

jest.mock('expo-sms', () => ({
  isAvailableAsync: jest.fn(),
  sendSMSAsync: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe('ContactsScreen', () => {
  const mockUser = {
    uid: 'test-uid',
    phoneNumber: '+1234567890',
  };

  const mockContacts = [
    {
      id: '1',
      name: 'John Doe',
      phoneNumbers: [{ number: '+1234567890' }],
      imageAvailable: true,
      image: { uri: 'test-uri' },
    },
    {
      id: '2',
      name: 'Jane Smith',
      phoneNumbers: [{ number: '+1987654321' }],
      imageAvailable: false,
    },
  ];

  const mockGroups = [
    {
      id: 'group1',
      name: 'Family',
      members: ['1234567890'],
    },
    {
      id: 'group2',
      name: 'Work',
      members: ['1234567890', '1987654321'],
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useTheme as jest.Mock).mockReturnValue({ isDark: false });
    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Contacts.getContactsAsync as jest.Mock).mockResolvedValue({ data: mockContacts });
    (SMS.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SMS.sendSMSAsync as jest.Mock).mockResolvedValue({ result: 'sent' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        status: 'accepted',
        events: [],
        sharedAt: { toDate: () => new Date() },
        lastUpdated: { toDate: () => new Date() },
      }),
    });

    // Add mock implementation for groups
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockGroups.map(group => ({
        id: group.id,
        data: () => group,
      })),
    });
  });

  it('renders loading state initially', () => {
    const { getByTestId } = render(<ContactsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('loads and displays contacts after permission granted', async () => {
    const { getByText, queryByTestId } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
    });
  });

  it('handles contact permission denied', async () => {
    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    
    const { getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('Permission to access contacts was denied')).toBeTruthy();
    });
  });

  it('sends sharing invite successfully', async () => {
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const shareButton = getByTestId('share-button-1');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(SMS.sendSMSAsync).toHaveBeenCalledWith(
        ['1234567890'],
        expect.stringContaining('John Doe')
      );
    });
  });

  it('handles SMS sending failure', async () => {
    (SMS.sendSMSAsync as jest.Mock).mockResolvedValue({ result: 'failed' });
    
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const shareButton = getByTestId('share-button-1');
    fireEvent.press(shareButton);

    await waitFor(() => {
      expect(getByText('Failed to send SMS invitation')).toBeTruthy();
    });
  });

  it('refreshes contact status', async () => {
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const refreshButton = getByTestId('refresh-button-1');
    fireEvent.press(refreshButton);

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledWith(
        expect.any(Object),
        'sharedCalendars/1234567890'
      );
    });
  });

  it('shows sharing history modal', async () => {
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const historyButton = getByTestId('history-button-1');
    fireEvent.press(historyButton);

    await waitFor(() => {
      expect(getByText('Sharing History')).toBeTruthy();
    });
  });

  it('handles bulk refresh', async () => {
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const bulkRefreshButton = getByTestId('bulk-refresh-button');
    fireEvent.press(bulkRefreshButton);

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledTimes(2); // Called for each contact
    });
  });

  it('retries failed status checks', async () => {
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const { getByTestId, getByText } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const retryButton = getByTestId('retry-button-1');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledTimes(2); // Initial call + retry
    });
  });

  it('handles web platform differently', () => {
    Platform.OS = 'web';
    
    const { getByText } = render(<ContactsScreen />);
    
    expect(getByText('Contacts')).toBeTruthy();
    expect(SMS.isAvailableAsync).not.toHaveBeenCalled();
  });

  it('displays groups for a contact', async () => {
    const { getByText, getByTestId } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const contactCard = getByTestId('contact-card-1');
    fireEvent.press(contactCard);

    await waitFor(() => {
      expect(getByText('Groups')).toBeTruthy();
      expect(getByText('Family')).toBeTruthy();
      expect(getByText('Work')).toBeTruthy();
    });
  });

  it('shows no groups message when contact is not in any groups', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [],
    });

    const { getByText, getByTestId } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('Jane Smith')).toBeTruthy();
    });

    const contactCard = getByTestId('contact-card-2');
    fireEvent.press(contactCard);

    await waitFor(() => {
      expect(getByText('No groups')).toBeTruthy();
    });
  });

  it('handles error when fetching groups', async () => {
    (getDocs as jest.Mock).mockRejectedValue(new Error('Failed to fetch groups'));
    
    const { getByText, getByTestId } = render(<ContactsScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    const contactCard = getByTestId('contact-card-1');
    fireEvent.press(contactCard);

    await waitFor(() => {
      expect(getByText('Failed to load groups')).toBeTruthy();
    });
  });
}); 