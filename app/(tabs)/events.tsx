import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Alert,
  Platform,
  Dimensions,
  Share,
  RefreshControl,
  ImageBackground,
  Animated,
  ToastAndroid,
} from 'react-native';
import { Plus, Calendar, MapPin, Clock, Users, Share2, Heart, X, Filter, Search } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { useUserStore } from '@/store/userStore';
import { useEventStore } from '@/store/eventStore';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PaymentModal from '@/components/PaymentModal';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { supabase } from '@/lib/supabase';

const { height: screenHeight } = Dimensions.get('window');

interface Event {
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
  ticketStatus?: 'none' | 'reserved' | 'purchased';
}

const FEATURED_TAGS = ['All', 'Networking', 'Tech', 'Business', 'Social', 'Workshop', 'Art'];

const EventCard = ({ event, onpress, onShare, onLike }: { event: Event, onpress: (event: Event) => void, onShare: (event: Event) => void, onLike: (eventId: string) => void }) => (
  <TouchableOpacity
    style={styles.eventCard}
    onPress={() => onpress(event)}
  >
    <Image
      source={{ uri: event.image }}
      style={styles.eventImage}
      resizeMode="cover"
    />
    <View style={styles.eventContent}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            {event.price === null ? 'Free' : `$${event.price}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={Colors.gray} />
          <Text style={styles.detailText}>
            {format(event.date, 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color={Colors.gray} />
          <Text style={styles.detailText}>{event.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color={Colors.gray} />
          <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
        </View>
      </View>
      
      <View style={styles.eventFooter}>
        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Users size={16} color={Colors.gray} />
            <Text style={styles.statText}>
              {event.attendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
            </Text>
          </View>
          <View style={styles.statItem}>
            <Heart
              size={16}
              color={event.isLiked ? Colors.primary : Colors.gray}
              fill={event.isLiked ? Colors.primary : 'none'}
            />
            <Text style={[styles.statText, event.isLiked && styles.statTextActive]}>
              {event.likes} likes
            </Text>
          </View>
        </View>
        
        <View style={styles.eventActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(event)}
          >
            <Share2 size={16} color={Colors.gray} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(event.id)}
          >
            <Heart
              size={16}
              color={event.isLiked ? Colors.primary : Colors.gray}
              fill={event.isLiked ? Colors.primary : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const EventsListHeader = ({ onCreateEvent, onFilter, selectedTag, onShowMenu, onDebugProfileSetup, onDebugSyncEvents }: { 
  onCreateEvent: () => void, 
  onFilter: (tag: string | null) => void, 
  selectedTag: string | null, 
  onShowMenu: () => void,
  onDebugProfileSetup: () => void,
  onDebugSyncEvents: () => void
}) => (
  <>
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onDebugProfileSetup} style={styles.debugButton}>
            <Ionicons name="bug-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDebugSyncEvents} style={styles.debugButton}>
            <Ionicons name="sync-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShowMenu} style={styles.menuButton}>
            <Ionicons name="reorder-three-outline" size={34} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.createEventBtn}
        onPress={onCreateEvent}
        activeOpacity={0.85}
      >
        <Plus size={22} color={'#fff'} />
        <Text style={styles.createEventBtnText}>Create Event</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.discoverBanner}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/1707820/pexels-photo-1707820.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
        style={styles.bannerImage}
        resizeMode="cover"
      >
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Discover Events Near You</Text>
          <Text style={styles.bannerSubtitle}>📍 Events near Orlando, FL</Text>
        </View>
      </ImageBackground>
    </View>

    <View style={styles.filterContainer}>
      <Text style={styles.featuredTagsTitle}>Featured Tags</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollView}>
        {FEATURED_TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagChip,
              (selectedTag === tag || (tag === 'All' && !selectedTag)) && styles.tagChipSelected
            ]}
            onPress={() => onFilter(tag === 'All' ? null : tag)}
          >
            <Text style={[
              styles.tagChipText,
              (selectedTag === tag || (tag === 'All' && !selectedTag)) && styles.tagChipTextSelected
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </>
);

export default function EventsScreen() {
  const { profile, isLoaded, loadProfile, checkProfileSetup, syncWithSupabase } = useUserStore();
  const { filteredEvents, selectedTag, filterByTag, toggleRSVP, toggleLike, updateEventAfterTicketPurchase, loadEventsFromDatabase, syncMockEventsToDatabase } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [localSelectedTag, setLocalSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [hasCheckedProfileSetup, setHasCheckedProfileSetup] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user } = useAuth();

  // Check profile setup on first visit
  useEffect(() => {
    const checkProfile = async () => {
      if (user?.id && !hasCheckedProfileSetup) {
        const isProfileSetup = await checkProfileSetup(user.id);
        if (!isProfileSetup) {
          setShowProfileSetup(true);
        }
        setHasCheckedProfileSetup(true);
      }
    };

    if (isLoaded && user?.id) {
      checkProfile();
    }
  }, [isLoaded, user?.id, hasCheckedProfileSetup, checkProfileSetup]);

  // Load profile on mount
  useEffect(() => {
    if (!isLoaded) {
      loadProfile();
    }
  }, [isLoaded, loadProfile]);

  useEffect(() => {
    loadEventsFromDatabase();
  }, [user]);

  // Sync mock events to database on first load
  useEffect(() => {
    const syncEvents = async () => {
      if (user?.id) {
        await syncMockEventsToDatabase();
        await loadEventsFromDatabase();
      }
    };
    syncEvents();
  }, [user?.id]);

  // Sync local selected tag with store selected tag
  useEffect(() => {
    setLocalSelectedTag(selectedTag);
  }, [selectedTag]);

  // Cleanup function to close menu when component unmounts
  useEffect(() => {
    return () => {
      setMenuVisible(false);
    };
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadEventsFromDatabase();
    setRefreshing(false);
  }, []);

  const handleRSVP = (eventId: string) => {
    toggleRSVP(eventId);
  };

  const handleLike = (eventId: string) => {
    toggleLike(eventId);
  };

  const handleShare = async (event: Event) => {
    const shareText = `Check out this event: ${event.title}\n${format(event.date, 'MMM d, yyyy')} at ${event.time}\n${event.location}`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: event.title,
            text: shareText,
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          Alert.alert('Copied', 'Event details copied to clipboard');
        }
      } else {
        await Share.share({
          message: shareText,
          title: event.title,
        });
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Error', 'Failed to share event. Please try again.');
    }
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = () => {
    if (user) {
      router.push('/events/create');
    } else {
      router.push('/auth');
    }
  };

  const handlePurchaseTicket = async (event: Event) => {
    if (!profile || !user) {
      Alert.alert(
        'Login Required',
        'Please log in to purchase tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    // Ensure events are synced to database before purchasing tickets
    try {
      await syncMockEventsToDatabase();
    } catch (error) {
      console.error('Error syncing events before ticket purchase:', error);
    }

    // For free events, create ticket directly
    if (event.price === null || event.price === 0) {
      try {
        const { error } = await supabase.from('tickets').insert({
          user_id: user.id,
          event_id: event.id,
          ticket_type: 'free',
          status: 'paid', // Free tickets are immediately paid
          amount: 0, // Free tickets have 0 amount
          currency: 'usd',
        });

        if (error) throw error;

        await updateEventAfterTicketPurchase(event.id);

        // Show success feedback with navigation options
        Alert.alert(
          'Purchase Successful',
          'Your free ticket has been claimed! 🎉',
          [
            {
              text: 'View My Tickets',
              onPress: () => router.push('/my-tickets'),
            }
          ]
        );

        // Android toast (optional)
        if (Platform.OS === 'android') {
          ToastAndroid.show('Free ticket claimed!', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error('Error claiming free ticket:', error);
        Alert.alert(
          'Error',
          'Failed to claim free ticket. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // For paid events, open the PaymentModal
      setSelectedEvent(event);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    
    if (selectedEvent && user) {
      try {
        // Create ticket record after successful payment
        const { error: ticketError } = await supabase.from('tickets').insert({
          user_id: user.id,
          event_id: selectedEvent.id,
          ticket_type: 'paid',
          status: 'paid', // Paid tickets are confirmed as paid
          amount: selectedEvent.price || 0, // Use event price or 0 as fallback
          currency: selectedEvent.currency || 'usd',
        });

        if (ticketError) throw ticketError;

        await updateEventAfterTicketPurchase(selectedEvent.id);
        
        // Show success feedback with navigation options
        Alert.alert(
          'Purchase Successful',
          'Your ticket has been booked! 🎉',
          [
            {
              text: 'View My Tickets',
              onPress: () => router.push('/my-tickets'),
            }
          ]
        );

        // Android toast (optional)
        if (Platform.OS === 'android') {
          ToastAndroid.show('Ticket Purchased!', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error('Error after payment:', error);
        Alert.alert(
          'Warning',
          'Payment successful, but there was an issue creating your ticket. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    }
    
    setSelectedEvent(null);
  };

  const handleProfileSetupComplete = async () => {
    setShowProfileSetup(false);
    // Reload profile from Supabase to get the new roles
    if (user?.id) {
      await syncWithSupabase(user.id);
    }
  };

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false);
    // Reset the checked state so it can be shown again later
    setHasCheckedProfileSetup(false);
    // Navigate to home tab using Expo Router
    router.push('/');
  };

  const handleDebugProfileSetup = async () => {
    // Reset the profile setup state to trigger the onboarding again
    setHasCheckedProfileSetup(false);
    setShowProfileSetup(true);
    
    // Optional: Reset the profile setup in Supabase for testing
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ is_setup: false })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error resetting profile setup:', error);
        } else {
          console.log('Profile setup reset for debugging');
          // Also force a sync to reflect the change
          await syncWithSupabase(user.id);
        }
      } catch (error) {
        console.error('Error resetting profile setup:', error);
      }
    }
  };

  const handleDebugSyncEvents = async () => {
    if (user?.id) {
      try {
        console.log('Forcing sync of mock events to database...');
        await syncMockEventsToDatabase();
        await loadEventsFromDatabase();
        console.log('Mock events synced to database successfully!');
      } catch (error) {
        console.error('Error syncing events:', error);
      }
    }
  };

  const handleNavigateToMyTickets = () => {
    setMenuVisible(false); // Close the menu first
    router.push('/my-tickets'); // Then navigate
  };

  // Animation functions
  const showMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  // Enhanced menu items with icons
  const getMenuItems = () => {
    const userRoles = profile?.roles || [];
    const isOrganizer = userRoles.includes('organizer');
    const isAttendee = userRoles.includes('attendee');

    console.log('User roles:', userRoles);
    console.log('Is organizer:', isOrganizer);
    console.log('Is attendee:', isAttendee);

    const menuItems: Array<{
      id: string;
      text: string;
      icon: string;
      action?: () => void;
      isSeparator?: boolean;
    }> = [];

    if (isOrganizer) {
      // Organizer menu items
      const organizerItems = [
        { id: 'dashboard', text: 'Dashboard Overview', icon: 'analytics-outline', action: () => { hideMenu(); router.push('/organizer/dashboard-overview'); } },
        { id: 'tickets', text: 'Tickets Sold', icon: 'ticket-outline', action: () => { hideMenu(); router.push('/organizer/tickets-sold'); } },
        { id: 'scan-tickets', text: 'Scan Tickets', icon: 'qr-code-outline', action: () => { hideMenu(); router.push('/scan'); } },
        { id: 'payments', text: 'Payments & Payouts', icon: 'card-outline', action: () => { hideMenu(); router.push('/organizer/payments-payouts'); } },
        { id: 'tax', text: 'Tax Documents', icon: 'document-text-outline', action: () => { hideMenu(); router.push('/organizer/tax-documents'); } },
        { id: 'bank', text: 'Bank Account Info', icon: 'business-outline', action: () => { hideMenu(); router.push('/organizer/bank-account'); } },
        { id: 'receipts', text: 'Receipts & Invoices', icon: 'receipt-outline', action: () => { hideMenu(); router.push('/organizer/receipts-invoices'); } },
        { id: 'settings', text: 'Organizer Settings', icon: 'settings-outline', action: () => { hideMenu(); router.push('/organizer/settings'); } }
      ];
      
      console.log('Organizer items:', organizerItems.map(item => item.text));
      menuItems.push(...organizerItems);
    }

    if (isAttendee) {
      // Attendee menu items
      menuItems.push(
        { id: 'mytickets', text: 'My Tickets', icon: 'ticket-outline', action: () => { hideMenu(); handleNavigateToMyTickets(); } }
      );
    }

    // If user has both roles, add a separator
    if (isOrganizer && isAttendee && menuItems.length > 1) {
      // Find the index of the first attendee-specific item
      const firstAttendeeItemIndex = menuItems.findIndex(item => item.id === 'mytickets');
      if (firstAttendeeItemIndex > -1) {
        menuItems.splice(firstAttendeeItemIndex, 0, { id: 'separator', text: '', icon: '', isSeparator: true });
      }
    }

    // Fallback: If no roles are set, show a simplified menu
    if (menuItems.length === 0) {
      console.log('No roles found, showing fallback menu');
      menuItems.push(
        { id: 'dashboard', text: 'Dashboard Overview', icon: 'analytics-outline', action: () => { hideMenu(); router.push('/organizer/dashboard-overview'); } },
        { id: 'tickets', text: 'Tickets Sold', icon: 'ticket-outline', action: () => { hideMenu(); router.push('/organizer/tickets-sold'); } },
        { id: 'scan-tickets', text: 'Scan Tickets', icon: 'qr-code-outline', action: () => { hideMenu(); router.push('/scan'); } },
        { id: 'payments', text: 'Payments & Payouts', icon: 'card-outline', action: () => { hideMenu(); router.push('/organizer/payments-payouts'); } },
        { id: 'mytickets', text: 'My Tickets', icon: 'ticket-outline', action: () => { hideMenu(); handleNavigateToMyTickets(); } },
        { id: 'settings', text: 'Settings', icon: 'settings-outline', action: () => { hideMenu(); router.push('/organizer/settings'); } }
      );
    }

    console.log('Generated menu items:', menuItems.length);
    return menuItems;
  };

  const EventDetailsModal = ({ event, visible, onClose }: { event: Event; visible: boolean; onClose: () => void }) => {
    const [hasTicket, setHasTicket] = useState(false);
    const { user } = useAuth();

    // Check for existing ticket when modal opens
    useEffect(() => {
      const checkExistingTicket = async () => {
        if (!user || !event) return;
        
        try {
          const { data, error } = await supabase
            .from('tickets')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', event.id)
            .single();
          
          setHasTicket(!!data);
        } catch (error) {
          // If no ticket found, single() throws an error, so we set hasTicket to false
          setHasTicket(false);
        }
      };

      if (visible && user) {
        checkExistingTicket();
      }
    }, [visible, user, event]);

    const handlePurchaseTicketInModal = () => {
      handlePurchaseTicket(event);
      onClose();
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.eventModalContainer}>
          <View style={styles.eventModalContent}>
            <ScrollView style={styles.modalScroll}>
              <Image
                source={{ uri: event.image }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              
              <View style={styles.eventModalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.eventModalTitle}>{event.title}</Text>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>
                      {event.price === null ? 'Free' : `$${event.price}`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.organizerInfo}>
                  {event.organizerAvatar && (
                    <Image
                      source={{ uri: event.organizerAvatar }}
                      style={styles.organizerAvatar}
                    />
                  )}
                  <Text style={styles.organizerName}>{event.organizer}</Text>
                </View>
              </View>

              <View style={styles.eventModalBody}>
                <Text style={styles.description}>{event.description}</Text>
                
                <View style={styles.eventModalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Calendar size={20} color={Colors.gray} />
                    <Text style={styles.detailText}>
                      {format(event.date, 'EEEE, MMMM d, yyyy')}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Clock size={20} color={Colors.gray} />
                    <Text style={styles.detailText}>{event.time}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <MapPin size={20} color={Colors.gray} />
                    <Text style={styles.detailText}>{event.location}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Users size={20} color={Colors.gray} />
                    <Text style={styles.detailText}>
                      {event.attendees} attending
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </Text>
                  </View>
                </View>

                {event.tags && event.tags.length > 0 && (
                  <View style={styles.statsContainer}>
                    {event.tags.map((tag, index) => (
                      <View key={index} style={styles.statItem}>
                        <Text style={styles.statText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.modalFooterButtons}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShare(event)}
                >
                  <Share2 size={20} color={Colors.white} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.ticketButton,
                    (event.ticketStatus === 'purchased' || hasTicket) && styles.ticketButtonPurchased
                  ]}
                  onPress={(event.ticketStatus === 'purchased' || hasTicket) ? undefined : handlePurchaseTicketInModal}
                  disabled={event.ticketStatus === 'purchased' || hasTicket}
                >
                  <Text style={styles.ticketButtonText}>
                    {(event.ticketStatus === 'purchased' || hasTicket)
                      ? 'Already Claimed'
                      : event.price === null
                      ? 'Get Free Ticket'
                      : `Buy Ticket - $${event.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => <EventCard event={item} onpress={openEventDetails} onShare={handleShare} onLike={handleLike} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <EventsListHeader
            onCreateEvent={handleCreateEvent}
            onFilter={filterByTag}
            selectedTag={localSelectedTag}
            onShowMenu={showMenu}
            onDebugProfileSetup={handleDebugProfileSetup}
            onDebugSyncEvents={handleDebugSyncEvents}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              {selectedTag ? `No events found for "${selectedTag}"` : 'No events yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTag 
                ? 'Try a different tag or clear the filter'
                : 'Be the first to create an event and start networking!'
              }
            </Text>
          </View>
        }
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          visible={showEventDetails}
          onClose={() => setShowEventDetails(false)}
        />
      )}

      {/* Payment Modal */}
      {selectedEvent && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          eventData={{
            id: selectedEvent.id,
            title: selectedEvent.title,
            price: selectedEvent.price || 0,
            currency: selectedEvent.currency || 'usd',
          }}
        />
      )}

      {/* Tag Filter Modal */}
      <Modal
        visible={showTagFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Tag</Text>
              <TouchableOpacity 
                onPress={() => setShowTagFilter(false)} 
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.tagItem,
                  localSelectedTag === null && styles.tagItemSelected
                ]}
                onPress={() => {
                  setLocalSelectedTag(null);
                }}
              >
                <Text style={[
                  styles.tagText,
                  localSelectedTag === null && styles.tagTextSelected
                ]}>
                  Show All Events
                </Text>
                {localSelectedTag === null && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {['Legal', 'Networking', 'Professional', 'Medical', 'Conference', 'CME', 'Startup', 'Pitch', 'Tech'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagItem,
                    localSelectedTag === tag && styles.tagItemSelected
                  ]}
                  onPress={() => {
                    setLocalSelectedTag(tag);
                  }}
                >
                  <Text style={[
                    styles.tagText,
                    localSelectedTag === tag && styles.tagTextSelected
                  ]}>
                    {tag}
                  </Text>
                  {localSelectedTag === tag && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  filterByTag(localSelectedTag);
                  setShowTagFilter(false);
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={hideMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={hideMenu}>
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                transform: [{
                  scale: menuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
                opacity: menuAnimation,
              }
            ]}
          >
            {(() => {
              const items = getMenuItems();
              console.log('Rendering menu with items:', items.length);
              items.forEach((item, index) => {
                console.log(`Item ${index}:`, item.text);
              });
              
              return items.length > 0 ? (
                items.map((item, index) => (
                  item.isSeparator ? (
                    <View key={item.id} style={styles.menuSeparator} />
                  ) : (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={item.action}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemContent}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={20} 
                          color={Colors.textSecondary} 
                          style={styles.menuItemIcon}
                        />
                      <Text style={styles.menuItemText}>{item.text}</Text>
                      </View>
                    </TouchableOpacity>
                  )
                ))
              ) : (
                <View style={styles.menuItem}>
                  <Text style={styles.menuItemText}>No menu items available</Text>
                </View>
              );
            })()}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          visible={showProfileSetup}
          onComplete={handleProfileSetupComplete}
          onClose={handleProfileSetupClose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: Colors.background,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    padding: 4,
    marginRight: -4,
  },
  menuButton: {
    padding: 4,
    marginRight: -4,
  },
  createEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  createEventBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  discoverBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    height: '100%',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  featuredTagsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tagsScrollView: {
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagChipText: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: Colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  eventsList: {
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  priceTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventStats: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statTextActive: {
    color: Colors.primary,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tagItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagItemSelected: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  tagTextSelected: {
    color: Colors.white,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  eventModalContainer: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
  },
  eventModalContent: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eventModalHeader: {
    padding: 20,
  },
  eventModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  modalScroll: {
    padding: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  eventModalBody: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
  },
  eventModalDetails: {
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  ticketButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  ticketButtonPurchased: {
    backgroundColor: Colors.success,
  },
  ticketButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  clearFilterButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 15,
    width: 280,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
    opacity: 0.5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
  },
}); 