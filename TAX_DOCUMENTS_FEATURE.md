# Tax Documents Feature

## Overview
The Tax Documents feature provides event organizers with access to their 1099 tax forms when their payouts exceed $600 in a calendar year. This feature integrates with Stripe's tax document system to automatically generate and provide downloadable tax forms.

## Features Implemented

### ✅ Tax Documents Screen
- **Year-based organization** - Tax documents grouped by calendar year
- **Automatic threshold detection** - Shows documents when payouts > $600
- **Multiple document types** - Supports 1099-K and 1099-MISC forms
- **Status tracking** - Shows document availability status (available, pending, unavailable)
- **Direct downloads** - One-click download of tax forms
- **Payout summaries** - Shows total payouts per year
- **Pull-to-refresh** - Easy data refresh functionality

### ✅ Stripe Integration
- **Tax document fetching** - Retrieves 1099 forms from Stripe API
- **Payout calculations** - Calculates total payouts per year
- **Connected account support** - Works with Stripe Express accounts
- **Error handling** - Graceful handling of API errors and missing data
- **Status monitoring** - Tracks document processing status

### ✅ User Experience
- **Loading states** - Clear loading indicators during data fetch
- **Empty states** - Helpful messages when no documents are available
- **Error handling** - User-friendly error messages with retry options
- **Help integration** - Direct link to support for tax-related questions
- **Responsive design** - Works on all screen sizes

## Technical Implementation

### Database Schema
No additional database tables are required. The feature uses Stripe's API directly for tax document data.

### Stripe Service Extensions
Added new methods to `lib/stripeService.ts`:

```typescript
// Get tax documents for a specific year
async getTaxDocuments(year: number): Promise<TaxDocument[]>

// Get payout summary for a specific year
async getPayoutSummary(year: number): Promise<{
  totalPayouts: number;
  payoutCount: number;
  averagePayout: number;
}>

// Check if tax documents are required for a year
async isTaxDocumentRequired(year: number): Promise<boolean>
```

### Tax Document Interface
```typescript
interface TaxDocument {
  id: string;
  year: number;
  type: '1099-K' | '1099-MISC';
  status: 'available' | 'pending' | 'unavailable';
  downloadUrl?: string;
  amount: number;
  created: number;
}
```

## File Structure
```
app/organizer/
├── tax-documents.tsx          # Main tax documents screen
lib/
├── stripeService.ts           # Enhanced with tax document methods
docs/
├── TAX_DOCUMENTS_FEATURE.md   # This documentation
```

## How It Works

### 1. Tax Document Generation
- Stripe automatically generates 1099 forms when payouts exceed $600
- Forms are typically available by January 31st of the following year
- Both 1099-K (payment processing) and 1099-MISC (miscellaneous income) are supported

### 2. Data Fetching
- The app fetches tax documents for the current year and previous 3 years
- Uses Stripe's `/tax_forms` endpoint with year filtering
- Handles connected accounts (Stripe Express) automatically

### 3. User Interface
- Documents are grouped by year with payout totals
- Each document shows type, amount, creation date, and status
- Download buttons appear only for available documents
- Pending documents show processing status

### 4. Error Handling
- Graceful degradation when Stripe API is unavailable
- Empty states for years with no documents
- Retry functionality for failed requests
- User-friendly error messages

## Stripe Configuration Requirements

### 1. Stripe Express Account
The organizer must have a Stripe Express account set up to receive payouts.

### 2. API Permissions
The Stripe secret key must have access to:
- `tax_forms.read` - Read tax document information
- `payouts.read` - Read payout information
- `accounts.read` - Read connected account information

### 3. Webhook Setup (Optional)
For real-time updates, consider setting up webhooks for:
- `tax_forms.available` - When tax documents become available
- `payouts.paid` - When payouts are completed

## Usage Instructions

### For Organizers
1. Navigate to Organizer Dashboard
2. Select "Tax Documents" from the menu
3. View documents by year
4. Download available tax forms
5. Contact support if documents are missing

### For Developers
1. Ensure Stripe Express is configured
2. Verify API permissions are set correctly
3. Test with both test and live Stripe accounts
4. Monitor API rate limits

## Testing

### Test Scenarios
1. **No payouts** - Should show empty state
2. **Payouts < $600** - Should show empty state
3. **Payouts > $600** - Should show tax documents
4. **Multiple years** - Should show documents for each year
5. **Pending documents** - Should show processing status
6. **Download errors** - Should handle gracefully

### Test Data
Use Stripe's test mode to create test scenarios:
- Create test payouts to trigger tax document generation
- Use test connected accounts to simulate real scenarios
- Test with various payout amounts and frequencies

## Security Considerations

### Data Protection
- Tax documents contain sensitive financial information
- Downloads are handled securely through Stripe's API
- No tax data is stored locally in the app

### Access Control
- Only authenticated users can access tax documents
- Documents are tied to the user's Stripe account
- Row-level security ensures data isolation

## Future Enhancements

### Planned Features
- **Email notifications** - Alert users when tax documents are available
- **Document preview** - Preview tax forms before downloading
- **Export options** - Export data in various formats (CSV, PDF)
- **Tax year reminders** - Remind users about upcoming tax deadlines
- **Integration with accounting software** - Direct export to QuickBooks, etc.

### Potential Improvements
- **Offline caching** - Cache document metadata for offline viewing
- **Batch downloads** - Download multiple documents at once
- **Document search** - Search through historical tax documents
- **Analytics dashboard** - Tax-related analytics and insights

## Troubleshooting

### Common Issues

#### No Tax Documents Showing
- Verify Stripe Express account is set up
- Check that payouts exceed $600 threshold
- Ensure tax documents are available (typically by January 31st)
- Verify API permissions are correct

#### Download Errors
- Check internet connection
- Verify Stripe API is accessible
- Ensure document status is "available"
- Try refreshing the page

#### API Errors
- Check Stripe secret key configuration
- Verify connected account permissions
- Monitor API rate limits
- Check Stripe dashboard for account status

### Support Resources
- Stripe Tax Documentation: https://stripe.com/docs/tax
- Stripe API Reference: https://stripe.com/docs/api
- App Support: Contact through help/support screen

## Compliance Notes

### Tax Requirements
- 1099 forms are required for payouts exceeding $600
- Forms are typically due by January 31st
- Users are responsible for filing their own taxes
- The app provides access but doesn't file taxes

### Data Retention
- Tax documents are retained by Stripe according to their policies
- App doesn't store tax document data locally
- Users should download and save their own copies

## Conclusion

The Tax Documents feature provides a comprehensive solution for event organizers to access their tax forms directly through the app. The implementation is secure, user-friendly, and integrates seamlessly with Stripe's tax document system.

The feature automatically handles the $600 threshold, provides clear status information, and offers easy download functionality. With proper error handling and user guidance, organizers can easily manage their tax documentation needs. 