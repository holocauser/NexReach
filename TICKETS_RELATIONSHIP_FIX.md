# Tickets Relationship Fix

## Issue
The Tickets Sold feature is showing an error because there's no direct foreign key relationship between the `tickets` and `profiles` tables.

## Error Message
```
ERROR: Could not find a relationship between 'tickets' and 'profiles' in the schema cache
```

## Solution

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste this SQL:**

```sql
-- Fix tickets and profiles relationship
-- This creates a view that properly joins tickets with user profile information

-- Create a view that joins tickets with events and user profiles
CREATE OR REPLACE VIEW public.tickets_with_attendee_info AS
SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.ticket_type,
    t.status,
    t.created_at,
    e.title as event_title,
    e.location as event_location,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.image as event_image,
    p.full_name as attendee_name,
    p.email as attendee_email
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id;

-- Grant permissions on the view
GRANT SELECT ON public.tickets_with_attendee_info TO authenticated;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);

-- Add comment for documentation
COMMENT ON VIEW public.tickets_with_attendee_info IS 'View that joins tickets with event and attendee profile information';
```

4. **Click "Run" to execute the SQL**

### Option 2: Use the Provided File

Run the SQL file directly:
```bash
# If you have Supabase CLI installed
npx supabase db push --file database/fix_tickets_profiles_relationship.sql
```

## What This Fix Does

### 1. Creates a Database View
The `tickets_with_attendee_info` view properly joins:
- **tickets** table (ticket information)
- **events** table (event details)
- **profiles** table (attendee information)

### 2. Provides Complete Data
The view returns:
- **Ticket details**: ID, type, status, purchase date
- **Event information**: Title, location, dates, image
- **Attendee information**: Name, email (from profiles)

### 3. Handles Missing Data
- Uses `LEFT JOIN` so tickets without profile data still appear
- Provides fallback attendee names when profile data is missing
- Maintains data integrity

## Updated Service

The `organizerService.ts` has been updated to:
- Use the new view instead of complex joins
- Handle missing profile data gracefully
- Provide better error handling
- Maintain the same interface for the UI

## Verification

After running the SQL, you can verify the view was created by running:

```sql
SELECT 
    'View created successfully' as status,
    schemaname,
    viewname
FROM pg_views 
WHERE viewname = 'tickets_with_attendee_info';
```

## Result

Once the view is created, the Tickets Sold screen will:
- ✅ Load without errors
- ✅ Display real ticket data from your database
- ✅ Show attendee names and emails when available
- ✅ Work with all filtering and search features
- ✅ Display proper event information

## Database Structure

The view creates this relationship:
```
tickets → events (via event_id)
tickets → profiles (via user_id)
```

This allows the Tickets Sold feature to display complete information about:
- Who bought the ticket (attendee)
- What event it's for
- When it was purchased
- Current status

**Next Step**: Run the SQL in your Supabase dashboard to fix the relationship error! 