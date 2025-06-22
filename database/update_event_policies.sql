-- Update Event Policies Script
-- This script updates the Row Level Security (RLS) policies for the 'events' table.
-- It changes the rules to allow any logged-in user to view all events,
-- while still ensuring users can only create, update, or delete their own events.

-- Drop the old, restrictive policy first.
DROP POLICY IF EXISTS "Users can access their events" ON public.events;

-- 1. Create a new policy to allow any authenticated user to VIEW all events.
DROP POLICY IF EXISTS "All authenticated users can view events" ON public.events;
CREATE POLICY "All authenticated users can view events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- 2. Create a policy for INSERTING events. Users can only insert events for themselves.
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Create a policy for UPDATING events. Users can only update their own events.
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Create a policy for DELETING events. Users can only delete their own events.
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

SELECT 'Successfully updated event policies. All authenticated users can now view all events.' as status; 