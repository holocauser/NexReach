import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  company?: string;
  title?: string;
  isSetup: boolean;
  createdAt: Date;
}

interface UserState {
  profile: UserProfile | null;
  isLoaded: boolean;
  setupProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'isSetup'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  generateDeviceId: () => string;
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
}));