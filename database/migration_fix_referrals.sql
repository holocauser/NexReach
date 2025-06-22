-- Migration to fix referrals table schema
-- This allows NULL values for referrer_id and recipient_id when they represent the current user

-- First, drop the existing foreign key constraints
ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;

ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS referrals_recipient_id_fkey;

-- Add the constraints back but allow NULL values
ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_referrer_id_fkey 
FOREIGN KEY (referrer_id) REFERENCES public.cards(id) ON DELETE CASCADE;

ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.cards(id) ON DELETE CASCADE;

-- Add a check constraint to ensure at least one of referrer_id or recipient_id is not null
ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS check_referral_participants;

ALTER TABLE public.referrals 
ADD CONSTRAINT check_referral_participants 
CHECK ((referrer_id IS NOT NULL) OR (recipient_id IS NOT NULL));

-- Update any existing referrals that might have user IDs in the referrer_id or recipient_id fields
-- This will set them to NULL since they should represent the current user
UPDATE public.referrals 
SET referrer_id = NULL 
WHERE referrer_id NOT IN (SELECT id FROM public.cards);

UPDATE public.referrals 
SET recipient_id = NULL 
WHERE recipient_id NOT IN (SELECT id FROM public.cards);

-- Ensure we don't have any referrals with both NULL values
DELETE FROM public.referrals 
WHERE referrer_id IS NULL AND recipient_id IS NULL; 