-- Fix: Add missing DELETE policy for tickets table
-- This allows users to delete their own tickets

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;

-- Create the DELETE policy
CREATE POLICY "Users can delete their own tickets"
ON public.tickets FOR DELETE
USING (auth.uid() = user_id);

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
WHERE tablename = 'tickets' AND policyname = 'Users can delete their own tickets'; 