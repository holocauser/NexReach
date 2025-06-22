# Database Setup Guide

This guide will help you set up the Supabase database and storage for the ScanCard app.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase project URL and anon key
3. Access to your Supabase dashboard

## Step 1: Database Tables Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/setup.sql` into the editor
4. Run the SQL script

This will create the following tables:
- `profiles` - User profile information
- `files` - File metadata for business card attachments
- `voice_notes` - Voice note metadata for business card recordings

## Step 2: Storage Buckets Setup

You need to create two storage buckets for file uploads:

### Create Files Bucket

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name: `files`
4. Public bucket: ✅ (checked)
5. File size limit: 50MB (or your preferred limit)
6. Allowed MIME types: Leave empty for all types, or specify:
   ```
   application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,image/jpeg,image/png,image/gif,video/mp4,video/quicktime
   ```

### Create Voice Notes Bucket

1. Click "Create a new bucket" again
2. Name: `voice-notes`
3. Public bucket: ✅ (checked)
4. File size limit: 25MB (or your preferred limit)
5. Allowed MIME types: `audio/m4a,audio/mpeg,audio/wav`

## Step 3: Storage Policies

The SQL script includes Row Level Security (RLS) policies, but you also need storage policies:

### Files Bucket Policies

Go to Storage > Policies for the `files` bucket and add these policies for **SELECT, INSERT, UPDATE, and DELETE** operations.

- **Target role**: `authenticated`
- **Policy definition**: 
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This ensures that authenticated users can only access files within their own user-specific folder.

### Voice Notes Bucket Policies

Go to Storage > Policies for the `voice-notes` bucket and add the same policies for **SELECT, INSERT, UPDATE, and DELETE** operations.

- **Target role**: `authenticated`
- **Policy definition**: 
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

## Step 4: Environment Variables

Update your `.env` file or environment variables with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Verify Setup

1. Check that all tables were created in the Table Editor
2. Verify that both storage buckets exist
3. Test file upload functionality in your app

## Database Schema Overview

### Profiles Table
- `id` (uuid, primary key) - References auth.users
- `full_name` (text) - User's full name
- `avatar_url` (text) - Profile picture URL
- `created_at` (timestamp) - Account creation date

### Files Table
- `id` (uuid, primary key) - Unique file identifier
- `card_id` (text) - Associated business card ID
- `user_id` (uuid) - Owner user ID
- `name` (text) - File name
- `type` (text) - File extension/type
- `url` (text) - Public storage URL
- `size` (bigint) - File size in bytes
- `mime_type` (text) - MIME type
- `created_at` (timestamp) - Upload date
- `updated_at` (timestamp) - Last modification date

### Voice Notes Table
- `id` (uuid, primary key) - Unique voice note identifier
- `card_id` (text) - Associated business card ID
- `user_id` (uuid) - Owner user ID
- `name` (text) - Voice note name (optional)
- `url` (text) - Public storage URL
- `duration` (integer) - Duration in seconds
- `size` (bigint) - File size in bytes
- `created_at` (timestamp) - Recording date
- `updated_at` (timestamp) - Last modification date

## Security Features

- **Row Level Security (RLS)**: All tables have RLS enabled
- **User Isolation**: Users can only access their own data
- **Storage Policies**: Files are protected by user-based policies
- **Automatic Timestamps**: Created and updated timestamps are managed automatically
- **Cascade Protection**: Proper foreign key relationships

## Troubleshooting

### Common Issues

1. **"Policy violation" errors**: Make sure storage policies are correctly set
2. **"Bucket not found" errors**: Verify bucket names match exactly (`files` and `voice-notes`)
3. **"Permission denied" errors**: Check that RLS policies are enabled and correct
4. **Upload failures**: Verify file size limits and MIME type restrictions

### Testing Queries

You can test the setup with these queries in the SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'files', 'voice_notes');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Next Steps

After completing this setup:

1. Test file upload functionality in your app
2. Test voice note recording and upload
3. Verify that files are properly associated with business cards
4. Test file deletion and cleanup

The database is now ready to handle file and voice note storage for your ScanCard app! 