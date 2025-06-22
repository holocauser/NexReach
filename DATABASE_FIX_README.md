# Database Fix for Events Table Image Column Issue

## Problem
The error `"Could not find the 'image' column of 'events' in the schema cache"` occurs because:

1. The `events` table was created without the `image` column in the initial migration
2. A separate migration was created to add the `image` column, but it hasn't been applied to the database
3. The TypeScript database types were missing the `events` table definition entirely

## Solution

### Step 1: Update Database Types (Already Done)
The `types/database.ts` file has been updated to include:
- `events` table with `image` column
- `cards` table (was missing)
- `referrals` table (was missing)

### Step 2: Apply Database Migration
You need to run the migration to add the `image` column to the `events` table in your Supabase database.

#### Option A: Use the Complete Setup Script (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/complete_setup.sql`
4. Run the script

This will:
- Drop and recreate all tables with the correct schema
- Ensure the `image` column exists in the `events` table
- Set up all necessary indexes and policies

#### Option B: Run Just the Migration
If you want to preserve existing data, run only the migration:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/run_migration_add_event_image.sql`
4. Run the script

This will:
- Check if the `image` column exists
- Add it if it doesn't exist
- Update existing events with a default image

### Step 3: Troubleshoot Events Not Showing

If events are not showing up in the database after applying the migration, follow these steps:

#### Step 3a: Run Diagnostic Script
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/debug_events.sql`
4. Run the script and check the output

This will show you:
- If the events table exists with the correct structure
- How many events are in the table
- How many users exist
- RLS policies status
- Any existing events

#### Step 3b: Test Database Functionality
1. Copy and paste the contents of `database/test_events_sync.sql`
2. Run the script to test if the table is working correctly

#### Step 3c: Manually Insert Mock Events
If the table is working but empty, manually insert the mock events:

1. First, find your user ID by running:
   ```sql
   SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```

2. Copy the contents of `database/insert_mock_events.sql`
3. Replace `'YOUR_USER_ID_HERE'` with your actual user ID
4. Run the script

#### Step 3d: Check App Logs
In your app, check the console logs for:
- `=== SYNC MOCK EVENTS TO DATABASE START ===`
- `=== LOAD EVENTS FROM DATABASE START ===`
- Any error messages related to events

### Step 4: Verify the Fix
After applying the fix, the app should now be able to:
- Save events with images to the database
- Load events from the database
- Sync mock events without errors

## Files Modified
- `types/database.ts` - Added missing table definitions
- `database/complete_setup.sql` - Complete database setup with image column
- `database/run_migration_add_event_image.sql` - Safe migration script
- `database/debug_events.sql` - Diagnostic script for troubleshooting
- `database/test_events_sync.sql` - Test script for database functionality
- `database/insert_mock_events.sql` - Manual insert script for mock events

## Testing
After applying the fix:
1. Restart your development server
2. Try creating a new event with an image
3. Check that events load properly from the database
4. Verify that mock events sync without errors

## Common Issues and Solutions

### Issue: Events table is empty after migration
**Solution**: Run the diagnostic script first, then manually insert mock events if needed.

### Issue: RLS policies blocking access
**Solution**: Ensure the events table has the correct RLS policies applied.

### Issue: User authentication problems
**Solution**: Check that you're logged in and the user exists in auth.users table.

### Issue: Image column still missing
**Solution**: Run the complete setup script to recreate the table with the image column.

## Notes
- The `image` column is optional (nullable) in the database
- Default images are provided for existing events
- All database types are now properly defined for TypeScript
- The app will fall back to mock events if database access fails 