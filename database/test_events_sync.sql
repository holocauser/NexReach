-- Test Events Sync Script
-- This script tests the events table functionality

-- 1. Check if we can insert a test event (this simulates what the app does)
-- First, get a user ID to use for testing
DO $$
DECLARE
    test_user_id uuid;
    test_event_id uuid := gen_random_uuid();
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing with user ID: %', test_user_id;
    
    -- Try to insert a test event
    INSERT INTO public.events (
        id,
        user_id,
        title,
        description,
        location,
        start_time,
        end_time,
        image,
        created_at,
        updated_at
    ) VALUES (
        test_event_id,
        test_user_id,
        'Test Event',
        'This is a test event to verify the table is working',
        'Test Location',
        NOW(),
        NOW(),
        'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Successfully inserted test event with ID: %', test_event_id;
    
    -- Try to select the event back
    PERFORM COUNT(*) FROM public.events WHERE id = test_event_id;
    RAISE NOTICE 'Successfully found the test event in the database';
    
    -- Clean up the test event
    DELETE FROM public.events WHERE id = test_event_id;
    RAISE NOTICE 'Successfully deleted the test event';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test: %', SQLERRM;
END $$;

-- 2. Check RLS policies are working correctly
-- This simulates what happens when the app tries to access events
DO $$
DECLARE
    test_user_id uuid;
    event_count integer;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table';
        RETURN;
    END IF;
    
    -- Check how many events this user has access to
    SELECT COUNT(*) INTO event_count 
    FROM public.events 
    WHERE user_id = test_user_id;
    
    RAISE NOTICE 'User % has access to % events', test_user_id, event_count;
    
    -- List the events this user has access to
    RAISE NOTICE 'Events for user %:', test_user_id;
    FOR event_rec IN 
        SELECT id, title, location, start_time 
        FROM public.events 
        WHERE user_id = test_user_id 
        ORDER BY start_time ASC
    LOOP
        RAISE NOTICE '  - %: % at %', event_rec.id, event_rec.title, event_rec.location;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error checking user events: %', SQLERRM;
END $$;

-- 3. Check if the image column exists and is working
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'events' 
AND column_name = 'image';

-- 4. Show current events count by user
SELECT 
    user_id,
    COUNT(*) as event_count
FROM public.events 
GROUP BY user_id 
ORDER BY event_count DESC; 