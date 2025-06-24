-- Fix tickets and profiles relationship
-- This creates a view that properly joins tickets with user profile information

-- Create a view that joins tickets with events and user profiles
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

-- Verify the view was created
SELECT 
    'View created successfully' as status,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'tickets_with_attendee_info'; 