const React = require('react');
const { View, Text } = require('react-native');
console.log('expo-router mock loaded');
module.exports = {
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Redirect: ({ href }) => (
    React.createElement(View, null, React.createElement(Text, null, `Redirected to ${href}`))
  ),
};