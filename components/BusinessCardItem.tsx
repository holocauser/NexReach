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
import { FileService } from '@/lib/fileService';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.md * 3) / 2;

interface BusinessCardItemProps {
  card: BusinessCard;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onAddVoiceNote: (id: string) => void;
  onFileIconPress: () => void;
  onFileChange?: () => void;
  registerRefresh?: (cardId: string, refreshFunction: () => void) => void;
  viewMode?: 'grid' | 'list';
}

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onPress,
  onToggleFavorite,
  onEdit,
  onAddVoiceNote,
  onFileIconPress,
  onFileChange,
  registerRefresh,
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
  const [cardFileCount, setCardFileCount] = React.useState(0);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const router = useRouter();
  const { user } = useAuth();
  
  // Fetch real-time file count for this card
  React.useEffect(() => {
    if (user && card.id) {
      fetchCardFileCount();
    }
  }, [user, card.id, refreshTrigger]);

  // Listen for file changes from parent
  React.useEffect(() => {
    if (onFileChange) {
      // Force refresh when parent notifies of file changes
      setRefreshTrigger(prev => prev + 1);
    }
  }, [onFileChange]);

  // Register refresh function with parent
  React.useEffect(() => {
    if (registerRefresh) {
      registerRefresh(card.id, () => {
        setRefreshTrigger(prev => prev + 1);
      });
    }
  }, [registerRefresh, card.id]);

  const fetchCardFileCount = async () => {
    if (!user || !card.id) return;
    try {
      const [filesData, voiceNotesData] = await Promise.all([
        FileService.getFilesByCardId(card.id, user.id),
        FileService.getVoiceNotesByCardId(card.id, user.id),
      ]);
      
      const totalCount = (filesData?.length || 0) + (voiceNotesData?.length || 0);
      setCardFileCount(totalCount);
    } catch (error) {
      console.error('Error fetching card file count:', error);
    }
  };

  const handlePhoneCall = () => {
    const phones = card.phones || [];
    if (phones.length === 0) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
    const phoneNumber = typeof phones[0] === 'string' ? phones[0] : phones[0].number;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handlePhonePress = (phone: string | { label: string; number: string }) => {
    const phoneNumber = typeof phone === 'string' ? phone : phone.number;
    Linking.openURL(`tel:${phoneNumber}`);
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

  const handleAddressPress = (address?: string | { label: string; address: string }) => {
    let addressString: string;
    if (typeof address === 'string') {
      addressString = address;
    } else if (address && typeof address === 'object') {
      addressString = address.address;
    } else {
      addressString = card.addresses && card.addresses[0] ? 
        (typeof card.addresses[0] === 'string' ? card.addresses[0] : card.addresses[0].address) : '';
    }
    
    if (!addressString) {
      Alert.alert('No Address', 'This contact does not have an address.');
      return;
    }
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
      console.log('=== START RECORDING DEBUG ===');
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required to record voice notes.');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // ✅ Apply high-quality, compatible recording settings
      const recordingSettings = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
        },
      };

      // Create and prepare recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingSettings);
      
      // Set up status updates for timer
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          console.log('[STATUS UPDATE] Recording... duration:', status.durationMillis, 'ms');
        }
      });
      
      // Set progress update interval for smoother timer
      newRecording.setProgressUpdateInterval(100);
      
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      
      console.log('Recording started.');
      console.log('=== START RECORDING DEBUG END ===');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      
      // Wait a little before stopping (for iOS stability)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      
      console.log('Recording stopped. URI:', uri);
      console.log('Recording duration:', status.durationMillis);
      
      if (!uri || status.durationMillis < 500) {
        console.warn('Recording too short or invalid. Not saving.');
        setRecordedUri(null);
        setIsRecording(false);
        setRecording(null);
        setRecordingError('Recording too short. Please record for at least half a second.');
        return;
      }
      
      setRecordedUri(uri || null);
      setIsRecording(false);
      setRecording(null);
      setRecordingError(null);
    } catch (err) {
      setRecordingError('Failed to stop recording.');
      console.error('Voice Note: Error stopping recording:', err);
    }
  };

  const cancelRecording = () => {
    setRecording(null);
    setIsRecording(false);
    setRecordedUri(null);
    setRecordingError(null);
  };

  const handleVoiceNoteSave = async (uri: string, duration: number) => {
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to save a voice note.');
      return;
    }
    try {
      console.log('Saving voice note for cardId:', card.id);
      console.log('Voice note details:', { uri, duration });
      
      const result = await FileService.uploadVoiceNote(uri, card.id, user.id, duration);

      if (result.success && result.url) {
        console.log('Voice note saved successfully, updating badges...');
        // Here you would ideally refresh the card data from the store
        // or add the new voice note to the local state to update the UI.
        // For now, we just show an alert.
        Alert.alert('Success', 'Voice note saved successfully.');
        
        // Update badge counts immediately
        if (onFileChange) {
          console.log('Calling onFileChange callback...');
          onFileChange();
        }
        // Force refresh this card's file count
        console.log('Triggering card refresh...');
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(result.error || 'Failed to save voice note.');
      }
    } catch (error) {
      console.error('Voice note save error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred.');
      console.error('Failed to save voice note:', error);
    }
    // Close the modal regardless of success or failure
    setShowVoiceModal(false);
  };

  const playVoiceNote = async (note: any) => {
    try {
      console.log('🎧 Checking voice note before playback:', note.recording);
      
      // Validate the file before playing (for local files)
      if (note.recording && note.recording.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(note.recording);
        if (!fileInfo.exists || fileInfo.size < 1000) {
          console.warn('Voice note file is invalid or empty. Skipping playback.');
          Alert.alert('Playback Error', 'This voice note could not be played.');
          return;
        }
        console.log('✅ Voice note file validated. Size:', fileInfo.size, 'bytes');
      }
      
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
      console.log('✅ Voice note playback started.');
    } catch (err) {
      console.error('Error playing voice note:', err);
      setIsPlaying(false);
      setPlayingNoteId(null);
      Alert.alert('Playback Failed', 'The audio file may be damaged or unsupported.');
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
    
    try {
      console.log('🎧 Checking preview voice note before playback:', recordedUri);
      
      // Validate the file before playing
      const fileInfo = await FileSystem.getInfoAsync(recordedUri);
      if (!fileInfo.exists || fileInfo.size < 1000) {
        console.warn('Preview voice note file is invalid or empty. Skipping playback.');
        Alert.alert('Playback Error', 'This voice note could not be played.');
        return;
      }
      console.log('✅ Preview voice note file validated. Size:', fileInfo.size, 'bytes');
      
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
      console.log('✅ Preview voice note playback started.');
    } catch (err) {
      console.error('Error playing preview voice note:', err);
      Alert.alert('Playback Failed', 'The audio file may be damaged or unsupported.');
    }
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

  const fileCount = cardFileCount;

  const renderCardContent = () => (
    <View style={styles.card}>
      {/* Top Section - Header Info and Action Icons */}
      <View style={styles.topSection}>
        {/* Avatar - Clickable */}
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={() => onPress(card.id)} 
          activeOpacity={0.8}
        >
          {card.profileImage ? (
            <Image source={{ uri: card.profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {card.name ? (card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')) : '?'}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Name and Info - Clickable */}
        <TouchableOpacity 
          style={styles.headerInfo} 
          onPress={() => onPress(card.id)} 
          activeOpacity={0.8}
        >
          <Text style={styles.name} numberOfLines={1}>
            {card.name ? capitalizeName(card.name) : 'Unknown'}
          </Text>
          {card.company && <Text style={styles.company}>{card.company}</Text>}
          {card.title && <Text style={styles.title}>{card.title}</Text>}
        </TouchableOpacity>
        
        {/* Action Buttons - Not clickable for card opening */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => onToggleFavorite(card.id)}>
            <Star size={16} color={card.favorited ? Colors.accent : Colors.textSecondary} fill={card.favorited ? Colors.accent : 'none'} />
          </TouchableOpacity>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={(e) => {
                e.stopPropagation();
                fetchCardFileCount();
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
            <TouchableOpacity onPress={() => handlePhonePress(card.phone!)}>
              <Text style={styles.contactText}>{card.phone}</Text>
            </TouchableOpacity>
          </View>
        )}
        {(card.phones || []).map((phone, idx) => (
          <View key={`phone-${idx}`} style={styles.contactRow}>
            <Phone size={14} color={Colors.textSecondary} />
            <TouchableOpacity onPress={() => handlePhonePress(phone)}>
              <Text style={styles.contactText}>
                {typeof phone === 'string' ? phone : `${phone.label ? phone.label + ': ' : ''}${phone.number}`}
              </Text>
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
            <TouchableOpacity onPress={() => handleAddressPress(card.address)}>
              <Text style={styles.contactText} numberOfLines={1}>{card.address}</Text>
            </TouchableOpacity>
          </View>
        )}
        {(card.addresses || []).map((address, idx) => (
          <View key={`address-${idx}`} style={styles.contactRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <TouchableOpacity onPress={() => handleAddressPress(address)}>
              <Text style={styles.contactText} numberOfLines={1}>
                {typeof address === 'string' ? address : `${address.label ? address.label + ': ' : ''}${address.address}`}
              </Text>
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

      {/* Tags Section */}
      {card.tags && card.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <TagList tags={card.tags} maxTags={3} />
        </View>
      )}

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
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 0,
  },
  company: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 0,
    marginTop: 2,
  },
  title: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: Colors.textSecondary,
    opacity: 0.6,
    marginTop: 2,
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
  tagsSection: {
    marginBottom: spacing.sm,
  },
});

export default BusinessCardItem;