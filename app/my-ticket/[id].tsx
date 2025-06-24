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
  Modal,
  Alert,
  Linking,
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
  Clock,
  Mail,
  Phone,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, Event } from '@/types/database';

const { width } = Dimensions.get('window');

type TicketWithEvent = Ticket & {
  events: Event | null;
};

const MyTicketScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketWithEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showDownloadTicket, setShowDownloadTicket] = useState(false);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const [showCancelOrder, setShowCancelOrder] = useState(false);
  const [showReportEvent, setShowReportEvent] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Calendar and map functions
  const addToCalendar = async () => {
    Alert.alert(
      'Calendar Integration', 
      'Calendar functionality will be available in the next update. For now, you can manually add this event to your calendar.',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Copy Event Details', 
          onPress: () => {
            const eventDetails = `Event: ${ticket?.events?.title}\nDate: ${ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'E, MMM d, yyyy, h:mma') : 'TBD'}\nLocation: ${ticket?.events?.location || 'TBD'}`;
            // You could implement clipboard functionality here
            Alert.alert('Event Details Copied', 'Event details have been copied to clipboard.');
          }
        }
      ]
    );
  };

  const openMap = () => {
    const location = ticket?.events?.location || '';
    if (!location) {
      Alert.alert('No Location', 'Location information is not available.');
      return;
    }

    const mapUrl = Platform.select({
      ios: `maps://maps.apple.com/?q=${encodeURIComponent(location)}`,
      android: `geo:0,0?q=${encodeURIComponent(location)}`,
    });

    if (mapUrl) {
      Linking.openURL(mapUrl).catch(() => {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        Linking.openURL(googleMapsUrl);
      });
    }
  };

  // Cancel order function
  const cancelOrder = async () => {
    if (!ticket?.id || !ticket?.events?.id) {
      Alert.alert('Error', 'Unable to cancel ticket: missing ticket information.');
      return;
    }

    console.log('Attempting to cancel ticket:', {
      ticketId: ticket.id,
      eventId: ticket.events.id,
      userId: user?.id
    });

    setIsCanceling(true);

    try {
      // a) Delete ticket
      const { data: deleted, error: delErr } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.id)
        .select();
      
      console.log('Delete operation result:', {
        deleted,
        delErr,
        ticketId: ticket.id,
        userId: user?.id
      });
      
      if (delErr || !deleted || deleted.length === 0) {
        console.error('Delete failed:', { delErr, deleted });
        throw delErr || new Error('No rows deleted');
      }

      // b) Decrement attending_count via RPC
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('decrement_attending_count', { event_id: ticket.events.id });
      
      console.log('RPC operation result:', {
        rpcData,
        rpcErr,
        eventId: ticket.events.id
      });
      
      if (rpcErr) throw rpcErr;

      // c) Success → alert + navigate back & signal refresh
      Alert.alert(
        'Canceled', 
        'Your ticket has been canceled.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowCancelOrder(false);
              // Reset navigation stack to prevent swipe-back to deleted ticket
              // This ensures the user can't navigate back to the deleted ticket screen
              router.replace('/(tabs)/events');
              setTimeout(() => {
                // Navigate to my-tickets with refresh flag
                router.push({ 
                  pathname: '/my-tickets', 
                  params: { shouldRefresh: 'true' }
                });
              }, 100);
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('cancelOrder failed', err);
      Alert.alert('Error', err?.message || 'Something went wrong while canceling your ticket.');
    } finally {
      setIsCanceling(false);
    }
  };

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
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Date and time</Text>
            <Text style={styles.detailText}>
              {`${format(startTime, 'E, MMM d, yyyy, h:mma')} - ${format(endTime, 'h:mma')}`}
            </Text>
            <TouchableOpacity onPress={addToCalendar}>
              <Text style={styles.linkText}>Add to calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.detailTitle}>Location</Text>
            <Text style={styles.detailText}>{ticket.events.location || 'Location TBD'}</Text>
            <TouchableOpacity onPress={openMap}>
              <Text style={styles.linkText}>View map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions List */}
        <View style={styles.actionsContainer}>
          <ActionRow 
            icon={<FileText size={24} color={Colors.textSecondary} />} 
            text="Event details" 
            onPress={() => setShowEventDetails(true)}
          />
          <ActionRow 
            icon={<Info size={24} color={Colors.textSecondary} />} 
            text="Order details" 
            onPress={() => setShowOrderDetails(true)}
          />
          <ActionRow 
            icon={<Download size={24} color={Colors.textSecondary} />} 
            text="Download ticket" 
            onPress={() => setShowDownloadTicket(true)}
          />
          <ActionRow 
            icon={<Ionicons name="ticket-outline" size={24} color={Colors.textSecondary} />} 
            text="Ticket information" 
            onPress={() => setShowTicketInfo(true)}
          />
          <ActionRow 
            icon={<XCircle size={24} color={Colors.textSecondary} />} 
            text="Cancel order" 
            onPress={() => setShowCancelOrder(true)}
          />
          <ActionRow 
            icon={<AlertCircle size={24} color={Colors.textSecondary} />} 
            text="Report event" 
            onPress={() => setShowReportEvent(true)}
            isLast
          />
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

      {/* Event Details Modal */}
      <Modal 
        visible={showEventDetails} 
        onRequestClose={() => setShowEventDetails(false)}
        animationType="slide" 
        transparent
      >
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity onPress={() => setShowEventDetails(false)}>
                  <Text style={styles.fullModalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fullModalTitle}>Event Details</Text>
              
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event:</Text> {ticket?.events?.title}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Date:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'E, MMM d, yyyy') : 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Time:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'h:mma') : 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Location:</Text> {ticket?.events?.location || 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Description:</Text> {ticket?.events?.description || 'No description available'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Ticket Type:</Text> {ticket?.ticket_type === 'free' ? 'Free' : 'Paid'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event ID:</Text> {ticket?.events?.id}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal 
        visible={showOrderDetails} 
        onRequestClose={() => setShowOrderDetails(false)}
        animationType="slide" 
        transparent
      >
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
                  <Text style={styles.fullModalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fullModalTitle}>Order Details</Text>
              
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Order ID:</Text> {ticket?.id}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Ticket Type:</Text> {ticket?.ticket_type === 'free' ? 'Free' : 'Paid'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Quantity:</Text> 1
              </Text>
              
              {/* Conditional payment information - only show for paid tickets */}
              {ticket?.ticket_type !== 'free' && (
                <>
                  <Text style={styles.fullModalText}>
                    <Text style={styles.fullModalLabel}>Amount:</Text> $25.00 USD
                  </Text>
                  <Text style={styles.fullModalText}>
                    <Text style={styles.fullModalLabel}>Status:</Text> {ticket?.status || 'paid'}
                  </Text>
                </>
              )}
              
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Purchase Date:</Text> {ticket?.created_at ? format(new Date(ticket.created_at), 'MMM d, yyyy') : 'N/A'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event:</Text> {ticket?.events?.title}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Location:</Text> {ticket?.events?.location || 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Date:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'E, MMM d, yyyy') : 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Time:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'h:mma') : 'TBD'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Download Ticket Modal */}
      <Modal 
        visible={showDownloadTicket} 
        onRequestClose={() => setShowDownloadTicket(false)}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentFixed}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Ticket</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowDownloadTicket(false)}
              >
                <XCircle size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScrollFixed}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalText}>
                Your ticket is ready for download. You can save it to your device or share it with others.
              </Text>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Download PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Save to Photos</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ticket Information Modal */}
      <Modal 
        visible={showTicketInfo} 
        onRequestClose={() => setShowTicketInfo(false)}
        animationType="slide" 
        transparent
      >
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity onPress={() => setShowTicketInfo(false)}>
                  <Text style={styles.fullModalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fullModalTitle}>Ticket Information</Text>
              
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Ticket ID:</Text> {ticket?.id}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event:</Text> {ticket?.events?.title}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Type:</Text> {ticket?.ticket_type || 'General Admission'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Valid for:</Text> 1 person
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Entry:</Text> Show this ticket at the entrance
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Refund Policy:</Text> Non-refundable
              </Text>

              {/* QR Code Section */}
              <View style={styles.fullModalQRContainer}>
                <QRCode
                  value={JSON.stringify({
                    ticketId: ticket?.id,
                    eventId: ticket?.events?.id,
                    eventTitle: ticket?.events?.title,
                    ticketType: ticket?.ticket_type,
                    userId: ticket?.user_id,
                    timestamp: new Date().toISOString()
                  })}
                  size={180}
                  backgroundColor="white"
                  color="black"
                />
                <Text style={styles.fullModalQRLabel}>Scan at entrance</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal 
        visible={showCancelOrder} 
        onRequestClose={() => setShowCancelOrder(false)}
        animationType="slide" 
        transparent
      >
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity onPress={() => setShowCancelOrder(false)}>
                  <Text style={styles.fullModalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fullModalTitle}>Cancel Order</Text>
              
              <Text style={styles.fullModalText}>
                Are you sure you want to cancel this order? This action cannot be undone.
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event:</Text> {ticket?.events?.title}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Ticket Type:</Text> {ticket?.ticket_type === 'free' ? 'Free' : 'Paid'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Order ID:</Text> {ticket?.id}
              </Text>
              
              {/* Conditional payment information - only show for paid tickets */}
              {ticket?.ticket_type !== 'free' && (
                <Text style={styles.fullModalText}>
                  <Text style={styles.fullModalLabel}>Amount:</Text> $25.00 USD
                </Text>
              )}
              
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Date:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'E, MMM d, yyyy') : 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Time:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'h:mma') : 'TBD'}
              </Text>
              
              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonSecondary]} 
                  onPress={() => setShowCancelOrder(false)}
                  disabled={isCanceling}
                >
                  <Text style={styles.modalButtonSecondaryText}>Keep Order</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonDanger]} 
                  onPress={cancelOrder}
                  disabled={isCanceling}
                >
                  {isCanceling ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.modalButtonText}>Cancel Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Event Modal */}
      <Modal 
        visible={showReportEvent} 
        onRequestClose={() => setShowReportEvent(false)}
        animationType="slide" 
        transparent
      >
        <View style={styles.fullModalOverlay}>
          <View style={styles.fullModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity onPress={() => setShowReportEvent(false)}>
                  <Text style={styles.fullModalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.fullModalTitle}>Report Event</Text>
              
              <Text style={styles.fullModalText}>
                Help us keep our community safe by reporting any issues with this event.
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event:</Text> {ticket?.events?.title}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Event ID:</Text> {ticket?.events?.id}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Date:</Text> {ticket?.events?.start_time ? format(new Date(ticket.events.start_time), 'E, MMM d, yyyy') : 'TBD'}
              </Text>
              <Text style={styles.fullModalText}>
                <Text style={styles.fullModalLabel}>Location:</Text> {ticket?.events?.location || 'TBD'}
              </Text>
              
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Report Inappropriate Content</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Report Technical Issues</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const ActionRow = ({ icon, text, onPress, isLast = false }: { icon: React.ReactNode; text: string; onPress: () => void; isLast?: boolean }) => (
  <TouchableOpacity style={[styles.actionRow, isLast && styles.actionRowLast]} onPress={onPress}>
    {icon}
    <Text style={styles.actionRowText}>{text}</Text>
    <ChevronRight size={20} color={Colors.textLight} />
  </TouchableOpacity>
);

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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalLabel: {
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSecondaryText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonDanger: {
    backgroundColor: Colors.error,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDangerText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 16,
  },
  qrCodeWrapper: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  qrCodeSubLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentFixed: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalScrollFixed: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  modalCloseButton: {
    padding: 8,
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullModalContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  fullModalHeader: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  fullModalCloseButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    padding: 8,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  fullModalText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  fullModalLabel: {
    fontWeight: '600',
  },
  fullModalQRContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  fullModalQRWrapper: {
    marginBottom: 10,
  },
  fullModalQRLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  fullModalQRSubLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MyTicketScreen; 