import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Referral } from '@/types';
import { mockReferrals } from '@/data/mockData';
import { BusinessCard } from '@/types';
import { supabase } from '@/lib/supabase';
import { useCardStore } from './cardStore';
import * as Crypto from 'expo-crypto';

interface ReferralState {
  referrals: Referral[];
  isLoaded: boolean;
  addReferral: (referral: Referral) => void;
  updateReferral: (referral: Partial<Referral> & { id: string }) => Promise<void>;
  deleteReferral: (id: string) => void;
  getReferralsByReferrer: (referrerId: string) => Referral[];
  getReferralsByRecipient: (recipientId: string) => Referral[];
  getTotalReferralsValue: () => number;
  getTotalSentValue: () => number;
  getTotalReceivedValue: () => Promise<number>;
  getTopReferrers: (limit?: number) => Promise<{ id: string; count: number; value: number }[]>;
  getTopRecipients: (limit?: number) => Promise<{ id: string; count: number; value: number }[]>;
  loadReferrals: () => Promise<void>;
  saveReferrals: (referrals: Referral[]) => Promise<void>;
  clearReferrals: () => Promise<void>;
  setReferrals: (newReferrals: Referral[]) => Promise<void>;
  syncReferralsToDatabase: () => Promise<void>;
  loadReferralsFromDatabase: () => Promise<void>;
  regenerateReferrals: () => Promise<void>;
  forceRegenerateReferrals: () => Promise<void>;
  cleanInvalidReferrals: () => Promise<void>;
}

const STORAGE_KEY = '@cardlink_referrals';

// Helper function to generate proper UUIDs for referrals
/*
const generateReferralUUID = (index: number, prefix: number = 200000000000): string => {
  return `550e8400-e29b-41d4-a716-${(prefix + index).toString().padStart(12, '0')}`;
};
*/

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper function to clean up referrals with invalid IDs
const cleanInvalidReferrals = (referrals: any[]): Referral[] => {
  return referrals
    .filter(referral => isValidUUID(referral.id))
    .map(referral => ({
      ...referral,
      date: new Date(referral.date),
    }));
};

export const useReferralStore = create<ReferralState>((set, get) => ({
  referrals: [],
  isLoaded: false,
  
  loadReferrals: async () => {
    try {
      // First try to load from database
      await get().loadReferralsFromDatabase();
      
      // If no referrals in database, try to load from AsyncStorage
      if (get().referrals.length === 0) {
        const storedReferrals = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (storedReferrals) {
          const parsedReferrals: Referral[] = cleanInvalidReferrals(JSON.parse(storedReferrals));
          
          set({
            referrals: parsedReferrals,
            isLoaded: true,
          });
          
          // Sync to database
          await get().syncReferralsToDatabase();
        } else {
          // First time loading - wait for cards to be loaded first
          console.log('No stored referrals found, waiting for cards to load...');
          
          // Wait a bit for cards to load, then generate referrals
          setTimeout(async () => {
            try {
              const { cards } = useCardStore.getState();
              
              console.log('Cards loaded for referral generation:', cards.length);
              
              if (cards && cards.length > 0) {
                // Generate referrals based on current cards
                const { generateReferralsFromCards } = await import('@/data/mockData');
                const generatedReferralsData = generateReferralsFromCards(cards);
                
                // Get current user ID for referral generation
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  console.log('User not authenticated, skipping referral generation');
                  set({
                    referrals: [],
                    isLoaded: true,
                  });
                  return;
                }
                const userId = user.id;
                
                // Add proper UUIDs and replace USER_ID with actual user ID
                const generatedReferrals: Referral[] = generatedReferralsData.map((referralData, index) => {
                  // Generate a proper UUID for each referral
                  const uuid = Crypto.randomUUID();
                  return {
                    ...referralData,
                    id: uuid,
                    referrerId: referralData.referrerId === 'USER_ID' ? userId : referralData.referrerId,
                    recipientId: referralData.recipientId === 'USER_ID' ? userId : referralData.recipientId,
                    date: new Date(referralData.date),
                  };
                });
                
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(generatedReferrals));
                
                set({
                  referrals: generatedReferrals,
                  isLoaded: true,
                });
                
                // Sync to database
                await get().syncReferralsToDatabase();
                console.log('Generated initial referrals from cards:', generatedReferrals.length);
              } else {
                console.log('No cards available for referral generation');
                set({
                  referrals: [],
                  isLoaded: true,
                });
              }
            } catch (error) {
              console.error('Error generating referrals from cards:', error);
              set({
                referrals: [],
                isLoaded: true,
              });
            }
          }, 1000); // Wait 1 second for cards to load
          
          // Set loaded to true immediately to prevent blocking
          set({
            referrals: [],
            isLoaded: true,
          });
        }
      }
    } catch (error) {
      console.error('Error loading referrals from storage:', error);
      // Fallback to empty array if storage fails
      set({
        referrals: [],
        isLoaded: true,
      });
    }
  },
  
  loadReferralsFromDatabase: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, skipping database load');
        return;
      }

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading referrals from database:', error);
        return;
      }

      if (referrals && referrals.length > 0) {
        const parsedReferrals: Referral[] = referrals.map(referral => ({
          id: referral.id,
          referrerId: referral.referrer_id || user.id,
          recipientId: referral.recipient_id || user.id,
          date: new Date(referral.date),
          caseType: referral.case_type,
          outcome: referral.outcome as 'pending' | 'successful' | 'unsuccessful',
          value: referral.value,
          notes: referral.notes,
        }));

        set({
          referrals: parsedReferrals,
          isLoaded: true,
        });
        
        // Update AsyncStorage to match database
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsedReferrals));
        console.log('Loaded referrals from database:', parsedReferrals.length);
      }
    } catch (error) {
      console.error('Error loading referrals from database:', error);
    }
  },
  
  syncReferralsToDatabase: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, skipping database sync');
        return;
      }

      const { referrals } = get();
      console.log('Syncing referrals to database:', referrals.length);

      // Filter out referrals with invalid UUIDs
      const validReferrals = referrals.filter(ref => isValidUUID(ref.id));
      if (validReferrals.length !== referrals.length) {
        console.log(`Filtered out ${referrals.length - validReferrals.length} referrals with invalid UUIDs`);
        // Update the store with only valid referrals
        set({ referrals: validReferrals });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validReferrals));
      }

      // Check which referrals already exist in database
      const { data: existingReferrals, error: fetchError } = await supabase
        .from('referrals')
        .select('id')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching existing referrals:', fetchError);
        return;
      }

      const existingReferralIds = new Set(existingReferrals?.map(ref => ref.id) || []);
      const referralsToInsert = validReferrals.filter(ref => !existingReferralIds.has(ref.id));

      if (referralsToInsert.length > 0) {
        const referralsForDatabase = referralsToInsert.map(referral => ({
          id: referral.id,
          user_id: user.id,
          referrer_id: referral.referrerId === user.id ? null : referral.referrerId,
          recipient_id: referral.recipientId === user.id ? null : referral.recipientId,
          date: referral.date.toISOString(),
          case_type: referral.caseType,
          outcome: referral.outcome,
          value: referral.value,
          notes: referral.notes,
        }));

        const { error } = await supabase.from('referrals').insert(referralsForDatabase);
        if (error) {
          console.error('Error syncing referrals to database:', error);
        } else {
          console.log('Successfully synced referrals to database:', referralsToInsert.length, 'referrals inserted');
        }
      } else {
        console.log('All referrals already exist in database');
      }
    } catch (error) {
      console.error('Error syncing referrals to database:', error);
    }
  },
  
  saveReferrals: async (referrals: Referral[]) => {
    try {
      // Filter out invalid referrals before saving
      const validReferrals = referrals.filter(ref => isValidUUID(ref.id));
      if (validReferrals.length !== referrals.length) {
        console.log(`Filtered out ${referrals.length - validReferrals.length} invalid referrals before saving`);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validReferrals));
      // Also sync to database
      await get().syncReferralsToDatabase();
    } catch (error) {
      console.error('Error saving referrals to storage:', error);
    }
  },
  
  addReferral: async (referral) => {
    // Validate UUID before adding
    if (!isValidUUID(referral.id)) {
      console.error('Attempted to add referral with invalid UUID:', referral.id);
      return;
    }
    
    // Get current user ID for validation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not logged in, cannot add referral');
      return;
    }
    
    // Check if referrer exists (skip if it's the current user)
    let referrerExists = true;
    if (referral.referrerId !== user.id) {
      referrerExists = await useCardStore.getState().checkCardExistsInDatabase(referral.referrerId);
    }
    
    // Check if recipient exists (skip if it's the current user)
    let recipientExists = true;
    if (referral.recipientId !== user.id) {
      recipientExists = await useCardStore.getState().checkCardExistsInDatabase(referral.recipientId);
    }
    
    if (!referrerExists) {
      console.error('Referrer card does not exist in database:', referral.referrerId);
      return;
    }
    
    if (!recipientExists) {
      console.error('Recipient card does not exist in database:', referral.recipientId);
      return;
    }
    
    const newReferrals = [...get().referrals, referral];
    set({ referrals: newReferrals });
    await get().saveReferrals(newReferrals);
    // Also add to supabase
    await get().syncReferralsToDatabase();
  },
  
  updateReferral: async (updatedReferral) => {
    const oldReferrals = get().referrals;
    const newReferrals = oldReferrals.map((r) =>
      r.id === updatedReferral.id ? { ...r, ...updatedReferral } : r
    );

    // Optimistic update in the UI
    set({ referrals: newReferrals });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated.");

      const { id, ...updateData } = updatedReferral;

      const { error } = await supabase
        .from('referrals')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only update their own referrals

      if (error) throw error;

      // Persist to local storage on success
      await get().saveReferrals(newReferrals);
    } catch (error) {
      console.error("Failed to update referral in Supabase:", error);
      // Rollback UI on failure
      set({ referrals: oldReferrals });
      // Propagate error to the UI layer
      throw error;
    }
  },
  
  deleteReferral: async (id) => {
    const updatedReferrals = get().referrals.filter(referral => referral.id !== id);
    set({ referrals: updatedReferrals });
    await get().saveReferrals(updatedReferrals);
    
    // Also delete from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('referrals')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error deleting referral from database:', error);
        }
      }
    } catch (error) {
      console.error('Error deleting referral from database:', error);
    }
  },
  
  getReferralsByReferrer: (referrerId) => {
    return get().referrals
      .filter(referral => referral.referrerId === referrerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  getReferralsByRecipient: (recipientId) => {
    return get().referrals
      .filter(referral => referral.recipientId === recipientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  
  getTotalReferralsValue: () => {
    return get().referrals.reduce((total, referral) => total + referral.value, 0);
  },
  
  getTotalSentValue: () => {
    return get().referrals
      .filter(referral => referral.direction === 'sent')
      .reduce((total, referral) => total + referral.value, 0);
  },
  
  getTotalReceivedValue: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return 0;

    return get().referrals
      .filter(r => r.recipientId === userId)
      .reduce((sum, r) => sum + r.value, 0);
  },
  
  getTopReferrers: async (limit = 5) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return [];

    const referrerStats: Record<string, { count: number; value: number }> = {};
    
    get().referrals.forEach(referral => {
      const referrerId = referral.referrerId;
      
      // We are interested in referrals sent by others
      if (referrerId !== userId) {
        if (!referrerStats[referrerId]) {
          referrerStats[referrerId] = { count: 0, value: 0 };
        }
        referrerStats[referrerId].count += 1;
        referrerStats[referrerId].value += referral.value;
      }
    });

    return Object.entries(referrerStats)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, limit)
      .map(([id, stats]) => ({ id, ...stats }));
  },
  
  getTopRecipients: async (limit = 5) => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return [];

    const recipientStats: Record<string, { count: number; value: number }> = {};

    get().referrals.forEach(referral => {
      // If the recipient is the current user, we want to attribute this referral
      // to the person who *sent* it.
      const keyId = referral.recipientId === userId ? referral.referrerId : referral.recipientId;

      if (keyId !== userId) {
        if (!recipientStats[keyId]) {
          recipientStats[keyId] = { count: 0, value: 0 };
        }
        recipientStats[keyId].count += 1;
        recipientStats[keyId].value += referral.value;
      }
    });

    return Object.entries(recipientStats)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, limit)
      .map(([id, stats]) => ({ id, ...stats }));
  },
  
  setReferrals: async (newReferrals: Referral[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReferrals));
      set({ referrals: newReferrals, isLoaded: true });
      
      // Also sync to database
      await get().syncReferralsToDatabase();
      console.log(`Forcefully set and saved ${newReferrals.length} referrals.`);
    } catch (error) {
      console.error('Error in setReferrals:', error);
    }
  },
  
  clearReferrals: async () => {
    try {
      console.log('Clearing referrals from database...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('referrals')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error clearing referrals from database:', error);
        } else {
          console.log('Cleared referrals from database');
        }
      }
      
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ referrals: [], isLoaded: true });
      console.log('Cleared referrals in store and AsyncStorage.');
    } catch (error) {
      console.error('Error clearing referrals:', error);
    }
  },
  
  regenerateReferrals: async () => {
    try {
      console.log('Regenerating referrals from current cards...');
      
      const { cards } = useCardStore.getState();
      
      if (cards && cards.length > 0) {
        // Generate referrals based on current cards
        const { generateReferralsFromCards } = await import('@/data/mockData');
        const generatedReferralsData = generateReferralsFromCards(cards);
        
        // Get current user ID for referral generation
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('User not authenticated, skipping referral generation');
          set({
            referrals: [],
            isLoaded: true,
          });
          return;
        }
        const userId = user.id;
        
        // Add proper UUIDs and replace USER_ID with actual user ID
        const generatedReferrals: Referral[] = generatedReferralsData.map((referralData, index) => {
          // Generate a proper UUID for each referral
          const uuid = Crypto.randomUUID();
          return {
            ...referralData,
            id: uuid,
            referrerId: referralData.referrerId === 'USER_ID' ? userId : referralData.referrerId,
            recipientId: referralData.recipientId === 'USER_ID' ? userId : referralData.recipientId,
            date: new Date(referralData.date),
          };
        });
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(generatedReferrals));
        
        set({
          referrals: generatedReferrals,
          isLoaded: true,
        });
        
        // Sync to database
        await get().syncReferralsToDatabase();
        console.log('Regenerated referrals from cards:', generatedReferrals.length);
      } else {
        console.log('No cards available for referral regeneration');
      }
    } catch (error) {
      console.error('Error regenerating referrals:', error);
    }
  },
  
  // Force clear and regenerate referrals to fix invalid UUID issues
  forceRegenerateReferrals: async () => {
    try {
      console.log('Force clearing and regenerating referrals to fix UUID issues...');
      
      // First clear everything
      await get().clearReferrals();
      
      // Then regenerate
      await get().regenerateReferrals();
      
      console.log('Force regeneration completed');
    } catch (error) {
      console.error('Error in force regeneration:', error);
    }
  },
  
  // Immediately clean up invalid referrals from current state
  cleanInvalidReferrals: async () => {
    try {
      const { referrals } = get();
      const validReferrals = referrals.filter(ref => isValidUUID(ref.id));
      
      if (validReferrals.length !== referrals.length) {
        console.log(`Cleaning up ${referrals.length - validReferrals.length} invalid referrals`);
        set({ referrals: validReferrals });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validReferrals));
        console.log('Invalid referrals cleaned up');
      } else {
        console.log('No invalid referrals found');
      }
    } catch (error) {
      console.error('Error cleaning invalid referrals:', error);
    }
  }
}));