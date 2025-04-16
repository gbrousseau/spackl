import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
};

const mockLocalSearchParams = {
  id: '',
};

const Redirect = ({ href }) => (
  <View>
    <Text>Redirected to {href}</Text>
  </View>
);

Redirect.propTypes = {
  href: PropTypes.string.isRequired,
};

module.exports = {
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockLocalSearchParams,
  Redirect,
};