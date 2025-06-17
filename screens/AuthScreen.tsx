import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';

// Define the AuthContext type
interface AuthContextType {
  user: any;
  loading: boolean;
  intendedAction: null | (() => void);
  setIntendedAction: (action: null | (() => void)) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  requireLogin: (action: () => void) => void;
}

export default function AuthScreen() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth() as AuthContextType;
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace('/home');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Alert.alert('Missing Fields', isSignUp ? 'Please enter your full name, email, and password.' : 'Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e) {
      const error = e as Error;
      Alert.alert('Authentication Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const error = e as Error;
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithApple();
    } catch (e) {
      const error = e as Error;
      Alert.alert('Apple Sign-In Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 24 }}>Welcome</Text>
      <View style={{ width: '100%', marginBottom: 16 }}>
        {isSignUp && (
          <>
            <Text style={{ marginBottom: 4, fontWeight: '600' }}>Full Name</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />
          </>
        )}
        <Text style={{ marginBottom: 4, fontWeight: '600' }}>Email</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
        />
        <Text style={{ marginBottom: 4, fontWeight: '600' }}>Password</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
        />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 }}
        onPress={handleAuth}
        disabled={submitting || loading}
      >
        {submitting || loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#007AFF' }}>{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</Text>
      </TouchableOpacity>
      {/* Google Sign-In Button */}
      <TouchableOpacity
        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center' }}
        onPress={handleGoogleSignIn}
        disabled={submitting || loading}
      >
        {submitting || loading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>Sign In with Google</Text>
        )}
      </TouchableOpacity>
      {/* Apple Sign-In Button (iOS only) */}
      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ width: '100%', height: 44, marginBottom: 12 }}
          onPress={handleAppleSignIn}
        />
      )}
      {(submitting || loading) && (
        <View style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
} 