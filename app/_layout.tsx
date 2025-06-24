import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';
import { useReferralStore } from '@/store/referralStore';
import { useUserStore } from '@/store/userStore';
import { useStartupPermissions } from '@/hooks/useStartupPermissions';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AuthScreen from './auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import StripeProvider from '@/components/StripeProvider';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppContent() {
  useFrameworkReady();

  const { loadCards, isLoaded: cardsLoaded } = useCardStore();
  const { loadReferrals, isLoaded: referralsLoaded } = useReferralStore();
  const { loadProfile, isLoaded: profileLoaded } = useUserStore();
  const { loading: authLoading, user } = useAuth();
  
  // Request all permissions at startup
  const { allGranted: permissionsGranted, isLoading: permissionsLoading } = useStartupPermissions();

  useEffect(() => {
    // Load data from storage when app starts
    const loadData = async () => {
      try {
        await Promise.all([
          loadCards(),
          loadReferrals(),
          loadProfile()
        ]);
      } catch (error) {
        console.error('Error loading app data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Hide splash screen when everything is ready or after a timeout
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    // Hide splash screen after 3 seconds regardless of loading state
    const timeoutId = setTimeout(hideSplash, 3000);

    // Also hide when everything is ready
    if (cardsLoaded && referralsLoaded && profileLoaded && !permissionsLoading && !authLoading) {
      clearTimeout(timeoutId);
      hideSplash();
    }

    return () => clearTimeout(timeoutId);
  }, [cardsLoaded, referralsLoaded, profileLoaded, permissionsLoading, authLoading]);

  // Show auth screen if user is not authenticated
  if (!user && !authLoading) {
    return <AuthScreen />;
  }

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Checking authentication...</Text>
      </View>
    );
  }

  // User is authenticated - show main app interface
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="test-auth" options={{ headerShown: false }} />
        <Stack.Screen name="events/create" options={{ headerShown: false }} />
        <Stack.Screen name="referral-list" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="terms-of-service" options={{ title: 'Terms of Service' }} />
        <Stack.Screen name="privacy-security" options={{ title: 'Privacy & Security' }} />
        <Stack.Screen name="help-support" options={{ title: 'Help & Support' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        <Stack.Screen name="organizer/scan-tickets" options={{ title: 'Scan Tickets' }} />
        <Stack.Screen name="organizer/dashboard-overview" options={{ title: 'Dashboard' }} />
        <Stack.Screen name="organizer/tickets-sold" options={{ title: 'Tickets Sold' }} />
        <Stack.Screen name="organizer/payments-payouts" options={{ title: 'Payments' }} />
        <Stack.Screen name="organizer/receipts-invoices" options={{ title: 'Receipts' }} />
        <Stack.Screen name="organizer/tax-documents" options={{ title: 'Tax Documents' }} />
        <Stack.Screen name="organizer/bank-account" options={{ title: 'Bank Account' }} />
        <Stack.Screen name="organizer/settings" options={{ title: 'Organizer Settings' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan Card' }} />
        <Stack.Screen name="edit-card/[id]" options={{ title: 'Edit Card' }} />
        <Stack.Screen name="contact-details/[id]" options={{ title: 'Contact Details' }} />
        <Stack.Screen name="add-referral/[id]" options={{ title: 'Add Referral' }} />
        <Stack.Screen name="edit-referral/[id]" options={{ title: 'Edit Referral' }} />
        <Stack.Screen name="my-tickets" options={{ title: 'My Tickets' }} />
        <Stack.Screen name="my-ticket/[id]" options={{ title: 'Ticket Details' }} />
        <Stack.Screen name="organizer-settings" options={{ title: 'Organizer Settings' }} />
        <Stack.Screen name="about" options={{ title: 'About' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        {/* Temporarily disabled StripeProvider to fix startup issues */}
        {/* <StripeProvider> */}
          <AppContent />
        {/* </StripeProvider> */}
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});