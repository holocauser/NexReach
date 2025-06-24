-- Setup test tickets for QR scanner testing
-- This script creates sample events and tickets for testing the QR scanner functionality

-- First, ensure we have the validation columns
-- Run migration_add_ticket_validation.sql first if not already done

-- Create test events (if they don't exist)
INSERT INTO public.events (id, user_id, title, description, location, start_time, end_time, image, attending_count, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as organizer
   'Tech Conference 2024', 
   'Annual technology conference with industry leaders', 
   'San Francisco Convention Center', 
   '2024-03-15T09:00:00Z', 
   '2024-03-15T18:00:00Z', 
   NULL, 
   150, 
   NOW(), 
   NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, user_id, title, description, location, start_time, end_time, image, attending_count, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440005', 
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as organizer
   'Different Event', 
   'A different event for testing', 
   'Different Location', 
   '2024-04-15T09:00:00Z', 
   '2024-04-15T18:00:00Z', 
   NULL, 
   50, 
   NOW(), 
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test tickets
INSERT INTO public.tickets (id, user_id, event_id, ticket_type, status, calendar_ics_url, validated_at, validated_by, created_at)
VALUES 
  -- Valid ticket for testing
  ('550e8400-e29b-41d4-a716-446655440000',
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as attendee
   '550e8400-e29b-41d4-a716-446655440001',
   'General Admission',
   'confirmed',
   NULL,
   NULL, -- Not validated yet
   NULL,
   NOW()),
   
  -- Already validated ticket
  ('550e8400-e29b-41d4-a716-446655440003',
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as attendee
   '550e8400-e29b-41d4-a716-446655440001',
   'VIP Pass',
   'confirmed',
   NULL,
   NOW(), -- Already validated
   (SELECT id FROM auth.users LIMIT 1), -- Validated by first user
   NOW()),
   
  -- Ticket for different event
  ('550e8400-e29b-41d4-a716-446655440004',
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as attendee
   '550e8400-e29b-41d4-a716-446655440005',
   'General Admission',
   'confirmed',
   NULL,
   NULL, -- Not validated yet
   NULL,
   NOW()),
   
  -- Cancelled ticket
  ('550e8400-e29b-41d4-a716-446655440006',
   (SELECT id FROM auth.users LIMIT 1), -- Use first user as attendee
   '550e8400-e29b-41d4-a716-446655440001',
   'General Admission',
   'cancelled',
   NULL,
   NULL, -- Not validated
   NULL,
   NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 
  'Events created:' as info,
  COUNT(*) as count
FROM public.events 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005')

UNION ALL

SELECT 
  'Tickets created:' as info,
  COUNT(*) as count
FROM public.tickets 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440006'
)

UNION ALL

SELECT 
  'Valid tickets (not validated):' as info,
  COUNT(*) as count
FROM public.tickets 
WHERE event_id = '550e8400-e29b-41d4-a716-446655440001'
  AND status = 'confirmed'
  AND validated_at IS NULL

UNION ALL

SELECT 
  'Validated tickets:' as info,
  COUNT(*) as count
FROM public.tickets 
WHERE event_id = '550e8400-e29b-41d4-a716-446655440001'
  AND validated_at IS NOT NULL;

-- Display test ticket information
SELECT 
  t.id as ticket_id,
  t.ticket_type,
  t.status,
  t.validated_at,
  e.title as event_title,
  CASE 
    WHEN t.validated_at IS NOT NULL THEN '✅ Already Validated'
    WHEN t.status != 'confirmed' THEN '❌ Invalid Status'
    ELSE '⏳ Ready for Validation'
  END as validation_status
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
WHERE t.id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440006'
)
ORDER BY t.created_at; 