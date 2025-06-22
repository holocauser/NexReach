-- Add missing 'ticket_type' column to the tickets table if it doesn't exist
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS ticket_type TEXT;

-- Update any existing rows where ticket_type might be null to 'free'
UPDATE public.tickets
SET ticket_type = 'free'
WHERE ticket_type IS NULL;

-- Now, enforce the NOT NULL constraint as originally intended
ALTER TABLE public.tickets
ALTER COLUMN ticket_type SET NOT NULL; 