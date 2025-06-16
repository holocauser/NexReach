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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useCardStore } from '@/store/cardStore';
import * as Sharing from 'expo-sharing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Recording {
  id: string;
  name: string;
  duration: string;
  date: string;
  uri: string;
}

interface File {
  id: string;
  name: string;
  type: string;
  date: string;
  uri: string;
  duration?: string;
}

interface FileStorageScreenProps {
  visible: boolean;
  onClose: () => void;
  cardId: string;
}

export default function FileStorageScreen({ visible, onClose, cardId }: FileStorageScreenProps) {
  const [tab, setTab] = useState<'files' | 'recordings'>('files');
  const [files, setFiles] = useState<File[]>([]);
  const [recordings, setRecordings] = useState<File[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'file' | 'recording' } | null>(null);
  const [newName, setNewName] = useState('');
  const { getCardById, updateCard } = useCardStore();

  useEffect(() => {
    if (visible) {
      loadFiles();
      loadRecordings();
    }
  }, [visible, cardId]);

  const loadFiles = async () => {
    try {
      const filesDir = `${FileSystem.documentDirectory}files/${cardId}`;
      const dirInfo = await FileSystem.getInfoAsync(filesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(filesDir, { intermediates: true });
      }
      const filesList = await FileSystem.readDirectoryAsync(filesDir);
      const filesData = await Promise.all(
        filesList.map(async (fileName) => {
          const fileInfo = await FileSystem.getInfoAsync(`${filesDir}/${fileName}`);
          const modTime = fileInfo.exists && 'modificationTime' in fileInfo && fileInfo.modificationTime ? fileInfo.modificationTime : Date.now();
          return {
            id: fileName,
            name: fileName,
            type: fileName.split('.').pop() || 'unknown',
            date: new Date(modTime).toISOString().split('T')[0],
            uri: fileInfo.uri,
            url: fileInfo.uri,
            createdAt: new Date(modTime).toISOString(),
          };
        })
      );
      setFiles(filesData.map(({ id, name, type, date, uri }) => ({ id, name, type, date, uri })));
      const card = getCardById(cardId);
      if (card) {
        const filesForStore = filesData.map(({ id, name, type, url, createdAt }) => ({ id, name, type, url, createdAt }));
        const updatedCard = { ...card, files: filesForStore };
        updateCard(updatedCard);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Failed to load files');
    }
  };

  const loadRecordings = async () => {
    try {
      const recordingsDir = `${FileSystem.documentDirectory}recordings/${cardId}`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
      }
      const files = await FileSystem.readDirectoryAsync(recordingsDir);
      const recordings = await Promise.all(
        files.map(async (file) => {
          const fileInfo = await FileSystem.getInfoAsync(`${recordingsDir}/${file}`);
          const modTime = fileInfo.exists && 'modificationTime' in fileInfo && fileInfo.modificationTime ? fileInfo.modificationTime : Date.now();
          return {
            id: file,
            name: file,
            duration: '00:00', // Placeholder
            date: new Date(modTime).toISOString().split('T')[0],
            uri: fileInfo.uri,
            type: file.split('.').pop() || 'unknown',
          };
        })
      );
      setRecordings(recordings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recordings');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const recordingsDir = `${FileSystem.documentDirectory}recordings/${cardId}`;
        const newUri = `${recordingsDir}/${new Date().toISOString()}.m4a`;
        await FileSystem.moveAsync({ from: uri, to: newUri });
        loadRecordings();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    } finally {
      setRecording(null);
    }
  };

  const playRecording = async (uri: string) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      const recordingsDir = `${FileSystem.documentDirectory}recordings/${cardId}`;
      await FileSystem.deleteAsync(`${recordingsDir}/${id}`);
      loadRecordings();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete recording');
    }
  };

  const uploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const filesDir = `${FileSystem.documentDirectory}files/${cardId}`;
        const newUri = `${filesDir}/${file.name}`;
        const dirInfo = await FileSystem.getInfoAsync(filesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(filesDir, { intermediates: true });
        }
        await FileSystem.copyAsync({ from: file.uri, to: newUri });
        const check = await FileSystem.getInfoAsync(newUri);
        if (!check.exists) {
          Alert.alert('Copy failed', 'File was not saved to storage.');
          return;
        }
        const newFile = {
          id: file.name,
          name: file.name,
          type: file.name.split('.').pop() || 'unknown',
          date: new Date().toISOString().split('T')[0],
          uri: newUri,
        };
        setFiles(prev => {
          const updated = [...prev, newFile];
          if (!updated.find(f => f.id === newFile.id)) {
            Alert.alert('UI Error', 'File list did not update.');
          }
          return updated;
        });
        const card = getCardById(cardId);
        if (card) {
          const newFileForStore = {
            id: file.name,
            name: file.name,
            type: file.name.split('.').pop() || 'unknown',
            url: newUri,
            createdAt: new Date().toISOString(),
          };
          const updatedCard = {
            ...card,
            files: [...(card.files || []), newFileForStore],
          };
          updateCard(updatedCard);
        }
        setTimeout(loadFiles, 500);
        Alert.alert('Success', 'File uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const filesDir = `${FileSystem.documentDirectory}files/${cardId}`;
      const fileUri = `${filesDir}/${id}`;
      
      // Delete from file system
      await FileSystem.deleteAsync(fileUri);
      
      // Update local state
      setFiles(prev => prev.filter(file => file.id !== id));
      
      // Update card store
      const card = getCardById(cardId);
      if (card) {
        const updatedCard = {
          ...card,
          files: (card.files || []).filter(file => file.id !== id)
        };
        updateCard(updatedCard);
      }
      
      Alert.alert('Success', 'File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Failed to delete file');
    }
  };

  const handleOpenFile = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Not supported', 'File sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file.');
    }
  };

  const handleRename = async () => {
    if (!editingItem || !newName.trim()) return;

    try {
      const oldName = editingItem.name;
      const newFileName = `${newName.trim()}.${oldName.split('.').pop()}`;
      
      if (editingItem.type === 'file') {
        const filesDir = `${FileSystem.documentDirectory}files/${cardId}`;
        const oldPath = `${filesDir}/${oldName}`;
        const newPath = `${filesDir}/${newFileName}`;
        
        await FileSystem.moveAsync({ from: oldPath, to: newPath });
        
        // Update local state
        setFiles(prev => prev.map(file => 
          file.id === oldName ? { ...file, id: newFileName, name: newFileName } : file
        ));
        
        // Update card store
        const card = getCardById(cardId);
        if (card) {
          const updatedFiles = (card.files || []).map(file => 
            file.id === oldName ? { ...file, id: newFileName, name: newFileName } : file
          );
          updateCard({ ...card, files: updatedFiles });
        }
      } else {
        const recordingsDir = `${FileSystem.documentDirectory}recordings/${cardId}`;
        const oldPath = `${recordingsDir}/${oldName}`;
        const newPath = `${recordingsDir}/${newFileName}`;
        
        await FileSystem.moveAsync({ from: oldPath, to: newPath });
        
        // Update local state
        setRecordings(prev => prev.map(rec => 
          rec.id === oldName ? { ...rec, id: newFileName, name: newFileName } : rec
        ));
      }
      
      Alert.alert('Success', 'File renamed successfully');
    } catch (error) {
      console.error('Error renaming file:', error);
      Alert.alert('Error', 'Failed to rename file');
    } finally {
      setShowRenameModal(false);
      setEditingItem(null);
      setNewName('');
    }
  };

  const startRename = (item: File, type: 'file' | 'recording') => {
    const nameWithoutExtension = item.name.split('.').slice(0, -1).join('.');
    setEditingItem({ id: item.id, name: item.name, type });
    setNewName(nameWithoutExtension);
    setShowRenameModal(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>File Storage</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'files' && styles.tabBtnActive]}
              onPress={() => setTab('files')}
            >
              <Ionicons name="document-outline" size={20} color={tab === 'files' ? Colors.primary : '#fff'} />
              <Text style={[styles.tabLabel, tab === 'files' && styles.tabLabelActive]}>Files</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'recordings' && styles.tabBtnActive]}
              onPress={() => setTab('recordings')}
            >
              <Ionicons name="mic-outline" size={20} color={tab === 'recordings' ? Colors.primary : '#fff'} />
              <Text style={[styles.tabLabel, tab === 'recordings' && styles.tabLabelActive]}>Recordings</Text>
            </TouchableOpacity>
          </View>

          {/* Rename Modal */}
          <Modal
            visible={showRenameModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowRenameModal(false)}
          >
            <View style={styles.renameModalOverlay}>
              <View style={styles.renameModal}>
                <Text style={styles.renameTitle}>Rename {editingItem?.type === 'file' ? 'File' : 'Recording'}</Text>
                <TextInput
                  style={styles.renameInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter new name"
                  placeholderTextColor="#666"
                  autoFocus
                />
                <View style={styles.renameButtons}>
                  <TouchableOpacity 
                    style={[styles.renameButton, styles.cancelButton]} 
                    onPress={() => setShowRenameModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.renameButton, styles.confirmButton]} 
                    onPress={handleRename}
                  >
                    <Text style={styles.buttonText}>Rename</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Content */}
          <View style={styles.content}>
            {tab === 'files' ? (
              <>
                <FlatList
                  data={files}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.card}
                      onPress={() => handleOpenFile(item.uri)}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={item.type === 'pdf' ? 'document-text-outline' : 'image-outline'} 
                        size={24} 
                        color={Colors.primary} 
                        style={{ marginRight: 12 }} 
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardSubtitle}>{item.date}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => startRename(item, 'file')} 
                        style={styles.iconBtn}
                      >
                        <Ionicons name="pencil-outline" size={24} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteFile(item.id)} 
                        style={styles.iconBtn}
                      >
                        <Ionicons name="trash-outline" size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No files yet.</Text>}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={uploadFile}>
                  <Ionicons name="cloud-upload-outline" size={28} color="#fff" />
                  <Text style={styles.actionLabel}>Upload File</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <FlatList
                  data={recordings}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <Ionicons name="mic-outline" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardSubtitle}>{item.duration} • {item.date}</Text>
                      </View>
                      <TouchableOpacity onPress={() => playRecording(item.uri)} style={styles.iconBtn}>
                        <Ionicons name="play-circle-outline" size={28} color={Colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => startRename(item, 'recording')} 
                        style={styles.iconBtn}
                      >
                        <Ionicons name="pencil-outline" size={24} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteRecording(item.id)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No recordings yet.</Text>}
                  contentContainerStyle={{ paddingBottom: 24 }}
                />
                <TouchableOpacity style={styles.actionBtn} onPress={recording ? stopRecording : startRecording}>
                  <Ionicons name={recording ? "stop-circle-outline" : "mic-circle-outline"} size={28} color="#fff" />
                  <Text style={styles.actionLabel}>{recording ? 'Stop Recording' : 'Record New'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: '#23232a',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#23232a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
    backgroundColor: '#23232a',
  },
  tabLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    width: '100%',
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#52525b',
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
    alignSelf: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  renameButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
}); 