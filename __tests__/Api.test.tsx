import getEventDetails from '../app/(tabs)/event/index';
import { EventDetails } from '../app/(tabs)/event/eventTypes';
import * as Calendar from 'expo-calendar';

jest.mock('expo-calendar', () => ({
    requestCalendarPermissionsAsync: jest.fn(),
    getEventAsync: jest.fn(() => ({
        id: '1',
        title: 'Test Event',
        startDate: new Date(),
        endDate: new Date(),
    })),
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-contacts', () => ({
    requestPermissionsAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    downloadAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
    startAsync: jest.fn(),
}));

jest.mock('expo-analytics-segment', () => ({
    track: jest.fn(),
}));

jest.mock('expo-application', () => ({
    getInstallationIdAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
    isDevice: jest.fn(),
}));

jest.mock('expo-updates', () => ({
    fetchUpdateAsync: jest.fn(),
}));

describe('getEventDetails', () => {
    it('retrieves event details successfully', async () => {
        const eventDetails = (await getEventDetails()) as unknown as EventDetails;
        expect(eventDetails.title).toBe('Test Event');
    });

    it('handles permission errors', async () => {
        (Calendar.requestCalendarPermissionsAsync as jest.Mock).mockResolvedValueOnce({
            status: 'denied',
        });

        await expect(getEventDetails()).rejects.toThrow('Permission denied');
    });

    it('handles network errors', async () => {
        (Calendar.getEventAsync as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(getEventDetails()).rejects.toThrow('Network error');
    });

    it('handles other errors', async () => {
        (Calendar.getEventAsync as jest.Mock).mockRejectedValueOnce(new Error('Other error'));

        await expect(getEventDetails()).rejects.toThrow('Other error');
    });
    
    it('handles loading state correctly', async () => {
        (Calendar.getEventAsync as jest.Mock).mockReturnValueOnce(new Promise(() => {}));

        const eventDetails = await getEventDetails();
        expect(eventDetails).toBeUndefined();
    });
});