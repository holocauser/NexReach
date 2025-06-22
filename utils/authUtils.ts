import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const SESSION_KEY = 'supabase.session';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await persistSession(data.session);
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  await persistSession(data.session);
  return data;
}

export async function signInWithGoogle() {
  // Use expo-auth-session for Google sign-in
  // Implementation will be completed in the AuthContext/screen for redirect
  throw new Error('Not implemented: Use AuthContext for Google sign-in flow.');
}

export async function signInWithApple() {
  if (Platform.OS !== 'ios') throw new Error('Apple Sign-In is only available on iOS');
  // Use expo-apple-authentication for Apple sign-in
  // Implementation will be completed in the AuthContext/screen for redirect
  throw new Error('Not implemented: Use AuthContext for Apple sign-in flow.');
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function saveUserToDB(user: any, provider: string, metadata?: any) {
  if (!user) return;
  const { id, email, app_metadata } = user;
  const full_name = app_metadata?.full_name || app_metadata?.name || '';
  const { error } = await supabase.from('users').upsert([
    {
      id,
      email,
      full_name,
      provider,
      metadata: metadata || app_metadata,
    },
  ], { onConflict: 'id' });
  if (error) throw error;
}

// Session persistence helpers
async function persistSession(session: any) {
  if (!session) return;
  await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
}

export async function loadSession() {
  const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
  if (sessionStr) {
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  }
  return null;
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export const useAuthGuard = () => {
  const { user, requireLogin } = useAuth();
  const router = useRouter();

  const requireAuthForAction = (action: () => void, actionName: string) => {
    if (!user) {
      console.log(`Auth required for: ${actionName}`);
      requireLogin(() => {
        // This will be executed after successful login
        console.log(`Executing action after login: ${actionName}`);
        action();
      });
      return false;
    }
    console.log(`User authenticated, executing: ${actionName}`);
    action();
    return true;
  };

  const requireAuthForEventCreation = (action: () => void) => {
    return requireAuthForAction(action, 'Create Event');
  };

  const requireAuthForTicketPurchase = (action: () => void) => {
    return requireAuthForAction(action, 'Buy Ticket');
  };

  return {
    requireAuthForAction,
    requireAuthForEventCreation,
    requireAuthForTicketPurchase,
    isAuthenticated: !!user,
  };
};

export const withAuthGuard = <T extends any[]>(
  action: (...args: T) => void,
  actionName: string
) => {
  return (...args: T) => {
    const { requireAuthForAction } = useAuthGuard();
    requireAuthForAction(() => action(...args), actionName);
  };
}; 