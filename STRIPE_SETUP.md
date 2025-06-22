# Stripe Integration Setup Guide

This guide will help you set up Stripe payment processing for paid events in your ScanCard app.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your Stripe API keys
3. Node.js and npm installed

## Step 1: Install Dependencies

The required dependencies have already been installed:

```bash
npm install @stripe/stripe-react-native stripe
```

## Step 2: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard
2. Go to Developers > API keys
3. Copy your **Publishable key** and **Secret key**
4. Keep your secret key secure and never expose it in client-side code

## Step 3: Set Up Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add your Stripe keys:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
EXPO_PUBLIC_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:** 
- Use test keys for development
- Use live keys for production
- The secret key should be kept secure and only used on your backend

## Step 4: Update Stripe Configuration

Update the Stripe configuration in `lib/stripeService.ts`:

```typescript
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';
const STRIPE_SECRET_KEY = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here';
```

## Step 5: Run Database Migration

Execute the database migration to add payment-related fields:

```sql
-- Run this in your Supabase SQL editor
-- File: database/migration_add_payment_fields.sql
```

This migration adds:
- Payment fields to the events table
- A new tickets table for tracking purchases
- Proper indexes and security policies

## Step 6: Wrap Your App with StripeProvider

Update your main app component to include the StripeProvider:

```typescript
// In your main App component
import StripeProvider from '@/components/StripeProvider';

export default function App() {
  return (
    <StripeProvider>
      {/* Your existing app structure */}
    </StripeProvider>
  );
}
```

## Step 7: Test the Integration

1. Create a paid event in your app
2. Try purchasing a ticket
3. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Features Implemented

### Event Creation
- ✅ Paid/free event toggle
- ✅ Price input with validation
- ✅ Automatic Stripe product/price creation
- ✅ Database storage with payment fields

### Payment Processing
- ✅ Stripe Payment Sheet integration
- ✅ Secure payment processing
- ✅ Ticket purchase tracking
- ✅ Payment status management

### User Experience
- ✅ Payment modal with card input
- ✅ Success/error handling
- ✅ Ticket status display
- ✅ Purchase confirmation

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Use environment variables** for sensitive data
3. **Validate payments** on your backend
4. **Implement webhook handling** for payment confirmations
5. **Use HTTPS** in production

## Testing

### Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

### Test Scenarios
1. Create a free event and claim ticket
2. Create a paid event and purchase ticket
3. Test payment failure scenarios
4. Verify ticket status updates

## Production Deployment

1. **Switch to live keys** in production
2. **Set up webhook endpoints** for payment confirmations
3. **Configure proper error handling**
4. **Monitor payment success rates**
5. **Set up Stripe Dashboard alerts**

## Troubleshooting

### Common Issues

1. **Payment fails with test cards**
   - Ensure you're using test keys in development
   - Check that the card number is correct

2. **Stripe provider not initialized**
   - Verify StripeProvider wraps your app
   - Check that publishable key is correct

3. **Database errors**
   - Run the migration script
   - Check Supabase permissions

4. **Payment intent creation fails**
   - Verify secret key is correct
   - Check network connectivity

### Debug Mode

Enable debug logging in `lib/stripeService.ts`:

```typescript
console.log('Stripe API Response:', response);
```

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For app-specific issues:
- Check the console logs
- Verify all environment variables are set
- Ensure database migration is complete

## Next Steps

Consider implementing these additional features:
- [ ] Webhook handling for payment confirmations
- [ ] Refund functionality
- [ ] Subscription-based events
- [ ] Multiple ticket types
- [ ] Discount codes
- [ ] Tax calculation
- [ ] Receipt generation 