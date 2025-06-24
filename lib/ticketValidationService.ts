import { supabase } from './supabase';
import { Ticket, Event } from '@/types/database';

export interface TicketValidationResult {
  success: boolean;
  message: string;
  ticket?: Ticket & { events: Event | null };
  attendeeInfo?: {
    name: string;
    email: string;
    ticketType: string;
    eventTitle: string;
    purchaseDate: string;
  };
}

export interface QRCodeData {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ticketType: string;
  userId: string;
  timestamp: string;
}

export class TicketValidationService {
  /**
   * Decode QR code data from scanned content
   */
  static decodeQRCode(qrContent: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrContent);
      
      // Validate required fields
      if (!data.ticketId || !data.eventId || !data.eventTitle || !data.ticketType) {
        return null;
      }
      
      return {
        ticketId: data.ticketId,
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        ticketType: data.ticketType,
        userId: data.userId,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Failed to decode QR code:', error);
      return null;
    }
  }

  /**
   * Fetch ticket by ID with event details
   */
  static async getTicketById(ticketId: string): Promise<Ticket & { events: Event | null } | null> {
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
            image,
            user_id
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }

  /**
   * Validate ticket for check-in
   */
  static async validateTicket(
    ticketId: string, 
    organizerId: string,
    currentEventId?: string
  ): Promise<TicketValidationResult> {
    try {
      // Fetch ticket with event details
      const ticket = await this.getTicketById(ticketId);
      
      if (!ticket) {
        return {
          success: false,
          message: '❌ Ticket not found'
        };
      }

      // Check if ticket is already validated
      if (ticket.validated_at) {
        return {
          success: false,
          message: '❌ Ticket already checked in',
          ticket,
          attendeeInfo: this.extractAttendeeInfo(ticket)
        };
      }

      // Check if organizer owns the event
      if (ticket.events?.user_id !== organizerId) {
        return {
          success: false,
          message: '❌ You can only validate tickets for your own events'
        };
      }

      // If currentEventId is provided, check if ticket matches current event
      if (currentEventId && ticket.event_id !== currentEventId) {
        return {
          success: false,
          message: '❌ Ticket is for a different event'
        };
      }

      // Check if ticket status is confirmed
      if (ticket.status !== 'confirmed') {
        return {
          success: false,
          message: `❌ Ticket status is ${ticket.status}`,
          ticket,
          attendeeInfo: this.extractAttendeeInfo(ticket)
        };
      }

      // Validate the ticket
      const { error } = await supabase
        .from('tickets')
        .update({
          validated_at: new Date().toISOString(),
          validated_by: organizerId
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error validating ticket:', error);
        return {
          success: false,
          message: '❌ Failed to validate ticket'
        };
      }

      return {
        success: true,
        message: '✅ Ticket validated successfully!',
        ticket: { ...ticket, validated_at: new Date().toISOString(), validated_by: organizerId },
        attendeeInfo: this.extractAttendeeInfo(ticket)
      };

    } catch (error) {
      console.error('Error validating ticket:', error);
      return {
        success: false,
        message: '❌ Error validating ticket'
      };
    }
  }

  /**
   * Manually mark attendee as checked in (for cases where QR code doesn't work)
   */
  static async manuallyCheckIn(
    eventId: string,
    attendeeEmail: string,
    organizerId: string
  ): Promise<TicketValidationResult> {
    try {
      // Find ticket by event and attendee email
      const { data: tickets, error } = await supabase
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
            image,
            user_id
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .is('validated_at', null);

      if (error) {
        console.error('Error fetching tickets:', error);
        return {
          success: false,
          message: '❌ Error finding tickets'
        };
      }

      // Find ticket by attendee email (would need to join with profiles)
      // For now, we'll need to implement this differently since we don't have direct email access
      // This is a placeholder - in a real implementation, you'd need to join with profiles table
      
      return {
        success: false,
        message: '❌ Manual check-in not implemented yet'
      };

    } catch (error) {
      console.error('Error with manual check-in:', error);
      return {
        success: false,
        message: '❌ Error with manual check-in'
      };
    }
  }

  /**
   * Get validation statistics for an event
   */
  static async getEventValidationStats(eventId: string): Promise<{
    totalTickets: number;
    validatedTickets: number;
    pendingTickets: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, validated_at')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error fetching validation stats:', error);
        return { totalTickets: 0, validatedTickets: 0, pendingTickets: 0 };
      }

      const totalTickets = data.length;
      const validatedTickets = data.filter(ticket => ticket.validated_at).length;
      const pendingTickets = totalTickets - validatedTickets;

      return { totalTickets, validatedTickets, pendingTickets };
    } catch (error) {
      console.error('Error getting validation stats:', error);
      return { totalTickets: 0, validatedTickets: 0, pendingTickets: 0 };
    }
  }

  /**
   * Extract attendee information from ticket
   */
  private static extractAttendeeInfo(ticket: Ticket & { events: Event | null }): {
    name: string;
    email: string;
    ticketType: string;
    eventTitle: string;
    purchaseDate: string;
  } {
    return {
      name: 'Attendee', // Would need to join with profiles table for actual name
      email: 'attendee@example.com', // Would need to join with profiles table for actual email
      ticketType: ticket.ticket_type,
      eventTitle: ticket.events?.title || 'Unknown Event',
      purchaseDate: new Date(ticket.created_at).toLocaleDateString()
    };
  }
} 