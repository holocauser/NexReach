import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  company?: string;
  title?: string;
  roles?: string[];
  isSetup: boolean;
  createdAt: Date;
  provider?: string;
}

interface UserState {
  profile: UserProfile | null;
  isLoaded: boolean;
  setupProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'isSetup'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  generateDeviceId: () => string;
  clearProfile: () => void;
  syncWithSupabase: (userId: string) => Promise<void>;
  checkProfileSetup: (userId: string) => Promise<boolean>;
}

const STORAGE_KEY = '@cardlink_user_profile';

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoaded: false,

  generateDeviceId: () => {
    return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  },

  loadProfile: async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedProfile) {
        const parsedProfile: UserProfile = JSON.parse(storedProfile);
        set({
          profile: {
            ...parsedProfile,
            createdAt: new Date(parsedProfile.createdAt),
          },
          isLoaded: true,
        });
      } else {
        // Create a basic profile with device ID
        const deviceId = get().generateDeviceId();
        const basicProfile: UserProfile = {
          id: deviceId,
          name: '',
          isSetup: false,
          createdAt: new Date(),
        };
        
        await get().saveProfile(basicProfile);
        set({ profile: basicProfile, isLoaded: true });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      set({ isLoaded: true });
    }
  },

  saveProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  setupProfile: (profileData) => {
    const profile: UserProfile = {
      ...profileData,
      id: get().profile?.id || get().generateDeviceId(),
      isSetup: true,
      createdAt: get().profile?.createdAt || new Date(),
    };
    
    set({ profile });
    get().saveProfile(profile);
  },

  updateProfile: (updates) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const updatedProfile = { ...currentProfile, ...updates };
    set({ profile: updatedProfile });
    get().saveProfile(updatedProfile);
  },

  clearProfile: () => {
    set({ profile: null });
    AsyncStorage.removeItem(STORAGE_KEY);
  },

  syncWithSupabase: async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile from Supabase:', error);
        return;
      }

      if (profile) {
        const localProfile: UserProfile = {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email,
          avatar: profile.avatar_url || '',
          company: profile.company || '',
          title: profile.title || '',
          roles: profile.roles || [],
          isSetup: profile.is_setup || false,
          createdAt: new Date(profile.created_at),
          provider: profile.provider,
        };
        
        set({ profile: localProfile });
        get().saveProfile(localProfile);
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  },

  checkProfileSetup: async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_setup, full_name')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile setup:', error);
        return false;
      }

      // If profile doesn't exist or is not setup, return false
      if (!profile || !profile.is_setup || !profile.full_name) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking profile setup:', error);
      return false;
    }
  },
}));