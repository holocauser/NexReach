import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Share,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Phone, Mail, MapPin, Globe, MessageCircle, CreditCard as Edit, Share2, Calendar, Clock, Tag, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';
import { useReferralStore } from '@/store/referralStore';
import { BusinessCard } from '@/types';
import { format } from 'date-fns';
import TagList from '@/components/TagList';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getCardById, toggleFavorite, updateLastContacted } = useCardStore();
  const { getReferralsByReferrer, getReferralsByRecipient } = useReferralStore();
  
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  useEffect(() => {
    if (id) {
      const foundCard = getCardById(id as string);
      setCard(foundCard || null);
    }
  }, [id]);

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Contact not found</Text>
      </View>
    );
  }

  const referralsSent = getReferralsByReferrer(card.id);
  const referralsReceived = getReferralsByRecipient(card.id);
  const totalReferralValue = referralsSent.reduce((sum, ref) => sum + ref.value, 0);

  const handleCall = () => {
    if (!card.phone) return;
    
    const cleanPhone = card.phone.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    
    if (Platform.OS === 'web') {
      window.open(phoneUrl, '_self');
    } else {
      Linking.openURL(phoneUrl);
    }
    
    // Update last contacted
    updateLastContacted(card.id, new Date());
  };

  const handleEmail = () => {
    if (!card.email) return;
    
    const emailUrl = `mailto:${card.email}`;
    
    if (Platform.OS === 'web') {
      window.open(emailUrl, '_self');
    } else {
      Linking.openURL(emailUrl);
    }
    
    // Update last contacted
    updateLastContacted(card.id, new Date());
  };

  const handleSMS = () => {
    if (!card.phone) return;
    
    const cleanPhone = card.phone.replace(/[^\d+]/g, '');
    const smsUrl = `sms:${cleanPhone}`;
    
    if (Platform.OS !== 'web') {
      Linking.openURL(smsUrl);
    }
    
    // Update last contacted
    updateLastContacted(card.id, new Date());
  };

  const handleWebsite = () => {
    if (!card.website) return;
    
    let websiteUrl = card.website;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    
    if (Platform.OS === 'web') {
      window.open(websiteUrl, '_blank');
    } else {
      Linking.openURL(websiteUrl);
    }
  };

  const handleAddress = () => {
    if (!card.address) return;
    
    const encodedAddress = encodeURIComponent(card.address);
    
    if (Platform.OS === 'web') {
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    } else {
      const mapsUrl = Platform.select({
        ios: `http://maps.apple.com/?q=${encodedAddress}`,
        android: `geo:0,0?q=${encodedAddress}`,
      });
      
      if (mapsUrl) {
        Linking.openURL(mapsUrl);
      }
    }
  };

  const handleShare = async () => {
    const shareContent = `${card.name}\n${card.company}\n${card.title}\n\nPhone: ${card.phone}\nEmail: ${card.email}${card.website ? `\nWebsite: ${card.website}` : ''}`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: `Contact: ${card.name}`,
            text: shareContent,
          });
        } else {
          // Fallback for web browsers without native share
          await navigator.clipboard.writeText(shareContent);
          Alert.alert('Copied', 'Contact information copied to clipboard');
        }
      } else {
        await Share.share({
          message: shareContent,
          title: `Contact: ${card.name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push(`/edit-card/${card.id}`)} 
            style={styles.headerButton}
          >
            <Edit size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => toggleFavorite(card.id)} 
            style={styles.headerButton}
          >
            <Star
              size={24}
              color={card.favorited ? Colors.favorite : Colors.white}
              fill={card.favorited ? Colors.favorite : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => card.profileImage && openImageModal(card.profileImage)}
            disabled={!card.profileImage}
          >
            {card.profileImage ? (
              <Image source={{ uri: card.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{card.name}</Text>
          <Text style={styles.company}>{card.company}</Text>
          <Text style={styles.title}>{card.title}</Text>
          
          {card.lastContacted && (
            <View style={styles.lastContactedBadge}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.lastContactedText}>
                Last contacted: {format(card.lastContacted, 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>

        {/* Business Card Photo */}
        {card.cardImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Card</Text>
            <TouchableOpacity 
              style={styles.cardImageContainer}
              onPress={() => openImageModal(card.cardImage!)}
            >
              <Image source={{ uri: card.cardImage }} style={styles.cardImage} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Phone size={24} color={Colors.success} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Mail size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
            <MessageCircle size={24} color={Colors.accent} />
            <Text style={styles.actionButtonText}>SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={24} color={Colors.textSecondary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
            <Phone size={20} color={Colors.primary} />
            <Text style={styles.contactText}>{card.phone}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <Mail size={20} color={Colors.primary} />
            <Text style={styles.contactText}>{card.email}</Text>
          </TouchableOpacity>
          
          {card.address && (
            <TouchableOpacity style={styles.contactRow} onPress={handleAddress}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{card.address}</Text>
            </TouchableOpacity>
          )}
          
          {card.website && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
              <Globe size={20} color={Colors.primary} />
              <Text style={styles.contactText}>{card.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>
          
          {card.specialty.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialties:</Text>
              <Text style={styles.infoValue}>{card.specialty.join(', ')}</Text>
            </View>
          )}
          
          {card.languages.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Languages:</Text>
              <Text style={styles.infoValue}>{card.languages.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {card.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            <TagList tags={card.tags} maxTags={10} />
          </View>
        )}

        {/* Referral Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Activity</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralsSent.length}</Text>
              <Text style={styles.statLabel}>Referrals Sent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralsReceived.length}</Text>
              <Text style={styles.statLabel}>Referrals Received</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${totalReferralValue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {card.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{card.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          />
          
          <View style={styles.imageModalContainer}>
            <TouchableOpacity 
              style={styles.imageModalCloseButton}
              onPress={() => setShowImageModal(false)}
            >
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: Colors.primary,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 36,
    fontFamily: 'Inter-SemiBold',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  company: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  lastContactedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lastContactedText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 20,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  section: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginLeft: 8,
    marginBottom: 16,
  },
  cardImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 16,
    flex: 1,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  notesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 100,
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageModalContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalImage: {
    width: screenWidth - 40,
    height: screenHeight - 200,
    borderRadius: 12,
  },
});