import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { Ticket as TicketIcon, Clock, MapPin } from 'lucide-react-native';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Event } from '@/types/database';

type TicketWithEvent = Ticket & {
  events: Event | null;
};

// Moved mockEvents outside the component for performance
const mockEvents = [
  { id: '550e8400-e29b-41d4-a716-446655440001', time: '6:00 PM - 9:00 PM' },
  { id: '550e8400-e29b-41d4-a716-446655440002', time: '8:00 AM - 5:00 PM' },
  { id: '550e8400-e29b-41d4-a716-446655440003', time: '7:00 PM - 10:00 PM' },
  { id: '550e8400-e29b-41d4-a716-446655440004', time: '9:00 AM - 4:00 PM' },
  { id: '550e8400-e29b-41d4-a716-446655440005', time: '7:00 PM - 9:00 PM' },
  { id: '550e8400-e29b-41d4-a716-446655440006', time: '6:00 PM - 9:00 PM' },
];

const MyTicketsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(
            `
            *,
            events (*)
          `
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setTickets(data as TicketWithEvent[]);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  // Close any overlays when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // This will run when the screen comes into focus
      // Force close any remaining overlays or modals
      console.log('My Tickets screen focused - ensuring overlays are closed');
      
      // You can add additional cleanup logic here if needed
      // For example, if you have global modal states, you can reset them here
      
      return () => {
        // Cleanup when screen loses focus
        console.log('My Tickets screen losing focus');
      };
    }, [])
  );

  const renderTicketItem = ({ item }: { item: TicketWithEvent }) => {
    const mockEvent = mockEvents.find(mock => mock.id === item.events?.id);
    const eventTime = mockEvent?.time || 'Time TBD';

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => router.push(`/my-ticket/${item.id}`)}
      >
        {item.events?.image && (
          <Image source={{ uri: item.events.image }} style={styles.eventImage} />
        )}
        <View style={styles.ticketInfo}>
          <Text style={styles.eventName}>{item.events?.title}</Text>
          {item.events?.start_time && (
            <Text style={styles.eventDate}>
              {format(new Date(item.events.start_time), 'eeee, MMM d, yyyy')}
            </Text>
          )}
          <View style={styles.eventTimeContainer}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.eventTime}>{eventTime}</Text>
          </View>
          {item.events?.location && (
            <View style={styles.eventLocationContainer}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.eventLocation}>{item.events.location}</Text>
            </View>
          )}
          <View style={styles.ticketTypeContainer}>
            <TicketIcon size={16} color={Colors.primary} />
            <Text style={styles.ticketType}>{item.ticket_type}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Tickets' }} />
      <Text style={styles.title}>My Tickets</Text>
      <FlatList
        data={tickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tickets yet.</Text>
            <Text style={styles.emptySubtext}>
              Your purchased tickets will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  eventImage: {
    height: 120,
    width: '100%',
  },
  ticketInfo: {
    padding: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  ticketTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '50%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
});

export default MyTicketsScreen; 