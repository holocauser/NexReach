# Wallet Integration Guide

This document outlines the platform-aware wallet integration for adding event tickets to Apple Wallet (iOS) and Google Wallet (Android).

## Overview

The wallet integration provides a seamless way for users to add their event tickets to their device's native wallet app, making it easy to access tickets offline and receive notifications.

## Implementation Status

### ✅ Completed
- ✅ Platform detection using `Platform.OS`
- ✅ Platform-aware UI (button text changes based on platform)
- ✅ Service layer architecture (`lib/walletService.ts`)
- ✅ Type-safe interfaces (`WalletPassData`)
- ✅ Error handling and user feedback
- ✅ Apple Wallet library integration (`react-native-passkit-wallet`)
- ✅ Pass generator utilities (`utils/passGenerator.ts`)
- ✅ Server-side pass generation example (`server/passGenerator.js`)

### 🔄 Next Steps for Apple Wallet
1. **Set up server endpoint** to generate .pkpass files
2. **Configure your certificates** in the server
3. **Update the pass URL** in `lib/walletService.ts`
4. **Test the integration** on iOS device

### Files Modified
- `app/my-ticket/[id].tsx` - Ticket detail screen with wallet button
- `lib/walletService.ts` - Platform-aware wallet service
- `utils/passGenerator.ts` - Client-side pass data generator
- `server/passGenerator.js` - Server-side pass generation example
- `WALLET_INTEGRATION.md` - This documentation

## Apple Wallet Implementation

### Current Setup
The Apple Wallet integration is ready to use! You have:

1. **Library installed**: `react-native-passkit-wallet`
2. **Certificates created**: ✅ (You mentioned you have these)
3. **Client-side code**: Ready to call your server
4. **Server example**: Provided in `server/passGenerator.js`

### What You Need to Do

#### 1. Set Up Your Server
Create an endpoint that generates .pkpass files:

```javascript
// Install server dependencies
npm install node-passkit express

// Use the example in server/passGenerator.js
```

#### 2. Configure Your Certificates
Update `server/passGenerator.js` with your details:

```javascript
this.teamIdentifier = 'YOUR_ACTUAL_TEAM_ID';
this.passTypeIdentifier = 'pass.com.yourapp.event';
this.certPath = 'path/to/your/certificate.pem';
this.keyPath = 'path/to/your/privateKey.pem';
this.wwdrPath = 'path/to/your/wwdr.pem';
```

#### 3. Update the Pass URL
In `lib/walletService.ts`, update the URL to point to your server:

```typescript
const passUrl = `https://your-actual-server.com/api/passes/${passData.ticketId}.pkpass`;
```

#### 4. Test the Integration
1. Run your server
2. Open a ticket in the app
3. Tap "Add to Apple Wallet"
4. The pass should be added to the user's Apple Wallet

### Server Endpoint Structure
Your server should have an endpoint like:
```
GET /api/passes/{ticketId}.pkpass
```

This endpoint should:
1. Fetch ticket data from your database
2. Generate a .pkpass file using your certificates
3. Return the file with proper headers:
   ```
   Content-Type: application/vnd.apple.pkpass
   Content-Disposition: attachment; filename="{ticketId}.pkpass"
   ```

### Pass Data Structure
The pass will include:
- **Event name** as primary field
- **Date and time** as secondary fields
- **Location and ticket type** as auxiliary fields
- **Price** in header
- **QR code** with ticket ID
- **Organizer name** and description

## Usage

### In Ticket Detail Screen
The wallet button is already implemented and will:
1. Detect iOS platform
2. Show "Add to Apple Wallet" button
3. Call your server endpoint
4. Add the pass to Apple Wallet
5. Show success/error feedback

### Button Implementation
```typescript
<TouchableOpacity style={styles.walletButton} onPress={handleAddToWallet}>
  <Ionicons name="wallet" size={20} color={Colors.white} style={{ marginRight: 8 }} />
  <Text style={styles.walletButtonText}>
    Add to {walletService.getWalletName()}
  </Text>
</TouchableOpacity>
```

## Testing

### Debug Information
The implementation includes console logging:
```typescript
console.log('Adding to Apple Wallet:', passData);
console.log('Successfully added pass to Apple Wallet');
```

### Error Handling
- Checks if PassKit is available
- Handles server errors gracefully
- Shows user-friendly error messages
- Provides setup instructions if server isn't ready

## Troubleshooting

### Common Issues
1. **"Pass URL method failed"**: Your server endpoint isn't set up yet
2. **"Apple Wallet Not Available"**: User doesn't have Apple Wallet installed
3. **Certificate errors**: Check your certificate paths and validity
4. **Network errors**: Ensure your server is accessible

### Debug Steps
1. Check console logs for detailed error messages
2. Verify your server endpoint is working
3. Test with a simple .pkpass file first
4. Ensure certificates are valid and properly configured

## Security Considerations

1. **Certificate Management**: Store certificates securely on your server
2. **Data Validation**: Validate all pass data before generation
3. **User Consent**: Users explicitly tap to add to wallet
4. **Privacy**: Handle user data according to privacy policies
5. **HTTPS**: Always use HTTPS for pass downloads

## Next Steps

Once Apple Wallet is working, you can:
1. Add Google Wallet support for Android
2. Implement pass updates and notifications
3. Add analytics to track wallet usage
4. Create custom pass designs with images
5. Add location-based notifications 