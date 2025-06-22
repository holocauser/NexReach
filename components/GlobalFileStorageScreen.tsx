import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
import { FileService } from '@/lib/fileService';
import { useAuth } from '@/contexts/AuthContext';
import { File as DbFile, VoiceNote as DbVoiceNote } from '@/types/database';
import { shadows } from '@/constants/Styles';
import { Search, Filter, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GlobalFileStorageScreenProps {
  visible: boolean;
  onClose: () => void;
  onFileChange?: () => void;
}

interface FileWithCard {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  mime_type: string;
  created_at: string;
  card_id: string;
  card_name?: string;
  fileType: 'file' | 'voice';
  duration?: number;
}

export default function GlobalFileStorageScreen({ visible, onClose, onFileChange }: GlobalFileStorageScreenProps) {
  const [tab, setTab] = useState<'files' | 'recordings'>('files');
  const [allFiles, setAllFiles] = useState<FileWithCard[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingVoiceNote, setPlayingVoiceNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingVoiceNote, setDownloadingVoiceNote] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'file' | 'recording' } | null>(null);
  const [newName, setNewName] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'large'>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (visible && user) {
      loadAllFiles();
    }
  }, [visible, user]);

  useEffect(() => {
    filterFiles();
  }, [searchQuery, filterType, allFiles, tab]);

  // Cleanup audio when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!visible && sound) {
      sound.unloadAsync();
      setSound(null);
      setPlayingVoiceNote(null);
      setIsPlaying(false);
    }
  }, [visible, sound]);

  const loadAllFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Get all files and voice notes for the current user's cards
      const [filesData, recordingsData] = await Promise.all([
        FileService.getAllFiles(user.id),
        FileService.getAllVoiceNotes(user.id),
      ]);

      // Transform files to include card information
      const filesWithCards: FileWithCard[] = (filesData || []).map(file => ({
        ...file,
        fileType: 'file' as const,
        card_name: file.card_name || 'Unknown Card',
      }));

      const recordingsWithCards: FileWithCard[] = (recordingsData || []).map(recording => ({
        ...recording,
        fileType: 'voice' as const,
        card_name: recording.card_name || 'Unknown Card',
      }));

      setAllFiles([...filesWithCards, ...recordingsWithCards]);
    } catch (error) {
      console.error('Error loading all files:', error);
      Alert.alert('Error', 'Failed to load files.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = allFiles.filter(item => {
      // Filter by tab
      if (tab === 'files' && item.fileType !== 'file') return false;
      if (tab === 'recordings' && item.fileType !== 'voice') return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (item.name?.toLowerCase() || '').includes(query) ||
          (item.card_name?.toLowerCase() || '').includes(query) ||
          (item.type?.toLowerCase() || '').includes(query)
        );
      }
      
      return true;
    });

    // Apply additional filters
    switch (filterType) {
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 50); // Show only recent 50
        break;
      case 'large':
        filtered = filtered
          .filter(item => item.size && item.size > 1024 * 1024) // Files larger than 1MB
          .sort((a, b) => (b.size || 0) - (a.size || 0));
        break;
      default:
        // Sort by creation date (newest first)
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    setFilteredFiles(filtered);
  };

  // Utility function to validate downloaded audio files
  const validateAudioFile = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('Downloaded file is empty or invalid');
    }
    console.log('Audio file validation passed:', { uri, size: fileInfo.size });
    return uri;
  };

  // Download audio from a remote source
  const downloadAudioFile = async (remoteUrl: string): Promise<string> => {
    try {
      console.log('=== DOWNLOAD AUDIO DEBUG START ===');
      console.log('Starting download from:', remoteUrl);
      
      // Create a unique filename for the downloaded audio
      const filename = `voice_note_${Date.now()}.m4a`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      console.log('Local URI will be:', localUri);

      // Check if file already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      console.log('File info check:', fileInfo);
      if (fileInfo.exists) {
        console.log('File already exists locally, using cached version');
        return await validateAudioFile(localUri);
      }

      // Download the file using FileSystem.downloadAsync
      console.log('Downloading with FileSystem.downloadAsync...');
      const response = await FileSystem.downloadAsync(remoteUrl, localUri);
      console.log('Download result:', response);
      console.log('Download status:', response.status);
      console.log('Download headers:', response.headers);

      if (response.status !== 200) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Validate downloaded file
      const validUri = await validateAudioFile(response.uri);
      console.log('=== DOWNLOAD AUDIO DEBUG END ===');
      return validUri;
      
    } catch (error) {
      console.error('=== DOWNLOAD AUDIO ERROR ===');
      console.error('Error downloading audio file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Try alternative approach - use fetch to get the file
      try {
        console.log('Trying fetch-based download as fallback...');
        const filename = `voice_note_fetch_${Date.now()}.m4a`;
        const localUri = `${FileSystem.documentDirectory}${filename}`;
        
        const response = await fetch(remoteUrl);
        console.log('Fetch response status:', response.status);
        console.log('Fetch response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob created:', { size: blob.size, type: blob.type });
        
        // Convert blob to base64 string
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        
        const base64Data = await base64Promise;
        // Remove the data URL prefix (e.g., "data:audio/m4a;base64,")
        const base64Content = base64Data.split(',')[1];
        
        // Write the file using base64 encoding
        await FileSystem.writeAsStringAsync(localUri, base64Content, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        
        console.log('Fetch-based download successful');
        return await validateAudioFile(localUri);
        
      } catch (fallbackError) {
        console.error('Fetch-based download also failed:', fallbackError);
        throw new Error(`Failed to download audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const playRecording = async (uri: string, voiceNoteId: string) => {
    if (!user) return;
    
    try {
      // If the same voice note is already playing, pause it
      if (playingVoiceNote === voiceNoteId && isPlaying) {
        if (sound) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
        return;
      }

      // If a different voice note is playing, stop it first
      if (sound && playingVoiceNote !== voiceNoteId) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // If the same voice note is paused, resume it
      if (playingVoiceNote === voiceNoteId && !isPlaying && sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }

      // Show loading state while downloading
      setDownloadingVoiceNote(voiceNoteId);

      // Get a signed URL for the voice note
      console.log('Getting signed URL for voice note:', voiceNoteId);
      const signedUrl = await FileService.getVoiceNoteSignedUrl(voiceNoteId, user.id);
      
      if (!signedUrl) {
        throw new Error('Failed to get signed URL for voice note');
      }

      // Download the audio file to local storage first
      console.log('Downloading audio file from signed URL');
      const localUri = await downloadAudioFile(signedUrl);
      console.log('Audio file downloaded to:', localUri);

      // Validate the downloaded file before playing
      const validUri = await validateAudioFile(localUri);

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and play the sound with better error handling
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: validUri },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying || false);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlayingVoiceNote(null);
            }
          } else if (status.error) {
            console.error('Audio playback error:', status.error);
            setIsPlaying(false);
            setPlayingVoiceNote(null);
            Alert.alert('Playback Error', 'Failed to play voice note. The file may be corrupted or in an unsupported format.');
          }
        }
      );

      setSound(newSound);
      setPlayingVoiceNote(voiceNoteId);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing recording:', error);
      
      // Try alternative playback method
      try {
        console.log('Trying alternative playback method...');
        await playRecordingAlternative(uri, voiceNoteId);
      } catch (alternativeError) {
        console.error('Alternative playback also failed:', alternativeError);
        Alert.alert('Error', 'Unable to play recording. The file might be missing or corrupted.');
      }
    } finally {
      setDownloadingVoiceNote(null);
    }
  };

  const playRecordingAlternative = async (uri: string, voiceNoteId: string) => {
    try {
      // Try playing directly from the URL without downloading
      console.log('Trying direct URL playback...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: uri },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 100,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying || false);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlayingVoiceNote(null);
            }
          } else if (status.error) {
            console.error('Direct URL playback error:', status.error);
            setIsPlaying(false);
            setPlayingVoiceNote(null);
          }
        }
      );

      setSound(newSound);
      setPlayingVoiceNote(voiceNoteId);
      setIsPlaying(true);
    } catch (error) {
      console.error('Alternative playback error:', error);
      throw error;
    }
  };

  const deleteFile = async (id: string, type: 'file' | 'voice') => {
    if (!user) return;
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = type === 'file' 
            ? await FileService.deleteFile(id, user.id)
            : await FileService.deleteVoiceNote(id, user.id);
          
          if (success) {
            Alert.alert('Success', 'File deleted.');
            loadAllFiles(); // Refresh list
            onFileChange?.(); // Update badge count
          } else {
            Alert.alert('Error', 'Failed to delete file.');
          }
        },
      },
    ]);
  };

  const handleOpenFile = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Try to share the file
        await Sharing.shareAsync(url);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open file.');
    }
  };

  const handleRename = async () => {
    if (!editingItem || !user) return;
    try {
      const success = editingItem.type === 'file'
        ? await FileService.updateFile(editingItem.id, user.id, { name: newName })
        : await FileService.updateVoiceNote(editingItem.id, user.id, { name: newName });
      
      if (success) {
        Alert.alert('Success', 'File renamed successfully.');
        loadAllFiles(); // Refresh list
        onFileChange?.(); // Update badge count
      } else {
        throw new Error('Failed to rename file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to rename file.');
    } finally {
      setShowRenameModal(false);
      setEditingItem(null);
      setNewName('');
    }
  };

  const startRename = (item: FileWithCard) => {
    setEditingItem({ id: item.id, name: item.name, type: item.fileType === 'voice' ? 'recording' : 'file' });
    setNewName(item.name);
    setShowRenameModal(true);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderFileItem = ({ item }: { item: FileWithCard }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        onPress={() => handleOpenFile(item.url)} 
        style={styles.itemInfo}
        disabled={downloadingVoiceNote === item.id}
      >
        {downloadingVoiceNote === item.id ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons 
            name={item.fileType === 'file' ? "document-text-outline" : "mic-outline"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        )}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCard}>{item.card_name}</Text>
          <Text style={styles.itemMeta}>
            {new Date(item.created_at).toLocaleDateString()} • {formatFileSize(item.size)}
            {item.fileType === 'voice' && item.duration && (
              ` • ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
            )}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        {item.fileType === 'voice' && (
          <TouchableOpacity onPress={() => playRecording(item.url, item.id)} style={styles.actionButton}>
            <Ionicons 
              name={playingVoiceNote === item.id && isPlaying ? "pause" : "play"} 
              size={20} 
              color={playingVoiceNote === item.id && isPlaying ? Colors.primary : Colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => startRename(item)} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteFile(item.id, item.fileType)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Global File Storage</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search files, cards, or types..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filterType === 'recent' && styles.filterTabActive]}
            onPress={() => setFilterType('recent')}
          >
            <Text style={[styles.filterText, filterType === 'recent' && styles.filterTextActive]}>Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filterType === 'large' && styles.filterTabActive]}
            onPress={() => setFilterType('large')}
          >
            <Text style={[styles.filterText, filterType === 'large' && styles.filterTextActive]}>Large Files</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'files' && styles.tabActive]}
            onPress={() => setTab('files')}
          >
            <Ionicons name="document-attach-outline" size={20} color={tab === 'files' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'files' && styles.tabTextActive]}>
              Files ({allFiles.filter(f => f.fileType === 'file').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'recordings' && styles.tabActive]}
            onPress={() => setTab('recordings')}
          >
            <Ionicons name="mic-outline" size={20} color={tab === 'recordings' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'recordings' && styles.tabTextActive]}>
              Recordings ({allFiles.filter(f => f.fileType === 'voice').length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={filteredFiles}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No files found matching your search.' : `No ${tab} found.`}
                </Text>
                {searchQuery && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <Text style={styles.clearSearchText}>Clear search</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename {editingItem?.type}</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowRenameModal(false)} style={styles.modalButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename} style={[styles.modalButton, styles.modalButtonPrimary]}>
                <Text style={{color: Colors.white}}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 10,
    ...shadows.medium,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDetails: {
    marginLeft: 10,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemCard: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  clearSearchText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
}); 