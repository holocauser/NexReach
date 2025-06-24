-- Fix email column error in tickets_with_attendee_info view
-- The error occurs because p.email doesn't exist in profiles table
-- We need to join with auth.users table to get the email

-- Drop the existing view
DROP VIEW IF EXISTS public.tickets_with_attendee_info;

-- Recreate the view with proper email column from auth.users
CREATE OR REPLACE VIEW public.tickets_with_attendee_info AS
SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.ticket_type,
    t.status,
    t.created_at,
    e.title as event_title,
    e.location as event_location,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.image as event_image,
    p.full_name as attendee_name,
    u.email as attendee_email
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;

-- Grant permissions on the view
GRANT SELECT ON public.tickets_with_attendee_info TO authenticated;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);

-- Add comment for documentation
COMMENT ON VIEW public.tickets_with_attendee_info IS 'View that joins tickets with event and attendee profile information';

-- Verify the view was created successfully
SELECT 
    'View created successfully' as status,
    schemaname,
    viewname
FROM pg_views 
WHERE viewname = 'tickets_with_attendee_info';

-- Test the view to make sure it works
SELECT 
    'View test successful' as test_result,
    COUNT(*) as total_tickets
FROM public.tickets_with_attendee_info; 