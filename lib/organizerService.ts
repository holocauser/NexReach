import { supabase } from './supabase';

export interface TicketSale {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type: string;
  status: string;
  created_at: string;
  // Joined data
  attendee_name: string | null;
  attendee_email: string | null;
  event_title: string;
  event_location: string | null;
  event_start_time: string;
  event_end_time: string | null;
  event_image: string | null;
}

export interface TicketSaleStats {
  totalRevenue: number;
  totalTickets: number;
  completedTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
}

export interface StripeAccountInfo {
  accountId: string | null;
  status: 'disconnected' | 'pending' | 'active' | 'restricted';
  bankAccount?: {
    last4: string;
    bankName: string;
    accountType: string;
  };
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

export interface Receipt {
  id: string;
  eventId: string;
  eventName: string;
  buyerEmail: string;
  ticketType: string;
  amount: number;
  currency: string;
  status: string;
  receiptId: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  createdAt: string;
  purchaseDate: string;
}

export interface ReceiptStats {
  totalRevenue: number;
  totalReceipts: number;
  paidReceipts: number;
  pendingReceipts: number;
  cancelledReceipts: number;
}

export interface OrganizerProfile {
  id: string;
  fullName: string | null;
  orgName: string | null;
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  company: string | null;
  title: string | null;
  avatarUrl: string | null;
  stripeAccountStatus: string | null;
}

class OrganizerService {
  // Fetch all tickets sold for events by the current organizer
  async getTicketsSold(organizerId: string): Promise<TicketSale[]> {
    try {
      // First get all events by this organizer
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', organizerId);

      if (eventsError) {
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return [];
      }

      const eventIds = events.map(e => e.id);

      // Then get tickets for these events using the view
      const { data, error } = await supabase
        .from('tickets_with_attendee_info')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match the interface
      const transformedData: TicketSale[] = (data || []).map((ticket: any) => ({
        id: ticket.id,
        event_id: ticket.event_id,
        user_id: ticket.user_id,
        ticket_type: ticket.ticket_type,
        status: ticket.status,
        created_at: ticket.created_at,
        attendee_name: ticket.attendee_name || `Attendee ${ticket.user_id.slice(0, 8)}`,
        attendee_email: ticket.attendee_email,
        event_title: ticket.event_title || '',
        event_location: ticket.event_location,
        event_start_time: ticket.event_start_time || '',
        event_end_time: ticket.event_end_time,
        event_image: ticket.event_image,
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching tickets sold:', error);
      throw error;
    }
  }

  // Get ticket sales statistics
  async getTicketSalesStats(organizerId: string): Promise<TicketSaleStats> {
    try {
      const tickets = await this.getTicketsSold(organizerId);
      
      const stats: TicketSaleStats = {
        totalRevenue: 0,
        totalTickets: tickets.length,
        completedTickets: tickets.filter(t => t.status === 'paid' || t.status === 'confirmed').length,
        pendingTickets: tickets.filter(t => t.status === 'pending').length,
        cancelledTickets: tickets.filter(t => t.status === 'cancelled' || t.status === 'refunded').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching ticket sales stats:', error);
      throw error;
    }
  }

  // Filter tickets by various criteria
  async getFilteredTickets(
    organizerId: string,
    filters: {
      eventId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      searchAttendee?: string;
    }
  ): Promise<TicketSale[]> {
    try {
      // First get all events by this organizer
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', organizerId);

      if (eventsError) {
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return [];
      }

      const eventIds = events.map(e => e.id);

      // Build query using the view
      let query = supabase
        .from('tickets_with_attendee_info')
        .select('*')
        .in('event_id', eventIds);

      // Apply filters
      if (filters.eventId) {
        query = query.eq('event_id', filters.eventId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data
      let transformedData: TicketSale[] = (data || []).map((ticket: any) => ({
        id: ticket.id,
        event_id: ticket.event_id,
        user_id: ticket.user_id,
        ticket_type: ticket.ticket_type,
        status: ticket.status,
        created_at: ticket.created_at,
        attendee_name: ticket.attendee_name || `Attendee ${ticket.user_id.slice(0, 8)}`,
        attendee_email: ticket.attendee_email,
        event_title: ticket.event_title || '',
        event_location: ticket.event_location,
        event_start_time: ticket.event_start_time || '',
        event_end_time: ticket.event_end_time,
        event_image: ticket.event_image,
      }));

      // Apply attendee search filter (client-side for better UX)
      if (filters.searchAttendee) {
        const searchTerm = filters.searchAttendee.toLowerCase();
        transformedData = transformedData.filter(ticket => 
          (ticket.attendee_name && ticket.attendee_name.toLowerCase().includes(searchTerm)) ||
          (ticket.attendee_email && ticket.attendee_email.toLowerCase().includes(searchTerm))
        );
      }

      return transformedData;
    } catch (error) {
      console.error('Error fetching filtered tickets:', error);
      throw error;
    }
  }

  // Get list of events for filter dropdown
  async getOrganizerEvents(organizerId: string): Promise<Array<{ id: string; title: string }>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .eq('user_id', organizerId)
        .order('start_time', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw error;
    }
  }

  // Get Stripe account information for an organizer
  async getStripeAccountInfo(organizerId: string): Promise<StripeAccountInfo> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_account_status')
        .eq('id', organizerId)
        .single();

      if (error) {
        console.error('Error fetching Stripe account info:', error);
        return {
          accountId: null,
          status: 'disconnected',
          payoutsEnabled: false,
          chargesEnabled: false,
        };
      }

      if (!profile?.stripe_account_id) {
        return {
          accountId: null,
          status: 'disconnected',
          payoutsEnabled: false,
          chargesEnabled: false,
        };
      }

      // Get detailed account information from Stripe
      const { stripeService } = await import('./stripeService');
      const accountDetails = await stripeService.getStripeAccount(profile.stripe_account_id);

      if (!accountDetails) {
        return {
          accountId: profile.stripe_account_id,
          status: profile.stripe_account_status || 'disconnected',
          payoutsEnabled: false,
          chargesEnabled: false,
        };
      }

      return {
        accountId: profile.stripe_account_id,
        status: profile.stripe_account_status || 'disconnected',
        payoutsEnabled: accountDetails.payouts_enabled,
        chargesEnabled: accountDetails.charges_enabled,
      };
    } catch (error) {
      console.error('Error getting Stripe account info:', error);
      return {
        accountId: null,
        status: 'disconnected',
        payoutsEnabled: false,
        chargesEnabled: false,
      };
    }
  }

  // Create Stripe Connect onboarding link
  async createStripeOnboardingLink(organizerId: string, returnUrl: string): Promise<string | null> {
    try {
      const { stripeService } = await import('./stripeService');
      return await stripeService.createOnboardingUrl(organizerId, returnUrl);
    } catch (error) {
      console.error('Error creating Stripe onboarding link:', error);
      return null;
    }
  }

  // Update Stripe account status in database
  async updateStripeAccountStatus(organizerId: string, accountId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: status,
        })
        .eq('id', organizerId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating Stripe account status:', error);
      throw error;
    }
  }

  // Get all receipts for organizer's events
  async getReceipts(organizerId: string): Promise<Receipt[]> {
    try {
      // First get all events by this organizer
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .eq('user_id', organizerId);

      if (eventsError) {
        throw eventsError;
      }

      if (!events || events.length === 0) {
        return [];
      }

      const eventIds = events.map(e => e.id);
      const eventTitles = events.reduce((acc, event) => {
        acc[event.id] = event.title;
        return acc;
      }, {} as Record<string, string>);

      // Get tickets for these events
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          event_id,
          user_id,
          ticket_type,
          status,
          amount,
          currency,
          stripe_payment_intent_id,
          stripe_session_id,
          created_at,
          profiles!inner(full_name),
          users!inner(email)
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      // Transform the data to match the Receipt interface
      const receipts: Receipt[] = (tickets || []).map((ticket: any) => ({
        id: ticket.id,
        eventId: ticket.event_id,
        eventName: eventTitles[ticket.event_id] || 'Unknown Event',
        buyerEmail: ticket.users?.email || 'No email',
        ticketType: ticket.ticket_type || 'General',
        amount: ticket.amount || 0,
        currency: ticket.currency || 'usd',
        status: ticket.status || 'pending',
        receiptId: ticket.stripe_payment_intent_id || ticket.id,
        stripePaymentIntentId: ticket.stripe_payment_intent_id,
        stripeSessionId: ticket.stripe_session_id,
        createdAt: ticket.created_at,
        purchaseDate: ticket.created_at,
      }));

      return receipts;
    } catch (error) {
      console.error('Error fetching receipts:', error);
      throw error;
    }
  }

  // Get receipt statistics
  async getReceiptStats(organizerId: string): Promise<ReceiptStats> {
    try {
      const receipts = await this.getReceipts(organizerId);
      
      const stats: ReceiptStats = {
        totalRevenue: receipts.reduce((sum, receipt) => sum + receipt.amount, 0),
        totalReceipts: receipts.length,
        paidReceipts: receipts.filter(r => r.status === 'paid').length,
        pendingReceipts: receipts.filter(r => r.status === 'pending').length,
        cancelledReceipts: receipts.filter(r => r.status === 'cancelled' || r.status === 'refunded').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching receipt stats:', error);
      throw error;
    }
  }

  // Get Stripe receipt URL
  async getStripeReceiptUrl(paymentIntentId: string): Promise<string | null> {
    try {
      const { stripeService } = await import('./stripeService');
      const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent && paymentIntent.id) {
        // Stripe receipt URL format
        return `https://receipt.stripe.com/pay/${paymentIntent.id}`;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Stripe receipt URL:', error);
      return null;
    }
  }

  // Resend receipt email (placeholder - would need backend implementation)
  async resendReceipt(receiptId: string, buyerEmail: string): Promise<boolean> {
    try {
      // This would typically call a backend API to resend the receipt
      // For now, we'll just log the action
      console.log(`Resending receipt ${receiptId} to ${buyerEmail}`);
      
      // In a real implementation, you would:
      // 1. Call your backend API
      // 2. Backend would use Stripe API to resend receipt
      // 3. Return success/failure status
      
      return true;
    } catch (error) {
      console.error('Error resending receipt:', error);
      return false;
    }
  }

  // Filter receipts by various criteria
  async getFilteredReceipts(
    organizerId: string,
    filters: {
      eventId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      searchBuyer?: string;
    }
  ): Promise<Receipt[]> {
    try {
      let receipts = await this.getReceipts(organizerId);

      // Apply filters
      if (filters.eventId) {
        receipts = receipts.filter(receipt => receipt.eventId === filters.eventId);
      }

      if (filters.status) {
        receipts = receipts.filter(receipt => receipt.status === filters.status);
      }

      if (filters.dateFrom) {
        receipts = receipts.filter(receipt => receipt.createdAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        receipts = receipts.filter(receipt => receipt.createdAt <= filters.dateTo!);
      }

      if (filters.searchBuyer) {
        const searchTerm = filters.searchBuyer.toLowerCase();
        receipts = receipts.filter(receipt => 
          receipt.buyerEmail.toLowerCase().includes(searchTerm)
        );
      }

      return receipts;
    } catch (error) {
      console.error('Error fetching filtered receipts:', error);
      throw error;
    }
  }

  // Get organizer profile information
  async getOrganizerProfile(organizerId: string): Promise<OrganizerProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          org_name,
          contact_email,
          phone,
          website,
          company,
          title,
          avatar_url,
          stripe_account_status
        `)
        .eq('id', organizerId)
        .single();

      if (error) {
        console.error('Error fetching organizer profile:', error);
        return null;
      }

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        fullName: profile.full_name,
        orgName: profile.org_name,
        contactEmail: profile.contact_email,
        phone: profile.phone,
        website: profile.website,
        company: profile.company,
        title: profile.title,
        avatarUrl: profile.avatar_url,
        stripeAccountStatus: profile.stripe_account_status,
      };
    } catch (error) {
      console.error('Error getting organizer profile:', error);
      return null;
    }
  }

  // Update organizer profile information
  async updateOrganizerProfile(
    organizerId: string,
    profileData: {
      fullName?: string;
      orgName?: string;
      contactEmail?: string;
      phone?: string;
      website?: string;
      company?: string;
      title?: string;
    }
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (profileData.fullName !== undefined) updateData.full_name = profileData.fullName;
      if (profileData.orgName !== undefined) updateData.org_name = profileData.orgName;
      if (profileData.contactEmail !== undefined) updateData.contact_email = profileData.contactEmail;
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;
      if (profileData.website !== undefined) updateData.website = profileData.website;
      if (profileData.company !== undefined) updateData.company = profileData.company;
      if (profileData.title !== undefined) updateData.title = profileData.title;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', organizerId);

      if (error) {
        console.error('Error updating organizer profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating organizer profile:', error);
      return false;
    }
  }
}

export const organizerService = new OrganizerService(); 