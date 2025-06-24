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

export interface EventTicketStats {
  totalTickets: number;
  checkedInTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
  totalRevenue: number;
  checkInRate: number;
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
   * Get event ticket statistics for organizers
   */
  static async getEventTicketStats(eventId: string): Promise<EventTicketStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_event_ticket_stats', { event_id: eventId });

      if (error) {
        console.error('Error fetching event stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      return null;
    }
  }

  /**
   * Validate ticket for check-in using database function
   */
  static async validateTicket(
    ticketId: string, 
    organizerId: string,
    currentEventId?: string
  ): Promise<TicketValidationResult> {
    try {
      // Use the database function for validation
      const { data, error } = await supabase
        .rpc('validate_ticket', {
          ticket_id: ticketId,
          organizer_id: organizerId
        });

      if (error) {
        console.error('Error validating ticket:', error);
        return {
          success: false,
          message: '❌ Error validating ticket'
        };
      }

      // If currentEventId is provided, check if ticket matches current event
      if (currentEventId && data.event_id !== currentEventId) {
        return {
          success: false,
          message: '❌ Ticket is for a different event'
        };
      }

      if (data.success) {
        return {
          success: true,
          message: data.message,
          attendeeInfo: {
            name: data.attendee_name || 'Unknown',
            email: data.attendee_email || 'Unknown',
            ticketType: data.ticket_type || 'General Admission',
            eventTitle: data.event_title || 'Unknown Event',
            purchaseDate: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: data.message,
          attendeeInfo: data.attendee_name ? {
            name: data.attendee_name,
            email: data.attendee_email || 'Unknown',
            ticketType: data.ticket_type || 'General Admission',
            eventTitle: data.event_title || 'Unknown Event',
            purchaseDate: new Date().toISOString()
          } : undefined
        };
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      return {
        success: false,
        message: '❌ Error validating ticket'
      };
    }
  }

  /**
   * Manually check in attendee by email
   */
  static async manuallyCheckIn(
    eventId: string,
    attendeeEmail: string,
    organizerId: string
  ): Promise<TicketValidationResult> {
    try {
      const { data, error } = await supabase
        .rpc('manual_check_in', {
          event_id: eventId,
          attendee_email: attendeeEmail,
          organizer_id: organizerId
        });

      if (error) {
        console.error('Error with manual check-in:', error);
        return {
          success: false,
          message: '❌ Error with manual check-in'
        };
      }

      if (data.success) {
        return {
          success: true,
          message: data.message,
          attendeeInfo: {
            name: data.attendee_name || 'Unknown',
            email: data.attendee_email || 'Unknown',
            ticketType: data.ticket_type || 'General Admission',
            eventTitle: data.event_title || 'Unknown Event',
            purchaseDate: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          message: data.message
        };
      }
    } catch (error) {
      console.error('Error with manual check-in:', error);
      return {
        success: false,
        message: '❌ Error with manual check-in'
      };
    }
  }

  /**
   * Get recent validations for an event
   */
  static async getRecentValidations(eventId: string, limit: number = 10): Promise<TicketValidationResult[]> {
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
        .eq('event_id', eventId)
        .not('validated_at', 'is', null)
        .order('validated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent validations:', error);
        return [];
      }

      return data.map(ticket => ({
        success: true,
        message: '✅ Checked in',
        ticket,
        attendeeInfo: {
          name: ticket.attendee_name || 'Unknown',
          email: ticket.attendee_email || 'Unknown',
          ticketType: ticket.ticket_type || 'General Admission',
          eventTitle: ticket.events?.title || 'Unknown Event',
          purchaseDate: ticket.validated_at || new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error fetching recent validations:', error);
      return [];
    }
  }

  /**
   * Generate QR code data for a ticket
   */
  static generateQRCodeData(ticket: Ticket, event: Event): string {
    return JSON.stringify({
      ticketId: ticket.id,
      eventId: event.id,
      eventTitle: event.title,
      ticketType: ticket.ticket_type || 'General Admission',
      userId: ticket.user_id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Extract attendee information from ticket
   */
  static extractAttendeeInfo(ticket: Ticket & { events: Event | null }): {
    name: string;
    email: string;
    ticketType: string;
    eventTitle: string;
    purchaseDate: string;
  } {
    return {
      name: ticket.attendee_name || 'Unknown',
      email: ticket.attendee_email || 'Unknown',
      ticketType: ticket.ticket_type || 'General Admission',
      eventTitle: ticket.events?.title || 'Unknown Event',
      purchaseDate: ticket.created_at || new Date().toISOString()
    };
  }
} 