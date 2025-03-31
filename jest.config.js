module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|react-navigation|@react-navigation)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^react-native/(.*)$': 'react-native-web/$1',
    '^@react-native-community/(.*)$': '@react-native-community-web/$1',
    '^@expo/(.*)$': '@expo/web/$1',
    '^@react-navigation/(.*)$': '@react-navigation/web/$1',
    '^@testing-library/(.*)$': '@testing-library/web/$1',
    '^@react-native-async-storage/(.*)$': '@react-native-async-storage/web/$1',
    '^@react-native-picker/(.*)$': '@react-native-picker/web/$1'
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true, // Enables detailed test results
  testTimeout: 30000, // Sets a custom timeout for tests
  globals: {
    __DEV__: true, // Example of setting global variables
  },
  setupFiles: ['<rootDir>/jest.setup.js'], // Add any setup files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Use Babel for transforming files
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ], // Adds watch plugins for better test filtering
};