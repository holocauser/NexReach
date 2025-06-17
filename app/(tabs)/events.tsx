import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Plus, Calendar, MapPin, Clock, Users, Share2, Heart, MessageCircle, Camera, X, Send, User, CreditCard as Edit } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { format, addDays, addWeeks } from 'date-fns';
import { useUserStore } from '@/store/userStore';
import { useEventStore } from '@/store/eventStore';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import globalStyles, { spacing, typography, shadows } from '@/constants/Styles';
import { useRouter } from 'expo-router';

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
  comments: Comment[];
  tags: string[];
  price: number | null; // null means free
  ticketStatus?: 'none' | 'reserved' | 'purchased';
}

interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  timestamp: Date;
  userId: string;
}

// Mock events data
const mockEvents: Event[] = [
  {
    id: '1',
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
    comments: [
      {
        id: '1',
        author: 'Sarah Johnson',
        authorAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        text: 'Looking forward to this event!',
        timestamp: new Date(),
        userId: 'user_sample1'
      }
    ],
    tags: ['Legal', 'Networking', 'Professional'],
    price: null,
    ticketStatus: 'none'
  },
  {
    id: '2',
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
    comments: [],
    tags: ['Medical', 'Conference', 'CME'],
    price: 100,
    ticketStatus: 'none'
  },
  {
    id: '3',
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
    comments: [
      {
        id: '1',
        author: 'Mike Chen',
        authorAvatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        text: 'Excited to see the new startups!',
        timestamp: new Date(),
        userId: 'user_sample2'
      },
      {
        id: '2',
        author: 'Lisa Wang',
        authorAvatar: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        text: 'Will there be food provided?',
        timestamp: new Date(),
        userId: 'user_sample3'
      }
    ],
    tags: ['Startup', 'Pitch', 'Networking', 'Tech'],
    price: null,
    ticketStatus: 'none'
  }
];

export default function EventsScreen() {
  const { profile, isLoaded, loadProfile } = useUserStore();
  const { events, toggleRSVP, toggleLike, addComment } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [newComment, setNewComment] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) {
      loadProfile();
    }
  }, [isLoaded, loadProfile]);

  // Show profile setup modal on first visit if profile is not setup
  useEffect(() => {
    if (isLoaded && profile && !profile.isSetup) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setShowProfileSetup(true);
      }, 500);
    }
  }, [isLoaded, profile]);

  const checkProfileSetup = (callback: () => void) => {
    if (!profile?.isSetup) {
      setShowProfileSetup(true);
      return;
    }
    callback();
  };

  const handleRSVP = (eventId: string) => {
    checkProfileSetup(() => {
      toggleRSVP(eventId);
    });
  };

  const handleLike = (eventId: string) => {
    checkProfileSetup(() => {
      toggleLike(eventId);
    });
  };

  const handleShare = (event: Event) => {
    const shareText = `Check out this event: ${event.title}\n${format(event.date, 'MMM d, yyyy')} at ${event.time}\n${event.location}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: shareText,
      });
    } else {
      // Fallback for web
      navigator.clipboard.writeText(shareText);
      Alert.alert('Copied', 'Event details copied to clipboard');
    }
  };

  const handleAddComment = (eventId: string) => {
    if (!newComment.trim()) return;

    checkProfileSetup(() => {
      if (!profile) return;

      addComment(eventId, {
        author: profile.name,
        authorAvatar: profile.avatar,
        text: newComment.trim(),
        userId: profile.id
      });

      setNewComment('');
    });
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = () => {
    checkProfileSetup(() => {
      router.push('/events/create');
    });
  };

  const handleProfilePress = () => {
    if (!profile?.isSetup) {
      router.push('/profile');
    } else {
      router.push('/profile');
    }
  };

  const renderEventCard = ({ item: event }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, shadows.medium]}
      onPress={() => openEventDetails(event)}
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
          <View style={styles.attendeesContainer}>
            <Users size={16} color={Colors.gray} />
            <Text style={styles.attendeesText}>
              {event.attendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
            </Text>
          </View>
          <View style={styles.interactionContainer}>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => handleLike(event.id)}
            >
              <Heart
                size={16}
                color={event.isLiked ? Colors.primary : Colors.gray}
                fill={event.isLiked ? Colors.primary : 'none'}
              />
              <Text style={[styles.interactionText, event.isLiked && styles.interactionTextActive]}>
                {event.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => handleShare(event)}
            >
              <Share2 size={16} color={Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EventDetailsModal = ({ event, visible, onClose }: { event: Event; visible: boolean; onClose: () => void }) => {
    const { profile } = useUserStore();
    const [newComment, setNewComment] = useState('');
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const handlePurchaseTicket = () => {
      if (!profile) {
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
      setShowPurchaseModal(true);
    };

    const confirmPurchase = () => {
      // TODO: Implement actual purchase logic
      Alert.alert(
        'Success',
        'Your ticket has been purchased!',
        [{ text: 'OK', onPress: () => setShowPurchaseModal(false) }]
      );
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Image
                source={{ uri: event.image }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{event.title}</Text>
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
          
              <View style={styles.eventInfo}>
                <View style={styles.infoRow}>
                  <Calendar size={20} color={Colors.gray} />
                  <Text style={styles.infoText}>
                    {format(event.date, 'EEEE, MMMM d, yyyy')}
                  </Text>
          </View>
                
                <View style={styles.infoRow}>
                  <Clock size={20} color={Colors.gray} />
                  <Text style={styles.infoText}>{event.time}</Text>
        </View>

                <View style={styles.infoRow}>
                  <MapPin size={20} color={Colors.gray} />
                  <Text style={styles.infoText}>{event.location}</Text>
                </View>
              </View>

              <Text style={styles.description}>{event.description}</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Users size={20} color={Colors.gray} />
                  <Text style={styles.statText}>
                    {event.attendees} {event.maxAttendees ? `/ ${event.maxAttendees}` : ''} attending
                  </Text>
          </View>
          
                <View style={styles.statItem}>
                  <Heart
                    size={20}
                    color={event.isLiked ? Colors.primary : Colors.gray}
                    fill={event.isLiked ? Colors.primary : 'none'}
                  />
                  <Text style={[styles.statText, event.isLiked && styles.statTextActive]}>
                    {event.likes} likes
                  </Text>
                </View>
          </View>
          
              <View style={styles.commentsSection}>
                <Text style={styles.sectionTitle}>Comments</Text>
                
                {event.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Image
                      source={{ uri: comment.authorAvatar }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentTime}>
                          {format(comment.timestamp, 'MMM d, h:mm a')}
            </Text>
          </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
        </View>
                  </View>
                ))}

                {profile ? (
                  <View style={styles.commentInputContainer}>
                    <Image
                      source={{ uri: profile.avatar }}
                      style={styles.commentInputAvatar}
                    />
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />
          <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !newComment.trim() && styles.sendButtonDisabled
                      ]}
                      disabled={!newComment.trim()}
                      onPress={() => handleAddComment(event.id)}
                    >
                      <Send
                        size={20}
                        color={newComment.trim() ? Colors.primary : Colors.gray}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.loginPrompt}
                    onPress={() => router.push('/auth')}
                  >
                    <Text style={styles.loginPromptText}>
                      Log in to leave a comment
            </Text>
          </TouchableOpacity>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
            <TouchableOpacity
                style={[
                  styles.ticketButton,
                  event.ticketStatus === 'purchased' && styles.ticketButtonPurchased
                ]}
                onPress={handlePurchaseTicket}
              >
                <Text style={styles.ticketButtonText}>
                  {event.ticketStatus === 'purchased'
                    ? 'Ticket Purchased'
                    : event.price === null
                    ? 'Get Free Ticket'
                    : `Buy Ticket - $${event.price}`}
                </Text>
            </TouchableOpacity>
            </View>
          </View>

            <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            >
            <X size={24} color={Colors.white} />
            </TouchableOpacity>
        </View>

        <Modal
          visible={showPurchaseModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.purchaseModalContainer}>
            <View style={styles.purchaseModalContent}>
              <Text style={styles.purchaseModalTitle}>Confirm Purchase</Text>
              <Text style={styles.purchaseModalText}>
                Would you like to purchase a ticket for {event.title}?
              </Text>
              <Text style={styles.purchaseModalPrice}>
                Price: {event.price === null ? 'Free' : `$${event.price}`}
              </Text>
              
              <View style={styles.purchaseModalButtons}>
            <TouchableOpacity
                  style={[styles.purchaseModalButton, styles.purchaseModalButtonCancel]}
                  onPress={() => setShowPurchaseModal(false)}
                >
                  <Text style={styles.purchaseModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.purchaseModalButton, styles.purchaseModalButtonConfirm]}
                  onPress={confirmPurchase}
                >
                  <Text style={[styles.purchaseModalButtonText, styles.purchaseModalButtonTextConfirm]}>
                    Confirm
                  </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
        </Modal>
      </Modal>
  );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Events</Text>
          <TouchableOpacity 
            style={styles.createEventBtn}
            onPress={handleCreateEvent}
            activeOpacity={0.85}
          >
            <Plus size={22} color={'#fff'} />
            <Text style={styles.createEventBtnText}>Create Event</Text>
          </TouchableOpacity>
          <Text style={styles.headerSubtitle}>Discover and share networking events</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfilePress}
        >
          {profile?.isSetup && profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.profileAvatarPlaceholder}>
              <User size={20} color={Colors.textLight} />
            </View>
          )}
          {profile?.isSetup && (
            <View style={styles.editBadge}>
              <Edit size={12} color={Colors.textLight} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.eventsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={Colors.textLight} />
              <Text style={styles.emptyText}>No events yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to create an event and start networking!
              </Text>
            </View>
          }
        />
      </View>

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        visible={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onComplete={() => {
          // Profile setup completed
        }}
      />

      {/* Profile Edit Modal */}
      <ProfileSetupModal
        visible={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onComplete={() => {
          // Profile edit completed
        }}
      />

      {/* Event Details Modal */}
            {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          visible={showEventDetails}
          onClose={() => setShowEventDetails(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 10,
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
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  eventsList: {
    padding: 16,
    paddingTop: 0,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
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
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  interactionTextActive: {
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
  },
  imageUploadText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textLight,
    marginTop: 12,
  },
  comingSoonText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  comingSoonSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalHeader: {
    padding: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  organizerName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  eventInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  statTextActive: {
    color: Colors.primary,
  },
  commentsSection: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  commentInputAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loginPrompt: {
    padding: 16,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    marginTop: 16,
  },
  loginPromptText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ticketButton: {
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
    fontFamily: 'Inter-SemiBold',
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
  purchaseModalContainer: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  purchaseModalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  purchaseModalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  purchaseModalPrice: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  purchaseModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  purchaseModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseModalButtonCancel: {
    backgroundColor: Colors.inputBackground,
    marginRight: 8,
  },
  purchaseModalButtonConfirm: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  purchaseModalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  purchaseModalButtonTextConfirm: {
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  createEventModal: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createEventContent: {
    flex: 1,
  },
  createEventForm: {
    padding: 20,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
  },
});