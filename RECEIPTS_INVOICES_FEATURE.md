# Receipts & Invoices Feature

## Overview
The Receipts & Invoices screen allows event organizers to view all ticket purchases for their events with comprehensive receipt management capabilities, including Stripe integration for receipt downloads and email resending.

## ✅ Features Implemented

### Core Functionality
- **Real-time data fetching** from Supabase database
- **Purchase information display** including buyer email, event name, ticket type, amount, and receipt ID
- **Stripe integration** for receipt downloads and management
- **Receipt statistics** with revenue tracking and status breakdown

### Receipt Information Display
- **Buyer Email**: Shows the email address of the ticket purchaser
- **Event Name**: Displays the name of the event
- **Ticket Type**: Shows the type of ticket purchased
- **Amount**: Displays the purchase amount with currency
- **Receipt ID**: Shows the unique receipt identifier
- **Purchase Date**: Displays when the ticket was purchased
- **Status**: Visual status indicators (paid, pending, cancelled, refunded)

### Action Buttons
- **Download PDF**: Opens Stripe receipt link in browser for Stripe payments
- **Share**: Shares receipt information via native sharing
- **Resend Receipt**: Triggers email resend to the buyer

### Filtering & Statistics
- **Status filters**: Filter by paid, pending, or cancelled receipts
- **Real-time statistics**: Total revenue, total receipts, and paid receipts count
- **Pull-to-refresh**: Manual refresh functionality
- **Loading states**: Proper loading indicators and error handling

## 🗄️ Database Requirements

### Required Tables
The feature uses these existing tables:
- `tickets` - Stores ticket purchase information
- `events` - Stores event information
- `profiles` - Stores user profile information
- `auth.users` - Stores user email addresses

### Required Fields
The `tickets` table should have these fields:
- `id` (uuid) - Primary key
- `event_id` (uuid) - Reference to events table
- `user_id` (uuid) - Reference to users table
- `ticket_type` (text) - Type of ticket
- `status` (text) - Payment status
- `amount` (numeric) - Purchase amount in cents
- `currency` (text) - Currency code
- `stripe_payment_intent_id` (text) - Stripe payment intent ID
- `stripe_session_id` (text) - Stripe checkout session ID
- `created_at` (timestamp) - Purchase timestamp

## 🔧 Technical Implementation

### OrganizerService Methods
Added new methods to `lib/organizerService.ts`:

#### `getReceipts(organizerId: string): Promise<Receipt[]>`
- Fetches all receipts for events created by the organizer
- Joins with events, profiles, and auth.users tables
- Returns formatted receipt data with buyer information

#### `getReceiptStats(organizerId: string): Promise<ReceiptStats>`
- Calculates receipt statistics including total revenue
- Provides counts for different receipt statuses
- Returns aggregated data for dashboard display

#### `getStripeReceiptUrl(paymentIntentId: string): Promise<string | null>`
- Generates Stripe receipt URLs for payment intents
- Returns formatted receipt URL for browser opening
- Handles errors gracefully for missing payment intents

#### `resendReceipt(receiptId: string, buyerEmail: string): Promise<boolean>`
- Placeholder for receipt resending functionality
- Logs the action for debugging
- Returns success/failure status

#### `getFilteredReceipts(organizerId: string, filters): Promise<Receipt[]>`
- Filters receipts by various criteria
- Supports event, status, date range, and buyer search filters
- Returns filtered receipt data

### Screen Implementation
Updated `app/organizer/receipts-invoices.tsx`:

#### Real Data Integration
- Replaced mock data with real database queries
- Added loading states and error handling
- Implemented pull-to-refresh functionality

#### Stripe Integration
- **Download PDF**: Opens Stripe receipt URLs in browser
- **Receipt Management**: Handles Stripe payment intents
- **Error Handling**: Graceful fallbacks for non-Stripe payments

#### User Experience
- **Loading States**: Activity indicators during data fetching
- **Empty States**: Helpful messages when no receipts exist
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Clean, modern UI with proper styling

## 🔗 Stripe Integration

### Receipt URLs
- Uses Stripe's receipt URL format: `https://receipt.stripe.com/pay/{payment_intent_id}`
- Opens receipts in browser for PDF download
- Handles cases where Stripe payment intent is not available

### Payment Intent Retrieval
- Uses existing `stripeService.retrievePaymentIntent()` method
- Validates payment intent before generating receipt URL
- Provides fallback for non-Stripe payments

### Email Resending
- Placeholder implementation for receipt resending
- Would typically call backend API to trigger Stripe email resend
- Logs actions for debugging and monitoring

## 📊 Data Flow

### Receipt Loading
1. User navigates to Receipts & Invoices screen
2. `loadReceipts()` fetches organizer's events
3. Queries tickets for those events with user information
4. Transforms data into Receipt interface format
5. Updates UI with real receipt data

### Receipt Actions
1. **Download**: Gets Stripe receipt URL and opens in browser
2. **Share**: Uses native sharing with formatted receipt text
3. **Resend**: Calls resend service (placeholder implementation)

### Statistics Calculation
1. Fetches all receipts for organizer
2. Calculates total revenue (sum of amounts)
3. Counts receipts by status
4. Updates statistics display

## 🎨 User Interface

### Receipt Cards
- **Header**: Event name and receipt ID
- **Amount**: Formatted currency display with status indicator
- **Details**: Buyer email, ticket type, purchase date
- **Actions**: Download, share, and resend buttons

### Statistics Cards
- **Total Revenue**: Sum of all receipt amounts
- **Total Receipts**: Count of all receipts
- **Paid Receipts**: Count of paid receipts

### Filter Buttons
- **All**: Shows all receipts
- **Paid**: Shows only paid receipts
- **Pending**: Shows only pending receipts
- **Cancelled**: Shows cancelled/refunded receipts

## 🔒 Security & Permissions

### Database Policies
- Uses existing organizer ticket viewing policies
- Ensures organizers can only see receipts for their events
- Maintains user privacy and data security

### Stripe Security
- Receipt URLs are public but require valid payment intent ID
- No sensitive payment data exposed in the app
- Secure communication with Stripe API

## 🚀 Future Enhancements

### Backend Integration
- **Email Resending**: Implement actual receipt resending via backend
- **Webhook Handling**: Real-time receipt status updates
- **PDF Generation**: Custom receipt PDF generation

### Advanced Features
- **Receipt Search**: Advanced search by buyer name/email
- **Date Range Filtering**: UI for date range selection
- **Export Functionality**: CSV/PDF export of receipt data
- **Bulk Actions**: Bulk receipt management operations

### Analytics
- **Revenue Analytics**: Detailed revenue breakdown and trends
- **Receipt Analytics**: Receipt performance metrics
- **Customer Insights**: Buyer behavior analysis

## 🧪 Testing

### Test Scenarios
1. **No Receipts**: Verify empty state display
2. **Stripe Receipts**: Test download functionality
3. **Non-Stripe Receipts**: Test fallback behavior
4. **Filtering**: Test all filter combinations
5. **Error Handling**: Test network and API errors

### Data Validation
- Verify receipt amounts are in cents
- Check currency formatting
- Validate date formatting
- Test status indicators

## 📱 Usage

### For Organizers
1. Navigate to organizer dashboard
2. Go to "Receipts & Invoices" section
3. View all ticket purchases for their events
4. Use filters to find specific receipts
5. Download, share, or resend receipts as needed

### Receipt Management
- **Download**: Click "Download PDF" to open Stripe receipt
- **Share**: Click "Share" to share receipt information
- **Resend**: Click "Resend" to email receipt to buyer
- **Refresh**: Pull down to refresh receipt data

The Receipts & Invoices feature provides comprehensive receipt management for event organizers with full Stripe integration and a modern, user-friendly interface. 