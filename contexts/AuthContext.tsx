import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  intendedAction: (() => void) | null;
  setIntendedAction: (action: (() => void) | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  requireLogin: (action: () => void) => void;
  clearIntendedAction: () => void;
  syncUserProfile: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [intendedAction, setIntendedAction] = useState<(() => void) | null>(null);
  
  const { setupProfile, updateProfile, loadProfile } = useUserStore();
  const { syncCardsToDatabase } = useCardStore();

  // Sync user profile with Supabase user data
  const syncUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (profile) {
        // Update local profile with Supabase data
        updateProfile({
          id: user.id,
          name: profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
          company: '',
          title: '',
          avatar: profile.avatar_url || user.user_metadata?.avatar_url || '',
          isSetup: true,
        });
      } else {
        // Create profile from user metadata
        const profileData = {
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          company: '',
          title: '',
          avatar: user.user_metadata?.avatar_url || '',
        };
        
        setupProfile(profileData);
        
        // The trigger should automatically create the profile, but let's try to create it manually if needed
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: profileData.name || null,
            avatar_url: profileData.avatar || null,
          }]);
        
        if (insertError) {
          console.error('Error creating user profile in Supabase:', insertError);
          // If insert fails, the trigger might have already created the profile
          // Let's try to fetch it again
          const { data: retryProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (retryProfile) {
            console.log('Profile was created by trigger, updating local state');
            updateProfile({
              id: user.id,
              name: retryProfile.full_name || profileData.name,
              company: '',
              title: '',
              avatar: retryProfile.avatar_url || profileData.avatar,
              isSetup: true,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  };

  useEffect(() => {
    // Load user profile from local storage
    loadProfile();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        syncUserProfile(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await syncUserProfile(session.user);
          // If the user just signed in, sync the local cards with the database
          if (event === 'SIGNED_IN') {
            console.log('User signed in, triggering card sync...');
            await syncCardsToDatabase();
            console.log('Card sync after login completed.');
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // ✅ Use hardcoded redirect URI for reliability
      const redirectUri = 'scancard123://auth/callback';

      console.log('Redirect URI used:', redirectUri);

      // ✅ Trigger Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      console.log('OAuth URL generated:', data?.url);

      // ✅ Open browser login session
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        console.log('WebBrowser result:', result);

        if (result.type !== 'success') {
          throw new Error('Google sign-in was cancelled or failed.');
        }

        console.log('OAuth redirect complete, waiting for session...');

        // ✅ Wait a bit for the auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ✅ Try multiple times to get the session
        let sessionData = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          console.log(`Attempt ${attempts + 1} to fetch session...`);
          
          const { data: sessionResult, error: sessionError } = await supabase.auth.getSession();
          console.log('Session fetch result:', { sessionResult, sessionError });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }

          if (sessionResult?.session) {
            sessionData = sessionResult;
            console.log('Session found!');
            break;
          }

          // Try to get user directly
          const { data: userData } = await supabase.auth.getUser();
          console.log('User data:', userData);
          
          if (userData?.user) {
            console.log('User found, creating session manually...');
            // Create a basic session object
            sessionData = {
              session: {
                user: userData.user,
                access_token: 'temp_token',
                refresh_token: 'temp_refresh_token',
                expires_in: 3600,
                token_type: 'bearer',
              }
            };
            break;
          }

          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Waiting 1 second before attempt ${attempts + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (sessionData?.session) {
          console.log('Session found, updating app state...');
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          await syncUserProfile(sessionData.session.user);
        } else {
          console.log('No session found after all attempts, checking auth state...');
          // Final attempt to get user
          const { data: authData } = await supabase.auth.getUser();
          console.log('Final auth state:', authData);
          
          if (authData?.user) {
            console.log('User found in final check, updating state...');
            setUser(authData.user);
            await syncUserProfile(authData.user);
          } else {
            throw new Error('No session found after Google sign-in. Please try again.');
          }
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('Apple Sign-In credential received:', credential.email);
      
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'scancard123',
        path: 'auth/callback',
      });
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });
      
      if (error) throw new Error(error.message);
      
      console.log('Apple Sign-In successful');
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  };

  const requireLogin = (action: () => void) => {
    if (!user) {
      setIntendedAction(() => action);
      // Navigate to auth screen - this will be handled by the app router
      return;
    }
    action();
  };

  const clearIntendedAction = () => {
    setIntendedAction(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        intendedAction,
        setIntendedAction,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signOut,
        requireLogin,
        clearIntendedAction,
        syncUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 