import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Calendar,
  MapPin,
  ChevronRight,
  Share2,
  AlertCircle,
  Download,
  XCircle,
  FileText,
  Info,
  User,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Event } from '@/types/database';
import { walletService, WalletPassData } from '@/lib/walletService';

const { width } = Dimensions.get('window');

type TicketWithEvent = Ticket & {
  events: Event | null;
};

const MyTicketScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketWithEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock events data to get additional details
  const mockEvents = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Legal Networking Mixer',
      time: '6:00 PM - 9:00 PM',
      organizer: 'Atlanta Bar Association',
      organizerAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 1250,
      events: 89,
      hostingYears: 15,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Medical Conference 2024',
      time: '8:00 AM - 5:00 PM',
      organizer: 'Georgia Medical Association',
      organizerAvatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 3200,
      events: 156,
      hostingYears: 25,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Startup Pitch Night',
      time: '7:00 PM - 10:00 PM',
      organizer: 'Atlanta Tech Village',
      organizerAvatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 890,
      events: 67,
      hostingYears: 8,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Digital Marketing Summit',
      time: '9:00 AM - 4:00 PM',
      organizer: 'Marketing Pro Group',
      organizerAvatar: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 2100,
      events: 134,
      hostingYears: 12,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      title: 'Real Estate Investors Meetup',
      time: '7:00 PM - 9:00 PM',
      organizer: 'Orlando REI Club',
      organizerAvatar: 'https://images.pexels.com/photos/1615776/pexels-photo-1615776.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 650,
      events: 45,
      hostingYears: 6,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      title: 'Orlando Art & Wine Stroll',
      time: '6:00 PM - 9:00 PM',
      organizer: 'City of Orlando',
      organizerAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      image: 'https://images.pexels.com/photos/14840714/pexels-photo-14840714.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
      followers: 1800,
      events: 78,
      hostingYears: 10,
    }
  ];

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            events (*)
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setTicket(data as TicketWithEvent);
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ticket || !ticket.events) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  // Find the corresponding mock event data
  const mockEvent = mockEvents.find(mock => mock.id === ticket.events?.id);
  const eventTime = mockEvent?.time || 'Time TBD';
  const eventImage = mockEvent?.image || ticket.events?.image;
  const organizerName = mockEvent?.organizer || 'Event Organizer';
  const organizerAvatar = mockEvent?.organizerAvatar;
  const followers = mockEvent?.followers || 0;
  const events = mockEvent?.events || 0;
  const hostingYears = mockEvent?.hostingYears || 0;

  const startTime = ticket.events?.start_time ? new Date(ticket.events.start_time) : new Date();
  const endTime = ticket.events?.end_time ? new Date(ticket.events.end_time) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  // Platform-aware wallet handler
  const handleAddToWallet = async () => {
    if (!ticket || !ticket.events) {
      Alert.alert('Error', 'Ticket data not available');
      return;
    }

    const passData: WalletPassData = {
      eventName: ticket.events.title,
      eventDate: startTime,
      eventLocation: ticket.events.location || undefined,
      ticketType: ticket.ticket_type,
      ticketId: ticket.id,
      organizerName: organizerName,
      eventImage: eventImage || undefined,
      eventTime: eventTime || undefined,
      price: ticket.ticket_type === 'paid' ? 'Paid' : 'Free',
    };

    const success = await walletService.addToWallet(passData);
    
    if (success) {
      Alert.alert(
        'Success',
        `Ticket added to ${walletService.getWalletName()} successfully!`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerRight: () => (
            <TouchableOpacity style={{ paddingRight: 16 }}>
              <Share2 size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Ticket Card */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.ticketDate}>{format(startTime, 'MMM d')}</Text>
              <Text style={styles.ticketTime}>{format(startTime, 'h:mma')}</Text>
            </View>
            {eventImage && (
              <Image source={{ uri: eventImage }} style={styles.eventImage} />
            )}
          </View>
          <Text style={styles.eventName}>{ticket.events.title}</Text>
          <Text style={styles.ticketHolder}>
            {`${user?.email?.split('@')[0] || 'User'} · Ticket 1 of 1 · ${ticket.ticket_type === 'free' ? 'Free' : 'Paid'}`}
          </Text>
          <TouchableOpacity style={styles.walletButton} onPress={handleAddToWallet}>
            <Ionicons name="wallet" size={20} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.walletButtonText}>
              Add to {walletService.getWalletName()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Date and time</Text>
            <Text style={styles.detailText}>
              {`${format(startTime, 'E, MMM d, yyyy, h:mma')} - ${format(endTime, 'h:mma')}`}
            </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Add to calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Location</Text>
            <Text style={styles.detailText}>{ticket.events.location || 'Location TBD'}</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>View map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions List */}
        <View style={styles.actionsContainer}>
          <ActionRow icon={<FileText size={24} color={Colors.textSecondary} />} text="Event details" />
          <ActionRow icon={<Info size={24} color={Colors.textSecondary} />} text="Order details" />
          <ActionRow icon={<Download size={24} color={Colors.textSecondary} />} text="Download ticket" />
          <ActionRow icon={<Ionicons name="ticket-outline" size={24} color={Colors.textSecondary} />} text="Ticket information" />
          <ActionRow icon={<XCircle size={24} color={Colors.textSecondary} />} text="Cancel order" />
          <ActionRow icon={<AlertCircle size={24} color={Colors.textSecondary} />} text="Report event" isLast />
        </View>

        {/* Organizer Section */}
        <View style={styles.organizerSection}>
          <Text style={styles.organizerTitle}>Organized by</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar}>
              {organizerAvatar ? (
                <Image source={{ uri: organizerAvatar }} style={styles.organizerImage} />
              ) : (
                <User size={24} color={Colors.textSecondary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.organizerName}>{organizerName}</Text>
              <View style={styles.organizerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{events}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{hostingYears}</Text>
                  <Text style={styles.statLabel}>Hosting</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.organizerButtons}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const ActionRow = ({ icon, text, isLast = false }: { icon: React.ReactNode; text: string; isLast?: boolean }) => (
  <TouchableOpacity style={[styles.actionRow, isLast && styles.actionRowLast]}>
    {icon}
    <Text style={styles.actionRowText}>{text}</Text>
    <ChevronRight size={20} color={Colors.textLight} />
  </TouchableOpacity>
);

export default MyTicketScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: Colors.white,
    padding: 20,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  ticketTime: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  ticketHolder: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  walletButton: {
    backgroundColor: Colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  walletButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginTop: -8, // Slight overlap
    paddingTop: 28, // Adjust for overlap
  },
  detailBlock: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 6,
  },
  actionsContainer: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionRowText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  organizerSection: {
    marginHorizontal: 16,
  },
  organizerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  organizerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  organizerStats: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  organizerButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  followButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactButton: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});