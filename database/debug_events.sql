-- Debug Events Table Script
-- This script helps diagnose issues with the events table

-- 1. Check if events table exists and has the correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check if there are any events in the table
SELECT COUNT(*) as total_events FROM public.events;

-- 3. Check if there are any users in the auth.users table
SELECT COUNT(*) as total_users FROM auth.users;

-- 4. Check RLS policies on events table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events';

-- 5. Check if events table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'events';

-- 6. List all events (if any exist)
SELECT 
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
FROM public.events
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check current database connections (simplified)
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state = 'active'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start DESC
LIMIT 5; 