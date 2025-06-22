import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import * as AuthSession from 'expo-auth-session';

export default function TestAuthScreen() {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();

  const testEmailAuth = () => {
    Alert.alert(
      'Test Email Auth',
      'This will redirect you to the auth screen where you can test email/password authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Auth', onPress: () => router.push('/auth') }
      ]
    );
  };

  const testProtectedAction = () => {
    Alert.alert(
      'Test Protected Action',
      'This simulates trying to create an event without being logged in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test', onPress: () => router.push('/events/create') }
      ]
    );
  };

  const testProfile = () => {
    if (!user) {
      Alert.alert('Not Logged In', 'Please log in first to view your profile.');
      return;
    }
    router.push('/profile');
  };

  const testRedirectUri = () => {
    const redirectUri = 'scancard123://auth/callback';
    setDebugInfo(`OAuth Redirect URI: ${redirectUri}\n\nConfiguration needed:\n\n1. Google Cloud Console:\n   - Add: ${redirectUri}\n\n2. Supabase Dashboard:\n   - Authentication → URL Configuration\n   - Add: ${redirectUri}\n\n3. Also add these for development:\n   - exp://localhost:8081/--/auth/callback\n   - exp://localhost:8082/--/auth/callback\n   - exp://localhost:8083/--/auth/callback`);
    console.log('OAuth Redirect URI:', redirectUri);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auth Test</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Authentication Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text style={styles.statusValue}>{loading ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Logged In:</Text>
            <Text style={styles.statusValue}>{user ? 'Yes' : 'No'}</Text>
          </View>
          {user && (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Email:</Text>
                <Text style={styles.statusValue}>{user.email}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Name:</Text>
                <Text style={styles.statusValue}>
                  {user.user_metadata?.full_name || user.user_metadata?.name || 'Not set'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testEmailAuth}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={styles.testButtonText}>Test Email Authentication</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testProtectedAction}>
            <Ionicons name="shield-outline" size={20} color={Colors.primary} />
            <Text style={styles.testButtonText}>Test Protected Action</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testProfile}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
            <Text style={styles.testButtonText}>View Profile</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity 
              style={[styles.testButton, styles.signOutButton]} 
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={[styles.testButtonText, styles.signOutText]}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What to Test</Text>
          <Text style={styles.infoText}>
            • Try email/password authentication first{'\n'}
            • Test creating an event (should require login){'\n'}
            • Verify session persistence after app restart{'\n'}
            • Test sign out functionality{'\n'}
            • Check user profile creation in Supabase
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Troubleshooting</Text>
          <Text style={styles.infoText}>
            • If Google OAuth fails, check the setup guide{'\n'}
            • Ensure Supabase is properly configured{'\n'}
            • Test on physical device for OAuth{'\n'}
            • Check network connection{'\n'}
            • Verify redirect URI matches Supabase config
          </Text>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <TouchableOpacity style={styles.debugButton} onPress={testRedirectUri}>
            <Text style={styles.debugButtonText}>Generate Redirect URI</Text>
          </TouchableOpacity>
          {debugInfo ? (
            <Text style={styles.debugText}>{debugInfo}</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 24,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  testButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: Colors.error + '10',
  },
  signOutText: {
    color: Colors.error,
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  debugSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  debugButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
}); 