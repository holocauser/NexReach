import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Image } from 'react-native';
import { Star, CreditCard as Edit, Phone, Mail, ArrowRight, Mic, MapPin, Globe, MessageCircle, Users, User, FileText } from 'lucide-react-native';
import { BusinessCard } from '@/types';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import TagList from './TagList';

interface BusinessCardItemProps {
  card: BusinessCard;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onAddVoiceNote: (id: string) => void;
  onLogReferral: (id: string) => void;
}

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onPress,
  onToggleFavorite,
  onEdit,
  onAddVoiceNote,
  onLogReferral,
}) => {
  
  const handlePhoneCall = () => {
    if (!card.phone) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
    
    // Clean phone number for calling
    const cleanPhone = card.phone.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    
    if (Platform.OS === 'web') {
      // For web, show an alert with the phone number
      Alert.alert(
        'Call Contact',
        `Would you like to call ${card.name}?\n\nPhone: ${card.phone}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              // On web, try to open the tel: link
              window.open(phoneUrl, '_self');
            }
          }
        ]
      );
    } else {
      // For mobile, check if calling is supported
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) {
            Alert.alert(
              'Call Contact',
              `Call ${card.name}?\n\nPhone: ${card.phone}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Call', 
                  onPress: () => Linking.openURL(phoneUrl)
                }
              ]
            );
          } else {
            Alert.alert('Cannot Make Call', 'Phone calling is not supported on this device.');
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Unable to make phone call.');
        });
    }
  };

  const handleEmailPress = () => {
    if (!card.email) {
      Alert.alert('No Email', 'This contact does not have an email address.');
      return;
    }
    
    const emailUrl = `mailto:${card.email}`;
    
    if (Platform.OS === 'web') {
      window.open(emailUrl, '_self');
    } else {
      Linking.canOpenURL(emailUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(emailUrl);
          } else {
            Alert.alert('Cannot Send Email', 'Email is not supported on this device.');
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Unable to open email client.');
        });
    }
  };

  const handleSMSPress = () => {
    if (!card.phone) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
    
    const cleanPhone = card.phone.replace(/[^\d+]/g, '');
    const smsUrl = `sms:${cleanPhone}`;
    
    if (Platform.OS === 'web') {
      Alert.alert('SMS Not Available', 'SMS is not available on web browsers.');
    } else {
      Linking.canOpenURL(smsUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(smsUrl);
          } else {
            Alert.alert('Cannot Send SMS', 'SMS is not supported on this device.');
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Unable to open SMS.');
        });
    }
  };

  const handleWebsitePress = () => {
    if (!card.website) {
      Alert.alert('No Website', 'This contact does not have a website.');
      return;
    }
    
    let websiteUrl = card.website;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    
    if (Platform.OS === 'web') {
      window.open(websiteUrl, '_blank');
    } else {
      Linking.canOpenURL(websiteUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(websiteUrl);
          } else {
            Alert.alert('Cannot Open Website', 'Unable to open the website.');
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Unable to open website.');
        });
    }
  };

  const handleAddressPress = () => {
    if (!card.address) {
      Alert.alert('No Address', 'This contact does not have an address.');
      return;
    }
    
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

  const handleReferralPress = () => {
    Alert.alert(
      'Create Referral',
      `Create a referral involving ${card.name}?\n\nYou can track referrals sent to or received from this contact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Referral', 
          onPress: () => onLogReferral(card.id)
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(card.id)}
      activeOpacity={0.92}
    >
      <View style={styles.cardOuter}>
        <View style={styles.accentBar} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')}
                </Text>
              </View>
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.name}>{card.name}</Text>
              <Text style={styles.company}>{card.company}</Text>
              <Text style={styles.title}>{card.title}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => onToggleFavorite(card.id)}
              >
                <Star
                  size={24}
                  color={card.favorited ? Colors.favorite : Colors.textLight}
                  fill={card.favorited ? Colors.favorite : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fileButton}
                onPress={() => {}}
              >
                <FileText size={16} color={Colors.textLight} />
                {card.files && card.files.length > 0 && (
                  <View style={styles.fileBadge}>
                    <Text style={styles.fileBadgeText}>{card.files.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={handlePhoneCall}
              activeOpacity={0.7}
            >
              <Phone size={16} color={Colors.primary} />
              <Text style={[styles.contactText, styles.clickableText]}>{card.phone}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <Mail size={16} color={Colors.primary} />
              <Text style={[styles.contactText, styles.clickableText]}>{card.email}</Text>
            </TouchableOpacity>

            {card.address && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handleAddressPress}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={Colors.primary} />
                <Text style={[styles.contactText, styles.clickableText]} numberOfLines={1}>
                  {card.address}
                </Text>
              </TouchableOpacity>
            )}

            {card.website && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handleWebsitePress}
                activeOpacity={0.7}
              >
                <Globe size={16} color={Colors.primary} />
                <Text style={[styles.contactText, styles.clickableText]} numberOfLines={1}>
                  {card.website}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tagListRow}>
            {card.tags.slice(0, 3).map((tag, idx) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagPillText}>{tag}</Text>
              </View>
            ))}
            {card.tags.length > 3 && (
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>+{card.tags.length - 3} more</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F2F7FF' }]}
              onPress={handlePhoneCall}
            >
              <Phone size={16} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F7F6FF' }]}
              onPress={handleSMSPress}
            >
              <MessageCircle size={16} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent }]}>SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFF9F2' }]}
              onPress={handleReferralPress}
            >
              <Users size={16} color={Colors.warning} />
              <Text style={[styles.actionText, { color: Colors.warning }]}>Refer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFF5F5' }]}
              onPress={() => onAddVoiceNote(card.id)}
            >
              <Mic size={16} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]} numberOfLines={1} ellipsizeMode="tail">Record</Text>
              {card.voiceNotes && card.voiceNotes.length > 0 && (
                <View style={styles.voiceNoteBadgeAction}>
                  <Text style={styles.voiceNoteBadgeText}>{card.voiceNotes.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {card.lastContacted && (
            <View style={styles.lastContactedContainer}>
              <Text style={styles.lastContactedLabel}>Last Contacted:</Text>
              <Text style={styles.lastContactedDate}>
                {format(card.lastContacted, 'MMM d, yyyy')}
              </Text>
              {card.reminder && (
                <View style={styles.reminderBadge}>
                  <Text style={styles.reminderText}>Reminder</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 6,
  },
  cardOuter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 24,
    marginHorizontal: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  accentBar: {
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: Colors.primary,
    marginRight: -6,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    paddingVertical: 22,
    paddingHorizontal: 12,
    minHeight: 140,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'Inter-Medium',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textLight,
  },
  favoriteButton: {
    justifyContent: 'center',
    padding: 4,
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactInfo: {
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  clickableText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  tagListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    marginTop: 2,
  },
  tagPill: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 7,
    marginBottom: 4,
  },
  tagPillText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginHorizontal: 1,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.background,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 7,
    textAlign: 'center',
  },
  lastContactedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  lastContactedLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  lastContactedDate: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  reminderBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reminderText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  voiceNoteBadgeAction: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  voiceNoteBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  fileButton: {
    justifyContent: 'center',
    padding: 4,
    marginLeft: 8,
  },
  fileBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.textLight,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  fileBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
});

export default BusinessCardItem;