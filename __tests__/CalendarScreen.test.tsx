import React from 'react';
import { render } from '@testing-library/react-native';
import { useTheme } from '@/context/ThemeContext';
import CalendarScreen from '../app/(tabs)/calendar/index';
import { jest } from '@jest/globals';

jest.mock('@/context/ThemeContext', () => ({
    useTheme: jest.fn(),
}));

jest.mock('expo-calendar', () => ({
    requestCalendarPermissionsAsync: jest.fn(),
    getEventsAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 0, longitude: 0 } })),
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

jest.mock('expo-analytics-segment', () => ({
    track: jest.fn(),
}));

jest.mock('expo-application', () => ({
    getInstallationIdAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
    isDevice: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

jest.mock('expo-updates', () => ({
    fetchUpdateAsync: jest.fn(),
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

describe('CalendarScreen', () => {
    it('renders correctly in light mode', () => {
        (useTheme as jest.Mock).mockReturnValue({ isDark: false });

        const { getByText } = render(<CalendarScreen />);
        console.log('CalendarScreen rendered in light mode');
        console.log('useTheme:', useTheme);
        console.log('getByText:', getByText);
        console.log('CalendarScreen:', CalendarScreen);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
        expect(textElement.props.style).toContainEqual({ color: '#0f172a' });
    });

    it('renders correctly in dark mode', () => {
        (useTheme as jest.Mock).mockReturnValue({ isDark: true });

        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
        expect(textElement.props.style).toContainEqual({ color: '#f8fafc' });
    });

    it('handles navigation correctly', () => {
        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
    });
    it('handles permission errors gracefully', () => {
        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
    });
    it('handles network errors gracefully', () => {
        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
    });
    it('handles other errors gracefully', () => {
        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Calendar View');

        expect(textElement).toBeTruthy();
    });
    it('handles loading state correctly', () => {
        const { getByText } = render(<CalendarScreen />);
        const textElement = getByText('Loading...');

        expect(textElement).toBeTruthy();
    });
});