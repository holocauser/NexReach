-- Insert Mock Events Script
-- This script manually inserts the 3 mock events into the events table
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

-- First, let's get your user ID (run this first to find your user ID)
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then, replace 'YOUR_USER_ID_HERE' below with your actual user ID and run this script

-- Insert Mock Event 1: Legal Networking Mixer
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
    '550e8400-e29b-41d4-a716-446655440001',
    'YOUR_USER_ID_HERE', -- Replace with your actual user ID
    'Legal Networking Mixer',
    'Join us for an evening of networking with fellow legal professionals. Great opportunity to meet new colleagues and discuss industry trends.',
    'The Ritz-Carlton, Atlanta',
    (NOW() + INTERVAL '5 days')::timestamp with time zone,
    (NOW() + INTERVAL '5 days')::timestamp with time zone,
    'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Mock Event 2: Medical Conference 2024
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
    '550e8400-e29b-41d4-a716-446655440002',
    'YOUR_USER_ID_HERE', -- Replace with your actual user ID
    'Medical Conference 2024',
    'Annual medical conference featuring the latest research and innovations in healthcare. CME credits available.',
    'Georgia World Congress Center',
    (NOW() + INTERVAL '14 days')::timestamp with time zone,
    (NOW() + INTERVAL '14 days')::timestamp with time zone,
    'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Mock Event 3: Startup Pitch Night
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
    '550e8400-e29b-41d4-a716-446655440003',
    'YOUR_USER_ID_HERE', -- Replace with your actual user ID
    'Startup Pitch Night',
    'Watch innovative startups pitch their ideas to investors. Great networking opportunity for entrepreneurs and investors.',
    'Tech Square, Atlanta',
    (NOW() + INTERVAL '12 days')::timestamp with time zone,
    (NOW() + INTERVAL '12 days')::timestamp with time zone,
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the events were inserted
SELECT 
    id,
    title,
    location,
    start_time,
    image
FROM public.events 
WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with your actual user ID
ORDER BY start_time ASC; 