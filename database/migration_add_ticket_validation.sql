-- Migration: Add validated_at field to tickets table for QR code validation
-- This enables organizers to scan and validate tickets at events

-- Add validated_at column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

-- Create index for faster validation queries
CREATE INDEX IF NOT EXISTS idx_tickets_validated_at ON public.tickets(validated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_validated_by ON public.tickets(validated_by);

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.validated_at IS 'Timestamp when ticket was validated/checked-in at event';
COMMENT ON COLUMN public.tickets.validated_by IS 'User ID of organizer who validated the ticket';

-- Update existing tickets to have null validated_at
UPDATE public.tickets 
SET validated_at = NULL, validated_by = NULL 
WHERE validated_at IS NULL;

-- Add RLS policy for organizers to validate tickets for their events
-- This allows event organizers to validate tickets for events they created
DROP POLICY IF EXISTS "Organizers can validate tickets for their events" ON public.tickets;

CREATE POLICY "Organizers can validate tickets for their events"
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = tickets.event_id 
    AND events.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = tickets.event_id 
    AND events.user_id = auth.uid()
  )
);

-- Add RLS policy for organizers to view tickets for their events
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;

CREATE POLICY "Organizers can view tickets for their events"
ON public.tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = tickets.event_id 
    AND events.user_id = auth.uid()
  )
);

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name IN ('validated_at', 'validated_by')
ORDER BY column_name; 