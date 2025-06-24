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

-- Create an index for better performance on events table
CREATE INDEX IF NOT EXISTS idx_events_user_id_created_at ON events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_id_start_time ON events(user_id, start_time);

-- Create an index for better performance on tickets table
CREATE INDEX IF NOT EXISTS idx_tickets_event_id_created_at ON tickets(event_id, created_at DESC); 