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
    // Hide splash screen when everything is ready
    if (cardsLoaded && referralsLoaded && profileLoaded && !permissionsLoading && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [cardsLoaded, referralsLoaded, profileLoaded, permissionsLoading, authLoading]);

  // Show loading screen while data is loading
  if (!cardsLoaded || !referralsLoaded || !profileLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Loading your data...</Text>
      </View>
    );
  }

  // Show loading screen while permissions are being set up
  if (permissionsLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Setting up permissions...</Text>
        <Text style={styles.subtext}>This helps us provide the best experience</Text>
      </View>
    );
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

  // Show auth screen if user is not authenticated
  if (!user) {
    return <AuthScreen />;
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