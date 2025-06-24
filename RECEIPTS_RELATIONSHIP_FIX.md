# Receipts Relationship Fix

## Issue
The Receipts & Invoices feature was showing errors because there was no direct foreign key relationship between the `tickets` and `profiles` tables. The error message was:

```
ERROR: Could not find a relationship between 'tickets' and 'profiles' in the schema cache
```

## Root Cause
The problem occurred because:
1. `tickets.user_id` references `auth.users(id)`, not `profiles(id)`
2. `profiles.id` references `auth.users(id)`, so there's no direct foreign key relationship between `tickets` and `profiles`
3. The Supabase query was trying to use `profiles!inner(full_name)` and `users!inner(email)` which requires foreign key relationships

## Solution

### 1. Created Database View
Created a new view `tickets_with_user_info` that properly joins all the necessary tables:

```sql
CREATE OR REPLACE VIEW public.tickets_with_user_info AS
SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.ticket_type,
    t.status,
    t.amount,
    t.currency,
    t.stripe_payment_intent_id,
    t.stripe_session_id,
    t.created_at,
    e.title as event_title,
    e.location as event_location,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.image as event_image,
    e.user_id as organizer_id,
    p.full_name as attendee_name,
    u.email as attendee_email
FROM public.tickets t
JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.profiles p ON t.user_id = p.id
LEFT JOIN auth.users u ON t.user_id = u.id;
```

### 2. Updated OrganizerService
Modified the `getReceipts` method in `lib/organizerService.ts` to use the new view instead of trying to join tables directly:

```typescript
// Use the tickets_with_user_info view to get all ticket data with user information
const { data: tickets, error: ticketsError } = await supabase
  .from('tickets_with_user_info')
  .select(`
    id,
    event_id,
    user_id,
    ticket_type,
    status,
    amount,
    currency,
    stripe_payment_intent_id,
    stripe_session_id,
    created_at,
    event_title,
    attendee_email
  `)
  .eq('organizer_id', organizerId)
  .order('created_at', { ascending: false });
```

### 3. Updated Database Types
Added the new view to the database types in `types/database.ts`:

```typescript
Views: {
  tickets_with_user_info: {
    Row: {
      id: string;
      event_id: string;
      user_id: string;
      ticket_type: string;
      status: string;
      amount: number | null;
      currency: string | null;
      stripe_payment_intent_id: string | null;
      stripe_session_id: string | null;
      created_at: string;
      event_title: string;
      event_location: string | null;
      event_start_time: string;
      event_end_time: string | null;
      event_image: string | null;
      organizer_id: string;
      attendee_name: string | null;
      attendee_email: string | null;
    };
  };
}
```

## How to Apply the Fix

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the SQL from `database/fix_receipts_relationship.sql`**
4. **Click "Run" to execute the SQL**

### Option 2: Use the Provided File

Run the SQL file directly:
```bash
# If you have Supabase CLI installed
npx supabase db push --file database/fix_receipts_relationship.sql
```

## What This Fix Does

### 1. Creates a Database View
The `tickets_with_user_info` view properly joins:
- **tickets** table (ticket information)
- **events** table (event information)
- **profiles** table (attendee profile information)
- **auth.users** table (attendee email addresses)

### 2. Provides Proper Data Access
The view includes:
- All ticket fields (id, event_id, user_id, ticket_type, status, amount, currency, etc.)
- Event information (title, location, start_time, end_time, image)
- Organizer information (organizer_id from events.user_id)
- Attendee information (full_name from profiles, email from auth.users)

### 3. Enables Efficient Queries
- Organizers can query tickets for their events using `organizer_id`
- All necessary information is available in a single query
- No need for complex joins or multiple queries

## Benefits

1. **Fixes the Relationship Error**: Eliminates the foreign key relationship error
2. **Improves Performance**: Single query instead of multiple queries
3. **Simplifies Code**: Cleaner, more maintainable code in the service layer
4. **Maintains Security**: RLS policies still apply to the underlying tables
5. **Future-Proof**: Easy to extend with additional fields if needed

## Testing

After applying the fix:
1. Navigate to the Receipts & Invoices screen
2. Verify that receipts load without errors
3. Check that receipt statistics display correctly
4. Test filtering and search functionality
5. Verify that receipt actions (download, share, resend) work properly

## Files Modified

- `database/fix_receipts_relationship.sql` - New migration file
- `lib/organizerService.ts` - Updated getReceipts method
- `types/database.ts` - Added view type definition
- `RECEIPTS_RELATIONSHIP_FIX.md` - This documentation file 