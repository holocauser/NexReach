-- Fix view dependencies for tickets table
-- This script drops all views that depend on the tickets table before making changes

-- Drop all views that might depend on tickets table
DROP VIEW IF EXISTS public.tickets_with_user_info CASCADE;
DROP VIEW IF EXISTS public.tickets_with_attendee_info CASCADE;
DROP VIEW IF EXISTS public.tickets_for_validation CASCADE;

-- Also drop any other views that might reference tickets
DO $$ 
DECLARE
    view_record RECORD;
BEGIN
    -- Drop any views that might be named with tickets in them
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE viewname LIKE '%ticket%' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || view_record.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped ticket-related view: %', view_record.viewname;
    END LOOP;
END $$;

-- Now you can run your migration without view dependency issues
SELECT 'All dependent views dropped successfully' as status; 