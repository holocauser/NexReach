-- Cleanup script to remove test data from the current user's account only
-- This script will clean up files, voice notes, cards, referrals, and events
-- that were created by the load test data generator for the current user.

-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can find your user ID in the Supabase Authentication dashboard or by checking the auth.users table

-- First, let's see what data exists for the current user
DO $$
DECLARE
    current_user_id UUID := '28003fce-c4af-46b4-8373-61220e5dbdf9'; -- Replace with your actual user ID
    file_count INT;
    voice_note_count INT;
    card_count INT;
    referral_count INT;
    event_count INT;
BEGIN
    -- Count existing data
    SELECT COUNT(*) INTO file_count FROM public.files WHERE user_id = current_user_id;
    SELECT COUNT(*) INTO voice_note_count FROM public.voice_notes WHERE user_id = current_user_id;
    SELECT COUNT(*) INTO card_count FROM public.cards WHERE user_id = current_user_id;
    SELECT COUNT(*) INTO referral_count FROM public.referrals WHERE user_id = current_user_id;
    SELECT COUNT(*) INTO event_count FROM public.events WHERE user_id = current_user_id;
    
    RAISE NOTICE 'Current user data counts:';
    RAISE NOTICE 'Files: %', file_count;
    RAISE NOTICE 'Voice Notes: %', voice_note_count;
    RAISE NOTICE 'Cards: %', card_count;
    RAISE NOTICE 'Referrals: %', referral_count;
    RAISE NOTICE 'Events: %', event_count;
    
    -- Clean up in the correct order (respecting foreign key constraints)
    RAISE NOTICE 'Cleaning up test data for user %...', current_user_id;
    
    -- Delete files (these reference cards)
    DELETE FROM public.files WHERE user_id = current_user_id;
    RAISE NOTICE 'Deleted % files', file_count;
    
    -- Delete voice notes (these reference cards)
    DELETE FROM public.voice_notes WHERE user_id = current_user_id;
    RAISE NOTICE 'Deleted % voice notes', voice_note_count;
    
    -- Delete referrals (these reference cards)
    DELETE FROM public.referrals WHERE user_id = current_user_id;
    RAISE NOTICE 'Deleted % referrals', referral_count;
    
    -- Delete events
    DELETE FROM public.events WHERE user_id = current_user_id;
    RAISE NOTICE 'Deleted % events', event_count;
    
    -- Delete cards (this will cascade to any remaining related data)
    DELETE FROM public.cards WHERE user_id = current_user_id;
    RAISE NOTICE 'Deleted % cards', card_count;
    
    RAISE NOTICE 'Cleanup complete for user %!', current_user_id;
END $$; 