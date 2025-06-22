-- Run this script to add attendees column to events table
-- This will enable persistent attendees tracking

\i migration_add_attendees_column.sql

-- Verify the migration was successful
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('attendees', 'max_attendees')
ORDER BY column_name;

-- Show the functions that were created
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('increment_event_attendees', 'get_event_attendees_count')
ORDER BY routine_name; 