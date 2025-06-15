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

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - spacing.md * 3) / 2;

interface BusinessCardItemProps {
  card: BusinessCard;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onAddVoiceNote: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  onPress,
  onToggleFavorite,
  onEdit,
  onAddVoiceNote,
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
    const phoneNumber = card.phones[0];
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
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
    const phoneNumber = card.phones[0];
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number.');
      return;
    }
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
          files: [...(card.files || []), newFile],
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

  const saveVoiceNote = () => {
    if (!recordedUri) return;
    const newNote = {
      id: Date.now().toString(),
      cardId: card.id,
      recording: recordedUri,
      duration: 0, // Optionally calculate duration
      createdAt: new Date(),
    };
    const updatedCard = {
      ...card,
      voiceNotes: [...(card.voiceNotes || []), newNote],
    };
    updateCard(updatedCard);
    Alert.alert('Voice Note Saved', 'Your voice note was saved.');
    setShowVoiceModal(false);
    cancelRecording();
    // Optionally force refresh: onEdit(card.id);
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

  const renderCardContent = () => (
    <>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {card.profileImage ? (
            <Image source={{ uri: card.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{card.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.nameSection}>
            <Text style={styles.name}>{card.name}</Text>
            {card.title && <Text style={styles.title}>{card.title}</Text>}
            {card.company && <Text style={styles.company}>{card.company}</Text>}
            {card.tags && card.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {card.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
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
            onPress={() => setShowFilesModal(true)}
          >
            <FileText size={20} color={Colors.textSecondary} />
            {(card.files && card.files.filter(f => f && f.url).length > 0) && (
              <View style={styles.fileBadge}>
                <Text style={styles.fileBadgeText}>{card.files.filter(f => f && f.url).length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contactInfoSection}>
        {(card.phones && card.phones.length > 0
          ? card.phones
          : card.phone
            ? [card.phone]
            : []
        ).map((phone, idx) => (
          <TouchableOpacity key={idx} style={styles.contactRow} onPress={() => Linking.openURL(`tel:${phone}`)}>
            <Phone size={18} color={Colors.primary} />
            <Text style={styles.contactRowText}>{phone}</Text>
          </TouchableOpacity>
        ))}
        {card.email && (
          <TouchableOpacity style={styles.contactRow} onPress={handleEmailPress}>
            <Mail size={18} color={Colors.primary} />
            <Text style={styles.contactRowText}>{card.email}</Text>
          </TouchableOpacity>
        )}
        {card.website && (
          <TouchableOpacity style={styles.contactRow} onPress={handleWebsitePress}>
            <Globe size={18} color={Colors.primary} />
            <Text style={styles.contactRowText}>{card.website}</Text>
          </TouchableOpacity>
        )}
        {(card.addresses && card.addresses.length > 0
          ? card.addresses
          : card.address
            ? [card.address]
            : []
        ).map((address, idx) => (
          <TouchableOpacity key={idx} style={styles.contactRow} onPress={() => handleAddressPress(address)}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.contactRowText}>{address}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handlePhoneCall()}>
          <Phone size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSMSPress()}>
          <MessageCircle size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleReferPress}>
          <ArrowRight size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Refer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowVoiceModal(true)}>
          <Mic size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Record</Text>
        </TouchableOpacity>
      </View>

      {card.lastContacted && (
        <View style={styles.lastContactedContainer}>
          <Calendar size={16} color={Colors.textSecondary} />
          <Text style={styles.lastContactedText}>
            Last contact: {format(card.lastContacted, 'MMM d, yyyy')}
          </Text>
        </View>
      )}
    </>
  );

  return (
          <TouchableOpacity
      style={[
        styles.container,
        viewMode === 'grid' ? styles.gridContainer : styles.listContainer
      ]}
      onPress={() => onPress(card.id)}
    >
      {renderCardContent()}
      
      <Modal
        visible={showFilesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Files & Voice Notes</Text>
              <TouchableOpacity onPress={() => setShowFilesModal(false)} style={styles.modalCloseButton}>
                <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
            </View>
            <View style={styles.tabSwitcher}>
          <TouchableOpacity
                style={[styles.tabButton, activeTab === 'files' && styles.tabButtonActive]}
                onPress={() => setActiveTab('files')}
          >
                <Text style={[styles.tabButtonText, activeTab === 'files' && styles.tabButtonTextActive]}>Files</Text>
          </TouchableOpacity>
          <TouchableOpacity
                style={[styles.tabButton, activeTab === 'voice' && styles.tabButtonActive]}
                onPress={() => setActiveTab('voice')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'voice' && styles.tabButtonTextActive]}>Voice Notes</Text>
              </TouchableOpacity>
            </View>
            {activeTab === 'files' ? (
              <>
                {(card.files || []).length === 0 && <Text style={{ color: Colors.textSecondary, marginBottom: 12 }}>No files attached yet.</Text>}
                {(card.files || []).map((file, idx) => (
                  <TouchableOpacity key={file.url} style={styles.fileItem} onPress={() => handleOpenFile(file.url)}>
                    <FileText size={16} color={Colors.primary} />
                    <Text style={styles.fileItemText}>{file.name}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.attachFileButton} onPress={handleAddFile}>
                    <FileText size={20} color={Colors.primary} />
                    <Text style={styles.attachFileText}>Attach File</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {(card.voiceNotes || []).length === 0 && <Text style={{ color: Colors.textSecondary, marginBottom: 12 }}>No voice notes yet.</Text>}
                {(card.voiceNotes || []).map((note, idx) => {
                  const isCurrent = playingNoteId === note.id;
                  const durationSec = note.duration ? Math.round(note.duration / 1000) : playbackStatus && isCurrent && playbackStatus.durationMillis ? Math.round(playbackStatus.durationMillis / 1000) : 0;
                  const positionSec = playbackStatus && isCurrent && playbackStatus.positionMillis ? Math.round(playbackStatus.positionMillis / 1000) : 0;
                  return (
                    <View key={note.id} style={styles.fileItem}>
                      <Mic size={16} color={Colors.error} />
                      {editingNoteId === note.id ? (
                        <TextInput
                          value={editingNoteName}
                          onChangeText={setEditingNoteName}
                          onBlur={() => saveNoteName(note.id)}
                          style={styles.voiceNoteEditInput}
                          autoFocus
                        />
                      ) : (
                        <Text style={styles.fileItemText}>{note.name || `Voice Note ${idx + 1}`}</Text>
                      )}
                      <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setEditingNoteName(note.name || `Voice Note ${idx + 1}`); }} style={styles.editIcon}>
            <Edit size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.voiceNoteDuration}>{positionSec}s / {durationSec}s</Text>
                      {isCurrent && isPlaying ? (
                        <TouchableOpacity onPress={pauseVoiceNote} style={[styles.playButton, styles.playButtonActive]} disabled={!isCurrent}>
                          <Text style={styles.playButtonText}>Pause</Text>
                        </TouchableOpacity>
                      ) : isCurrent && !isPlaying ? (
                        <TouchableOpacity onPress={resumeVoiceNote} style={styles.playButton} disabled={!isCurrent}>
                          <Text style={styles.playButtonText}>Resume</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => playVoiceNote(note)} style={styles.playButton} disabled={isPlaying && !isCurrent}>
                          <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
                      )}
                      {isCurrent && (
                        <TouchableOpacity onPress={stopVoiceNote} style={styles.stopButton}>
                          <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
                      )}
                      {isCurrent && playbackStatus && playbackStatus.durationMillis ? (
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBar, { width: `${(playbackStatus.positionMillis / playbackStatus.durationMillis) * 100}%` }]} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>
      </Modal>
      <VoiceNoteModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSave={(uri, name, duration) => {
          const newNote = {
            id: Date.now().toString(),
            cardId: card.id,
            recording: uri,
            name,
            duration,
            createdAt: new Date(),
          };
          const updatedCard = {
            ...card,
            voiceNotes: [...(card.voiceNotes || []), newNote],
          };
          updateCard(updatedCard);
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    ...shadows.small,
  },
  listContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  gridContainer: {
    width: cardWidth,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: Colors.cardBackground,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  company: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  fileButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  fileBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fileBadgeText: {
    color: Colors.cardBackground,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
  tagsContainer: {
    marginBottom: spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: Colors.primary,
  },
  lastContactedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  lastContactedText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fileItemText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  attachFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  attachFileText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 10,
  },
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  voiceNoteText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 10,
  },
  tabSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontFamily: 'Inter-SemiBold',
  },
  voiceModalContainer: {
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
  },
  voiceRecordControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  recordButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  recordButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 10,
  },
  cancelButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 10,
  },
  saveButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
    marginLeft: 10,
  },
  playButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  playButtonText: {
    color: Colors.cardBackground,
    fontFamily: 'Inter-Medium',
  },
  stopButton: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.error,
    borderRadius: 6,
  },
  stopButtonText: {
    color: Colors.cardBackground,
    fontFamily: 'Inter-Medium',
  },
  voiceNoteDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.textLight,
    borderRadius: 2,
    marginTop: 4,
    width: 80,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  playButtonActive: {
    backgroundColor: Colors.success,
  },
  voiceNoteEditInput: {
    borderBottomWidth: 1,
    borderColor: Colors.primary,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginRight: 8,
    minWidth: 80,
  },
  editIcon: {
    marginLeft: 6,
    marginRight: 6,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.large,
  },
  contactInfoSection: {
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  contactRowText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  tagBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 4,
    marginRight: 4,
  },
  tagBadgeText: {
    color: Colors.cardBackground,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
  },
});

export default BusinessCardItem;