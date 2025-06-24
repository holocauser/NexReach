# Email Column Error Fix

## Problem
The error `ERROR: 42703: column p.email does not exist` occurs because the `tickets_with_attendee_info` view is trying to access `p.email` from the `profiles` table, but the `profiles` table does not have an `email` column.

## Root Cause
- The `profiles` table only contains: `id`, `full_name`, `avatar_url`, `company`, `title`, `roles`, `is_setup`, `created_at`
- The `email` field is stored in the `auth.users` table, not in the `profiles` table
- The view was incorrectly trying to join only with `profiles` table

## Solution
The fix involves updating the `tickets_with_attendee_info` view to:
1. Join with `auth.users` table to get the email
2. Use `u.email` instead of `p.email`
3. Keep the existing join with `profiles` table for the `full_name`

## Database Schema
```sql
-- profiles table structure
CREATE TABLE profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  avatar_url text,
  company text,
  title text,
  roles text[],
  is_setup boolean,
  created_at timestamp with time zone
);

-- auth.users table structure (Supabase built-in)
-- Contains: id, email, encrypted_password, email_confirmed_at, etc.
```

## Fixed View
```sql
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
    u.email as attendee_email  -- Fixed: now from auth.users
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;  -- Added: join with auth.users
```

## How to Apply the Fix

### Step 1: Run the SQL Fix
Connect to your Supabase database and run:
```sql
\i database/fix_email_column_error.sql
```

### Step 2: Verify the Fix
The script will:
1. Drop the existing broken view
2. Recreate the view with proper joins
3. Grant necessary permissions
4. Test the view to ensure it works

### Step 3: Test the Application
1. Navigate to the Tickets Sold screen in your app
2. Verify that the screen loads without errors
3. Check that attendee emails are displayed correctly

## Files Modified
- `database/fix_email_column_error.sql` - New fix script
- `database/fix_tickets_profiles_relationship.sql` - Updated view definition
- `EMAIL_COLUMN_FIX.md` - This documentation

## Technical Details
- **Error Code**: 42703 (column does not exist)
- **Affected Table**: `tickets_with_attendee_info` view
- **Root Cause**: Missing join with `auth.users` table
- **Solution**: Added LEFT JOIN with `auth.users` table
- **Impact**: Tickets Sold screen will now display attendee emails correctly

## Verification
After running the fix, you can verify it worked by:
```sql
-- Check if the view exists
SELECT * FROM pg_views WHERE viewname = 'tickets_with_attendee_info';

-- Test the view
SELECT * FROM public.tickets_with_attendee_info LIMIT 5;
```

The error should be resolved and the Tickets Sold screen should work properly. 