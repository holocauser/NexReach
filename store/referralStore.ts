import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Referral } from '@/types';
import { mockReferrals } from '@/data/mockData';

interface ReferralState {
  referrals: Referral[];
  isLoaded: boolean;
  addReferral: (referral: Referral) => void;
  updateReferral: (referral: Referral) => void;
  deleteReferral: (id: string) => void;
  getReferralsByReferrer: (referrerId: string) => Referral[];
  getReferralsByRecipient: (recipientId: string) => Referral[];
  getTotalReferralsValue: () => number;
  getTopReferrers: (limit?: number) => { id: string; count: number; value: number }[];
  getTopRecipients: (limit?: number) => { id: string; count: number; value: number }[];
  loadReferrals: () => Promise<void>;
  saveReferrals: (referrals: Referral[]) => Promise<void>;
}

const STORAGE_KEY = '@cardlink_referrals';

export const useReferralStore = create<ReferralState>((set, get) => ({
  referrals: [],
  isLoaded: false,
  
  loadReferrals: async () => {
    try {
      const storedReferrals = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedReferrals) {
        const parsedReferrals: Referral[] = JSON.parse(storedReferrals).map((referral: any) => ({
          ...referral,
          date: new Date(referral.date),
        }));
        
        set({
          referrals: parsedReferrals,
          isLoaded: true,
        });
      } else {
        // First time loading - use mock data and save it
        const referralsWithDates = mockReferrals.map(referral => ({
          ...referral,
          date: new Date(referral.date),
        }));
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(referralsWithDates));
        
        set({
          referrals: referralsWithDates,
          isLoaded: true,
        });
      }
    } catch (error) {
      console.error('Error loading referrals from storage:', error);
      // Fallback to mock data if storage fails
      set({
        referrals: mockReferrals,
        isLoaded: true,
      });
    }
  },
  
  saveReferrals: async (referrals: Referral[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(referrals));
    } catch (error) {
      console.error('Error saving referrals to storage:', error);
    }
  },
  
  addReferral: (referral) => {
    const newReferrals = [...get().referrals, referral];
    set({ referrals: newReferrals });
    get().saveReferrals(newReferrals);
  },
  
  updateReferral: (updatedReferral) => {
    const updatedReferrals = get().referrals.map(referral => 
      referral.id === updatedReferral.id ? updatedReferral : referral
    );
    set({ referrals: updatedReferrals });
    get().saveReferrals(updatedReferrals);
  },
  
  deleteReferral: (id) => {
    const updatedReferrals = get().referrals.filter(referral => referral.id !== id);
    set({ referrals: updatedReferrals });
    get().saveReferrals(updatedReferrals);
  },
  
  getReferralsByReferrer: (referrerId) => {
    return get().referrals.filter(referral => referral.referrerId === referrerId);
  },
  
  getReferralsByRecipient: (recipientId) => {
    return get().referrals.filter(referral => referral.recipientId === recipientId);
  },
  
  getTotalReferralsValue: () => {
    return get().referrals.reduce((total, referral) => total + referral.value, 0);
  },
  
  getTopReferrers: (limit = 5) => {
    const referrals = get().referrals;
    const referrerCounts: Record<string, { count: number; value: number }> = {};
    
    referrals.forEach(referral => {
      if (!referrerCounts[referral.referrerId]) {
        referrerCounts[referral.referrerId] = { count: 0, value: 0 };
      }
      referrerCounts[referral.referrerId].count += 1;
      referrerCounts[referral.referrerId].value += referral.value;
    });
    
    return Object.entries(referrerCounts)
      .map(([id, { count, value }]) => ({ id, count, value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
  
  getTopRecipients: (limit = 5) => {
    const referrals = get().referrals;
    const recipientCounts: Record<string, { count: number; value: number }> = {};
    
    referrals.forEach(referral => {
      if (!recipientCounts[referral.recipientId]) {
        recipientCounts[referral.recipientId] = { count: 0, value: 0 };
      }
      recipientCounts[referral.recipientId].count += 1;
      recipientCounts[referral.recipientId].value += referral.value;
    });
    
    return Object.entries(recipientCounts)
      .map(([id, { count, value }]) => ({ id, count, value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}));