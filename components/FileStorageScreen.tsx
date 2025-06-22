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
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FileStorageScreenProps {
  visible: boolean;
  onClose: () => void;
  cardId: string;
  onFileChange?: () => void;
  onCardFileChange?: (cardId: string) => void;
}

export default function FileStorageScreen({ visible, onClose, cardId, onFileChange, onCardFileChange }: FileStorageScreenProps) {
  const [tab, setTab] = useState<'files' | 'recordings'>('files');
  const [files, setFiles] = useState<DbFile[]>([]);
  const [recordings, setRecordings] = useState<DbVoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingVoiceNote, setPlayingVoiceNote] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'file' | 'recording' } | null>(null);
  const [newName, setNewName] = useState('');
  const { user } = useAuth();

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Clean up audio when modal closes
  useEffect(() => {
    if (!visible && sound) {
      sound.unloadAsync();
      setSound(null);
      setPlayingVoiceNote(null);
      setIsPlaying(false);
    }
  }, [visible, sound]);

  // Verify card exists in database
  const verifyCardExists = async (cardId: string) => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();
      
      return !error && data;
    } catch (error) {
      console.error('Error verifying card:', error);
      return false;
    }
  };

  useEffect(() => {
    if (visible && user) {
      loadFilesAndRecordings();
      // Verify card exists when opening
      verifyCardExists(cardId);
    }
  }, [visible, cardId, user]);

  const loadFilesAndRecordings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [filesData, recordingsData] = await Promise.all([
        FileService.getFilesByCardId(cardId, user.id),
        FileService.getVoiceNotesByCardId(cardId, user.id),
      ]);
      setFiles(filesData || []);
      setRecordings(recordingsData || []);
      if (onFileChange) {
        onFileChange();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load files and recordings.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!user) return;
    try {
      console.log('Uploading file for cardId:', cardId);
      console.log('User ID:', user.id);
      
      // Verify card exists before uploading
      const cardExists = await verifyCardExists(cardId);
      if (!cardExists) {
        Alert.alert('Error', 'Card not found in database. Please refresh and try again.');
        return;
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsLoading(true);
        const file = result.assets[0];
        console.log('File to upload:', { name: file.name, uri: file.uri });
        
        const uploadResult = await FileService.uploadFile(
          file.uri,
          file.name,
          cardId,
          user.id
        );
        if (uploadResult.success) {
          Alert.alert('Success', 'File uploaded successfully.');
          loadFilesAndRecordings(); // Refresh list
          if (onFileChange) {
            onFileChange();
          }
          if (onCardFileChange) {
            onCardFileChange(cardId);
          }
        } else {
          throw new Error(uploadResult.error);
        }
      }
    } catch (error) {
      console.error('Upload error details:', error);
      Alert.alert('Error', 'Failed to upload file.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (!user) return;
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await FileService.deleteFile(id, user.id);
          if (success) {
            Alert.alert('Success', 'File deleted.');
            setFiles(prev => prev.filter(f => f.id !== id));
            if (onFileChange) {
              onFileChange();
            }
            if (onCardFileChange) {
              onCardFileChange(cardId);
            }
          } else {
            Alert.alert('Error', 'Failed to delete file.');
          }
        },
      },
    ]);
  };

  const deleteVoiceNote = async (id: string) => {
    if (!user) return;
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await FileService.deleteVoiceNote(id, user.id);
          if (success) {
            Alert.alert('Success', 'Recording deleted.');
            setRecordings(prev => prev.filter(r => r.id !== id));
            if (onFileChange) {
              onFileChange();
            }
            if (onCardFileChange) {
              onCardFileChange(cardId);
            }
          } else {
            Alert.alert('Error', 'Failed to delete recording.');
          }
        },
      },
    ]);
  };

  const playVoiceNote = async (voiceNote: DbVoiceNote) => {
    try {
      // Stop any currently playing audio
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPlayingVoiceNote(null);
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Get signed URL for the voice note
      const signedUrl = await FileService.getVoiceNoteSignedUrl(voiceNote.id, user?.id || '');
      const audioUrl = signedUrl || voiceNote.url;

      console.log('Playing voice note from URL:', audioUrl);

      // Create and play the sound with better error handling
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
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
            if (!status.isPlaying) {
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
      setPlayingVoiceNote(voiceNote.id);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing voice note:', error);
      
      // Try fallback approach - download and play locally
      try {
        console.log('Trying fallback playback method...');
        await playVoiceNoteFallback(voiceNote);
      } catch (fallbackError) {
        console.error('Fallback playback also failed:', fallbackError);
        Alert.alert('Error', 'Failed to play voice note. Please try again later.');
      }
    }
  };

  const playVoiceNoteFallback = async (voiceNote: DbVoiceNote) => {
    try {
      // Download the file locally first
      const filename = `voice_note_${Date.now()}.m4a`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      
      const signedUrl = await FileService.getVoiceNoteSignedUrl(voiceNote.id, user?.id || '');
      const audioUrl = signedUrl || voiceNote.url;
      
      console.log('Downloading voice note for local playback:', audioUrl);
      
      const response = await FileSystem.downloadAsync(audioUrl, localUri);
      console.log('Download result:', response);
      
      if (response.status !== 200) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      
      // Verify the downloaded file
      const fileInfo = await FileSystem.getInfoAsync(response.uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Downloaded file is empty or invalid');
      }
      
      console.log('Playing from local file:', response.uri);
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and play the sound from local file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: response.uri },
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
            if (!status.isPlaying) {
              setIsPlaying(false);
              setPlayingVoiceNote(null);
            }
          } else if (status.error) {
            console.error('Local audio playback error:', status.error);
            setIsPlaying(false);
            setPlayingVoiceNote(null);
          }
        }
      );

      setSound(newSound);
      setPlayingVoiceNote(voiceNote.id);
      setIsPlaying(true);
    } catch (error) {
      console.error('Fallback playback error:', error);
      throw error;
    }
  };

  const handleOpenFile = async (url: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(url);
      } else {
        Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Cannot open this file type.');
    }
  };

  const handleRename = async () => {
    if (!editingItem || !newName || !user) return;

    const { id, type } = editingItem;
    let success = false;
    
    if (type === 'file') {
      success = await FileService.updateFile(id, user.id, { name: newName });
    } else {
      success = await FileService.updateVoiceNote(id, user.id, { name: newName });
    }

    if (success) {
      Alert.alert('Success', 'Renamed successfully.');
      loadFilesAndRecordings(); // Refresh both lists
      if (onFileChange) {
        onFileChange();
      }
      if (onCardFileChange) {
        onCardFileChange(cardId);
      }
    } else {
      Alert.alert('Error', 'Failed to rename.');
    }

    setShowRenameModal(false);
    setEditingItem(null);
    setNewName('');
  };

  const startRename = (item: DbFile | DbVoiceNote, type: 'file' | 'recording') => {
    setEditingItem({ id: item.id, name: item.name || '', type });
    setNewName(item.name || '');
    setShowRenameModal(true);
  };
  
  const renderFileItem = ({ item }: { item: DbFile }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => handleOpenFile(item.url)} style={styles.itemInfo}>
        <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => startRename(item, 'file')} style={styles.actionButton}>
          <Ionicons name="create-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteFile(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecordingItem = ({ item }: { item: DbVoiceNote }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => handleOpenFile(item.url)} style={styles.itemInfo}>
        <Ionicons name="mic-outline" size={24} color={Colors.primary} />
        <View>
          <Text style={styles.itemName}>{item.name || `Recording ${item.id.substring(0, 5)}`}</Text>
          <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => playVoiceNote(item)} style={styles.actionButton}>
          <Ionicons 
            name={playingVoiceNote === item.id && isPlaying ? "pause" : "play"} 
            size={24} 
            color={playingVoiceNote === item.id && isPlaying ? Colors.primary : Colors.textSecondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => startRename(item, 'recording')} style={styles.actionButton}>
          <Ionicons name="create-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteVoiceNote(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const listData = tab === 'files' ? files : recordings;
  const renderItem = tab === 'files' ? renderFileItem : renderRecordingItem;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attached Files</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={32} color={Colors.gray} />
          </TouchableOpacity>
        </View>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'files' && styles.tabActive]}
            onPress={() => setTab('files')}
          >
            <Ionicons name="document-attach-outline" size={20} color={tab === 'files' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'files' && styles.tabTextActive]}>Files ({files.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'recordings' && styles.tabActive]}
            onPress={() => setTab('recordings')}
          >
            <Ionicons name="mic-outline" size={20} color={tab === 'recordings' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.tabText, tab === 'recordings' && styles.tabTextActive]}>Recordings ({recordings.length})</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={listData}
            renderItem={renderItem as any}
            keyExtractor={(item: any) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No {tab} found.</Text>}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
        
        {/* FABs */}
        {tab === 'files' && (
          <TouchableOpacity style={styles.fab} onPress={uploadFile}>
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  itemName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  itemDate: {
    marginLeft: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 10,
    marginLeft: 10,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 5,
  }
}); 