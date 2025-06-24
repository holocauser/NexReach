-- Migration: Add policy for organizers to view tickets for their events
-- This allows event organizers to see all tickets sold for their events

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;

-- Create policy for organizers to view tickets for their events
CREATE POLICY "Organizers can view tickets for their events"
ON public.tickets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = tickets.event_id 
    AND events.user_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tickets' AND policyname = 'Organizers can view tickets for their events'; 