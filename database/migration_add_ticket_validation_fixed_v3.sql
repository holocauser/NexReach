-- Fixed Migration v3 to add ticket validation fields
-- This handles all dependent views and objects properly

-- First, identify and drop all views that depend on the tickets table
-- This will handle any views that might have been created outside our migration files

-- Drop any views that might depend on tickets table columns
DO $$ 
DECLARE
    view_record RECORD;
BEGIN
    -- Find all views that reference the tickets table
    FOR view_record IN 
        SELECT DISTINCT v.viewname 
        FROM pg_views v 
        JOIN pg_depend d ON d.objid = v.viewname::regclass
        JOIN pg_class c ON c.oid = d.refobjid
        WHERE c.relname = 'tickets' AND c.relnamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || view_record.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped dependent view: %', view_record.viewname;
    END LOOP;
    
    -- Also drop any views that might be named with tickets in them
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE viewname LIKE '%ticket%' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || view_record.viewname || ' CASCADE';
        RAISE NOTICE 'Dropped ticket-related view: %', view_record.viewname;
    END LOOP;
END $$;

-- Drop the specific views we know about
DROP VIEW IF EXISTS public.tickets_with_user_info CASCADE;
DROP VIEW IF EXISTS public.tickets_with_attendee_info CASCADE;
DROP VIEW IF EXISTS public.tickets_for_validation CASCADE;

-- Add missing columns to tickets table if they don't exist
DO $$ 
BEGIN
    -- Add validated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'validated_at') THEN
        ALTER TABLE public.tickets ADD COLUMN validated_at timestamptz;
    END IF;

    -- Add validated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'validated_by') THEN
        ALTER TABLE public.tickets ADD COLUMN validated_by uuid REFERENCES auth.users(id);
    END IF;

    -- Add attendee_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'attendee_name') THEN
        ALTER TABLE public.tickets ADD COLUMN attendee_name text;
    END IF;

    -- Add attendee_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'attendee_email') THEN
        ALTER TABLE public.tickets ADD COLUMN attendee_email text;
    END IF;

    -- Add amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'amount') THEN
        ALTER TABLE public.tickets ADD COLUMN amount numeric DEFAULT 0;
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'currency') THEN
        ALTER TABLE public.tickets ADD COLUMN currency text DEFAULT 'USD';
    END IF;

    -- Add stripe_payment_intent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE public.tickets ADD COLUMN stripe_payment_intent_id text;
    END IF;

    -- Add stripe_session_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'stripe_session_id') THEN
        ALTER TABLE public.tickets ADD COLUMN stripe_session_id text;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.tickets ADD COLUMN updated_at timestamptz DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_validated_at ON public.tickets(validated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_validated_by ON public.tickets(validated_by);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- Recreate the main view with proper column types
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
    COALESCE(t.attendee_name, p.full_name) as attendee_name,
    COALESCE(t.attendee_email, u.email::text) as attendee_email
FROM public.tickets t
LEFT JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;

-- Create a view specifically for ticket validation (organizer view)
CREATE OR REPLACE VIEW public.tickets_for_validation AS
SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.ticket_type,
    t.status,
    t.validated_at,
    t.validated_by,
    t.attendee_name,
    t.attendee_email,
    t.amount,
    t.currency,
    t.created_at,
    e.title as event_title,
    e.location as event_location,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.user_id as organizer_id,
    COALESCE(t.attendee_name, p.full_name) as display_name,
    COALESCE(t.attendee_email, u.email::text) as display_email,
    CASE 
        WHEN t.validated_at IS NOT NULL THEN '✅ Validated'
        WHEN t.status = 'confirmed' THEN '⏳ Pending'
        ELSE '❌ Invalid'
    END as validation_status
FROM public.tickets t
LEFT JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id
WHERE t.status = 'confirmed';

-- Add RLS policies for tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can update event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can validate tickets for their events" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tickets
CREATE POLICY "Users can update own tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Organizers can view tickets for their events
CREATE POLICY "Organizers can view event tickets" ON public.tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = tickets.event_id 
            AND e.user_id = auth.uid()
        )
    );

-- Policy: Organizers can update tickets for their events (for validation)
CREATE POLICY "Organizers can update event tickets" ON public.tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = tickets.event_id 
            AND e.user_id = auth.uid()
        )
    );

-- Create function to get ticket validation stats
CREATE OR REPLACE FUNCTION get_ticket_validation_stats(event_id uuid)
RETURNS TABLE (
    total_tickets bigint,
    validated_tickets bigint,
    pending_tickets bigint,
    total_revenue numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_tickets,
        COUNT(CASE WHEN t.validated_at IS NOT NULL THEN 1 END)::bigint as validated_tickets,
        COUNT(CASE WHEN t.validated_at IS NULL AND t.status = 'confirmed' THEN 1 END)::bigint as pending_tickets,
        COALESCE(SUM(t.amount), 0) as total_revenue
    FROM public.tickets t
    WHERE t.event_id = get_ticket_validation_stats.event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT SELECT ON public.tickets_with_user_info TO authenticated;
GRANT SELECT ON public.tickets_for_validation TO authenticated;
GRANT EXECUTE ON FUNCTION get_ticket_validation_stats(uuid) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.tickets IS 'Tickets table for event management and validation';
COMMENT ON COLUMN public.tickets.validated_at IS 'Timestamp when ticket was validated/checked in';
COMMENT ON COLUMN public.tickets.validated_by IS 'User ID of the organizer who validated the ticket';
COMMENT ON COLUMN public.tickets.attendee_name IS 'Name of the attendee (can be different from user)';
COMMENT ON COLUMN public.tickets.attendee_email IS 'Email of the attendee (can be different from user)';
COMMENT ON COLUMN public.tickets.amount IS 'Ticket price amount';
COMMENT ON COLUMN public.tickets.currency IS 'Currency code for the ticket price';
COMMENT ON COLUMN public.tickets.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking payments';
COMMENT ON COLUMN public.tickets.stripe_session_id IS 'Stripe session ID for checkout sessions';

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name IN ('validated_at', 'validated_by', 'attendee_name', 'attendee_email', 'amount', 'currency')
ORDER BY column_name;

-- Test the views to ensure they work
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_tickets_in_main_view
FROM public.tickets_with_user_info;

SELECT 
    'Validation view ready' as status,
    COUNT(*) as total_tickets_for_validation
FROM public.tickets_for_validation; 