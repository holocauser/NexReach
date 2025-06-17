import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Image, Modal, TextInput, Dimensions } from 'react-native';
import { Star, CreditCard as Edit, Phone, Mail, ArrowRight, Mic, MapPin, Globe, MessageCircle, Users, User, FileText, X, Share2, Calendar } from 'lucide-react-native';
import { BusinessCard } from '@/types';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import TagList from './TagList';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useCardStore } from '@/store/cardStore';
import VoiceNoteModal from './VoiceNoteModal';
import { VoiceNote } from '@/types';
import globalStyles, { spacing, typography, shadows } from '@/constants/Styles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.md * 3) / 2;

interface BusinessCardItemProps {
  card: BusinessCard;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onAddVoiceNote: (id: string) => void;
  onFileIconPress: () => void;
  viewMode?: 'grid' | 'list';
}

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onPress,
  onToggleFavorite,
  onEdit,
  onAddVoiceNote,
  onFileIconPress,
  viewMode = 'list',
}) => {
  
  const [showFilesModal, setShowFilesModal] = React.useState(false);
  const { updateCard } = useCardStore();
  const [activeTab, setActiveTab] = React.useState<'files' | 'voice'>('files');
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const [recordingError, setRecordingError] = React.useState<string | null>(null);
  const [playingNoteId, setPlayingNoteId] = React.useState<string | null>(null);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackStatus, setPlaybackStatus] = React.useState<any>(null);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteName, setEditingNoteName] = React.useState('');
  const [previewSound, setPreviewSound] = React.useState<Audio.Sound | null>(null);
  const [previewStatus, setPreviewStatus] = React.useState<any>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);
  const router = useRouter();
  
  const handlePhoneCall = () => {
    const phones = card.phones || [];
    if (phones.length > 0) {
      Linking.openURL(`tel:${phones[0]}`);
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
    const phones = card.phones || [];
    if (phones.length === 0) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
    const phoneNumber = phones[0];
    Linking.openURL(`sms:${phoneNumber}`);
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

  const handleAddressPress = (address?: string) => {
    const addr = address || (card.addresses && card.addresses[0]);
    if (!addr) {
      Alert.alert('No Address', 'This contact does not have an address.');
      return;
    }
    const encodedAddress = encodeURIComponent(addr);
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

  const handleReferPress = () => {
    router.push(`/add-referral/${card.id}`);
  };

  const handleAddFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if ('type' in result && result.type === 'success' && 'uri' in result && 'name' in result) {
        const newFile = {
          name: result.name as string,
          url: result.uri as string,
        };
        const updatedCard = {
          ...card,
          files: [...(card.files || []), {
            id: Date.now().toString(),
            name: result.name as string,
            type: 'application/octet-stream',
            url: result.uri as string,
            createdAt: new Date().toISOString()
          }],
        };
        updateCard(updatedCard);
        Alert.alert('File attached', 'Your file was successfully attached.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to attach file.');
      console.error('Error picking file:', error);
    }
  };

  const handleOpenFile = async (fileUrl: string) => {
    try {
      await Linking.openURL(fileUrl);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Voice Note: Requesting microphone permission...');
      setRecordingError(null);
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Voice Note: Microphone permission status:', status);
      if (status !== 'granted') {
        setRecordingError('Permission to access microphone is required!');
        Alert.alert('Permission Denied', 'Microphone access is required to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      console.log('Voice Note: Audio mode set.');
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      console.log('Voice Note: Prepared to record.');
      await rec.startAsync();
      console.log('Voice Note: Recording started.');
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      setRecordingError('Failed to start recording.');
      Alert.alert('Error', 'Failed to start recording.');
      console.error('Voice Note: Error starting recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri || null);
      setIsRecording(false);
      setRecording(null);
    } catch (err) {
      setRecordingError('Failed to stop recording.');
    }
  };

  const cancelRecording = () => {
    setRecording(null);
    setIsRecording(false);
    setRecordedUri(null);
    setRecordingError(null);
  };

  const handleVoiceNoteSave = async (uri: string) => {
    try {
      // Ensure the recordings directory exists
      const recordingsDir = `${FileSystem.documentDirectory}recordings/${card.id}`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }
      // Create a new file name
      const fileName = `${card.id}_${Date.now()}.m4a`;
      const newUri = `${recordingsDir}/${fileName}`;
      // Copy the file to the card's recordings directory
      await FileSystem.copyAsync({ from: uri, to: newUri });
      // Add the new voice note to the card's voiceNotes array
      const newNote = {
        id: fileName,
        name: fileName,
        uri: newUri,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      const updatedCard = {
        ...card,
        voiceNotes: [...(card.voiceNotes || []), {
          id: fileName,
          url: newUri,
          duration: 0, // You may want to calculate this from the audio file
          createdAt: new Date().toISOString()
        }],
      };
      updateCard(updatedCard);
      Alert.alert('Voice Note Saved', 'Your voice note was saved.');
      setShowVoiceModal(false);
      cancelRecording();
    } catch (err) {
      Alert.alert('Error', 'Failed to save voice note.');
      console.error('Voice Note: Error saving voice note:', err);
    }
  };

  const playVoiceNote = async (note: any) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: note.recording },
        { shouldPlay: true },
        (status) => {
          setPlaybackStatus(status);
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setPlayingNoteId(null);
            newSound.unloadAsync();
          }
        }
      );
      await newSound.setVolumeAsync(1.0);
      setSound(newSound);
      setPlayingNoteId(note.id);
      setIsPlaying(true);
      setPlaybackStatus(status);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      setIsPlaying(false);
      setPlayingNoteId(null);
    }
  };

  const pauseVoiceNote = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeVoiceNote = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const stopVoiceNote = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlayingNoteId(null);
    }
  };

  const playPreview = async () => {
    if (!recordedUri) return;
    if (previewSound) {
      await previewSound.unloadAsync();
      setPreviewSound(null);
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true }, (status) => {
      setPreviewStatus(status);
      if (status.isLoaded && status.didJustFinish) {
        setIsPreviewPlaying(false);
        newSound.unloadAsync();
      }
    });
    setPreviewSound(newSound);
    setIsPreviewPlaying(true);
  };

  const pausePreview = async () => {
    if (previewSound) {
      await previewSound.pauseAsync();
      setIsPreviewPlaying(false);
    }
  };

  const stopPreview = async () => {
    if (previewSound) {
      await previewSound.stopAsync();
      await previewSound.unloadAsync();
      setPreviewSound(null);
      setIsPreviewPlaying(false);
    }
  };

  const saveNoteName = (noteId: string) => {
    const updatedNotes = (card.voiceNotes || []).map(n => n.id === noteId ? { ...n, name: editingNoteName } : n);
    updateCard({ ...card, voiceNotes: updatedNotes });
    setEditingNoteId(null);
    setEditingNoteName('');
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Helper function to capitalize names properly
  const capitalizeName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fileCount =
    (Array.isArray(card.files) ? card.files.length : 0) +
    (Array.isArray(card.voiceNotes) ? card.voiceNotes.length : 0);

  const renderCardContent = () => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTapArea} onPress={() => onPress(card.id)} activeOpacity={0.8}>
        {/* Top Section - Header Info and Action Icons */}
        <View style={styles.topSection}>
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {card.name ? capitalizeName(card.name) : 'Unknown'}
            </Text>
            {card.title && <Text style={styles.title}>{card.title}</Text>}
            {card.company && <Text style={styles.company}>{card.company}</Text>}
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => onToggleFavorite(card.id)}>
              <Star size={16} color={card.favorited ? Colors.accent : Colors.textSecondary} fill={card.favorited ? Colors.accent : 'none'} />
            </TouchableOpacity>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  onFileIconPress();
                }}
              >
                <Ionicons name="document-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              {fileCount > 0 && (
                <View style={styles.fileBadge}>
                  <Text style={styles.fileBadgeText}>{fileCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Middle Section - Contact Information */}
        <View style={styles.contactSection}>
          {card.phone && (
            <View style={styles.contactRow}>
              <Phone size={14} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${card.phone}`)}>
                <Text style={styles.contactText}>{card.phone}</Text>
              </TouchableOpacity>
            </View>
          )}
          {card.phones && card.phones.map((phone, idx) => (
            <View key={phone + idx} style={styles.contactRow}>
              <Phone size={14} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)}>
                <Text style={styles.contactText}>{phone}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {card.email && (
            <View style={styles.contactRow}>
              <Mail size={14} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${card.email}`)}>
                <Text style={styles.contactText}>{card.email}</Text>
              </TouchableOpacity>
            </View>
          )}
          {card.address && (
            <View style={styles.contactRow}>
              <MapPin size={14} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(card.address!)}`)}>
                <Text style={styles.contactText} numberOfLines={1}>{card.address}</Text>
              </TouchableOpacity>
            </View>
          )}
          {card.addresses && card.addresses.map((address, idx) => (
            <View key={address + idx} style={styles.contactRow}>
              <MapPin size={14} color={Colors.textSecondary} />
              <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)}>
                <Text style={styles.contactText} numberOfLines={1}>{address}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {card.website && (
            <View style={styles.contactRow}>
              <Globe size={14} color={Colors.textSecondary} />
              <TouchableOpacity 
                onPress={() => {
                  const url = card.website?.startsWith('http') ? card.website : `https://${card.website}`;
                  if (url) {
                    Linking.openURL(url);
                  }
                }}
              >
                <Text style={styles.contactText} numberOfLines={1}>{card.website}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Section - Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionPill} onPress={handlePhoneCall}>
            <Phone size={14} color={Colors.success} />
            <Text style={[styles.actionLabel, { color: Colors.success }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} onPress={handleSMSPress}>
            <MessageCircle size={14} color={Colors.info} />
            <Text style={[styles.actionLabel, { color: Colors.info }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} onPress={handleReferPress}>
            <Users size={14} color={Colors.primary} />
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionPill} onPress={() => setShowVoiceModal(true)}>
            <Mic size={14} color={Colors.error} />
            <Text style={[styles.actionLabel, { color: Colors.error }]}>Record</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <VoiceNoteModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSave={handleVoiceNoteSave}
        cardId={card.id}
      />
    </View>
  );

  return renderCardContent();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.small,
  },
  cardTapArea: {
    borderRadius: 12,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: spacing.xs,
  },
  company: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  contactSection: {
    marginBottom: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  contactText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flex: 1,
    marginHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  actionLabel: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  fileBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 2,
  },
  fileBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default BusinessCardItem;