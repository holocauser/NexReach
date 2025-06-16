import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';
import { useReferralStore } from '@/store/referralStore';
import { useUserStore } from '@/store/userStore';
import { useStartupPermissions } from '@/hooks/useStartupPermissions';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  const { loadCards, isLoaded: cardsLoaded } = useCardStore();
  const { loadReferrals, isLoaded: referralsLoaded } = useReferralStore();
  const { loadProfile, isLoaded: profileLoaded } = useUserStore();
  
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
    if ((fontsLoaded || fontError) && cardsLoaded && referralsLoaded && profileLoaded && !permissionsLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, cardsLoaded, referralsLoaded, profileLoaded, permissionsLoading]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading fonts...</Text>
      </View>
    );
  }

  if (!cardsLoaded || !referralsLoaded || !profileLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading your data...</Text>
      </View>
    );
  }

  if (permissionsLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Setting up permissions...</Text>
        <Text style={styles.subtext}>This helps us provide the best experience</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="events/create" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
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
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});