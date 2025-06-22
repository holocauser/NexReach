-- Migration: Add attendees column to events table
-- Run this migration to enable persistent attendees tracking

-- Add attendees column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS attendees integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_attendees integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.events.attendees IS 'Number of attendees for this event';
COMMENT ON COLUMN public.events.max_attendees IS 'Maximum number of attendees allowed for this event';

-- Create a function to increment attendees count
CREATE OR REPLACE FUNCTION increment_event_attendees(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.events 
  SET attendees = attendees + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_event_attendees(uuid) TO authenticated;

-- Create a function to get total attendees for an event
CREATE OR REPLACE FUNCTION get_event_attendees_count(event_id uuid)
RETURNS integer AS $$
DECLARE
  attendee_count integer;
BEGIN
  SELECT attendees INTO attendee_count
  FROM public.events
  WHERE id = event_id;
  
  RETURN COALESCE(attendee_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_event_attendees_count(uuid) TO authenticated; 