import React from 'react';
import { render } from '@testing-library/react-native';
import { Redirect } from 'expo-router';
jest.mock('expo-router', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    Redirect: ({ href }) => (
      React.createElement(View, null, React.createElement(Text, null, `Redirected to ${href}`))
    ),
  };
});

describe('expo-router manual mock', () => {
  it('should use the mocked Redirect', () => {
    const { toJSON } = render(<Redirect href="/test" />);
    expect(toJSON()).toMatchSnapshot();
  });
});