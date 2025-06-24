-- Run this script in your Supabase SQL editor to set up the organizer dashboard functionality

-- Create the RPC function for organizer dashboard stats
CREATE OR REPLACE FUNCTION get_organizer_dashboard_stats(organizer_user_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  total_tickets_sold BIGINT,
  gross_revenue NUMERIC,
  upcoming_events BIGINT,
  recent_events JSON,
  recent_activity JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH event_stats AS (
    SELECT 
      COUNT(*) as total_events,
      COUNT(CASE WHEN start_time > NOW() THEN 1 END) as upcoming_events
    FROM events 
    WHERE user_id = organizer_user_id
  ),
  ticket_stats AS (
    SELECT 
      COUNT(*) as total_tickets_sold,
      COUNT(*) * 50 as gross_revenue -- Mock calculation, replace with actual payment data
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE e.user_id = organizer_user_id
  ),
  recent_events_data AS (
    SELECT json_agg(
      json_build_object(
        'id', e.id,
        'title', e.title,
        'start_time', e.start_time,
        'created_at', e.created_at,
        'attending_count', e.attending_count
      )
    ) as events
    FROM (
      SELECT * FROM events 
      WHERE user_id = organizer_user_id 
      ORDER BY created_at DESC 
      LIMIT 5
    ) e
  ),
  recent_activity_data AS (
    SELECT json_agg(activity_item) as activity
    FROM (
      -- Recent events
      SELECT 
        json_build_object(
          'id', 'event-' || e.id,
          'type', 'event_created',
          'title', 'Event "' || e.title || '" published',
          'description', 'Created on ' || to_char(e.created_at, 'MM/DD/YYYY'),
          'timestamp', e.created_at,
          'amount', NULL
        ) as activity_item
      FROM events e
      WHERE e.user_id = organizer_user_id
      ORDER BY e.created_at DESC
      LIMIT 3
      
      UNION ALL
      
      -- Recent ticket sales
      SELECT 
        json_build_object(
          'id', 'ticket-' || t.id,
          'type', 'ticket_sold',
          'title', 'Ticket sold for "' || e.title || '"',
          'description', 'Ticket type: ' || t.ticket_type,
          'timestamp', t.created_at,
          'amount', 50
        ) as activity_item
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE e.user_id = organizer_user_id
      ORDER BY t.created_at DESC
      LIMIT 2
    ) combined_activity
  )
  SELECT 
    es.total_events,
    ts.total_tickets_sold,
    ts.gross_revenue,
    es.upcoming_events,
    red.events,
    rad.activity
  FROM event_stats es
  CROSS JOIN ticket_stats ts
  CROSS JOIN recent_events_data red
  CROSS JOIN recent_activity_data rad;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organizer_dashboard_stats(UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_user_id_created_at ON events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id_start_time ON events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id_created_at ON tickets(event_id, created_at DESC);

-- Test the function (replace with actual user ID)
-- SELECT * FROM get_organizer_dashboard_stats('your-user-id-here'); 

-- Run Organizer Dashboard Setup
-- This script creates the missing function for organizer dashboard statistics

-- Create function to get organizer dashboard statistics
-- This function provides aggregated data for the organizer dashboard

CREATE OR REPLACE FUNCTION public.get_organizer_dashboard_stats(organizer_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
    result json;
    total_events integer;
    total_tickets integer;
    total_revenue numeric;
    upcoming_events integer;
    recent_tickets integer;
    avg_attendees numeric;
BEGIN
    -- Get total events created by organizer
    SELECT COUNT(*) INTO total_events
    FROM public.events
    WHERE user_id = organizer_user_id;
    
    -- Get total tickets sold for organizer's events
    SELECT COUNT(*) INTO total_tickets
    FROM public.tickets t
    JOIN public.events e ON t.event_id = e.id
    WHERE e.user_id = organizer_user_id
    AND t.status IN ('paid', 'confirmed');
    
    -- Get total revenue (placeholder - would need payment integration)
    total_revenue := 0; -- This would be calculated from actual payments
    
    -- Get upcoming events (events in the future)
    SELECT COUNT(*) INTO upcoming_events
    FROM public.events
    WHERE user_id = organizer_user_id
    AND start_time > now();
    
    -- Get recent tickets (last 30 days)
    SELECT COUNT(*) INTO recent_tickets
    FROM public.tickets t
    JOIN public.events e ON t.event_id = e.id
    WHERE e.user_id = organizer_user_id
    AND t.created_at >= now() - interval '30 days'
    AND t.status IN ('paid', 'confirmed');
    
    -- Get average attendees per event
    SELECT COALESCE(AVG(attending_count), 0) INTO avg_attendees
    FROM public.events
    WHERE user_id = organizer_user_id;
    
    -- Build result JSON
    result := json_build_object(
        'total_events', total_events,
        'total_tickets', total_tickets,
        'total_revenue', total_revenue,
        'upcoming_events', upcoming_events,
        'recent_tickets', recent_tickets,
        'avg_attendees', avg_attendees,
        'organizer_id', organizer_user_id
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organizer_dashboard_stats(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_organizer_dashboard_stats(uuid) IS 'Returns dashboard statistics for an organizer including event counts, ticket sales, and revenue data';

-- Verify the function was created
SELECT 
    'Function created successfully' as status,
    proname as function_name,
    proargtypes::regtype[] as parameters,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_organizer_dashboard_stats'; 