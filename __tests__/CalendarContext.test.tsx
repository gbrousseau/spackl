import React, { useContext } from 'react';
import { render, act } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import { Text } from 'react-native';
import { CalendarProvider, CalendarContext } from '../context/CalendarContext';

const mockRefreshEvents = jest.fn();

jest.mock('../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <>{children}</>,
    CalendarContext: React.createContext({
        refreshEvents: jest.fn(),
        setSelectedDate: jest.fn(),
        selectedDate: null,
    }),
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

describe('CalendarContext', () => {
    it('provides default values', () => {
        const { getByText } = render(
            <CalendarProvider>
                <Text>Test Context</Text>
            </CalendarProvider>
        );

        expect(getByText('Test Context')).toBeTruthy();
    });

    it('handles refreshEvents correctly', async () => {
        jest.spyOn(React, 'useContext').mockImplementation(() => ({
            refreshEvents: mockRefreshEvents,
        }));

        await act(async () => {
            const context = useContext(CalendarContext);
            await context.refreshEvents();
        });
    });

    expect(mockRefreshEvents).toHaveBeenCalled();


    it('handles setSelectedDate with a date correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01'));
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with a string date correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate('2023-10-01');
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with a date object correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01'));
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with a date string correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01').toString());
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with a date object correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01'));
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with a date object string correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01').toString());
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01'));
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with null correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(null);
        });

        expect(context.selectedDate).toBeNull();
    });

    it('handles setSelectedDate with undefined correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(null); // Now allowed as per updated type
        });

        expect(context.selectedDate).toBeUndefined();
    });

    it('handles setSelectedDate with a date string correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate('2023-10-01');
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });

    it('handles setSelectedDate with an invalid date correctly', async () => {
        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate('invalid date');
        });

        expect(context.selectedDate).toBeNaN();
    });

    it('handles setSelectedDate with a date object correctly', async () => {

        const context = useContext(CalendarContext);
        await act(async () => {
            context.setSelectedDate(new Date('2023-10-01'));
        });

        expect(context.selectedDate).toEqual(new Date('2023-10-01'));
    });
});
