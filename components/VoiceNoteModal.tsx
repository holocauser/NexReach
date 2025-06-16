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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VoiceNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (uri: string) => void;
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformAnim = useRef(new Animated.Value(0)).current;
  const [appState, setAppState] = useState(AppState.currentState);

  // Cleanup on unmount
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
      if (recording) recording.stopAndUnloadAsync();
      if (sound) sound.unloadAsync();
      if (timerRef.current) clearInterval(timerRef.current);
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

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Request microphone permissions and alert if denied
  const requestMicPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required to record.');
        return false;
      }
      return true;
    } catch (err) {
      Alert.alert('Permission Error', String(err));
      return false;
    }
  };

  // Start recording (robust for iOS/Android, checks app state)
  const startRecording = async () => {
    setIsLoading(true);
    setShowReview(false);
    setRecordingUri(null);
    setDuration(0);
    setIsPaused(false);
    try {
      if (appState !== 'active') {
        Alert.alert('App Not Active', 'Please make sure the app is in the foreground before recording.');
        setIsLoading(false);
        return;
      }
      const permission = await requestMicPermissions();
      if (!permission) {
        setIsLoading(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      Alert.alert('Recording error', String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Pause recording
  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
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
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      Alert.alert('Resume error', String(err));
    }
  };

  // Stop recording and save file (robust for iOS/EAS)
  const stopRecording = async () => {
    if (!recording) return;
    setIsLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      if (timerRef.current) clearInterval(timerRef.current);
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI');
      const fileName = `${cardId}_${Date.now()}.m4a`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: newUri });
      setRecordingUri(newUri);
      setRecording(null);
      setIsRecording(false);
      setIsPaused(false);
      setShowReview(true);
      // Save to global store if provided
      if (saveToAudioStore) saveToAudioStore(newUri, cardId);
    } catch (err) {
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
      setIsLoading(true);
      if (sound) {
        try { await sound.unloadAsync(); } catch {}
        setSound(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
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
    } catch (err) {
      Alert.alert('Playback error', String(err));
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
      onSave(recordingUri);
      if (saveToAudioStore) saveToAudioStore(recordingUri, cardId);
      onClose();
    }
  };

  // UI
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{top: 16, left: 16, right: 16, bottom: 16}}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Voice Note</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Waveform + Timer */}
          <View style={styles.waveformSection}>
            {/* Placeholder waveform animation */}
            <Animated.View
              style={[
                styles.waveformBar,
                {
                  opacity: waveformAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  transform: [{ scaleY: waveformAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
                },
              ]}
            />
            <Text style={styles.timer}>{formatTime(duration)}</Text>
          </View>

          {/* Recording Controls */}
          {!showReview ? (
            <View style={styles.controlsSection}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={isRecording ? undefined : startRecording}
                disabled={isRecording || isLoading}
              >
                <View style={[styles.recordCircle, isRecording && styles.recordingActive]}>
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
            // Review Controls
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
  recordingActive: {
    backgroundColor: '#fff',
    borderColor: Colors.error,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginVertical: 8,
    marginHorizontal: 8,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 12,
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
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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