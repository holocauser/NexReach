# 🍎 Apple Wallet Setup Complete!

Your Apple Wallet integration is now ready to use! Here's what's been set up:

## ✅ What's Ready

### 1. **Client-Side (React Native App)**
- ✅ Platform detection for iOS
- ✅ "Add to Apple Wallet" button in ticket details
- ✅ Wallet service with error handling
- ✅ Points to local development server

### 2. **Server-Side (Express.js)**
- ✅ Complete pass generation server
- ✅ Health check and test endpoints
- ✅ Certificate validation
- ✅ Proper .pkpass file generation

### 3. **Development Tools**
- ✅ Setup script to configure certificates
- ✅ WWDR certificate downloader
- ✅ Test scripts and documentation

## 🚀 Next Steps

### 1. **Get Your Apple Certificates**

You need three certificates from Apple Developer:

1. **Pass Type Certificate** (`certificate.pem`)
   - Go to [Apple Developer](https://developer.apple.com/account/resources/certificates/list)
   - Create a new Pass Type ID
   - Generate a certificate for this Pass Type ID
   - Download and convert to .pem format

2. **Private Key** (`privateKey.pem`)
   - The private key associated with your Pass Type certificate
   - Usually in .p12 format, convert to .pem

3. **WWDR Certificate** (`wwdr.pem`)
   - Download from: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer
   - Save as `certs/wwdr.pem`

### 2. **Set Up Your Server**

```bash
# Navigate to server directory
cd server-setup

# Run setup script
npm run setup

# Place your certificates in certs/ directory
# Update server.js with your configuration

# Start the server
npm start
```

### 3. **Test the Integration**

1. **Start the server:**
   ```bash
   cd server-setup
   npm start
   ```

2. **Test the server:**
   ```bash
   npm run test
   ```

3. **Test pass generation:**
   ```bash
   npm run test-pass
   ```

4. **Test in your app:**
   - Open a ticket in your React Native app
   - Tap "Add to Apple Wallet"
   - The pass should be added to Apple Wallet

## 📁 File Structure

```
project/
├── app/my-ticket/[id].tsx          # Ticket detail screen with wallet button
├── lib/walletService.ts            # Apple Wallet service
├── utils/passGenerator.ts          # Pass data generator
├── server-setup/                   # Apple Wallet server
│   ├── server.js                   # Main server file
│   ├── setup.js                    # Setup script
│   ├── download-wwdr.js           # WWDR downloader
│   ├── certs/                      # Certificate directory
│   │   ├── certificate.pem         # Your Pass Type certificate
│   │   ├── privateKey.pem          # Your private key
│   │   └── wwdr.pem               # Apple WWDR certificate
│   └── README.md                   # Server documentation
└── WALLET_INTEGRATION.md           # Complete integration guide
```

## 🔧 Configuration

Update these values in `server-setup/server.js`:

```javascript
const APPLE_CONFIG = {
  teamIdentifier: 'YOUR_ACTUAL_TEAM_ID',        // 10 characters
  passTypeIdentifier: 'pass.com.yourapp.event', // Your Pass Type ID
  organizationName: 'Your App Name',            // Display name in Wallet
  // ... certificate paths (usually don't need to change)
};
```

## 🧪 Testing

### Server Health Check
```bash
curl http://localhost:3000/health
```

### Test Pass Generation
```bash
curl http://localhost:3000/api/passes/test123.pkpass -o test123.pkpass
```

### iOS Simulator Testing
1. Open iOS Simulator
2. Drag the generated .pkpass file onto the simulator
3. It should open in Apple Wallet

## 🐛 Troubleshooting

### Common Issues

1. **"Missing certificate files"**
   - Ensure all three certificates are in `server-setup/certs/`
   - Check file names match exactly

2. **"Invalid certificate"**
   - Verify certificates are in .pem format
   - Check that certificates are not expired
   - Ensure Team ID and Pass Type ID match

3. **"Pass generation failed"**
   - Check server console logs
   - Verify certificate permissions
   - Ensure all required fields are provided

### Debug Commands

```bash
# Check certificate validity
openssl x509 -in server-setup/certs/certificate.pem -text -noout

# Check private key
openssl rsa -in server-setup/certs/privateKey.pem -check

# Test server
curl -v http://localhost:3000/api/passes/test.pkpass
```

## 🚀 Production Deployment

When ready for production:

1. **Deploy server** to your production environment
2. **Update app URL** in `lib/walletService.ts`:
   ```typescript
   const passUrl = `https://your-production-server.com/api/passes/${passData.ticketId}.pkpass`;
   ```
3. **Use HTTPS** (required by Apple)
4. **Secure certificates** on your server
5. **Add authentication** to protect the API

## 🎉 Success!

Once everything is working:

- ✅ Users can add tickets to Apple Wallet
- ✅ Passes show event details, date, time, location
- ✅ QR codes for easy scanning
- ✅ Professional Apple Wallet integration
- ✅ Platform-aware (iOS only for now)

Your Apple Wallet integration is now complete and ready to use! 🎫📱 