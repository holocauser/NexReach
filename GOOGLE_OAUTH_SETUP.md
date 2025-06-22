# Google OAuth Setup Guide

This guide will help you resolve the "Google sign-in was cancelled" error and properly configure Google OAuth for your Expo React Native app.

## 🔧 **Quick Fix for Localhost Redirect Issue**

The issue you're experiencing (being redirected to localhost after Google login) is caused by incorrect redirect URI configuration. Here's how to fix it:

### **Step 1: Check Required Redirect URI**

1. Open your app and navigate to `/test-auth`
2. Tap "Generate Redirect URI" 
3. Note the required URI: `https://fcimhehnuxycljnewqdw.supabase.co/auth/v1/callback`

### **Step 2: Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add this authorized redirect URI:
   ```
   https://fcimhehnuxycljnewqdw.supabase.co/auth/v1/callback
   ```

### **Step 3: Update Supabase Configuration**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **URL Configuration**
3. Add these redirect URLs:
   ```
   https://fcimhehnuxycljnewqdw.supabase.co/auth/v1/callback
   scancard123://auth/callback
   exp://localhost:8081/--/auth/callback
   exp://localhost:8082/--/auth/callback
   exp://localhost:8083/--/auth/callback
   ```

## 🚀 **Complete Setup Process**

### **1. Google Cloud Console Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI:
     ```
     https://fcimhehnuxycljnewqdw.supabase.co/auth/v1/callback
     ```

### **2. Supabase Configuration**

1. **Go to your Supabase dashboard**
2. **Navigate to Authentication > Providers**
3. **Enable Google provider**
4. **Add your Google OAuth credentials**:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
5. **Save the configuration**

### **3. App Configuration**

The app is already configured with the correct scheme (`scancard123`). Your `app.json` has:

```json
{
  "expo": {
    "scheme": "scancard123"
  }
}
```

## 🧪 **Testing Google OAuth**

### **Development Testing**

1. **Use Expo Go or Development Build**:
   ```bash
   npx expo start --clear
   ```

2. **Test on Physical Device**: Google OAuth works better on physical devices than simulators

3. **Check Network**: Ensure you have a stable internet connection

4. **Use Debug Screen**: Navigate to `/test-auth` to test the redirect URI generation

## 🔍 **Troubleshooting**

### **Issue 1: Still getting localhost redirect**

**Causes:**
- Redirect URLs don't match between Supabase and Google Console
- Cached redirect URI in the app

**Solutions:**
1. **Clear app cache** and restart the development server
2. **Verify redirect URLs** match exactly in both Supabase and Google Console
3. **Check the generated redirect URI** using the debug screen

### **Issue 2: "Google sign-in was cancelled"**

**Causes:**
- Incorrect redirect URLs
- Missing or incorrect OAuth credentials
- Network issues
- Testing on simulator

**Solutions:**
1. **Verify redirect URLs** in Google Cloud Console
2. **Check Supabase configuration**
3. **Test on physical device** instead of simulator
4. **Clear app cache** and try again

### **Issue 3: "Failed to extract authentication tokens"**

**Causes:**
- Malformed redirect URL
- OAuth flow interruption

**Solutions:**
1. **Check the redirect URL format** in Supabase
2. **Ensure proper URL scheme** configuration
3. **Test with a fresh app install**

## 📱 **Testing Checklist**

- [ ] Google OAuth enabled in Supabase
- [ ] Correct redirect URLs in Google Cloud Console
- [ ] Valid OAuth credentials in Supabase
- [ ] Testing on physical device
- [ ] Stable internet connection
- [ ] App scheme properly configured
- [ ] No network restrictions or firewalls
- [ ] Generated redirect URI matches Supabase config

## 🎯 **Expected Behavior**

After successful configuration:

1. **Tap "Continue with Google"** in your app
2. **Google OAuth popup opens** (or redirects to Google)
3. **Select your Google account** and grant permissions
4. **Redirects back to your app** (not localhost)
5. **Successfully logged in** with Google account

## 🆘 **Support**

If you continue to have issues:

1. **Check Supabase logs** in the dashboard
2. **Verify Google Cloud Console** configuration
3. **Test with the debug screen** (`/test-auth`)
4. **Check Expo documentation** for OAuth setup
5. **Ensure all dependencies** are properly installed

## 🔄 **Quick Test**

To quickly test if the issue is with Google OAuth specifically:

1. Try email/password authentication first
2. If that works, the issue is specifically with Google OAuth configuration
3. Use the debug screen to verify redirect URI generation
4. Check that the generated URI matches your Supabase configuration 