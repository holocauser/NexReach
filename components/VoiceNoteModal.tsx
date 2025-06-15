import React, { useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Animated, Dimensions, Platform } from 'react-native';
import { Mic, FileText, Play, Pause, X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import Colors from '@/constants/Colors';
import globalStyles, { spacing, typography, shadows } from '@/constants/Styles';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string, name: string, duration: number) => void;
  files?: { name: string; url: string }[];
  voiceNotes?: { id: string; name: string; duration: number; url: string }[];
}

const TABS = [
  { key: 'files', label: 'Files', icon: FileText },
  { key: 'voice', label: 'Voice Notes', icon: Mic },
];

const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({ visible, onClose, onSave, files = [], voiceNotes = [] }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'voice'>('voice');
  const [tabAnim] = useState(new Animated.Value(1));
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [name, setName] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tab animation
  const handleTabSwitch = (tab: 'files' | 'voice') => {
    setActiveTab(tab);
    Animated.timing(tabAnim, {
      toValue: tab === 'files' ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const startRecording = async () => {
    try {
      setTimer(0);
      setHasRecording(false);
      setRecordedUri(null);
      setName('');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required to record voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri || null);
      setIsRecording(false);
      setHasRecording(true);
      setRecording(null);
      clearInterval(intervalRef.current!);
      // Get duration
      const { sound: tempSound, status } = await Audio.Sound.createAsync({ uri: uri! }, {}, undefined, false);
      if (status.isLoaded) {
        setDuration(status.durationMillis || timer * 1000);
      }
      tempSound.unloadAsync();
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true }, (status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
        newSound.unloadAsync();
      }
    });
    setSound(newSound);
    setIsPlaying(true);
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const handleRetake = () => {
    setHasRecording(false);
    setRecordedUri(null);
    setTimer(0);
    setName('');
    stopPlayback();
  };

  const handleSave = () => {
    if (recordedUri) {
      onSave(recordedUri, name || 'Voice Note', duration || timer * 1000);
      setHasRecording(false);
      setRecordedUri(null);
      setTimer(0);
      setName('');
      stopPlayback();
      onClose();
    }
  };

  // --- UI ---
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Notes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          {/* Tabs */}
          <View style={styles.tabsRow}>
            {TABS.map((tab, idx) => {
              const isActive = (activeTab === tab.key);
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabButton}
                  onPress={() => handleTabSwitch(tab.key as 'files' | 'voice')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <tab.icon size={18} color={isActive ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                  {isActive && <Animated.View style={[styles.tabUnderline, { left: `${idx * 50}%` }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Animated Content */}
          <Animated.View style={{ flex: 1, width: '100%', flexDirection: 'row', transform: [{ translateX: tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -screenWidth] }) }] }}>
            {/* Files Tab */}
            <View style={[styles.tabContent, { width: screenWidth - 60 }]}> {/* 60 = horizontal padding */}
              {files.length === 0 ? (
                <Text style={styles.emptyText}>No files attached yet.</Text>
              ) : (
                files.map((file, idx) => (
                  <View key={file.url} style={styles.fileRow}>
                    <FileText size={20} color={Colors.primary} />
                    <Text style={styles.fileName}>{file.name}</Text>
                  </View>
                ))
              )}
            </View>
            {/* Voice Notes Tab */}
            <View style={[styles.tabContent, { width: screenWidth - 60 }]}> {/* 60 = horizontal padding */}
              {voiceNotes.length === 0 ? (
                <Text style={styles.emptyText}>No voice notes yet.</Text>
              ) : (
                <>
                  {/* If not recording and no recording exists, show a prominent 'Start Recording' button */}
                  {!isRecording && !hasRecording && (
                    <TouchableOpacity style={styles.startRecordingButton} onPress={startRecording} accessibilityLabel="Start Recording">
                      <Text style={styles.startRecordingText}>Start Recording</Text>
                    </TouchableOpacity>
                  )}
                  {/* If recording, show timer and 'Stop Recording' button */}
                  {isRecording && (
                    <View style={styles.recordingControls}>
                      <Text style={styles.timer}>{timer} seconds</Text>
                      <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording} accessibilityLabel="Stop Recording">
                        <Text style={styles.stopRecordingText}>Stop Recording</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* If hasRecording, show playback controls and 'Save' button */}
                  {hasRecording && (
                    <>
                      <View style={styles.playbackControls}>
                        <TouchableOpacity style={styles.playButton} onPress={playRecording} accessibilityLabel="Play Voice Note">
                          <Play size={20} color={Colors.cardBackground} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.pauseButton} onPress={pausePlayback} accessibilityLabel="Pause Voice Note">
                          <Pause size={20} color={Colors.cardBackground} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.saveButton} onPress={handleSave} accessibilityLabel="Save Voice Note">
                        <Text style={styles.saveText}>Save</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.large,
    minHeight: 380,
    maxHeight: 540,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabLabel: {
    fontSize: typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: '100%',
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  tabContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fileName: {
    marginLeft: spacing.md,
    fontSize: typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  voiceTitle: {
    fontSize: typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.inputBackground,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  startRecordingButton: {
    backgroundColor: Colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  startRecordingText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.cardBackground,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stopRecordingButton: {
    backgroundColor: Colors.primary,
    padding: spacing.md,
    borderRadius: 8,
  },
  stopRecordingText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.cardBackground,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  saveText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.cardBackground,
  },
  timer: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginRight: spacing.md,
  },
});

export default VoiceNoteModal; 