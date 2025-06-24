-- Migration: Add organizer fields to profiles table
-- This enables organizers to store their organization information

-- Add organizer-specific columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS org_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS website text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_org_name ON public.profiles(org_name);
CREATE INDEX IF NOT EXISTS idx_profiles_contact_email ON public.profiles(contact_email);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.org_name IS 'Organization name for event organizers';
COMMENT ON COLUMN public.profiles.contact_email IS 'Contact email for event organizers';
COMMENT ON COLUMN public.profiles.phone IS 'Phone number for event organizers';
COMMENT ON COLUMN public.profiles.website IS 'Website URL for event organizers';

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('org_name', 'contact_email', 'phone', 'website')
ORDER BY column_name; 