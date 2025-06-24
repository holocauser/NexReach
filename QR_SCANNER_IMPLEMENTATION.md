# QR Code Scanner Implementation

## Overview

This implementation provides a lightweight QR code scanner for ticket validation, similar to Eventbrite's Scan & Go feature. The scanner integrates seamlessly with your existing Supabase backend and ticket validation system.

## Features

✅ **Lightweight Implementation** - Uses only `expo-barcode-scanner`  
✅ **Camera Permission Handling** - Automatic permission requests  
✅ **QR Code Validation** - Supports both structured JSON and simple ticket IDs  
✅ **Manual Entry Fallback** - Enter ticket IDs manually if QR scanning fails  
✅ **Real-time Validation** - Instant feedback on ticket status  
✅ **Scan History** - Track recent validations  
✅ **Organizer Permissions** - Only event organizers can validate tickets  

## Components

### 1. QRCodeScanner Component (`components/QRCodeScanner.tsx`)

A reusable QR code scanner component with:
- Camera permission handling
- Visual scan area with corner indicators
- Permission denied state
- Scan success feedback

### 2. Updated Scan Tickets Screen (`app/organizer/scan-tickets.tsx`)

Enhanced ticket validation screen with:
- QR code scanning button
- Manual ticket ID entry
- Real-time validation results
- Scan history tracking

### 3. Database Schema (`database/migration_lightweight_tickets.sql`)

Minimal tickets table structure:
```sql
CREATE TABLE tickets (
  id            uuid PRIMARY KEY,
  event_id      uuid REFERENCES events(id),
  user_id       uuid REFERENCES users(id),
  ticket_type   text DEFAULT 'general',
  status        text DEFAULT 'issued',
  issued_at     timestamptz DEFAULT now(),
  validated_at  timestamptz,
  validated_by  uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);
```

## Usage

### For Organizers

1. **Navigate to Scan Tickets**
   - Go to Organizer Dashboard → Scan Tickets

2. **Scan QR Code**
   - Tap "Scan QR Code" button
   - Grant camera permission when prompted
   - Position QR code within the scan frame
   - View validation results

3. **Manual Entry (Fallback)**
   - Enter ticket ID manually in the input field
   - Tap "Validate Ticket" button

4. **View History**
   - Tap the clock icon in the header
   - Review recent validations

### QR Code Format

The scanner supports two formats:

#### 1. Structured JSON (Recommended)
```json
{
  "ticketId": "ticket-123456789",
  "eventId": "event-987654321",
  "eventTitle": "Tech Conference 2024",
  "ticketType": "vip",
  "userId": "user-123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. Simple Ticket ID
```
ticket-123456789
```

## Testing

### Generate Test QR Codes

Use the `QRCodeGenerator` utility to create test QR codes:

```typescript
import { QRCodeGenerator } from '@/utils/qrCodeGenerator';

// Generate a test QR code
const qrData = QRCodeGenerator.createTestQRCode('My Test Event', 'vip');
console.log('QR Code Data:', qrData);

// Generate multiple test scenarios
const scenarios = QRCodeGenerator.generateTestScenarios();
scenarios.forEach(scenario => {
  console.log(`${scenario.name}:`, scenario.qrData);
});
```

### Testing Steps

1. **Generate QR Code**
   - Use an online QR code generator (e.g., qr-code-generator.com)
   - Copy the output from `QRCodeGenerator.createTestQRCode()`
   - Generate the QR code image

2. **Test Scanning**
   - Display QR code on another device or print it
   - Open your app and navigate to Scan Tickets
   - Scan the QR code
   - Verify validation results

3. **Test Manual Entry**
   - Copy the ticket ID from the QR code data
   - Enter it manually in the input field
   - Verify validation results

## Database Setup

Run the lightweight migration to ensure proper table structure:

```sql
-- Execute the migration
\i database/migration_lightweight_tickets.sql
```

## Permissions

### Camera Permissions

The app automatically requests camera permissions when the scanner is opened. Users can:

- **Grant Permission**: Scanner works normally
- **Deny Permission**: Shows helpful message with instructions to enable in settings

### Row Level Security (RLS)

The tickets table has RLS policies ensuring:

- **Users**: Can only view/update their own tickets
- **Organizers**: Can view and validate tickets for their events only
- **Validation**: Only event organizers can mark tickets as validated

## Error Handling

The scanner handles various error scenarios:

- **Invalid QR Code**: Shows "Ticket not found" message
- **Already Validated**: Shows "Ticket already checked in" message
- **Wrong Event**: Shows "Ticket is for a different event" message
- **Permission Denied**: Shows camera access instructions
- **Network Errors**: Shows "Failed to validate ticket" message

## Performance Optimizations

- **Lightweight Dependencies**: Only uses `expo-barcode-scanner`
- **Efficient Scanning**: Stops scanning after successful read
- **Indexed Queries**: Database indexes for fast ticket lookups
- **Minimal UI**: Clean, focused interface for quick scanning

## Security Features

- **Organizer Validation**: Only event organizers can validate tickets
- **RLS Policies**: Database-level security
- **Input Sanitization**: Validates ticket IDs before processing
- **Audit Trail**: Tracks who validated each ticket and when

## Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check device camera permissions
   - Restart the app
   - Test on physical device (not simulator)

2. **QR Code Not Scanning**
   - Ensure QR code is well-lit
   - Hold device steady
   - Try manual entry as fallback

3. **Validation Fails**
   - Check ticket exists in database
   - Verify organizer permissions
   - Check ticket status

### Debug Mode

Enable debug logging by adding to your environment:

```typescript
// In your app configuration
console.log('QR Scanner Debug:', {
  hasPermission,
  scanned,
  qrData
});
```

## Future Enhancements

Potential improvements for future versions:

- **Offline Mode**: Cache ticket data for offline validation
- **Batch Scanning**: Validate multiple tickets quickly
- **Sound Feedback**: Audio confirmation for successful scans
- **Vibration**: Haptic feedback for validation results
- **Export Data**: Export validation history to CSV
- **Real-time Sync**: Live updates of validation status

## Dependencies

- `expo-barcode-scanner`: QR code scanning
- `@expo/vector-icons`: UI icons
- `@supabase/supabase-js`: Database operations
- `date-fns`: Date formatting

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the database migration logs
3. Test with the provided QR code generator
4. Verify camera permissions on your device

---

**Note**: This implementation is designed to be lightweight and efficient, focusing on core functionality while maintaining security and performance standards. 