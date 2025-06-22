import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCard } from '@/types';
import { mockCards } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface CardState {
  cards: BusinessCard[];
  favorites: BusinessCard[];
  isLoaded: boolean;
  addCard: (card: BusinessCard) => Promise<void>;
  updateCard: (card: BusinessCard) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setReminder: (id: string, hasReminder: boolean) => void;
  updateLastContacted: (id: string, date: Date) => void;
  getCardById: (id: string) => BusinessCard | undefined;
  filterCardsByTag: (tag: string) => BusinessCard[];
  loadCards: () => Promise<void>;
  saveCards: (cards: BusinessCard[]) => Promise<void>;
  resetToMockCards: (clearReferrals?: boolean, clearFiles?: boolean) => Promise<void>;
  resetAndSeedDatabase: () => Promise<{ success: boolean; error?: string; }>;
  syncCardsToDatabase: () => Promise<void>;
  checkCardExistsInDatabase: (cardId: string) => Promise<boolean>;
  onFilesCleared?: () => void;
  clearStorageAndReload: () => Promise<void>;
  cleanupDatabaseAndSync: () => Promise<{ success: boolean; error?: string; }>;
  syncDatabaseWithLocalState: () => Promise<{ success: boolean; error?: string; }>;
  clearAllCardsFromDatabase: () => Promise<{ success: boolean; error?: string; }>;
  cleanupDuplicateScannedCards: () => Promise<{ success: boolean; removedCount: number; error?: string; }>;
}

const STORAGE_KEY = '@cardlink_business_cards';

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  favorites: [],
  isLoaded: false,
  
  loadCards: async () => {
    try {
      const storedCards = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedCards) {
        const parsedCards: BusinessCard[] = JSON.parse(storedCards).map((card: any) => ({
          ...card,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
          lastContacted: card.lastContacted,
        }));
        
        // Check if cards have old IDs (card-001, card-002, etc.)
        const hasOldIds = parsedCards.some(card => card.id.startsWith('card-'));
        
        if (hasOldIds) {
          console.log('Detected old card IDs, clearing storage and loading fresh mock data...');
          await AsyncStorage.removeItem(STORAGE_KEY);
          // Also clear referral storage to ensure fresh referrals are generated
          await AsyncStorage.removeItem('@cardlink_referrals');
          // Fall through to load fresh mock data
        } else {
          set({
            cards: parsedCards,
            favorites: parsedCards.filter(card => card.favorited),
            isLoaded: true,
          });
          
          // Sync cards to database to prevent foreign key constraint violations
          await get().syncCardsToDatabase();
          return;
        }
      }
      
      // Load fresh mock data (either no stored data or old IDs detected)
      console.log('Loading fresh mock cards with proper UUIDs...');
      const mockCardsWithProperDates: BusinessCard[] = mockCards.map((card): BusinessCard => {
        const { lastContacted, ...rest } = card;
        return {
          ...rest,
          createdAt: (card.createdAt ? new Date(card.createdAt) : new Date()).toISOString(),
          updatedAt: (card.updatedAt ? new Date(card.updatedAt) : new Date()).toISOString(),
          lastContacted: lastContacted ? new Date(lastContacted).toISOString() : undefined,
        };
      });
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockCardsWithProperDates));
      set({
        cards: mockCardsWithProperDates,
        favorites: mockCardsWithProperDates.filter(card => card.favorited),
        isLoaded: true,
      });
      
      // Sync mock cards to database
      await get().syncCardsToDatabase();
      console.log('Loaded', mockCardsWithProperDates.length, 'fresh mock cards with proper UUIDs');
    } catch (error) {
      console.error('Error loading cards:', error);
      // Fallback to mock data if storage fails
      const mockCardsWithProperDates: BusinessCard[] = mockCards.map((card): BusinessCard => {
        const { lastContacted, ...rest } = card;
        return {
          ...rest,
          createdAt: (card.createdAt ? new Date(card.createdAt) : new Date()).toISOString(),
          updatedAt: (card.updatedAt ? new Date(card.updatedAt) : new Date()).toISOString(),
          lastContacted: lastContacted ? new Date(lastContacted).toISOString() : undefined,
        };
      });
      
      set({
        cards: mockCardsWithProperDates,
        favorites: mockCardsWithProperDates.filter(card => card.favorited),
        isLoaded: true,
      });
    }
  },
  
  saveCards: async (cards: BusinessCard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards to storage:', error);
    }
  },
  
  addCard: async (card) => {
    console.log('addCard called with:', card);
    const newCards = [card, ...get().cards];
    set({
      cards: newCards,
      favorites: card.favorited ? [card, ...get().favorites] : get().favorites
    });
    get().saveCards(newCards);
    
    // Sync the new card to Supabase database
    try {
      console.log('Syncing new card to database:', card.id);
      await get().syncCardsToDatabase();
      console.log('Successfully synced new card to database');
    } catch (error) {
      console.error('Error syncing new card to database:', error);
      // Don't throw error here to avoid breaking the UI flow
    }
    
    // Debug: log current cards in storage
    AsyncStorage.getItem('@cardlink_business_cards').then(data => {
      console.log('Current cards in storage:', data);
    });
  },
  
  updateCard: async (updatedCard) => {
    const updatedCards = get().cards.map(card => 
      card.id === updatedCard.id ? { ...updatedCard, updatedAt: new Date().toISOString() } : card
    );
    
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
    
    // Sync the updated card to Supabase database
    try {
      console.log('Syncing updated card to database:', updatedCard.id);
      await get().syncCardsToDatabase();
      console.log('Successfully synced updated card to database');
    } catch (error) {
      console.error('Error syncing updated card to database:', error);
    }
  },
  
  deleteCard: async (id) => {
    console.log('=== DELETE CARD START ===');
    console.log('Deleting card with ID:', id);
    
    const updatedCards = get().cards.filter(card => card.id !== id);
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
    
    // Delete the card from Supabase database
    try {
      console.log('Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication error');
      }
      
      if (!user) {
        console.error('No user found');
        throw new Error('User not authenticated');
      }
      
      console.log('User authenticated:', user.id);
      console.log('Attempting to delete card from database...');
      
      // First, let's check if the card exists in the database
      const { data: existingCard, error: checkError } = await supabase
        .from('cards')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (checkError) {
        console.error('Error checking if card exists:', checkError);
        if (checkError.code === 'PGRST116') {
          console.log('Card not found in database, but continuing with local deletion');
          return;
        }
        throw checkError;
      }
      
      console.log('Card found in database:', existingCard);
      
      // Now delete the card
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error('Error deleting card from database:', deleteError);
        throw deleteError;
      }
      
      console.log('Successfully deleted card from database');
      
      // Verify the deletion
      const { data: verifyCard, error: verifyError } = await supabase
        .from('cards')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (verifyError && verifyError.code === 'PGRST116') {
        console.log('✅ Card deletion verified - card no longer exists in database');
      } else if (verifyError) {
        console.error('Error verifying deletion:', verifyError);
      } else if (verifyCard) {
        console.error('❌ Card still exists in database after deletion attempt');
        throw new Error('Card deletion failed - card still exists');
      }
      
      console.log('=== DELETE CARD SUCCESS ===');
    } catch (error) {
      console.error('=== DELETE CARD ERROR ===');
      console.error('Error deleting card from database:', error);
      console.error('Error details:', error);
      
      // Revert local state if database deletion failed
      console.log('Reverting local state due to database deletion failure');
      const originalCards = get().cards;
      const cardToRestore = originalCards.find(card => card.id === id);
      if (cardToRestore) {
        const restoredCards = [...originalCards, cardToRestore];
        set({
          cards: restoredCards,
          favorites: restoredCards.filter(card => card.favorited)
        });
        get().saveCards(restoredCards);
        console.log('Local state reverted');
      }
      
      throw error; // Re-throw to let calling code handle it
    }
  },
  
  toggleFavorite: async (id) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, favorited: !card.favorited, updatedAt: new Date().toISOString() } : card
    );
    
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
    
    // Sync the favorite toggle to Supabase database
    try {
      console.log('Syncing favorite toggle to database:', id);
      await get().syncCardsToDatabase();
      console.log('Successfully synced favorite toggle to database');
    } catch (error) {
      console.error('Error syncing favorite toggle to database:', error);
    }
  },
  
  setReminder: (id, hasReminder) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, reminder: hasReminder, updatedAt: new Date().toISOString() } : card
    );
    
    set({ cards: updatedCards });
    get().saveCards(updatedCards);
  },
  
  updateLastContacted: (id, date) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, lastContacted: date.toISOString(), updatedAt: new Date().toISOString() } : card
    );
    
    set({ cards: updatedCards });
    get().saveCards(updatedCards);
  },
  
  getCardById: (id) => {
    return get().cards.find(card => card.id === id);
  },
  
  filterCardsByTag: (tag) => {
    return get().cards.filter(card => card.tags.includes(tag));
  },
  
  resetToMockCards: async (clearReferrals?: boolean, clearFiles?: boolean) => {
    console.log('=== RESET TO MOCK CARDS START ===');
    
    try {
      // 1. Clear existing cards from database first
      console.log('Clearing existing cards from database...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: cardsError } = await supabase
          .from('cards')
          .delete()
          .eq('user_id', user.id);
        
        if (cardsError) {
          console.error('Error clearing cards from database:', cardsError);
        } else {
          console.log('Successfully cleared all cards from database');
        }
      }
      
      // 2. Clear referrals if requested
      if (clearReferrals) {
        try {
          const { useReferralStore } = await import('@/store/referralStore');
          console.log('Commanding referral store to clear all data...');
          await useReferralStore.getState().clearReferrals();
          console.log('✅ Referral store has been commanded to clear.');
          
          // Verify the referral store state
          const referralStore = useReferralStore.getState();
          console.log('📊 Referral store state after reset:', {
            referralsCount: referralStore.referrals.length,
            isLoaded: referralStore.isLoaded
          });
        } catch (error) {
          console.error('Error handling referrals:', error);
        }
      }
      
      // 3. Handle files based on the clearFiles parameter
      if (clearFiles) {
        try {
          console.log('Clearing files and voice notes from database...');
          await supabase.from('files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voice_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          console.log('Cleared all files and voice notes from database');
          
          // Notify that files have been cleared
          const onFilesCleared = get().onFilesCleared;
          if (onFilesCleared) {
            onFilesCleared();
          }
        } catch (error) {
          console.error('Error clearing files:', error);
        }
      }
      
      // 4. Reset to original mock data with fresh dates
      console.log('Setting local state to mock cards...');
      const mockCardsWithProperDates: BusinessCard[] = mockCards.map((card): BusinessCard => {
        const { lastContacted, ...rest } = card;
        return {
          ...rest,
          createdAt: (card.createdAt ? new Date(card.createdAt) : new Date()).toISOString(),
          updatedAt: new Date().toISOString(),
          lastContacted: lastContacted ? new Date(lastContacted).toISOString() : undefined,
        };
      });
      
      await get().saveCards(mockCardsWithProperDates);
      set({ cards: mockCardsWithProperDates, favorites: mockCardsWithProperDates.filter(card => card.favorited), isLoaded: true });
      
      // 5. Sync mock cards to database
      console.log('Syncing mock cards to database...');
      await get().syncCardsToDatabase();
      
      console.log('=== RESET TO MOCK CARDS COMPLETE ===');
      console.log('Reset to', mockCardsWithProperDates.length, 'mock cards');
    } catch (error) {
      console.error('=== RESET TO MOCK CARDS ERROR ===');
      console.error('Error during reset:', error);
      throw error;
    }
  },
  
  resetAndSeedDatabase: async () => {
    try {
      console.log('--- Starting Database Reset and Seed ---');
      
      // 1. Clear existing data from database tables
      console.log('Deleting existing files...');
      await supabase.from('files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('Deleting existing voice notes...');
      await supabase.from('voice_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      console.log('Deleting existing cards...');
      await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Prepare mock cards for insertion (ensure user_id is set and map field names)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const cardsToInsert = mockCards.map(card => ({
        id: card.id,
        user_id: user.id,
        name: card.name,
        title: card.title,
        company: card.company,
        email: card.email,
        phone: card.phone,
        phones: card.phones,
        address: card.address,
        addresses: card.addresses,
        city: card.city,
        state: card.state,
        zip: card.zip,
        latitude: card.latitude,
        longitude: card.longitude,
        tags: card.tags || [],
        notes: card.notes,
        profile_image: card.profileImage,
        card_image: card.cardImage,
        favorited: card.favorited || false,
        last_contacted: card.lastContacted,
        specialty: card.specialty || [],
        languages: card.languages || [],
        website: card.website,
        created_at: card.createdAt,
        updated_at: card.updatedAt,
      }));

      // 3. Insert new mock data into the database
      console.log(`Inserting ${cardsToInsert.length} mock cards into database...`);
      const { error } = await supabase.from('cards').insert(cardsToInsert);
      if (error) {
        console.error('Error inserting mock cards:', error);
        throw error;
      }

      // 4. Set the local app state with the mock data
      console.log('Setting local store with mock cards...');
      set({ cards: mockCards, favorites: mockCards.filter(c => c.favorited) });
      
      console.log('--- Database Reset and Seed Complete ---');
      return { success: true };
    } catch (error) {
      console.error('Error during database reset and seed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
  
  syncCardsToDatabase: async () => {
    const { cards } = get();
    try {
      console.log('=== SYNC CARDS TO DATABASE START ===');
      console.log('Number of cards to sync:', cards.length);
      console.log('Card IDs to sync:', cards.map(c => c.id));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, skipping database sync');
        return;
      }

      console.log('User ID for sync:', user.id);

      // Check which cards already exist in database
      const { data: existingCards, error: fetchError } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching existing cards:', fetchError);
        return;
      }

      console.log('Existing cards in database:', existingCards?.map(c => c.id) || []);

      const existingCardIds = new Set(existingCards?.map(card => card.id) || []);
      const cardsToUpsert = cards.filter(card => !existingCardIds.has(card.id));

      console.log('Cards to upsert:', cardsToUpsert.map(c => c.id));

      if (cardsToUpsert.length > 0) {
        console.log(`Upserting ${cardsToUpsert.length} cards into database...`);
        
        const cardsForDatabase = cardsToUpsert.map(card => ({
          id: card.id,
          user_id: user.id,
          name: card.name,
          title: card.title,
          company: card.company,
          email: card.email,
          phone: card.phone,
          phones: card.phones,
          address: card.address,
          addresses: card.addresses,
          city: card.city,
          state: card.state,
          zip: card.zip,
          latitude: card.latitude,
          longitude: card.longitude,
          tags: card.tags || [],
          notes: card.notes,
          profile_image: card.profileImage,
          card_image: card.cardImage,
          favorited: card.favorited || false,
          last_contacted: card.lastContacted,
          specialty: card.specialty || [],
          languages: card.languages || [],
          website: card.website,
          created_at: card.createdAt,
          updated_at: card.updatedAt,
        }));

        console.log('Cards prepared for database upsert:', cardsForDatabase.map(c => ({ id: c.id, name: c.name })));

        // Use upsert instead of insert to handle potential duplicates
        const { data: upsertData, error } = await supabase
          .from('cards')
          .upsert(cardsForDatabase, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select();
        
        if (error) {
          console.error('Error syncing cards to database:', error);
          console.error('Error details:', error);
          
          // If it's a duplicate key error, try to handle it gracefully
          if (error.code === '23505') {
            console.log('Duplicate key detected, attempting individual inserts...');
            let successCount = 0;
            let errorCount = 0;
            
            for (const cardData of cardsForDatabase) {
              try {
                const { error: individualError } = await supabase
                  .from('cards')
                  .upsert([cardData], { 
                    onConflict: 'id',
                    ignoreDuplicates: true 
                  });
                
                if (individualError) {
                  console.error(`Error upserting card ${cardData.id}:`, individualError);
                  errorCount++;
                } else {
                  successCount++;
                }
              } catch (individualError) {
                console.error(`Error upserting card ${cardData.id}:`, individualError);
                errorCount++;
              }
            }
            
            console.log(`Individual upsert results: ${successCount} successful, ${errorCount} failed`);
          }
        } else {
          console.log('Successfully synced cards to database:', upsertData?.length || 0, 'cards upserted');
        }
      } else {
        console.log('All cards already exist in database');
      }
      
      console.log('=== SYNC CARDS TO DATABASE END ===');
    } catch (error) {
      console.error('=== SYNC CARDS TO DATABASE ERROR ===');
      console.error('Error syncing cards to database:', error);
    }
  },

  checkCardExistsInDatabase: async (cardId: string) => {
    try {
      console.log('=== CHECK CARD EXISTS IN DATABASE ===');
      console.log('Checking if card exists:', cardId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in');
        return false;
      }

      // If the cardId is the same as the user ID, it's not a card - it's the user
      if (cardId === user.id) {
        console.log('Card ID is user ID - treating as valid user reference');
        return true;
      }

      const { data: card, error } = await supabase
        .from('cards')
        .select('id, name')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.log('Error checking card existence:', error.message);
        return false;
      }

      if (!card) {
        console.log('Card not found in database');
        return false;
      }

      console.log('Card found in database:', card);
      return true;
    } catch (error) {
      console.error('Error checking card existence:', error);
      return false;
    }
  },

  clearStorageAndReload: async () => {
    console.log('Clearing storage and reloading fresh mock data...');
    try {
      // Clear card storage
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Clear referral storage to ensure fresh referrals are generated
      const { useReferralStore } = await import('@/store/referralStore');
      await AsyncStorage.removeItem('@cardlink_referrals');
      
      // Reload cards (this will also trigger fresh referral generation)
      await get().loadCards();
      
      // Reload referrals
      await useReferralStore.getState().loadReferrals();
      
      console.log('Storage cleared and fresh mock data loaded');
    } catch (error) {
      console.error('Error clearing storage and reloading:', error);
    }
  },

  // New function to clean up database and ensure proper sync
  cleanupDatabaseAndSync: async () => {
    console.log('=== CLEANUP DATABASE AND SYNC START ===');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, cannot cleanup database');
        return { success: false, error: 'User not logged in' };
      }

      // 1. Clear all existing data for this user
      console.log('Clearing existing referrals...');
      await supabase.from('referrals').delete().eq('user_id', user.id);
      
      console.log('Clearing existing cards...');
      await supabase.from('cards').delete().eq('user_id', user.id);
      
      console.log('Clearing existing files...');
      await supabase.from('files').delete().eq('user_id', user.id);
      
      console.log('Clearing existing voice notes...');
      await supabase.from('voice_notes').delete().eq('user_id', user.id);

      // 2. Clear local storage
      console.log('Clearing local storage...');
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem('@cardlink_referrals');

      // 3. Reload fresh mock data
      console.log('Loading fresh mock data...');
      await get().loadCards();
      
      // 4. Reload referrals
      const { useReferralStore } = await import('@/store/referralStore');
      await useReferralStore.getState().loadReferrals();

      console.log('=== CLEANUP DATABASE AND SYNC COMPLETE ===');
      return { success: true };
    } catch (error) {
      console.error('=== CLEANUP DATABASE AND SYNC ERROR ===');
      console.error('Error during cleanup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // New function to manually sync database with local state
  syncDatabaseWithLocalState: async () => {
    console.log('=== SYNC DATABASE WITH LOCAL STATE START ===');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      const localCards = get().cards;
      console.log('Local cards count:', localCards.length);
      console.log('Local card IDs:', localCards.map(c => c.id));
      
      // Get all cards from database for this user
      const { data: dbCards, error: dbError } = await supabase
        .from('cards')
        .select('id, name')
        .eq('user_id', user.id);
      
      if (dbError) {
        console.error('Error fetching database cards:', dbError);
        throw dbError;
      }
      
      console.log('Database cards count:', dbCards?.length || 0);
      console.log('Database card IDs:', dbCards?.map(c => c.id) || []);
      
      const localCardIds = new Set(localCards.map(c => c.id));
      const dbCardIds = new Set(dbCards?.map(c => c.id) || []);
      
      // Find cards that exist in database but not in local state
      const cardsToDeleteFromDb = dbCards?.filter(card => !localCardIds.has(card.id)) || [];
      console.log('Cards to delete from database:', cardsToDeleteFromDb.map(c => ({ id: c.id, name: c.name })));
      
      // Find cards that exist in local state but not in database
      const cardsToAddToDb = localCards.filter(card => !dbCardIds.has(card.id));
      console.log('Cards to add to database:', cardsToAddToDb.map(c => ({ id: c.id, name: c.name })));
      
      // Delete cards from database that don't exist locally
      if (cardsToDeleteFromDb.length > 0) {
        console.log('Deleting cards from database that don\'t exist locally...');
        const { error: deleteError } = await supabase
          .from('cards')
          .delete()
          .in('id', cardsToDeleteFromDb.map(c => c.id));
        
        if (deleteError) {
          console.error('Error deleting cards from database:', deleteError);
        } else {
          console.log('Successfully deleted', cardsToDeleteFromDb.length, 'cards from database');
        }
      }
      
      // Add cards to database that exist locally but not in database
      if (cardsToAddToDb.length > 0) {
        console.log('Adding cards to database that exist locally...');
        await get().syncCardsToDatabase();
      }
      
      console.log('=== SYNC DATABASE WITH LOCAL STATE COMPLETE ===');
      return { success: true };
    } catch (error) {
      console.error('=== SYNC DATABASE WITH LOCAL STATE ERROR ===');
      console.error('Error syncing database with local state:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Function to clear all cards from database for current user
  clearAllCardsFromDatabase: async () => {
    console.log('=== CLEAR ALL CARDS FROM DATABASE START ===');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log('Clearing all cards for user:', user.id);
      
      // Clear all cards for this user
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('user_id', user.id);
      
      if (cardsError) {
        console.error('Error clearing cards from database:', cardsError);
        throw cardsError;
      }
      
      console.log('Successfully cleared all cards from database');
      console.log('=== CLEAR ALL CARDS FROM DATABASE COMPLETE ===');
      return { success: true };
    } catch (error) {
      console.error('=== CLEAR ALL CARDS FROM DATABASE ERROR ===');
      console.error('Error clearing cards from database:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Function to clean up duplicate scanned cards
  cleanupDuplicateScannedCards: async () => {
    console.log('=== CLEANUP DUPLICATE SCANNED CARDS START ===');
    try {
      const localCards = get().cards;
      console.log('Total cards before cleanup:', localCards.length);
      
      // Find scanned cards (cards with "Added via business card scan" note)
      const scannedCards = localCards.filter(card => 
        card.notes === 'Added via business card scan'
      );
      
      console.log('Scanned cards found:', scannedCards.length);
      
      if (scannedCards.length <= 1) {
        console.log('No duplicates to clean up');
        return { success: true, removedCount: 0 };
      }
      
      // Group scanned cards by similarity (same email and similar name)
      const cardGroups = new Map<string, BusinessCard[]>();
      
      scannedCards.forEach(card => {
        const key = `${card.email || 'no-email'}-${card.name?.toLowerCase() || 'no-name'}`;
        if (!cardGroups.has(key)) {
          cardGroups.set(key, []);
        }
        cardGroups.get(key)!.push(card);
      });
      
      let totalRemoved = 0;
      const cardsToKeep: BusinessCard[] = [];
      
      // For each group, keep the most recent card and remove duplicates
      cardGroups.forEach((group, key) => {
        if (group.length > 1) {
          console.log(`Found ${group.length} duplicate cards for key: ${key}`);
          
          // Sort by creation date (newest first)
          group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Keep the most recent one
          const cardToKeep = group[0];
          cardsToKeep.push(cardToKeep);
          
          // Mark the rest for removal
          const cardsToRemove = group.slice(1);
          totalRemoved += cardsToRemove.length;
          
          console.log(`Keeping card: ${cardToKeep.id} (${cardToKeep.name})`);
          cardsToRemove.forEach(card => {
            console.log(`Removing duplicate: ${card.id} (${card.name})`);
          });
        } else {
          // Single card, keep it
          cardsToKeep.push(group[0]);
        }
      });
      
      // Add non-scanned cards
      const nonScannedCards = localCards.filter(card => 
        card.notes !== 'Added via business card scan'
      );
      cardsToKeep.push(...nonScannedCards);
      
      console.log(`Cleanup results: ${cardsToKeep.length} cards kept, ${totalRemoved} duplicates removed`);
      
      // Update local state
      set({
        cards: cardsToKeep,
        favorites: cardsToKeep.filter(card => card.favorited)
      });
      get().saveCards(cardsToKeep);
      
      // Sync to database
      await get().syncCardsToDatabase();
      
      console.log('=== CLEANUP DUPLICATE SCANNED CARDS COMPLETE ===');
      return { success: true, removedCount: totalRemoved };
    } catch (error) {
      console.error('=== CLEANUP DUPLICATE SCANNED CARDS ERROR ===');
      console.error('Error cleaning up duplicate cards:', error);
      return { success: false, removedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}));