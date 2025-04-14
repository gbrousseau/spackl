jest.mock('expo-router', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
    Redirect: ({ href }) => (
      React.createElement(View, null, React.createElement(Text, null, `Redirected to ${href}`))
    ),
  };
});
jest.mock('firebase/app', () => ({
  __esModule: true,
  initializeApp: () => ({}),
}));
jest.mock('firebase/auth', () => ({
  __esModule: true,
  initializeAuth: () => ({}),
}));
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  __esModule: true,
  getStorage: () => ({}),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('react-native/Libraries/Components/Switch/Switch', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => React.createElement('Switch', { ...props, ref })),
  };
});
jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => React.createElement('Pressable', { ...props, ref })),
  };
});