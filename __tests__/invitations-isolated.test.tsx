import React from 'react';
import { render } from '@testing-library/react-native';
import InvitationsScreen from '@/app/(tabs)/invitations';

describe('InvitationsScreen isolated', () => {
  it('renders without crashing', () => {
    render(<InvitationsScreen />);
  });
});