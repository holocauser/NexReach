-- Migration: Add payment fields to events table for Stripe integration
-- Run this migration to enable paid events functionality

-- Add payment-related columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS max_attendees integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create tickets table for tracking ticket purchases
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_payment_intent_id text,
  stripe_session_id text,
  status text not null check (status in ('pending', 'paid', 'cancelled', 'refunded')) default 'pending',
  amount numeric not null,
  currency text default 'usd',
  quantity integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for tickets table
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);

-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Tickets policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
CREATE POLICY "Users can insert their own tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Grant permissions
GRANT ALL ON public.tickets TO anon, authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tickets table
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN public.events.price IS 'Price in cents (e.g., 1000 = $10.00)';
COMMENT ON COLUMN public.events.currency IS 'Currency code (e.g., usd, eur)';
COMMENT ON COLUMN public.events.is_paid IS 'Whether this is a paid event';
COMMENT ON COLUMN public.events.stripe_product_id IS 'Stripe product ID for this event';
COMMENT ON COLUMN public.events.stripe_price_id IS 'Stripe price ID for this event';
COMMENT ON COLUMN public.events.max_attendees IS 'Maximum number of attendees allowed';
COMMENT ON COLUMN public.events.tags IS 'Array of tags for categorizing events'; 