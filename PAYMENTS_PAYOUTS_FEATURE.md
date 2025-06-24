# Payments & Payouts Feature

## Overview
The Payments & Payouts feature provides event organizers with comprehensive payment management through Stripe Connect integration. This feature enables organizers to receive payouts from their events, track payment history, and export financial data.

## Features Implemented

### ✅ Stripe Connect Integration
- **Account Connection** - Seamless onboarding to Stripe Connect Express
- **Status Tracking** - Monitor account connection status (disconnected, pending, active, restricted)
- **Automatic Detection** - Check for existing connected accounts
- **Onboarding Flow** - Guided setup process for new users

### ✅ Payout Management
- **Real-time Data** - Fetch live payout data from Stripe API
- **Payout Summary** - Total payouts, fees, net earnings, and pending amounts
- **Status Filtering** - Filter by payout status (paid, pending, in_transit, etc.)
- **Detailed Information** - Amount, fees, net amount, method, and timestamps

### ✅ Data Export & Analytics
- **CSV Export** - Export payout data for accounting and analysis
- **Event-based Filtering** - View payouts by specific events
- **Financial Summary** - Comprehensive earnings and fee breakdown
- **Historical Data** - Access to complete payout history

### ✅ User Experience
- **Loading States** - Clear indicators during data fetch
- **Empty States** - Helpful messages when no data is available
- **Error Handling** - Graceful handling of API errors
- **Pull-to-refresh** - Easy data refresh functionality
- **Stripe Dashboard Link** - Direct access to full Stripe dashboard

## Technical Implementation

### Database Schema
Added new fields to `profiles` table:
```sql
ALTER TABLE profiles 
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_account_status text DEFAULT 'disconnected' 
CHECK (stripe_account_status IN ('disconnected', 'pending', 'active', 'restricted'));
```

### Stripe Service Extensions
Added new methods to `lib/stripeService.ts`:

```typescript
// Get Stripe Connect account information
async getStripeAccount(accountId: string): Promise<StripeAccount | null>

// Create Stripe Connect onboarding URL
async createOnboardingUrl(userId: string, returnUrl: string): Promise<string | null>

// Get payouts for a connected account
async getPayouts(accountId: string, limit: number = 50): Promise<Payout[]>

// Get payout summary with statistics
async getPayoutSummary(accountId: string): Promise<PayoutSummary>

// Get payouts by event (using metadata)
async getPayoutsByEvent(accountId: string, eventId?: string): Promise<Payout[]>

// Export payouts to CSV format
exportPayoutsToCSV(payouts: Payout[]): string

// Get Stripe dashboard URL for the connected account
getStripeDashboardUrl(accountId: string): string
```

### Data Interfaces
```typescript
interface Payout {
  id: string;
  amount: number;
  fees: number;
  net: number;
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  arrival_date: number;
  created: number;
  method: string;
  destination: string;
  description?: string;
  event_id?: string;
  event_name?: string;
}

interface PayoutSummary {
  totalPayouts: number;
  totalFees: number;
  totalNet: number;
  pendingPayouts: number;
  recentPayouts: Payout[];
}

interface StripeAccount {
  id: string;
  business_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}
```

## File Structure
```
app/organizer/
├── payments-payouts.tsx          # Main payments & payouts screen
database/
├── migration_add_stripe_account_id.sql  # Database migration
lib/
├── stripeService.ts              # Enhanced with payout methods
docs/
├── PAYMENTS_PAYOUTS_FEATURE.md   # This documentation
```

## How It Works

### 1. Account Connection Flow
1. User navigates to Payments & Payouts screen
2. App checks for existing `stripe_account_id` in profile
3. If not connected, shows onboarding card with "Connect Stripe" button
4. Clicking button creates onboarding URL and opens Stripe Connect flow
5. User completes Stripe onboarding (business info, bank account, etc.)
6. Stripe redirects back to app with account ID
7. App updates profile with account ID and status

### 2. Payout Data Fetching
1. App loads user profile to get `stripe_account_id`
2. Uses Stripe API with connected account ID to fetch payouts
3. Retrieves payout summary, recent payouts, and account status
4. Displays data in organized, filterable interface

### 3. Data Export
1. User clicks "Export CSV" button
2. App generates CSV with all payout data
3. Uses React Native Share API to export file
4. User can save or share the CSV file

## Stripe Configuration Requirements

### 1. Stripe Connect Setup
- Enable Stripe Connect in your Stripe dashboard
- Configure Express onboarding settings
- Set up webhook endpoints for account updates
- Configure payout schedules and methods

### 2. API Permissions
The Stripe secret key must have access to:
- `accounts.read` - Read connected account information
- `payouts.read` - Read payout data
- `account_links.write` - Create onboarding links

### 3. Webhook Events
Set up webhooks for real-time updates:
- `account.updated` - When account status changes
- `payout.paid` - When payouts are completed
- `payout.failed` - When payouts fail

## Usage Instructions

### For Organizers
1. Navigate to Organizer Dashboard
2. Select "Payments & Payouts" from the menu
3. If not connected, click "Connect Stripe Account"
4. Complete Stripe onboarding process
5. View payout data and export as needed
6. Access full Stripe dashboard for detailed management

### For Developers
1. Run the database migration to add Stripe fields
2. Configure Stripe Connect in your Stripe dashboard
3. Set up webhook endpoints for real-time updates
4. Test with Stripe's test mode first
5. Monitor API rate limits and usage

## Testing

### Test Scenarios
1. **No connected account** - Should show onboarding flow
2. **Pending account** - Should show pending status
3. **Active account** - Should show payout data
4. **Restricted account** - Should show restrictions
5. **Export functionality** - Should generate valid CSV
6. **Filter functionality** - Should filter payouts correctly
7. **Error handling** - Should handle API errors gracefully

### Test Data
Use Stripe's test mode to create test scenarios:
- Create test connected accounts
- Generate test payouts
- Test various payout statuses
- Verify CSV export format

## Security Considerations

### Data Protection
- No sensitive financial data stored locally
- All data fetched securely through Stripe API
- Account IDs stored securely in database
- Proper authentication required for all operations

### Access Control
- Only authenticated users can access payout data
- Data tied to user's specific Stripe account
- Row-level security ensures data isolation
- API calls use proper authentication headers

## Future Enhancements

### Planned Features
- **Real-time notifications** - Alert users when payouts arrive
- **Payout scheduling** - Set up automatic payout schedules
- **Multi-currency support** - Handle different currencies
- **Advanced analytics** - Detailed financial reporting
- **Tax integration** - Automatic tax calculations

### Potential Improvements
- **Offline caching** - Cache payout data for offline viewing
- **Batch operations** - Bulk export and management
- **Custom payout rules** - Set minimum payout amounts
- **Integration with accounting software** - Direct export to QuickBooks, etc.

## Troubleshooting

### Common Issues

#### Account Connection Problems
- Verify Stripe Connect is enabled in dashboard
- Check onboarding URL configuration
- Ensure proper redirect URLs are set
- Verify webhook endpoints are working

#### No Payout Data Showing
- Check if Stripe account is active
- Verify API permissions are correct
- Check for API rate limiting
- Ensure payouts have been generated

#### Export Errors
- Check file permissions on device
- Verify CSV generation is working
- Test Share API functionality
- Check for large data sets

#### API Errors
- Verify Stripe secret key is correct
- Check API rate limits
- Monitor Stripe dashboard for account status
- Review webhook configurations

### Support Resources
- Stripe Connect Documentation: https://stripe.com/docs/connect
- Stripe API Reference: https://stripe.com/docs/api
- App Support: Contact through help/support screen

## Compliance Notes

### Financial Regulations
- Stripe handles all financial compliance
- Payouts follow Stripe's compliance requirements
- Users must complete KYC/AML verification through Stripe
- Tax reporting handled by Stripe

### Data Retention
- Payout data retained according to Stripe's policies
- App doesn't store sensitive financial data locally
- Users should export and save their own records
- Compliance with local financial regulations

## Conclusion

The Payments & Payouts feature provides a comprehensive solution for event organizers to manage their financial operations through Stripe Connect. The implementation is secure, user-friendly, and integrates seamlessly with Stripe's payment infrastructure.

The feature handles the complete lifecycle from account connection to payout management, with robust error handling and data export capabilities. Organizers can easily track their earnings, manage payouts, and export data for accounting purposes. 