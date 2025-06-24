-- Fix receipts relationship issue
-- This creates a view that properly joins tickets with user information for receipts

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.tickets_with_user_info;

-- Create a view that joins tickets with events and user information
CREATE OR REPLACE VIEW public.tickets_with_user_info AS
SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.ticket_type,
    t.status,
    t.amount,
    t.currency,
    t.stripe_payment_intent_id,
    t.stripe_session_id,
    t.created_at,
    e.title as event_title,
    e.location as event_location,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.image as event_image,
    e.user_id as organizer_id,
    p.full_name as attendee_name,
    u.email as attendee_email
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;

-- Grant permissions on the view
GRANT SELECT ON public.tickets_with_user_info TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);

-- Add comment for documentation
COMMENT ON VIEW public.tickets_with_user_info IS 'View that joins tickets with event and attendee information for receipts';

-- Verify the view was created
SELECT 
    'View created successfully' as status,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'tickets_with_user_info';

-- Test the view to make sure it works
SELECT 
    'View test successful' as test_result,
    COUNT(*) as total_tickets
FROM public.tickets_with_user_info; 