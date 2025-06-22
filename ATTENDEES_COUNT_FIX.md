# Attendees Count Fix

## Problem
The attending count was not updating when tickets were purchased because:
1. The attendees count was only stored in local state, not in the database
2. When tickets were purchased, only the local state was updated
3. The database events table didn't have an `attendees` column

## Solution

### 1. Database Migration
Created `database/migration_add_attendees_column.sql` to:
- Add `attendees` column to events table (default 0)
- Add `max_attendees` column to events table (nullable)
- Create `increment_event_attendees()` function to safely increment attendees count
- Create `get_event_attendees_count()` function to get current attendees count

### 2. Updated Event Store
Modified `store/eventStore.ts`:
- Made `updateEventAfterTicketPurchase` async
- Added database update to increment attendees count when tickets are purchased
- Updated `loadEventsFromDatabase` to load attendees count from database
- Updated `addEvent` to save attendees count to database

### 3. Updated Events Screen
Modified `app/(tabs)/events.tsx`:
- Made `handlePurchaseTicket` and `handlePaymentSuccess` async
- Added proper error handling for ticket purchase operations

### 4. Updated Payment Modal
Modified `components/PaymentModal.tsx`:
- Fixed ticket status to be properly set to 'paid' after successful payment
- Used `updateTicketStatus` function to ensure correct status

## How to Apply the Fix

### Step 1: Run the Database Migration
```bash
# Connect to your Supabase database and run:
\i database/migration_add_attendees_column.sql
```

Or run the verification script:
```bash
\i database/run_migration_add_attendees.sql
```

### Step 2: Test the Fix
1. Create or load events in the app
2. Purchase tickets (both free and paid)
3. Verify that the attendees count increases
4. Refresh the app and verify the count persists

## Technical Details

### Database Functions
- `increment_event_attendees(event_id)` - Safely increments attendees count
- `get_event_attendees_count(event_id)` - Returns current attendees count

### Error Handling
- Local state is updated immediately for responsive UI
- Database update happens asynchronously
- If database update fails, local state is preserved for better UX
- Proper error messages are shown to users

### Data Flow
1. User purchases ticket
2. Local state updates immediately (attendees +1, ticketStatus = 'purchased')
3. Database attendees count is incremented
4. Ticket status is updated to 'paid' in database
5. UI reflects the changes immediately

## Files Modified
- `database/migration_add_attendees_column.sql` (new)
- `database/run_migration_add_attendees.sql` (new)
- `store/eventStore.ts`
- `app/(tabs)/events.tsx`
- `components/PaymentModal.tsx`
- `ATTENDEES_COUNT_FIX.md` (this file) 