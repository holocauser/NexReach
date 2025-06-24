# Dashboard Function Fix

## Issue
The organizer dashboard is showing an error because the `get_organizer_dashboard_stats` function is missing from the database.

## Error Message
```
ERROR: Could not find the function public.get_organizer_dashboard_stats(organizer_user_id) in the schema cache
```

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste this SQL:**

```sql
-- Create function to get organizer dashboard statistics
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
```

4. **Click "Run" to execute the SQL**

### Option 2: Use the Provided File

Run the SQL file directly:
```bash
# If you have Supabase CLI installed
npx supabase db push --file database/run_organizer_dashboard_setup.sql
```

## What This Function Does

The `get_organizer_dashboard_stats` function provides:

- **Total Events**: Count of all events created by the organizer
- **Total Tickets**: Count of tickets sold for organizer's events
- **Total Revenue**: Revenue from ticket sales (currently placeholder)
- **Upcoming Events**: Count of future events
- **Recent Tickets**: Tickets sold in the last 30 days
- **Average Attendees**: Average attendees per event

## Verification

After running the SQL, you can verify the function was created by running:

```sql
SELECT 
    'Function created successfully' as status,
    proname as function_name,
    proargtypes::regtype[] as parameters,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_organizer_dashboard_stats';
```

## Result

Once the function is created, the organizer dashboard should load without errors and display the statistics properly. 