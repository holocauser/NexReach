# Bank Account Stripe Integration

## Overview
This document describes the implementation of the bank account information screen for event organizers, which integrates with Stripe Connect to manage payout accounts.

## Features Implemented

### ✅ Bank Account Info Display
- **Connected Account Status**: Shows whether the organizer has connected their Stripe account
- **Account Status Indicators**: Visual status indicators for different account states:
  - Active (green)
  - Pending Verification (orange)
  - Restricted (red)
  - Not Connected (gray)
- **Account Information**: Displays account ID, payouts enabled status, and charges enabled status

### ✅ Stripe Connect Integration
- **Connect Stripe Button**: For organizers who haven't connected their Stripe account
- **Update Bank Info Button**: For connected accounts to update banking information
- **Secure Onboarding**: Uses Stripe's secure onboarding flow for account setup

### ✅ User Experience
- **Loading States**: Shows loading indicators during API calls
- **Error Handling**: Proper error messages for failed operations
- **Refresh Functionality**: Manual refresh button to update account status
- **Responsive Design**: Clean, modern UI with proper spacing and typography

## Technical Implementation

### Database Schema
The implementation uses the existing `profiles` table with Stripe-related columns:
- `stripe_account_id`: Stores the Stripe Connect account ID
- `stripe_account_status`: Tracks account status ('disconnected', 'pending', 'active', 'restricted')

### Services

#### OrganizerService (`lib/organizerService.ts`)
Added new methods:
- `getStripeAccountInfo(organizerId)`: Fetches Stripe account information
- `createStripeOnboardingLink(organizerId, returnUrl)`: Creates Stripe Connect onboarding links
- `updateStripeAccountStatus(organizerId, accountId, status)`: Updates account status in database

#### StripeService (`lib/stripeService.ts`)
Uses existing methods:
- `getStripeAccount(accountId)`: Fetches detailed account information from Stripe
- `createOnboardingUrl(userId, returnUrl)`: Creates account onboarding links

### Screen Implementation (`app/organizer/bank-account.tsx`)
- **State Management**: Uses React hooks for loading states and data
- **Conditional Rendering**: Shows different UI based on connection status
- **Deep Linking**: Handles Stripe onboarding URLs with proper error handling
- **Real-time Updates**: Refreshes account information on demand

## User Flow

### For New Organizers (Not Connected)
1. User navigates to Bank Account screen
2. Sees "Connect Stripe" button with explanation text
3. Clicks button to start Stripe onboarding
4. Redirected to Stripe's secure onboarding flow
5. Completes account setup and verification
6. Returns to app with updated account status

### For Connected Organizers
1. User navigates to Bank Account screen
2. Sees connected account information:
   - Account status with visual indicator
   - Account ID (truncated for security)
   - Payouts enabled status
   - Charges enabled status
3. Can click "Update Bank Info" to modify banking details
4. Can refresh to get latest account status

## Security Features
- **PCI Compliance**: Banking details handled by Stripe (PCI-compliant)
- **No Local Storage**: Banking information never stored in the app
- **Secure Communication**: All Stripe API calls use HTTPS
- **Account Verification**: Stripe handles identity verification

## Error Handling
- **Network Errors**: Graceful handling of API failures
- **Invalid URLs**: Checks if Stripe onboarding URLs can be opened
- **Missing Data**: Fallback to disconnected state for missing account info
- **User Feedback**: Clear error messages and loading states

## Future Enhancements
- **Webhook Integration**: Real-time status updates via Stripe webhooks
- **Bank Account Details**: Display last 4 digits of connected bank account
- **Payout History**: Show recent payout information
- **Account Requirements**: Display pending verification requirements

## Testing
To test the implementation:
1. Navigate to the organizer dashboard
2. Go to Bank Account section
3. Test both connected and disconnected states
4. Verify Stripe onboarding flow works correctly
5. Check error handling with invalid scenarios

## Dependencies
- Stripe Connect API
- React Native Linking for URL handling
- Supabase for database operations
- Expo Router for navigation 