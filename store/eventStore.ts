import { create } from 'zustand';
import { format, addDays, addWeeks } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { stripeService } from '@/lib/stripeService';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  organizer: string;
  organizerAvatar?: string;
  image?: string;
  attendees: number;
  maxAttendees?: number;
  isRSVPed: boolean;
  likes: number;
  isLiked: boolean;
  tags: string[];
  price: number | null; // null means free
  currency?: string;
  isPaid?: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  ticketStatus?: 'none' | 'reserved' | 'purchased';
}

// Mock events data
const mockEvents: Event[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Legal Networking Mixer',
    description: 'Join us for an evening of networking with fellow legal professionals. Great opportunity to meet new colleagues and discuss industry trends.',
    date: addDays(new Date(), 5),
    time: '6:00 PM - 9:00 PM',
    location: 'The Ritz-Carlton, Atlanta',
    organizer: 'Atlanta Bar Association',
    organizerAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 45,
    maxAttendees: 100,
    isRSVPed: true,
    likes: 23,
    isLiked: false,
    tags: ['Legal', 'Networking', 'Professional'],
    price: null,
    ticketStatus: 'none'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Medical Conference 2024',
    description: 'Annual medical conference featuring the latest research and innovations in healthcare. CME credits available.',
    date: addWeeks(new Date(), 2),
    time: '8:00 AM - 5:00 PM',
    location: 'Georgia World Congress Center',
    organizer: 'Georgia Medical Association',
    organizerAvatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 234,
    maxAttendees: 500,
    isRSVPed: false,
    likes: 67,
    isLiked: true,
    tags: ['Medical', 'Conference', 'CME'],
    price: 100,
    ticketStatus: 'none'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Startup Pitch Night',
    description: 'Watch innovative startups pitch their ideas to investors. Great networking opportunity for entrepreneurs and investors.',
    date: addDays(new Date(), 12),
    time: '7:00 PM - 10:00 PM',
    location: 'Tech Square, Atlanta',
    organizer: 'Atlanta Tech Village',
    organizerAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 89,
    maxAttendees: 150,
    isRSVPed: false,
    likes: 34,
    isLiked: false,
    tags: ['Startup', 'Pitch', 'Networking', 'Tech'],
    price: null,
    ticketStatus: 'none'
  }
];

const moreMockEvents: Event[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Digital Marketing Summit',
    description: 'A deep dive into the latest trends in digital marketing, from SEO to social media strategies. Keynote by industry experts.',
    date: addDays(new Date(), 20),
    time: '9:00 AM - 4:00 PM',
    location: 'Miami Beach Convention Center',
    organizer: 'Marketing Pro Group',
    organizerAvatar: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 150,
    maxAttendees: 300,
    isRSVPed: false,
    likes: 45,
    isLiked: false,
    tags: ['Marketing', 'Business', 'Workshop'],
    price: 75,
    ticketStatus: 'none'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Real Estate Investors Meetup',
    description: 'Connect with fellow real estate investors, share deals, and learn from experienced professionals in the Orlando area.',
    date: addDays(new Date(), 8),
    time: '7:00 PM - 9:00 PM',
    location: 'The Alfond Inn, Winter Park',
    organizer: 'Orlando REI Club',
    organizerAvatar: 'https://images.pexels.com/photos/1615776/pexels-photo-1615776.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 62,
    isRSVPed: true,
    likes: 18,
    isLiked: true,
    tags: ['Real Estate', 'Investing', 'Networking'],
    price: null,
    ticketStatus: 'none'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Orlando Art & Wine Stroll',
    description: 'Enjoy a beautiful evening strolling through local art galleries while sampling fine wines. A perfect night out.',
    date: addDays(new Date(), 15),
    time: '6:00 PM - 9:00 PM',
    location: 'Downtown Orlando Arts District',
    organizer: 'City of Orlando',
    organizerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    image: 'https://images.pexels.com/photos/14840714/pexels-photo-14840714.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    attendees: 112,
    maxAttendees: 200,
    isRSVPed: false,
    likes: 55,
    isLiked: false,
    tags: ['Art', 'Social', 'Community'],
    price: 25,
    ticketStatus: 'none'
  }
];

mockEvents.push(...moreMockEvents);

interface EventStore {
  events: Event[];
  filteredEvents: Event[];
  selectedTag: string | null;
  loadEvents: () => void;
  filterByTag: (tag: string | null) => void;
  addEvent: (event: Omit<Event, 'id' | 'attendees' | 'isRSVPed' | 'likes' | 'isLiked' | 'ticketStatus'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  toggleRSVP: (id: string) => void;
  toggleLike: (id: string) => void;
  purchaseTicket: (id: string) => Promise<void>;
  syncMockEventsToDatabase: () => Promise<void>;
  loadEventsFromDatabase: () => Promise<void>;
  resetEventsToMock: () => Promise<void>;
  getUserTickets: () => Promise<any[]>;
  hasUserPurchasedTicket: (eventId: string) => Promise<boolean>;
  updateEventAfterTicketPurchase: (eventId: string) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  filteredEvents: [],
  selectedTag: null,
  
  loadEvents: () => {
    set({ events: mockEvents, filteredEvents: mockEvents });
  },
  
  filterByTag: (tag: string | null) => {
    const { events } = get();
    if (!tag) {
      set({ filteredEvents: events, selectedTag: null });
    } else {
      const filtered = events.filter(event => 
        event.tags.some(eventTag => 
          eventTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      set({ filteredEvents: filtered, selectedTag: tag });
    }
  },
  
  addEvent: async (eventData) => {
    console.log('🎯 addEvent called with eventData:', eventData);
    console.log('📝 Event title check:', {
      title: eventData.title,
      titleType: typeof eventData.title,
      titleLength: eventData.title?.length,
      titleTrimmed: eventData.title?.trim(),
      titleTrimmedLength: eventData.title?.trim().length
    });
    
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      attendees: 0,
      isRSVPed: false,
      likes: 0,
      isLiked: false,
      ticketStatus: 'none',
      currency: eventData.currency || 'usd',
      isPaid: eventData.price !== null && eventData.price > 0,
    };
    
    console.log('🆕 New event created:', {
      id: newEvent.id,
      title: newEvent.title,
      isPaid: newEvent.isPaid,
      price: newEvent.price
    });
    
    // If this is a paid event, create Stripe product and price
    if (newEvent.isPaid && newEvent.price) {
      try {
        console.log('💳 Processing paid event for Stripe integration');
        console.log('📋 Event data for Stripe:', {
          title: newEvent.title,
          description: newEvent.description,
          image: newEvent.image,
          price: newEvent.price,
          currency: newEvent.currency
        });
        
        // Validate Stripe configuration first
        const isStripeValid = await stripeService.validateConfiguration();
        if (!isStripeValid) {
          console.warn('Stripe configuration invalid, skipping Stripe integration');
          // Continue without Stripe integration
        } else {
          console.log('✅ Stripe configuration valid, proceeding with integration');
          
          // Upload event image if it's a local file
          let uploadedImageUrl: string | undefined;
          if (newEvent.image && newEvent.image.startsWith('file://')) {
            console.log('📸 Uploading local image for Stripe product');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const uploadedUrl = await stripeService.uploadEventImage(
                newEvent.image,
                newEvent.id,
                user.id
              );
              if (uploadedUrl) {
                uploadedImageUrl = uploadedUrl;
                console.log('✅ Image uploaded successfully:', uploadedUrl);
              } else {
                console.log('⚠️ Image upload failed, continuing without image');
              }
            }
          } else if (newEvent.image) {
            console.log('📸 Using existing public image:', newEvent.image);
          }

          // Create Stripe product
          console.log('🔄 Creating Stripe product with data:', {
            title: newEvent.title,
            description: newEvent.description,
            image: newEvent.image,
            uploadedImageUrl: uploadedImageUrl
          });
          
          const product = await stripeService.createProduct({
            title: newEvent.title,
            description: newEvent.description,
            image: newEvent.image,
            uploadedImageUrl: uploadedImageUrl,
          });

          console.log('✅ Stripe product created:', product.id);

          // Create Stripe price
          console.log('💰 Creating Stripe price for product:', product.id);
          const price = await stripeService.createPrice(
            product.id,
            newEvent.price * 100, // Convert to cents
            newEvent.currency || 'usd'
          );

          console.log('✅ Stripe price created:', price.id);

          // Update event with Stripe IDs
          newEvent.stripeProductId = product.id;
          newEvent.stripePriceId = price.id;
          console.log('✅ Event updated with Stripe IDs:', {
            productId: product.id,
            priceId: price.id
          });
        }
      } catch (error) {
        console.error('Error creating Stripe product/price:', error);
        // Continue without Stripe integration if it fails
      }
    }
    
    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('events')
          .insert({
            id: newEvent.id,
            user_id: user.id,
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            start_time: newEvent.date,
            end_time: newEvent.date,
            image: newEvent.image,
            price: newEvent.price,
            currency: newEvent.currency,
            is_paid: newEvent.isPaid,
            stripe_product_id: newEvent.stripeProductId,
            stripe_price_id: newEvent.stripePriceId,
            max_attendees: newEvent.maxAttendees,
            tags: newEvent.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error saving event to database:', error);
        } else {
          console.log('Event saved to database:', newEvent.id);
        }
      }
    } catch (error) {
      console.error('Error saving event to database:', error);
    }

    // Update local state
    set((state) => ({
      events: [newEvent, ...state.events],
      filteredEvents: state.selectedTag 
        ? [newEvent, ...state.events].filter(event => 
            event.tags.some(eventTag => 
              eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
            )
          )
        : [newEvent, ...state.events],
    }));
  },
  
  updateEvent: (id, eventData) => set((state) => {
    const updatedEvents = state.events.map((event) =>
      event.id === id ? { ...event, ...eventData } : event
    );
    return {
      events: updatedEvents,
      filteredEvents: state.selectedTag 
        ? updatedEvents.filter(event => 
            event.tags.some(eventTag => 
              eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
            )
          )
        : updatedEvents,
    };
  }),
  
  deleteEvent: (id) => set((state) => {
    const updatedEvents = state.events.filter((event) => event.id !== id);
    return {
      events: updatedEvents,
      filteredEvents: state.selectedTag 
        ? updatedEvents.filter(event => 
            event.tags.some(eventTag => 
              eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
            )
          )
        : updatedEvents,
    };
  }),
  
  toggleRSVP: (id) => set((state) => {
    const updatedEvents = state.events.map((event) =>
      event.id === id
        ? {
            ...event,
            isRSVPed: !event.isRSVPed,
            attendees: event.isRSVPed ? event.attendees - 1 : event.attendees + 1,
          }
        : event
    );
    return {
      events: updatedEvents,
      filteredEvents: state.selectedTag 
        ? updatedEvents.filter(event => 
            event.tags.some(eventTag => 
              eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
            )
          )
        : updatedEvents,
    };
  }),
  
  toggleLike: (id) => set((state) => {
    const updatedEvents = state.events.map((event) =>
      event.id === id
        ? {
            ...event,
            isLiked: !event.isLiked,
            likes: event.isLiked ? event.likes - 1 : event.likes + 1,
          }
        : event
    );
    return {
      events: updatedEvents,
      filteredEvents: state.selectedTag 
        ? updatedEvents.filter(event => 
            event.tags.some(eventTag => 
              eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
            )
          )
        : updatedEvents,
    };
  }),
  
  purchaseTicket: async (id) => {
    console.log('purchaseTicket called with id:', id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const event = get().events.find(e => e.id === id);
      if (!event) {
        throw new Error('Event not found');
      }

      // Check if user already purchased a ticket
      const hasPurchased = await get().hasUserPurchasedTicket(id);
      if (hasPurchased) {
        console.log('User already purchased ticket for this event');
        return;
      }

      // For now, we'll just update the local state
      // In a real implementation, this would integrate with the PaymentModal
      set((state) => {
        console.log('Updating store for event:', id);
        const updatedEvents = state.events.map((event) =>
          event.id === id
            ? {
                ...event,
                ticketStatus: 'purchased' as const,
                attendees: event.attendees + 1,
              }
            : event
        );
        console.log('Store updated successfully');
        return {
          events: updatedEvents,
          filteredEvents: state.selectedTag 
            ? updatedEvents.filter(event => 
                event.tags.some(eventTag => 
                  eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
                )
              )
            : updatedEvents,
        };
      });
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      throw error;
    }
  },
  
  syncMockEventsToDatabase: async () => {
    try {
      console.log('=== SYNC MOCK EVENTS TO DATABASE START ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, skipping event sync');
        return;
      }

      console.log('Syncing mock events for user:', user.id);

      // Check which mock events already exist in the database globally
      const mockEventIds = mockEvents.map(e => e.id);
      const { data: existingEvents, error: fetchError } = await supabase
        .from('events')
        .select('id, user_id')
        .in('id', mockEventIds);

      if (fetchError) {
        console.error('Error fetching existing events:', fetchError);
        return;
      }

      const existingEventIds = new Set(existingEvents?.map(event => event.id) || []);
      const eventsToInsert = mockEvents.filter(event => !existingEventIds.has(event.id));

      if (eventsToInsert.length === 0) {
        console.log('All mock events already exist in database');
        
        // Check if any events exist but belong to different users
        const eventsForCurrentUser = existingEvents?.filter(event => event.user_id === user.id) || [];
        if (eventsForCurrentUser.length < mockEvents.length) {
          console.log('Some events exist but belong to different users, creating copies for current user');
          
          // Create copies of events that don't belong to current user
          const eventsToCopy = mockEvents.filter(event => 
            !existingEvents?.some(existing => existing.id === event.id && existing.user_id === user.id)
          );
          
          const eventsForDatabase = eventsToCopy.map(event => ({
            id: event.id,
            user_id: user.id,
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.date,
            end_time: event.date,
            image: event.image,
            attendees: event.attendees || 0,
            max_attendees: event.maxAttendees || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: copyError } = await supabase
            .from('events')
            .insert(eventsForDatabase);

          if (copyError) {
            console.error('Error copying events for current user:', copyError);
          } else {
            console.log('Successfully copied', eventsToCopy.length, 'events for current user');
          }
        }
        return;
      }

      console.log('Events to insert:', eventsToInsert.length);

      // Prepare events for database insertion
      const eventsForDatabase = eventsToInsert.map(event => ({
        id: event.id,
        user_id: user.id,
        title: event.title,
        description: event.description,
        location: event.location,
        start_time: event.date,
        end_time: event.date,
        image: event.image,
        attendees: event.attendees || 0,
        max_attendees: event.maxAttendees || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert events into database
      const { error: insertError } = await supabase
        .from('events')
        .insert(eventsForDatabase);

      if (insertError) {
        console.error('Error inserting events:', insertError);
        return;
      }

      console.log('Successfully synced', eventsToInsert.length, 'events to database');
      console.log('=== SYNC MOCK EVENTS TO DATABASE COMPLETE ===');
    } catch (error) {
      console.error('Error syncing mock events to database:', error);
    }
  },

  loadEventsFromDatabase: async () => {
    try {
      console.log('=== LOAD EVENTS FROM DATABASE START ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, clearing events');
        set({ events: [], filteredEvents: [] });
        return;
      }

      const { data: dbEvents, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading events from database:', error);
        // Fallback to empty list on error
        set({ events: [], filteredEvents: [] });
        return;
      }

      if (dbEvents && dbEvents.length > 0) {
        // Convert database events to app format
        const appEvents: Event[] = dbEvents.map(dbEvent => {
          // Check if this is one of our mock events to preserve their data
          const mockEvent = mockEvents.find(mock => mock.id === dbEvent.id);
          
          if (mockEvent) {
            // Use mock event data for visual elements but database data for core info
            return {
              ...mockEvent,
              title: dbEvent.title,
              description: dbEvent.description,
              date: new Date(dbEvent.start_time),
              location: dbEvent.location,
              // Preserve mock event's visual data
              image: mockEvent.image,
              organizerAvatar: mockEvent.organizerAvatar,
              tags: mockEvent.tags,
              price: mockEvent.price,
              attendees: dbEvent.attendees || mockEvent.attendees, // Use database attendees count
              likes: mockEvent.likes,
              isLiked: mockEvent.isLiked,
              isRSVPed: mockEvent.isRSVPed,
              maxAttendees: dbEvent.max_attendees || mockEvent.maxAttendees, // Use database max attendees
              ticketStatus: mockEvent.ticketStatus,
            };
          } else {
            // For new events created by user, use default values
            return {
              id: dbEvent.id,
              title: dbEvent.title,
              description: dbEvent.description,
              date: new Date(dbEvent.start_time),
              time: format(new Date(dbEvent.start_time), 'h:mm a') + ' - ' + format(new Date(dbEvent.end_time), 'h:mm a'),
              location: dbEvent.location,
              organizer: 'You', // Default organizer for user's events
              attendees: dbEvent.attendees || 0, // Use database attendees count
              isRSVPed: false,
              likes: 0,
              isLiked: false,
              tags: [], // You might want to add a tags column to the database
              price: null,
              ticketStatus: 'none',
              image: dbEvent.image, // Load image from database
              maxAttendees: dbEvent.max_attendees || null, // Use database max attendees
            };
          }
        });

        set({ events: appEvents, filteredEvents: appEvents });
        console.log('Loaded', appEvents.length, 'events from database');
      } else {
        // No events in database, show empty list
        set({ events: [], filteredEvents: [] });
        console.log('No events in database, showing empty list');
      }

      console.log('=== LOAD EVENTS FROM DATABASE COMPLETE ===');
    } catch (error) {
      console.error('Error loading events from database:', error);
      // Fallback to empty list on error
      set({ events: [], filteredEvents: [] });
    }
  },

  resetEventsToMock: async () => {
    try {
      console.log('=== RESET EVENTS TO MOCK START ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not logged in, skipping reset');
        return;
      }

      console.log('Resetting events for user:', user.id);

      // Clear all events from database
      const { error: clearError } = await supabase
        .from('events')
        .delete()
        .eq('user_id', user.id);

      if (clearError) {
        console.error('Error clearing events from database:', clearError);
        return;
      }

      console.log('Successfully cleared events from database');
      console.log('=== RESET EVENTS TO MOCK COMPLETE ===');

      // Reset to mock events
      set({ events: mockEvents, filteredEvents: mockEvents });
    } catch (error) {
      console.error('Error resetting events to mock:', error);
    }
  },

  getUserTickets: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }
      return await stripeService.getUserTickets(user.id);
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  },

  hasUserPurchasedTicket: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }
      return await stripeService.hasUserPurchasedTicket(user.id, eventId);
    } catch (error) {
      console.error('Error checking ticket purchase:', error);
      return false;
    }
  },

  updateEventAfterTicketPurchase: async (eventId: string) => {
    try {
      // Update local state immediately for responsive UI
      set((state) => {
        const updatedEvents = state.events.map((event) =>
          event.id === eventId
            ? {
                ...event,
                attendees: event.attendees + 1,
                ticketStatus: 'purchased' as const,
              }
            : event
        );
        
        return {
          events: updatedEvents,
          filteredEvents: state.selectedTag 
            ? updatedEvents.filter(event => 
                event.tags.some(eventTag => 
                  eventTag.toLowerCase().includes(state.selectedTag!.toLowerCase())
                )
              )
            : updatedEvents,
        };
      });

      // Update database attendees count
      try {
        const { error } = await supabase
          .rpc('increment_event_attendees', { event_id: eventId });

        if (error) {
          console.error('Error updating attendees count in database:', error);
          // If the function doesn't exist, log a helpful message
          if (error.message?.includes('Could not find the function')) {
            console.log('Database migration not run yet. Run the migration to enable persistent attendees tracking.');
          }
        } else {
          console.log('Successfully updated attendees count in database for event:', eventId);
        }
      } catch (dbError) {
        console.error('Database update failed, but local state was updated:', dbError);
        console.log('Run the database migration to enable persistent attendees tracking.');
      }
    } catch (error) {
      console.error('Error in updateEventAfterTicketPurchase:', error);
    }
  },
})); 