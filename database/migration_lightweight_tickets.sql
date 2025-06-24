-- Lightweight Tickets Table Migration
-- This ensures the tickets table has the minimal required structure for QR scanner validation

-- Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_type   text NOT NULL DEFAULT 'general',
  status        text DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'canceled')),
  issued_at     timestamptz DEFAULT now(),
  validated_at  timestamptz,
  validated_by  uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_validated_at ON public.tickets(validated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_validated_by ON public.tickets(validated_by);

-- Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can update event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can validate tickets for their events" ON public.tickets;

-- Create RLS policies
-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
CREATE POLICY "Users can update own tickets"
ON public.tickets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Organizers can view tickets for their events
CREATE POLICY "Organizers can view event tickets"
ON public.tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.user_id = auth.uid()
  )
);

-- Organizers can update tickets for their events (for validation)
CREATE POLICY "Organizers can update event tickets"
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.user_id = auth.uid()
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.tickets IS 'Tickets table for event management and QR code validation';
COMMENT ON COLUMN public.tickets.validated_at IS 'Timestamp when ticket was validated/checked in';
COMMENT ON COLUMN public.tickets.validated_by IS 'User ID of the organizer who validated the ticket';
COMMENT ON COLUMN public.tickets.status IS 'Ticket status: issued, used, or canceled'; 