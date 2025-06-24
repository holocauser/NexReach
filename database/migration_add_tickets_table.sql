-- Create the tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  calendar_ics_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);

-- Enable Row-Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure the script is re-runnable
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;

-- RLS Policies for tickets
-- Allow users to view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own tickets
CREATE POLICY "Users can create their own tickets"
ON public.tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own tickets (e.g., status)
CREATE POLICY "Users can update their own tickets"
ON public.tickets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own tickets
CREATE POLICY "Users can delete their own tickets"
ON public.tickets FOR DELETE
USING (auth.uid() = user_id); 