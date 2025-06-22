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
import { ArrowLeft, Star, Phone, Mail, MapPin, Globe, MessageCircle, CreditCard as Edit, Share2, Calendar, Clock, Tag, X, Pencil, Plus, Camera } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';
import { useReferralStore } from '@/store/referralStore';
import { BusinessCard } from '@/types';
import { format } from 'date-fns';
import TagList from '@/components/TagList';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStore } from '@/store/userStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ContactDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getCardById, toggleFavorite, updateCard, cards } = useCardStore();
  const { referrals } = useReferralStore();
  const { user } = useAuth();
  const { profile } = useUserStore();
  
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  useEffect(() => {
    if (id) {
      const foundCard = getCardById(id as string);
      console.log('🔄 Contact details updating:', { 
        id, 
        foundCard: foundCard ? foundCard.name : 'not found',
        cardsCount: cards.length 
      });
      setCard(foundCard || null);
    }
  }, [id, cards]);

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Contact not found</Text>
      </View>
    );
  }

  // Get current user ID
  const userId = user?.id || profile?.id || 'default-user-id';

  // Calculate referrals in user-centric approach
  const referralsSent = referrals.filter(ref => 
    ref.referrerId === userId && ref.recipientId === card.id
  );
  const referralsReceived = referrals.filter(ref => 
    ref.referrerId === card.id && ref.recipientId === userId
  );
  const totalReferralValue = referralsSent.reduce((sum, ref) => sum + ref.value, 0) + 
                            referralsReceived.reduce((sum, ref) => sum + ref.value, 0);

  // Debug referral counting
  console.log('📊 Referral Debug:', {
    cardId: card.id,
    cardName: card.name,
    userId: userId,
    referralsSent: referralsSent.length,
    referralsReceived: referralsReceived.length,
    sentReferrals: referralsSent.map(r => ({ id: r.id, referrerId: r.referrerId, recipientId: r.recipientId, direction: r.direction })),
    receivedReferrals: referralsReceived.map(r => ({ id: r.id, referrerId: r.referrerId, recipientId: r.recipientId, direction: r.direction }))
  });

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(card.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  const handleCall = (phone?: string | { label: string; number: string }) => {
    let phoneNumber: string;
    if (typeof phone === 'string') {
      phoneNumber = phone;
    } else if (phone && typeof phone === 'object') {
      phoneNumber = phone.number;
    } else {
      phoneNumber = card.phones && card.phones[0] ? 
        (typeof card.phones[0] === 'string' ? card.phones[0] : card.phones[0].number) : '';
    }
    
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    if (Platform.OS === 'web') {
      window.open(phoneUrl, '_self');
    } else {
      Linking.openURL(phoneUrl);
    }
    updateCard({ ...card, updatedAt: new Date().toISOString() });
  };

  const handleEmail = () => {
    if (!card.email) return;
    
    const emailUrl = `mailto:${card.email}`;
    
    if (Platform.OS === 'web') {
      window.open(emailUrl, '_self');
    } else {
      Linking.openURL(emailUrl);
    }
    
    updateCard({ ...card, updatedAt: new Date().toISOString() });
  };

  const handleSMS = (phone?: string | { label: string; number: string }) => {
    let phoneNumber: string;
    if (typeof phone === 'string') {
      phoneNumber = phone;
    } else if (phone && typeof phone === 'object') {
      phoneNumber = phone.number;
    } else {
      phoneNumber = card.phones && card.phones[0] ? 
        (typeof card.phones[0] === 'string' ? card.phones[0] : card.phones[0].number) : '';
    }
    
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const smsUrl = `sms:${cleanPhone}`;
    if (Platform.OS !== 'web') {
      Linking.openURL(smsUrl);
    }
    updateCard({ ...card, updatedAt: new Date().toISOString() });
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

  const handleAddress = (address?: string | { label: string; address: string }) => {
    let addressString: string;
    if (typeof address === 'string') {
      addressString = address;
    } else if (address && typeof address === 'object') {
      addressString = address.address;
    } else {
      addressString = card.addresses && card.addresses[0] ? 
        (typeof card.addresses[0] === 'string' ? card.addresses[0] : card.addresses[0].address) : '';
    }
    
    if (!addressString) return;
    const encodedAddress = encodeURIComponent(addressString);
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
    try {
      // Build share content with proper phone handling
      let shareContent = `${card.name}`;
      
      if (card.company) {
        shareContent += `\n${card.company}`;
      }
      
      if (card.title) {
        shareContent += `\n${card.title}`;
      }
      
      shareContent += '\n';
      
      // Handle phones array properly
      if (card.phones && card.phones.length > 0) {
        const phoneNumbers = card.phones.map(phone => 
          typeof phone === 'string' ? phone : phone.number
        ).join(', ');
        shareContent += `Phone: ${phoneNumbers}\n`;
      }
      
      if (card.email) {
        shareContent += `Email: ${card.email}\n`;
      }
      
      if (card.website) {
        shareContent += `Website: ${card.website}\n`;
      }
      
      // Handle addresses
      if (card.addresses && card.addresses.length > 0) {
        const addressList = card.addresses.map(address => {
          if (typeof address === 'string') return address;
          return address.label ? `${address.label}: ${address.address}` : address.address;
        }).join('\n- ');
        
        shareContent += `Address(es):\n- ${addressList}\n`;
      }
      
      console.log('📤 Sharing content:', shareContent);
      
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
        // Use React Native's Share API instead of ExpoShare
        const result = await Share.share({
          message: shareContent,
          title: `Contact: ${card.name}`,
        });
        
        if (result.action === Share.sharedAction) {
          console.log('✅ Share successful');
        }
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
      Alert.alert('Share Error', 'Failed to share contact information. Please try again.');
    }
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const handleImagePick = async () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                if (selectedAsset.uri) {
                  // Update the card in the store
                  const updatedCard = {
                    ...card,
                    profileImage: selectedAsset.uri
                  };
                  updateCard(updatedCard);
                  
                  // Update local state
                  setCard(updatedCard);
                }
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
          }
        },
        { 
          text: 'Choose from Gallery', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                if (selectedAsset.uri) {
                  // Update the card in the store
                  const updatedCard = {
                    ...card,
                    profileImage: selectedAsset.uri
                  };
                  updateCard(updatedCard);
                  
                  // Update local state
                  setCard(updatedCard);
                }
              }
            } catch (error) {
              console.error('Error picking image:', error);
              Alert.alert('Error', 'Failed to pick image. Please try again.');
            }
          }
        }
      ]
    );
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
            onPress={() => router.push(`/edit-card/${id}`)}
            style={styles.headerButton}
          >
            <Pencil size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleToggleFavorite} 
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
          
          {card.updatedAt && (
            <View style={styles.lastContactedBadge}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.lastContactedText}>
                Last updated: {format(new Date(card.updatedAt), 'MMM d, yyyy')}
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
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall()}>
            <Phone size={24} color={Colors.success} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Mail size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSMS()}>
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
          {(card.phones || []).map((phone, idx) => (
            <TouchableOpacity key={idx} style={styles.contactRow} onPress={() => handleCall(phone)}>
              <Phone size={20} color={Colors.primary} />
              <Text style={styles.contactText}>
                {typeof phone === 'string' ? phone : `${phone.label ? phone.label + ': ' : ''}${phone.number}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <Mail size={20} color={Colors.primary} />
            <Text style={styles.contactText}>{card.email}</Text>
          </TouchableOpacity>
          {(card.addresses || []).map((address, idx) => (
            <TouchableOpacity key={idx} style={styles.contactRow} onPress={() => handleAddress(address)}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.contactText}>
                {typeof address === 'string' ? address : `${address.label ? address.label + ': ' : ''}${address.address}`}
              </Text>
            </TouchableOpacity>
          ))}
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
          
          {(Array.isArray(card.specialty) ? card.specialty : []).length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialty</Text>
              <Text style={styles.infoValue}>{(Array.isArray(card.specialty) ? card.specialty : []).join(', ')}</Text>
            </View>
          )}
          
          {/* Last Updated */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : 'Never'}
            </Text>
          </View>
          
          {/* Languages */}
          {(Array.isArray(card.languages) ? card.languages : []).length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{(Array.isArray(card.languages) ? card.languages : []).join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {(card.tags || []).length > 0 && (
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
          
          <View style={styles.referralActivityRow}>
            <TouchableOpacity 
              style={styles.referralCountItem}
              onPress={() => router.push({
                pathname: '/referral-list',
                params: { 
                  contactId: card.id, 
                  contactName: card.name,
                  mode: 'sent'
                }
              })}
            >
              <Text style={styles.referralCount}>{referralsSent.length}</Text>
              <Text style={styles.referralLabel}>Referrals Sent</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.referralCountItem}
              onPress={() => router.push({
                pathname: '/referral-list',
                params: { 
                  contactId: card.id, 
                  contactName: card.name,
                  mode: 'received'
                }
              })}
            >
              <Text style={styles.referralCount}>{referralsReceived.length}</Text>
              <Text style={styles.referralLabel}>Referrals Received</Text>
            </TouchableOpacity>
            
            <View style={styles.referralCountItem}>
              <Text style={styles.referralCount}>${totalReferralValue.toLocaleString()}</Text>
              <Text style={styles.referralLabel}>Total Value</Text>
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
  referralActivityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  referralCountItem: {
    alignItems: 'center',
    flex: 1,
  },
  referralCount: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginBottom: 4,
  },
  referralLabel: {
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