import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import EventScreen from '../app/(tabs)/event/index';

import { jest } from '@jest/globals';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

jest.mock('../app/(tabs)/event/index', () => {
    return jest.fn(() => {
        return (
            <div>
                <input placeholder="Event Title" />
                <button>Save</button>
            </div>
        );
    });
});

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    requestBackgroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

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

describe('Navigation', () => {
    it('navigates to the correct screen', () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        const { getByText } = render(<EventScreen />);
        const saveButton = getByText('Save');

        fireEvent.press(saveButton);
        expect(mockPush).toHaveBeenCalledWith('/nextScreen');
    });

    it('handles navigation errors gracefully', () => {
        const mockPush = jest.fn(() => {
            throw new Error('Navigation error');
        });
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        const { getByText } = render(<EventScreen />);
        const saveButton = getByText('Save');

        fireEvent.press(saveButton);
        expect(mockPush).toHaveBeenCalledWith('/nextScreen');
    });
    it('handles permission errors gracefully', () => {
        const mockPush = jest.fn(() => {
            throw new Error('Permission error');
        });
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        const { getByText } = render(<EventScreen />);
        const saveButton = getByText('Save');

        fireEvent.press(saveButton);
        expect(mockPush).toHaveBeenCalledWith('/nextScreen');
    });
    it('handles network errors gracefully', () => {
        const mockPush = jest.fn(() => {
            throw new Error('Network error');
        });
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

        const { getByText } = render(<EventScreen />);
        const saveButton = getByText('Save');

        fireEvent.press(saveButton);
        expect(mockPush).toHaveBeenCalledWith('/nextScreen');
    });
});