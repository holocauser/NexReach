import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Mic, Square, Play, Pause, RefreshCw, Save, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VoiceNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string, duration: number) => void;
  cardId: string;
  saveToAudioStore?: (uri: string, cardId: string) => void; // Optional global save
}

export default function VoiceNoteModal({ visible, onClose, onSave, cardId, saveToAudioStore }: VoiceNoteModalProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const [appState, setAppState] = useState(AppState.currentState);

  // Cleanup on unmount
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
      if (recording) recording.stopAndUnloadAsync();
      if (sound) sound.unloadAsync();
    };
  }, [recording, sound]);

  // Animate waveform (placeholder)
  useEffect(() => {
    if (isRecording || isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(waveformAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveformAnim.stopAnimation();
      waveformAnim.setValue(0);
    }
  }, [isRecording, isPlaying]);

  // Format time for display (convert milliseconds to seconds for display)
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start recording (robust for iOS/Android, checks app state)
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
      
      // Set up status updates for timer (duration is in milliseconds)
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setDuration(status.durationMillis || 0);
          console.log('[STATUS UPDATE] Recording... duration:', status.durationMillis, 'ms');
        }
      });
      
      // Set progress update interval for smoother timer
      newRecording.setProgressUpdateInterval(100);
      
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      
      console.log('Recording started.');
      console.log('=== START RECORDING DEBUG END ===');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Pause recording
  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
    } catch (err) {
      Alert.alert('Pause error', String(err));
    }
  };

  // Resume recording
  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      setIsPaused(false);
    } catch (err) {
      Alert.alert('Resume error', String(err));
    }
  };

  // Stop recording and save file (robust for iOS/EAS)
  const stopRecording = async () => {
    console.log('=== STOP RECORDING CALLED ===');
    if (!recording) {
      console.log('No recording object, returning early');
      return;
    }

    const lastKnownDurationMs = duration; // duration is already in milliseconds
    console.log(`Last known duration from state: ${lastKnownDurationMs}ms`);

    try {
      console.log('=== STOP RECORDING DEBUG ===');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      console.log('Recording stopped. URI:', uri);

      if (!uri || lastKnownDurationMs < 500) {
        console.warn('Recording too short or invalid. Not saving.');
        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        return;
      }
      
      const finalDuration = lastKnownDurationMs;
      const fileName = `${cardId}_${Date.now()}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({ from: uri, to: newUri });
      
      setRecordingUri(newUri);
      // duration state is in milliseconds, convert to seconds for display
      setDuration(Math.floor(lastKnownDurationMs / 1000));
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setShowReview(true);
      
      if (saveToAudioStore) saveToAudioStore(newUri, cardId);
      
    } catch (err) {
      console.error('=== STOP RECORDING ERROR ===');
      console.error('Stop recording error:', err);
      Alert.alert('Stop error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Play recording (robust for iOS/Android)
  const playRecording = async () => {
    if (!recordingUri) {
      Alert.alert('No recording', 'Please record audio first.');
      return;
    }
    try {
      console.log('🎧 Checking voice note before playback:', recordingUri);
      
      const fileInfo = await FileSystem.getInfoAsync(recordingUri);
      if (!fileInfo.exists || fileInfo.size < 1000) {
        console.warn('Voice note file is invalid or empty. Skipping playback.');
        Alert.alert('Playback Error', 'This voice note could not be played.');
        return;
      }
      
      console.log('✅ Voice note file validated. Size:', fileInfo.size, 'bytes');
      
      setIsLoading(true);
      if (sound) {
        try { await sound.unloadAsync(); } catch {}
        setSound(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying) {
          setIsPlaying(false);
          newSound.unloadAsync();
        }
      });
      console.log('✅ Voice note playback started.');
    } catch (err) {
      console.error('Error playing voice note:', err);
      Alert.alert('Playback Failed', 'The audio file may be damaged or unsupported.');
    } finally {
      setIsLoading(false);
    }
  };

  // Record again (reset)
  const recordAgain = () => {
    setRecordingUri(null);
    setShowReview(false);
    setDuration(0);
  };

  // Save recording
  const saveRecording = () => {
    if (recordingUri) {
      console.log('=== SAVE RECORDING DEBUG ===');
      console.log('Saving recording with URI:', recordingUri);
      console.log('Duration:', duration);
      
      if (duration < 1) {
        console.warn('Recording duration too short, not saving');
        Alert.alert('Recording Too Short', 'Please record for at least a second.');
        return;
      }
      
      // duration is now in seconds (converted in stopRecording), convert back to milliseconds for save
      const durationMs = Math.round(duration * 1000);
      onSave(recordingUri, durationMs);
      if (saveToAudioStore) saveToAudioStore(recordingUri, cardId);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Top Bar and other UI */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Voice Note</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.waveformSection}>
            <Animated.View style={[ styles.waveformBar, { opacity: waveformAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ scaleY: waveformAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }], }]} />
            <Text style={styles.timer}>{formatTime(duration)}</Text>
          </View>
          
          {!showReview ? (
            <View style={styles.controlsSection}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={isRecording ? undefined : startRecording}
                disabled={isRecording || isLoading}
              >
                <View style={[styles.recordCircle, isRecording && styles.recordCircleActive]}>
                  <Mic size={40} color={isRecording ? '#fff' : Colors.error} />
                </View>
              </TouchableOpacity>
              {isRecording && !isPaused && (
                <TouchableOpacity style={styles.controlBtn} onPress={pauseRecording}>
                  <Pause size={28} color="#fff" />
                  <Text style={styles.controlLabel}>Pause</Text>
                </TouchableOpacity>
              )}
              {isRecording && isPaused && (
                <TouchableOpacity style={styles.controlBtn} onPress={resumeRecording}>
                  <Play size={28} color="#fff" />
                  <Text style={styles.controlLabel}>Resume</Text>
                </TouchableOpacity>
              )}
              {isRecording && (
                <TouchableOpacity style={styles.controlBtn} onPress={stopRecording}>
                  <Square size={28} color="#fff" />
                  <Text style={styles.controlLabel}>Stop</Text>
                </TouchableOpacity>
              )}
              {isLoading && <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />}
            </View>
          ) : (
            <View style={styles.reviewSection}>
              <TouchableOpacity style={styles.playBtn} onPress={playRecording} disabled={isLoading}>
                <Play size={36} color="#fff" />
              </TouchableOpacity>
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.reviewBtn} onPress={recordAgain}>
                  <RefreshCw size={24} color="#fff" />
                  <Text style={styles.reviewLabel}>Record Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reviewBtn} onPress={saveRecording}>
                  <Save size={24} color="#fff" />
                  <Text style={styles.reviewLabel}>Save Recording</Text>
                </TouchableOpacity>
              </View>
              {isLoading && <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />}
            </View>
          )}
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
    backgroundColor: '#111',
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
    backgroundColor: 'transparent',
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
  waveformSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  waveformBar: {
    width: screenWidth * 0.7,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    opacity: 0.2,
    marginBottom: 12,
  },
  timer: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  controlsSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordCircleActive: {
    backgroundColor: '#fff',
    borderColor: Colors.error,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  reviewSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 8,
  },
  reviewLabel: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
}); 