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
import ProfileSetupModal from '@/components/ProfileSetupModal';

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
    tags: ['Legal', 'Networking', 'Professional']
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
    tags: ['Medical', 'Conference', 'CME']
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
    tags: ['Startup', 'Pitch', 'Networking', 'Tech']
  }
];

export default function EventsScreen() {
  const { profile, isLoaded, loadProfile } = useUserStore();
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [newComment, setNewComment] = useState('');

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
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? {
                ...event,
                isRSVPed: !event.isRSVPed,
                attendees: event.isRSVPed ? event.attendees - 1 : event.attendees + 1
              }
            : event
        )
      );
    });
  };

  const handleLike = (eventId: string) => {
    checkProfileSetup(() => {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? {
                ...event,
                isLiked: !event.isLiked,
                likes: event.isLiked ? event.likes - 1 : event.likes + 1
              }
            : event
        )
      );
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

      const comment: Comment = {
        id: Math.random().toString(36).substring(2, 11),
        author: profile.name,
        authorAvatar: profile.avatar,
        text: newComment.trim(),
        timestamp: new Date(),
        userId: profile.id
      };

      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, comments: [...event.comments, comment] }
            : event
        )
      );

      setNewComment('');
    });
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = () => {
    checkProfileSetup(() => {
      setShowCreateModal(true);
    });
  };

  const handleProfilePress = () => {
    if (!profile?.isSetup) {
      setShowProfileSetup(true);
    } else {
      setShowProfileEdit(true);
    }
  };

  const renderEventCard = ({ item: event }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => openEventDetails(event)}
      activeOpacity={0.9}
    >
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.eventImage} />
      )}
      
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={styles.organizerInfo}>
            {event.organizerAvatar && (
              <Image source={{ uri: event.organizerAvatar }} style={styles.organizerAvatar} />
            )}
            <Text style={styles.organizerName}>{event.organizer}</Text>
          </View>
          
          <View style={styles.eventDate}>
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.dateText}>{format(event.date, 'MMM d')}</Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailItem}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Users size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {event.attendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
            </Text>
          </View>
        </View>

        <View style={styles.eventActions}>
          <TouchableOpacity
            style={[styles.rsvpButton, event.isRSVPed && styles.rsvpButtonActive]}
            onPress={() => handleRSVP(event.id)}
          >
            <Text style={[styles.rsvpButtonText, event.isRSVPed && styles.rsvpButtonTextActive]}>
              {event.isRSVPed ? 'Going' : 'RSVP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.socialActions}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleLike(event.id)}
            >
              <Heart
                size={20}
                color={event.isLiked ? Colors.error : Colors.textSecondary}
                fill={event.isLiked ? Colors.error : 'transparent'}
              />
              <Text style={styles.socialCount}>{event.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openEventDetails(event)}
            >
              <MessageCircle size={20} color={Colors.textSecondary} />
              <Text style={styles.socialCount}>{event.comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleShare(event)}
            >
              <Share2 size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Events</Text>
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
              <User size={20} color={Colors.white} />
            </View>
          )}
          {profile?.isSetup && (
            <View style={styles.editBadge}>
              <Edit size={12} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateEvent}
        >
          <Plus size={20} color={Colors.white} />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>

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
      <Modal
        visible={showEventDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEventDetails(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowEventDetails(false)}
          />
          
          <View style={styles.eventDetailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Details</Text>
              <TouchableOpacity
                onPress={() => setShowEventDetails(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView 
                style={styles.eventDetailsContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {selectedEvent.image && (
                  <Image source={{ uri: selectedEvent.image }} style={styles.modalEventImage} />
                )}
                
                <View style={styles.modalEventContent}>
                  <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalEventDescription}>{selectedEvent.description}</Text>
                  
                  <View style={styles.modalEventDetails}>
                    <View style={styles.modalDetailItem}>
                      <Calendar size={20} color={Colors.primary} />
                      <Text style={styles.modalDetailText}>
                        {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
                      </Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Clock size={20} color={Colors.primary} />
                      <Text style={styles.modalDetailText}>{selectedEvent.time}</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <MapPin size={20} color={Colors.primary} />
                      <Text style={styles.modalDetailText}>{selectedEvent.location}</Text>
                    </View>
                    
                    <View style={styles.modalDetailItem}>
                      <Users size={20} color={Colors.primary} />
                      <Text style={styles.modalDetailText}>
                        {selectedEvent.attendees} people attending
                      </Text>
                    </View>
                  </View>

                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>Comments ({selectedEvent.comments.length})</Text>
                    
                    {selectedEvent.comments.map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentAvatar}>
                          {comment.authorAvatar ? (
                            <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatarImage} />
                          ) : (
                            <User size={16} color={Colors.white} />
                          )}
                        </View>
                        <View style={styles.commentContent}>
                          <Text style={styles.commentAuthor}>{comment.author}</Text>
                          <Text style={styles.commentText}>{comment.text}</Text>
                          <Text style={styles.commentTime}>
                            {format(comment.timestamp, 'MMM d, h:mm a')}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View style={styles.addCommentContainer}>
                      <View style={styles.commentInputContainer}>
                        <View style={styles.commentUserAvatar}>
                          {profile?.avatar ? (
                            <Image source={{ uri: profile.avatar }} style={styles.commentAvatarImage} />
                          ) : (
                            <User size={16} color={Colors.white} />
                          )}
                        </View>
                        <TextInput
                          style={styles.commentInput}
                          placeholder={profile?.isSetup ? "Add a comment..." : "Setup profile to comment"}
                          placeholderTextColor={Colors.textLight}
                          value={newComment}
                          onChangeText={setNewComment}
                          multiline
                          editable={profile?.isSetup}
                          returnKeyType="send"
                          onSubmitEditing={() => handleAddComment(selectedEvent.id)}
                          blurOnSubmit={false}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.sendCommentButton}
                        onPress={() => handleAddComment(selectedEvent.id)}
                        disabled={!newComment.trim() || !profile?.isSetup}
                      >
                        <Send size={20} color={newComment.trim() && profile?.isSetup ? Colors.primary : Colors.textLight} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          />
          
          <View style={styles.createEventModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Event</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.createEventContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.createEventForm}>
                <TouchableOpacity style={styles.imageUploadButton}>
                  <Camera size={32} color={Colors.textLight} />
                  <Text style={styles.imageUploadText}>Add Event Photo</Text>
                </TouchableOpacity>

                <Text style={styles.comingSoonText}>
                  Event creation feature coming soon! 🎉
                </Text>
                <Text style={styles.comingSoonSubtext}>
                  We're working on bringing you the ability to create and manage your own networking events. 
                  Stay tuned for updates!
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    marginLeft: 16,
    position: 'relative',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 8,
  },
  eventsList: {
    padding: 16,
    paddingTop: 0,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  organizerName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    flex: 1,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rsvpButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  rsvpButtonActive: {
    backgroundColor: Colors.primary,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
  },
  rsvpButtonTextActive: {
    color: Colors.white,
  },
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal Styles - Improved for keyboard handling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  eventDetailsModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  createEventModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetailsContent: {
    flex: 1,
  },
  modalEventImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalEventContent: {
    padding: 20,
  },
  modalEventTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalEventDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalEventDetails: {
    marginBottom: 24,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  modalDetailText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  commentsTitle: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textLight,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
  commentUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  sendCommentButton: {
    marginLeft: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: Colors.background,
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
});