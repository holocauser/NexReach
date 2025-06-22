// Database table interfaces for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          company: string | null;
          title: string | null;
          roles: string[] | null;
          is_setup: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          title?: string | null;
          roles?: string[] | null;
          is_setup?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company?: string | null;
          title?: string | null;
          roles?: string[] | null;
          is_setup?: boolean;
          created_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          title: string | null;
          company: string | null;
          email: string | null;
          phone: string | null;
          phones: string[] | null;
          address: string | null;
          addresses: string[] | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number | null;
          longitude: number | null;
          tags: string[];
          notes: string | null;
          profile_image: string | null;
          card_image: string | null;
          favorited: boolean;
          last_contacted: string | null;
          specialty: string[];
          languages: string[];
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          title?: string | null;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          phones?: string[] | null;
          address?: string | null;
          addresses?: string[] | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          tags?: string[];
          notes?: string | null;
          profile_image?: string | null;
          card_image?: string | null;
          favorited?: boolean;
          last_contacted?: string | null;
          specialty?: string[];
          languages?: string[];
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          title?: string | null;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          phones?: string[] | null;
          address?: string | null;
          addresses?: string[] | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          tags?: string[];
          notes?: string | null;
          profile_image?: string | null;
          card_image?: string | null;
          favorited?: boolean;
          last_contacted?: string | null;
          specialty?: string[];
          languages?: string[];
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          name: string;
          type: string;
          url: string;
          size: number | null;
          mime_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          name: string;
          type: string;
          url: string;
          size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          url?: string;
          size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_notes: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          name: string | null;
          url: string;
          duration: number;
          size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          name?: string | null;
          url: string;
          duration?: number;
          size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          user_id?: string;
          name?: string | null;
          url?: string;
          duration?: number;
          size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          user_id: string;
          referrer_id: string | null;
          recipient_id: string | null;
          date: string;
          case_type: string;
          outcome: 'pending' | 'successful' | 'unsuccessful';
          value: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          referrer_id?: string | null;
          recipient_id?: string | null;
          date: string;
          case_type: string;
          outcome: 'pending' | 'successful' | 'unsuccessful';
          value?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          referrer_id?: string | null;
          recipient_id?: string | null;
          date?: string;
          case_type?: string;
          outcome?: 'pending' | 'successful' | 'unsuccessful';
          value?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          location: string | null;
          start_time: string;
          end_time: string | null;
          image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          start_time: string;
          end_time?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_time?: string;
          end_time?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          ticket_type: string;
          status: string;
          wallet_url: string | null;
          calendar_ics_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          ticket_type: string;
          status?: string;
          wallet_url?: string | null;
          calendar_ics_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          ticket_type?: string;
          status?: string;
          wallet_url?: string | null;
          calendar_ics_url?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Card = Database['public']['Tables']['cards']['Row'];
export type File = Database['public']['Tables']['files']['Row'];
export type VoiceNote = Database['public']['Tables']['voice_notes']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type CardInsert = Database['public']['Tables']['cards']['Insert'];
export type FileInsert = Database['public']['Tables']['files']['Insert'];
export type VoiceNoteInsert = Database['public']['Tables']['voice_notes']['Insert'];
export type ReferralInsert = Database['public']['Tables']['referrals']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type CardUpdate = Database['public']['Tables']['cards']['Update'];
export type FileUpdate = Database['public']['Tables']['files']['Update'];
export type VoiceNoteUpdate = Database['public']['Tables']['voice_notes']['Update'];
export type ReferralUpdate = Database['public']['Tables']['referrals']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update']; 