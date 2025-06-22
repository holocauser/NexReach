import React, { ReactElement, useEffect, useState } from 'react';
import { StripeProvider as StripeProviderBase } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

interface StripeProviderProps {
  children: ReactElement | ReactElement[];
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Replace with your actual Stripe publishable key
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RcViL4CG0n9MpwO0CYV7Of67tuSAfB00EdbayDeE7bhpiV0ivG36xGQv21dCsrCWX6pp1io9cHb14myI8nR47pY00dmsHdv5E';

  useEffect(() => {
    // Add a small delay to ensure native modules are ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // On web, we don't need the Stripe provider wrapper
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  // Wait for native modules to be ready
  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <StripeProviderBase publishableKey={publishableKey}>
      {children}
    </StripeProviderBase>
  );
} 