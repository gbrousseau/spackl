// Extend Jest matchers for React Native
import '@testing-library/jest-native/extend-expect';

// Mock any modules if necessary
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));