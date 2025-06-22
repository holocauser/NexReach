import { useEventStore } from '@/store/eventStore';

/**
 * Sync mock events to Supabase database
 * This function will insert the 3 mock events into your events table
 */
export const syncMockEventsToDatabase = async () => {
  try {
    console.log('🔄 Starting mock events sync to database...');
    await useEventStore.getState().syncMockEventsToDatabase();
    console.log('✅ Mock events sync completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Error syncing mock events:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Load events from database
 * This function will load events from Supabase and update the store
 */
export const loadEventsFromDatabase = async () => {
  try {
    console.log('🔄 Loading events from database...');
    await useEventStore.getState().loadEventsFromDatabase();
    console.log('✅ Events loaded from database');
    return { success: true };
  } catch (error) {
    console.error('❌ Error loading events from database:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Reset events to mock data
 * This function will clear database events and load mock events
 */
export const resetEventsToMock = async () => {
  try {
    console.log('🔄 Resetting events to mock data...');
    await useEventStore.getState().resetEventsToMock();
    console.log('✅ Events reset to mock data');
    return { success: true };
  } catch (error) {
    console.error('❌ Error resetting events:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 