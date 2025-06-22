# Profile Setup Feature

## Overview
The Profile Setup feature ensures that users complete their profile information when they first visit the Events tab. This provides a personalized experience and allows the app to show relevant tools based on the user's selected roles.

## Features

### Profile Setup Modal
- **Full-screen modal** that appears on first visit to Events tab
- **Profile picture upload** with image picker integration
- **Basic information fields**:
  - Full Name (required)
  - Company (optional)
  - Job Title (optional)
- **Role selection** with checkboxes:
  - Attendee: "I attend events and network"
  - Organizer: "I create and manage events"
- **Validation** ensures name and at least one role are selected

### Database Schema Updates
The `profiles` table has been extended with new fields:
- `company` (TEXT, nullable)
- `title` (TEXT, nullable) 
- `roles` (TEXT[], default empty array)
- `is_setup` (BOOLEAN, default FALSE)

### Storage Setup
- **Avatar storage bucket** for profile pictures
- **Storage policies** for secure file uploads
- **Public read access** for avatar images

## Implementation Details

### Components
- `ProfileSetupModal.tsx`: Main profile setup interface
- Updated `EventsScreen.tsx`: Profile setup check and modal display
- Updated `userStore.ts`: Profile setup checking and syncing

### User Flow
1. User opens Events tab for the first time
2. App checks if profile exists and is setup in Supabase
3. If not setup, ProfileSetupModal appears
4. User fills out required information and selects roles
5. Profile is saved to Supabase with `is_setup: true`
6. User returns to Events tab with personalized experience

### Role-Based Features
Based on selected roles, the app can show:
- **Attendee tools**: RSVP, view events, network
- **Organizer tools**: Create events, manage events, analytics
- **Both**: Full feature access

## Database Migration
Run the migration to add new profile fields:
```sql
-- Run in Supabase SQL editor
-- See: database/migration_add_profile_fields.sql
```

## Storage Setup
Set up avatar storage bucket:
```sql
-- Run in Supabase SQL editor  
-- See: database/setup_avatar_storage.sql
```

## Usage
The feature is automatically triggered when:
- User is authenticated
- User visits Events tab for the first time
- User's profile is not marked as setup in Supabase

## Future Enhancements
- Profile editing from settings
- Role-based UI customization
- Profile completion percentage
- Social profile sharing 