-- Comprehensive fix for ticket cancellation issues
-- This script addresses both the missing DELETE policy and attending_count column

-- 1. Fix: Add missing DELETE policy for tickets table
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;
CREATE POLICY "Users can delete their own tickets"
ON public.tickets FOR DELETE
USING (auth.uid() = user_id);

-- 2. Fix: Add attending_count column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS attending_count INTEGER DEFAULT 0;

-- Update existing events to have attending_count = 0 if they don't have it
UPDATE public.events 
SET attending_count = 0 
WHERE attending_count IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.events 
ALTER COLUMN attending_count SET NOT NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_events_attending_count ON public.events(attending_count);

-- 3. Create or replace the decrement_attending_count function
CREATE OR REPLACE FUNCTION public.decrement_attending_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.events 
  SET attending_count = greatest(0, attending_count - 1)
  WHERE id = event_id;
END;
$$;

-- 4. Verify all fixes were applied
SELECT 'DELETE Policy' as fix_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_policies 
         WHERE tablename = 'tickets' 
         AND policyname = 'Users can delete their own tickets'
       ) THEN '✅ Applied' ELSE '❌ Missing' END as status
UNION ALL
SELECT 'attending_count Column' as fix_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'events' 
         AND column_name = 'attending_count'
       ) THEN '✅ Applied' ELSE '❌ Missing' END as status
UNION ALL
SELECT 'decrement_attending_count Function' as fix_type,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc 
         WHERE proname = 'decrement_attending_count'
       ) THEN '✅ Applied' ELSE '❌ Missing' END as status; 