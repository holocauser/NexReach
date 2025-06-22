-- Migration: Add image column to events table
-- This migration adds the image column to the events table if it doesn't exist

-- Add image column to events table if it doesn't exist
DO $$ 
BEGIN
    -- Check if the image column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'image'
    ) THEN
        -- Add the image column
        ALTER TABLE public.events ADD COLUMN image text;
        
        -- Update existing events to have default image if they don't have one
        UPDATE public.events 
        SET image = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop'
        WHERE image IS NULL;
        
        RAISE NOTICE 'Image column added to events table';
    ELSE
        RAISE NOTICE 'Image column already exists in events table';
    END IF;
END $$; 