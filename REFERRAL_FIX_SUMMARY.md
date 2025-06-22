# Referral Creation Fix Summary

## Problem
When creating a new referral for Dr. Sarah Johnson's card, the system was failing with the error:
```
ERROR Recipient card does not exist in database: 28003fce-c4af-46b4-8373-61220e5dbdf9
ERROR Referrer card does not exist in database: 28003fce-c4af-46b4-8373-61220e5dbdf9
```

## Root Cause
1. The `checkCardExistsInDatabase` function was using `.single()` which fails when multiple rows or no rows are returned
2. The database schema required `referrer_id` and `recipient_id` to be card IDs, but the application was trying to store user IDs in these fields
3. The validation logic was incorrectly checking if user IDs exist as cards in the database

## Changes Made

### 1. Fixed `checkCardExistsInDatabase` function (`store/cardStore.ts`)
- Changed from `.single()` to `.maybeSingle()` to avoid errors
- Added logic to treat user IDs as valid (when cardId === user.id)
- Improved error handling and logging

### 2. Updated database schema (`database/setup.sql`)
- Made `referrer_id` and `recipient_id` nullable in the referrals table
- Added a check constraint to ensure at least one is not null
- This allows storing NULL when the referrer/recipient is the current user

### 3. Updated referral store functions (`store/referralStore.ts`)
- Modified `addReferral` to skip validation for user IDs
- Updated database insert/update operations to use NULL for user references
- Modified `loadReferralsFromDatabase` to replace NULL values with user ID when loading
- Updated `syncReferralsToDatabase` and `updateReferral` to handle NULL values

## Database Migration Required
To apply the schema changes to an existing database, run the following SQL in the Supabase SQL Editor:

```sql
-- Drop existing foreign key constraints
ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;

ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS referrals_recipient_id_fkey;

-- Add constraints back but allow NULL values
ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_referrer_id_fkey 
FOREIGN KEY (referrer_id) REFERENCES public.cards(id) ON DELETE CASCADE;

ALTER TABLE public.referrals 
ADD CONSTRAINT referrals_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.cards(id) ON DELETE CASCADE;

-- Add check constraint
ALTER TABLE public.referrals 
DROP CONSTRAINT IF EXISTS check_referral_participants;

ALTER TABLE public.referrals 
ADD CONSTRAINT check_referral_participants 
CHECK ((referrer_id IS NOT NULL) OR (recipient_id IS NOT NULL));

-- Clean up any existing invalid data
UPDATE public.referrals 
SET referrer_id = NULL 
WHERE referrer_id NOT IN (SELECT id FROM public.cards);

UPDATE public.referrals 
SET recipient_id = NULL 
WHERE recipient_id NOT IN (SELECT id FROM public.cards);

DELETE FROM public.referrals 
WHERE referrer_id IS NULL AND recipient_id IS NULL;
```

## Testing
After applying these changes:
1. The referral creation should work for Dr. Sarah Johnson's card
2. User IDs will be stored as NULL in the database but converted back to user IDs in the application
3. The validation will properly distinguish between user IDs and card IDs
4. The error messages should no longer appear

## Files Modified
- `store/cardStore.ts` - Fixed checkCardExistsInDatabase function
- `store/referralStore.ts` - Updated all referral operations to handle NULL values
- `database/setup.sql` - Updated schema for new installations
- `database/migration_fix_referrals.sql` - Migration script for existing databases 