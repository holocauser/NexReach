import { stripeService } from '@/lib/stripeService';

export async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...');
  
  try {
    // Test 1: Validate configuration
    console.log('\n1. Testing Stripe configuration...');
    const isValid = await stripeService.validateConfiguration();
    console.log('✅ Stripe configuration valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Stripe configuration is invalid. Please check your API keys.');
      return false;
    }
    
    // Test 2: Create a test product
    console.log('\n2. Testing product creation...');
    const testProduct = await stripeService.createProduct({
      title: 'Test Event Product',
      description: 'This is a test product for Stripe integration',
    });
    console.log('✅ Test product created:', testProduct.id);
    
    // Test 3: Create a test price
    console.log('\n3. Testing price creation...');
    const testPrice = await stripeService.createPrice(
      testProduct.id,
      1000, // $10.00 in cents
      'usd'
    );
    console.log('✅ Test price created:', testPrice.id);
    
    console.log('\n🎉 All Stripe integration tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Stripe integration test failed:', error);
    return false;
  }
}

// Export for use in development
export default testStripeIntegration; 