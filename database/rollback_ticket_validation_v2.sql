-- Rollback script for ticket validation migration v2
-- This safely removes the added columns and reverts the view

-- Drop the function first
DROP FUNCTION IF EXISTS get_ticket_validation_stats(uuid);

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can update event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can validate tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;

-- Drop indexes
DROP INDEX IF EXISTS idx_tickets_validated_at;
DROP INDEX IF EXISTS idx_tickets_validated_by;
DROP INDEX IF EXISTS idx_tickets_event_id;
DROP INDEX IF EXISTS idx_tickets_user_id;
DROP INDEX IF EXISTS idx_tickets_status;

-- Drop the view
DROP VIEW IF EXISTS public.tickets_with_user_info;

-- Remove columns from tickets table
ALTER TABLE public.tickets DROP COLUMN IF EXISTS validated_at;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS validated_by;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS attendee_name;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS attendee_email;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS amount;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS currency;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS stripe_session_id;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS updated_at;

-- Recreate the original view (if needed)
-- This recreates the view as it was in fix_receipts_relationship.sql
CREATE OR REPLACE VIEW public.tickets_with_user_info AS
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
    e.user_id as organizer_id,
    p.full_name as attendee_name,
    u.email as attendee_email
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;

-- Grant permissions on the view
GRANT SELECT ON public.tickets_with_user_info TO authenticated;

-- Verify rollback was successful
SELECT 
    'Rollback completed successfully' as status,
    COUNT(*) as total_tickets_in_view
FROM public.tickets_with_user_info; 