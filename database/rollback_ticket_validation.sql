-- Rollback script for ticket validation migration
-- Use this if you need to undo the changes

-- Drop the function
DROP FUNCTION IF EXISTS get_ticket_validation_stats(uuid);

-- Drop the view
DROP VIEW IF EXISTS public.tickets_with_user_info;

-- Drop indexes
DROP INDEX IF EXISTS idx_tickets_validated_at;
DROP INDEX IF EXISTS idx_tickets_validated_by;
DROP INDEX IF EXISTS idx_tickets_event_id;
DROP INDEX IF EXISTS idx_tickets_user_id;
DROP INDEX IF EXISTS idx_tickets_status;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can update event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can validate tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;

-- Remove columns (be careful - this will delete data!)
-- Uncomment these lines if you want to remove the columns completely
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS validated_at;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS validated_by;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS attendee_name;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS attendee_email;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS amount;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS currency;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS stripe_payment_intent_id;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS stripe_session_id;
-- ALTER TABLE public.tickets DROP COLUMN IF EXISTS updated_at;

-- Note: The above DROP COLUMN commands are commented out for safety
-- Uncomment them only if you're sure you want to remove the data 