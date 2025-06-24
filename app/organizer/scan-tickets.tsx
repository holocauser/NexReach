import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Vibration,
  TextInput,
} from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  ArrowLeft, 
  Flashlight, 
  FlashlightOff, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  Settings,
  RefreshCw,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { TicketValidationService, TicketValidationResult } from '@/lib/ticketValidationService';
import { supabase } from '@/lib/supabase';
import { Event, Ticket } from '@/types/database';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(width, height) * 0.6;

interface EventStats {
  totalTickets: number;
  checkedIn: number;
  pending: number;
}

export default function ScanTicketsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isScanning, setIsScanning] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [eventStats, setEventStats] = useState<EventStats>({ totalTickets: 0, checkedIn: 0, pending: 0 });
  const [manualCheckIn, setManualCheckIn] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [recentValidations, setRecentValidations] = useState<TicketValidationResult[]>([]);

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Load organizer's events
  useEffect(() => {
    loadEvents();
  }, [user]);

  // Load event statistics when event is selected
  useEffect(() => {
    if (selectedEvent) {
      loadEventStats();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    }
  };

  const loadEventStats = async () => {
    if (!selectedEvent || !user) return;

    try {
      // Get total tickets
      const { data: totalTickets, error: totalError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .eq('event_id', selectedEvent.id)
        .eq('status', 'confirmed');

      if (totalError) throw totalError;

      // Get checked in tickets
      const { data: checkedInTickets, error: checkedError } = await supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .eq('event_id', selectedEvent.id)
        .eq('status', 'confirmed')
        .not('validated_at', 'is', null);

      if (checkedError) throw checkedError;

      setEventStats({
        totalTickets: totalTickets?.length || 0,
        checkedIn: checkedInTickets?.length || 0,
        pending: (totalTickets?.length || 0) - (checkedInTickets?.length || 0),
      });
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  };

  const handleBarCodeScanned = async (scanResult: BarCodeScannerResult) => {
    if (scanned || !selectedEvent || !user) return;

    setScanned(true);
    setIsScanning(false);
    Vibration.vibrate(100);

    try {
      setLoading(true);
      
      // Decode QR code data
      const qrData = TicketValidationService.decodeQRCode(scanResult.data);
      if (!qrData) {
        showValidationResult({
          success: false,
          message: '❌ Invalid QR code format'
        });
        return;
      }

      // Validate ticket
      const result = await TicketValidationService.validateTicket(
        qrData.ticketId,
        user.id,
        selectedEvent.id
      );

      showValidationResult(result);
      
      // Update stats if validation was successful
      if (result.success) {
        loadEventStats();
        addToRecentValidations(result);
      }
    } catch (error) {
      console.error('Error validating ticket:', error);
      showValidationResult({
        success: false,
        message: '❌ Error validating ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const showValidationResult = (result: TicketValidationResult) => {
    setValidationResult(result);
    setShowResult(true);
  };

  const addToRecentValidations = (result: TicketValidationResult) => {
    setRecentValidations(prev => [result, ...prev.slice(0, 4)]);
  };

  const resetScanner = () => {
    setScanned(false);
    setIsScanning(true);
    setShowResult(false);
    setValidationResult(null);
  };

  const toggleFlash = () => {
    setFlash(!flash);
  };

  const switchCamera = () => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  };

  const handleManualCheckIn = async () => {
    if (!manualEmail.trim() || !selectedEvent || !user) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Find ticket by email and event
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (
            id,
            title,
            description,
            location,
            start_time,
            end_time,
            image,
            user_id
          )
        `)
        .eq('event_id', selectedEvent.id)
        .eq('status', 'confirmed')
        .is('validated_at', null);

      if (error) throw error;

      // Find ticket by attendee email (would need to join with profiles)
      // For now, we'll use a simplified approach
      const ticket = tickets?.find(t => t.id); // This is a placeholder
      
      if (!ticket) {
        showValidationResult({
          success: false,
          message: '❌ No valid ticket found for this email'
        });
        return;
      }

      // Validate the ticket
      const result = await TicketValidationService.validateTicket(
        ticket.id,
        user.id,
        selectedEvent.id
      );

      showValidationResult(result);
      
      if (result.success) {
        loadEventStats();
        addToRecentValidations(result);
        setManualEmail('');
        setManualCheckIn(false);
      }
    } catch (error) {
      console.error('Error with manual check-in:', error);
      showValidationResult({
        success: false,
        message: '❌ Error with manual check-in'
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Tickets</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Tickets</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            To scan tickets, we need access to your camera. Please enable camera permissions in your device settings.
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Tickets</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowEventSelector(true)}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Event Info */}
      {selectedEvent && (
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Users size={16} color={Colors.textSecondary} />
              <Text style={styles.statText}>{eventStats.totalTickets} Total</Text>
            </View>
            <View style={styles.statItem}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.statText}>{eventStats.checkedIn} Checked In</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={16} color={Colors.warning} />
              <Text style={styles.statText}>{eventStats.pending} Pending</Text>
            </View>
          </View>
        </View>
      )}

      {/* Scanner */}
      {isScanning && selectedEvent ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
          
          {/* Scan Area Overlay */}
          <View style={styles.scanOverlay}>
            <View style={styles.scanArea}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.scanText}>Position QR code within frame</Text>
          </View>

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
              {flash ? <FlashlightOff size={24} color={Colors.white} /> : <Flashlight size={24} color={Colors.white} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
              <RotateCcw size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Manual Check-in Button */}
          <TouchableOpacity 
            style={styles.manualButton}
            onPress={() => setManualCheckIn(true)}
          >
            <Text style={styles.manualButtonText}>Manual Check-in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.centerContent}>
          {!selectedEvent ? (
            <>
              <Ionicons name="qr-code-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.errorTitle}>Select an Event</Text>
              <Text style={styles.errorText}>
                Please select an event to start scanning tickets.
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => setShowEventSelector(true)}
              >
                <Text style={styles.primaryButtonText}>Select Event</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Processing...</Text>
            </>
          )}
        </View>
      )}

      {/* Event Selector Modal */}
      <Modal
        visible={showEventSelector}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setShowEventSelector(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.eventList}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventItem}
                  onPress={() => {
                    setSelectedEvent(event);
                    setShowEventSelector(false);
                    resetScanner();
                  }}
                >
                  <View style={styles.eventItemContent}>
                    <Text style={styles.eventItemTitle}>{event.title}</Text>
                    <View style={styles.eventItemDetails}>
                      <View style={styles.eventItemDetail}>
                        <Calendar size={14} color={Colors.textSecondary} />
                        <Text style={styles.eventItemText}>
                          {format(new Date(event.start_time), 'MMM d, yyyy')}
                        </Text>
                      </View>
                      {event.location && (
                        <View style={styles.eventItemDetail}>
                          <MapPin size={14} color={Colors.textSecondary} />
                          <Text style={styles.eventItemText}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedEvent?.id === event.id && (
                    <CheckCircle size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Validation Result Modal */}
      <Modal
        visible={showResult}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Validation Result</Text>
              <TouchableOpacity onPress={() => setShowResult(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.resultContent}>
              {validationResult?.success ? (
                <View style={styles.successResult}>
                  <CheckCircle size={64} color={Colors.success} />
                  <Text style={styles.resultTitle}>✅ Check-in Successful</Text>
                  <Text style={styles.resultMessage}>{validationResult.message}</Text>
                  
                  {validationResult.attendeeInfo && (
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeTitle}>Attendee Information</Text>
                      <View style={styles.attendeeDetail}>
                        <User size={16} color={Colors.textSecondary} />
                        <Text style={styles.attendeeText}>{validationResult.attendeeInfo.name}</Text>
                      </View>
                      <View style={styles.attendeeDetail}>
                        <Mail size={16} color={Colors.textSecondary} />
                        <Text style={styles.attendeeText}>{validationResult.attendeeInfo.email}</Text>
                      </View>
                      <View style={styles.attendeeDetail}>
                        <Ionicons name="ticket-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.attendeeText}>{validationResult.attendeeInfo.ticketType}</Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.errorResult}>
                  <XCircle size={64} color={Colors.error} />
                  <Text style={styles.resultTitle}>❌ Check-in Failed</Text>
                  <Text style={styles.resultMessage}>{validationResult?.message}</Text>
                  
                  {validationResult?.attendeeInfo && (
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeTitle}>Ticket Information</Text>
                      <View style={styles.attendeeDetail}>
                        <User size={16} color={Colors.textSecondary} />
                        <Text style={styles.attendeeText}>{validationResult.attendeeInfo.name}</Text>
                      </View>
                      <View style={styles.attendeeDetail}>
                        <Mail size={16} color={Colors.textSecondary} />
                        <Text style={styles.attendeeText}>{validationResult.attendeeInfo.email}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => {
                  setShowResult(false);
                  resetScanner();
                }}
              >
                <Text style={styles.primaryButtonText}>Continue Scanning</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Check-in Modal */}
      <Modal
        visible={manualCheckIn}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Check-in</Text>
              <TouchableOpacity onPress={() => setManualCheckIn(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.manualContent}>
              <Text style={styles.manualText}>
                Enter the attendee's email address to manually check them in.
              </Text>
              
              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={manualEmail}
                  onChangeText={setManualEmail}
                  placeholder="Enter email address"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.primaryButton, !manualEmail.trim() && styles.disabledButton]}
                onPress={handleManualCheckIn}
                disabled={!manualEmail.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recent Validations */}
      {recentValidations.length > 0 && (
        <View style={styles.recentValidations}>
          <Text style={styles.recentTitle}>Recent Check-ins</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentValidations.map((result, index) => (
              <View key={index} style={styles.recentItem}>
                {result.success ? (
                  <CheckCircle size={16} color={Colors.success} />
                ) : (
                  <XCircle size={16} color={Colors.error} />
                )}
                <Text style={styles.recentText} numberOfLines={1}>
                  {result.attendeeInfo?.name || 'Unknown'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  eventInfo: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.primary,
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scanText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  eventList: {
    maxHeight: 400,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventItemDetails: {
    gap: 4,
  },
  eventItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultContent: {
    padding: 20,
    alignItems: 'center',
  },
  successResult: {
    alignItems: 'center',
    marginBottom: 20,
  },
  errorResult: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  attendeeInfo: {
    width: '100%',
    backgroundColor: Colors.inputBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  attendeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  attendeeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  attendeeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  manualContent: {
    padding: 20,
  },
  manualText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  recentValidations: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  recentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    maxWidth: 80,
  },
}); 