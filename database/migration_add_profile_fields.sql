-- Migration to add additional fields to profiles table for profile setup
-- Add company, title, and roles fields

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_setup BOOLEAN DEFAULT FALSE;

-- Update existing profiles to mark them as setup if they have a name
UPDATE profiles 
SET is_setup = TRUE 
WHERE full_name IS NOT NULL AND full_name != '';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_setup ON profiles(is_setup); 