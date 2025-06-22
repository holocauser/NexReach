-- Migration: Add image column to events table

-- Add image column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image text;

-- Update existing events to have default image if they don't have one
-- This is optional and can be removed if you don't want to set default images
UPDATE public.events 
SET image = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop'
WHERE image IS NULL; 