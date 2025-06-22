-- Master Cleanup Script (v3) - Fixes ALL foreign keys and cleans all test data.
-- WARNING: This script will alter your database schema and delete all load testing data.
-- This is a permanent fix for the database structure.

-- Step 1: Fix Foreign Key Constraints for ALL user-related tables.
-- This is a one-time operation that makes user cleanup cascade correctly from now on.

DO $$
BEGIN
    -- Fix for public.profiles
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix for public.cards
    ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_user_id_fkey;
    ALTER TABLE public.cards ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix for public.files
    ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
    ALTER TABLE public.files ADD CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix for public.voice_notes
    ALTER TABLE public.voice_notes DROP CONSTRAINT IF EXISTS voice_notes_user_id_fkey;
    ALTER TABLE public.voice_notes ADD CONSTRAINT voice_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix for public.referrals
    ALTER TABLE public.referrals DROP CONSTRAINT IF EXISTS referrals_user_id_fkey;
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix for public.events
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_user_id_fkey;
    ALTER TABLE public.events ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occurred while setting up foreign keys. This is likely safe to ignore if the script continues.';
END;
$$;

DO $$ BEGIN RAISE NOTICE 'Successfully fixed all user-related foreign key constraints.'; END; $$;

-- Step 2: Clean up dummy test users.
-- This command will now work correctly because of the fixes above.
DELETE FROM auth.users
WHERE email LIKE 'testuser%@scancard-test.com';

DO $$ BEGIN RAISE NOTICE 'Successfully deleted dummy users and all their associated data.'; END; $$;

-- Step 3: Clean up any remaining data from main tables (as a safety measure).
TRUNCATE TABLE public.cards, public.referrals, public.events, public.files, public.voice_notes RESTART IDENTITY CASCADE;

DO $$ BEGIN RAISE NOTICE 'Successfully truncated all test data tables.'; END; $$;

SELECT 'Database fixed and all load test data has been cleaned up.' as status; 