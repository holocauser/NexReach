import { supabase } from './supabase';
import { FileService } from './fileService';
import * as FileSystem from 'expo-file-system';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_SECRET_KEY = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY;

if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_SECRET_KEY) {
  console.error("Stripe keys are not set. Please check your environment variables.");
}

// For development, you can use Stripe's test keys
// In production, these should be environment variables

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface StripePrice {
  id: string;
  product_id: string;
  unit_amount: number;
  currency: string;
  recurring?: any;
  active: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  payment_intent?: string;
  status: string;
}

class StripeService {
  private baseUrl = 'https://api.stripe.com/v1';

  // Validate Stripe configuration
  async validateConfiguration(): Promise<boolean> {
    try {
      console.log('Validating Stripe configuration...');
      console.log('Publishable key:', STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not set');
      console.log('Secret key:', STRIPE_SECRET_KEY ? 'Set' : 'Not set');
      
      // Test the secret key by making a simple API call
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      if (response.ok) {
        const account = await response.json();
        console.log('Stripe configuration valid. Account:', account.id);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Stripe configuration invalid:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Error validating Stripe configuration:', error);
      return false;
    }
  }

  // Upload event image to Supabase Storage and get public URL
  async uploadEventImage(imageUri: string, eventId: string, userId: string): Promise<string | null> {
    try {
      console.log('Uploading event image for Stripe...');
      
      // Check if it's already a public URL
      if (!imageUri.startsWith('file://')) {
        console.log('Image is already a public URL:', imageUri);
        return imageUri;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        console.error('Event image file does not exist:', imageUri);
        return null;
      }

      // Generate filename
      const fileName = `event_${eventId}_${Date.now()}.jpg`;
      
      // Upload directly to Supabase Storage without using FileService
      // This avoids the foreign key constraint issue with the cards table
      console.log('Uploading event image directly to Supabase Storage...');
      
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      if (base64Data.length === 0) {
        throw new Error('File is empty after reading');
      }

      // Create data URL and blob
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to create blob from data URL: ${response.status}`);
      }
      const blob = await response.blob();

      // Upload to Supabase Storage
      const filePath = `events/${userId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files') // Use the same bucket as FileService
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      console.log('Event image uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading event image:', error);
      return null;
    }
  }

  // Create a Stripe product for an event
  async createProduct(eventData: {
    title: string;
    description?: string;
    image?: string;
    uploadedImageUrl?: string;
  }): Promise<StripeProduct> {
    try {
      console.log('🔍 createProduct called with eventData:', eventData);
      
      // Validate event title
      if (!eventData.title || eventData.title.trim().length < 3) {
        console.error('❌ Title validation failed:', {
          title: eventData.title,
          trimmedLength: eventData.title?.trim().length,
          isEmpty: !eventData.title,
          isTooShort: eventData.title?.trim().length < 3
        });
        throw new Error('Event title must be at least 3 characters long');
      }

      const trimmedTitle = eventData.title.trim();
      console.log('✅ Title validation passed:', {
        originalTitle: eventData.title,
        trimmedTitle: trimmedTitle,
        length: trimmedTitle.length
      });

      // Double-check that we have a valid title
      if (!trimmedTitle || trimmedTitle.length < 3) {
        console.error('❌ Title is still invalid after trimming:', {
          trimmedTitle: trimmedTitle,
          length: trimmedTitle?.length
        });
        throw new Error('Event title must be at least 3 characters long');
      }

      const params = new URLSearchParams({
        name: trimmedTitle,
        description: eventData.description || '',
      });

      console.log('📋 URLSearchParams created:', {
        name: trimmedTitle,
        description: eventData.description || '',
        paramsString: params.toString()
      });

      // Add uploaded image URL if provided
      if (eventData.uploadedImageUrl) {
        params.append('images', eventData.uploadedImageUrl);
        console.log('Adding uploaded image to Stripe product:', eventData.uploadedImageUrl);
      } else if (eventData.image && !eventData.image.startsWith('file://')) {
        // Fallback to original image if it's already a public URL
        params.append('images', eventData.image);
        console.log('Adding public image to Stripe product:', eventData.image);
      } else if (eventData.image) {
        console.log('Skipping local image for Stripe product:', eventData.image);
      }

      console.log('Creating Stripe product with params:', {
        name: trimmedTitle,
        description: eventData.description || '',
        image: eventData.uploadedImageUrl || (eventData.image && !eventData.image.startsWith('file://') ? eventData.image : 'none (local file)'),
        finalParamsString: params.toString()
      });

      // Try using a plain string body instead of URLSearchParams
      let bodyString = `name=${encodeURIComponent(trimmedTitle)}`;
      
      // Only add description if it's not empty
      if (eventData.description && eventData.description.trim()) {
        bodyString += `&description=${encodeURIComponent(eventData.description.trim())}`;
      }
      
      // Temporarily skip images to get basic product creation working
      // TODO: Add images back once basic functionality is confirmed
      console.log('⚠️ Skipping images for now to focus on basic product creation');

      console.log('🔧 Using plain string body:', bodyString);

      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString,
      });

      console.log('Stripe API response status:', response.status);
      console.log('Stripe API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stripe API error response:', errorText);
        throw new Error(`Failed to create Stripe product: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Stripe product created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating Stripe product:', error);
      throw error;
    }
  }

  // Create a Stripe price for an event
  async createPrice(productId: string, amount: number, currency: string = 'usd'): Promise<StripePrice> {
    try {
      console.log('Creating Stripe price with params:', {
        product: productId,
        unit_amount: amount,
        currency: currency
      });

      // Use plain string body instead of URLSearchParams
      const bodyString = `product=${encodeURIComponent(productId)}&unit_amount=${amount}&currency=${encodeURIComponent(currency)}`;

      console.log('🔧 Price body string:', bodyString);

      const response = await fetch(`${this.baseUrl}/prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyString,
      });

      console.log('Stripe price API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stripe price API error response:', errorText);
        throw new Error(`Failed to create Stripe price: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Stripe price created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating Stripe price:', error);
      throw error;
    }
  }

  // Create a payment intent for ticket purchase
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amount.toString(),
          currency: currency,
          automatic_payment_methods: 'enabled',
          ...(metadata && { metadata: JSON.stringify(metadata) }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Create a checkout session for ticket purchase
  async createCheckoutSession(eventData: {
    eventId: string;
    eventTitle: string;
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          payment_method_types: 'card',
          line_items: JSON.stringify([{
            price_data: {
              currency: eventData.currency,
              product_data: {
                name: eventData.eventTitle,
              },
              unit_amount: eventData.amount,
            },
            quantity: 1,
          }]),
          mode: 'payment',
          success_url: eventData.successUrl,
          cancel_url: eventData.cancelUrl,
          metadata: JSON.stringify({
            event_id: eventData.eventId,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Retrieve a payment intent
  async retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve payment intent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  }

  // Retrieve a checkout session
  async retrieveCheckoutSession(sessionId: string): Promise<CheckoutSession> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve checkout session: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw error;
    }
  }

  // Save ticket purchase to database
  async saveTicketPurchase(ticketData: {
    eventId: string;
    userId: string;
    stripePaymentIntentId?: string;
    stripeSessionId?: string;
    amount: number;
    currency: string;
    quantity: number;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          event_id: ticketData.eventId,
          user_id: ticketData.userId,
          stripe_payment_intent_id: ticketData.stripePaymentIntentId,
          stripe_session_id: ticketData.stripeSessionId,
          amount: ticketData.amount,
          currency: ticketData.currency,
          quantity: ticketData.quantity,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error saving ticket purchase:', error);
      throw error;
    }
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: 'pending' | 'paid' | 'cancelled' | 'refunded'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  // Get user's tickets
  async getUserTickets(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            description,
            location,
            start_time,
            end_time,
            image
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user tickets:', error);
      throw error;
    }
  }

  // Get event tickets
  async getEventTickets(eventId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting event tickets:', error);
      throw error;
    }
  }

  // Check if user has purchased ticket for event
  async hasUserPurchasedTicket(userId: string, eventId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('status', 'paid')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking ticket purchase:', error);
      return false;
    }
  }
}

export const stripeService = new StripeService();
export default stripeService; 