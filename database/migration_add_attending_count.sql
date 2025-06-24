-- Migration: Add attending_count column to events table
-- This column tracks how many people are attending each event

-- Add the attending_count column with a default value of 0
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS attending_count INTEGER DEFAULT 0;

-- Update existing events to have attending_count = 0 if they don't have it
UPDATE public.events 
SET attending_count = 0 
WHERE attending_count IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.events 
ALTER COLUMN attending_count SET NOT NULL;

-- Add an index for better performance when querying by attending_count
CREATE INDEX IF NOT EXISTS idx_events_attending_count ON public.events(attending_count);

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'attending_count'; 