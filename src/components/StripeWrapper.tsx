import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export const StripeWrapper: React.FC<{ children: React.ReactElement | React.ReactElement[] }> = ({ children }) => (
  <StripeProvider
    publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
    merchantIdentifier="merchant.com.anonymous.scroli"
  >
    {children}
  </StripeProvider>
);
