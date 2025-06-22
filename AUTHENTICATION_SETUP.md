# Authentication System Setup Guide

This guide will help you set up the complete authentication system for your Expo React Native app using Supabase.

## Features Implemented

- ✅ Email + Password authentication
- ✅ Google OAuth (Supabase OAuth)
- ✅ Apple Sign-In (iOS only)
- ✅ Session management and persistence
- ✅ User profile creation/update in `users` table
- ✅ Authentication guards for protected actions
- ✅ Modern, mobile-friendly UI
- ✅ Error handling and validation

## Prerequisites

1. **Supabase Project**: You need a Supabase project with authentication enabled
2. **Google OAuth**: Configure Google OAuth in your Supabase project
3. **Apple Sign-In**: Configure Apple Sign-In in your Supabase project (iOS only)

## Database Setup

Create a `users` table in your Supabase database:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Supabase Configuration

### 1. Authentication Settings

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Configure your site URL and redirect URLs
3. Enable the providers you want to use (Email, Google, Apple)

### 2. Google OAuth Setup

1. Go to **Authentication** > **Providers** > **Google**
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Add redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `exp://localhost:8081/--/auth/callback` (for development)

### 3. Apple Sign-In Setup (iOS only)

1. Go to **Authentication** > **Providers** > **Apple**
2. Enable Apple provider
3. Add your Apple Sign-In credentials
4. Configure the necessary settings in your Apple Developer account

## Environment Configuration

Update your `lib/supabase.ts` file with your actual Supabase credentials:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## App Configuration

### 1. Expo Configuration

Add the following to your `app.json`:

```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "ios": {
      "usesAppleSignIn": true
    }
  }
}
```

### 2. URL Scheme Setup

For OAuth to work properly, you need to configure URL schemes. Add this to your `app.json`:

```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

## Usage Examples

### 1. Basic Authentication Check

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return <AuthenticatedContent />;
}
```

### 2. Protected Actions

```typescript
import { useAuthGuard } from '@/utils/authUtils';

function EventComponent() {
  const { requireAuthForEventCreation } = useAuthGuard();

  const handleCreateEvent = () => {
    requireAuthForEventCreation(() => {
      // This will only execute if user is authenticated
      createEvent();
    });
  };

  return (
    <Button onPress={handleCreateEvent}>
      Create Event
    </Button>
  );
}
```

### 3. Sign Out

```typescript
import { useAuth } from '@/contexts/AuthContext';

function ProfileScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // User will be redirected to auth screen
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Button onPress={handleSignOut}>
      Sign Out
    </Button>
  );
}
```

## Authentication Flow

1. **App Launch**: AuthContext checks for existing session
2. **No Session**: User is redirected to `/auth` screen
3. **Login/Signup**: User can use email/password, Google, or Apple
4. **Success**: User profile is created/updated in `users` table
5. **Redirect**: User is redirected to intended action or main app
6. **Session Persistence**: Session is maintained across app restarts

## Protected Actions

The system automatically handles authentication requirements for:

- **Creating Events**: Users must be logged in to create events
- **Buying Tickets**: Users must be logged in to purchase tickets
- **Other Protected Features**: Use `useAuthGuard()` for any protected action

## Error Handling

The authentication system includes comprehensive error handling:

- Invalid email/password
- Network errors
- OAuth errors
- Apple Sign-In errors
- User-friendly error messages

## Testing

### Development Testing

1. Test email/password authentication
2. Test Google OAuth (requires proper redirect URLs)
3. Test Apple Sign-In on iOS simulator/device
4. Test session persistence
5. Test protected actions

### Production Testing

1. Verify all OAuth providers work in production
2. Test session management
3. Verify user profile creation
4. Test authentication guards

## Troubleshooting

### Common Issues

1. **Google OAuth not working**: Check redirect URLs in Supabase and Google Console
2. **Apple Sign-In not working**: Verify Apple Developer account configuration
3. **Session not persisting**: Check AsyncStorage permissions
4. **User profile not created**: Verify RLS policies in Supabase

### Debug Mode

Enable debug logging by adding this to your AuthContext:

```typescript
// Add to AuthContext for debugging
console.log('Auth state changed:', { event, session, user });
```

## Security Considerations

1. **Never expose service role keys** in client-side code
2. **Use Row Level Security** (RLS) policies in Supabase
3. **Validate user input** on both client and server
4. **Handle session expiration** gracefully
5. **Implement proper error handling** for all auth flows

## Next Steps

1. Customize the UI to match your app's design
2. Add additional user profile fields as needed
3. Implement email verification flow
4. Add password reset functionality
5. Implement role-based access control if needed

## Support

If you encounter issues:

1. Check the Supabase documentation
2. Verify your configuration settings
3. Check the browser console for errors
4. Review the authentication logs in Supabase dashboard 