-- Migration: Add stripe_account_id to profiles table for Stripe Connect integration
-- This enables organizers to connect their Stripe accounts for payouts

-- Add stripe_account_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_account_status text DEFAULT 'disconnected' CHECK (stripe_account_status IN ('disconnected', 'pending', 'active', 'restricted'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON public.profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_status ON public.profiles(stripe_account_status);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'Stripe Connect account ID for receiving payouts';
COMMENT ON COLUMN public.profiles.stripe_account_status IS 'Status of the connected Stripe account';

-- Update existing profiles to have disconnected status
UPDATE public.profiles 
SET stripe_account_status = 'disconnected' 
WHERE stripe_account_status IS NULL;

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('stripe_account_id', 'stripe_account_status')
ORDER BY column_name; 