import React, { useState } from 'react';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { TicketValidationService } from '@/lib/ticketValidationService';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';

const { width, height } = Dimensions.get('window');

interface ScanResult {
  success: boolean;
  message: string;
  ticketId?: string;
  attendeeInfo?: {
    name: string;
    email: string;
    ticketType: string;
    eventTitle: string;
    purchaseDate: string;
  };
  timestamp: Date;
}

export default function ScanTicketsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');

  const handleManualValidation = async () => {
    if (!manualTicketId.trim()) {
      Alert.alert('Error', 'Please enter a ticket ID');
      return;
    }

    setIsProcessing(true);
    try {
      const validationResult = await TicketValidationService.validateTicket(
        manualTicketId.trim(),
        user?.id || ''
      );
      
      const result: ScanResult = {
        success: validationResult.success,
        message: validationResult.message,
        ticketId: manualTicketId.trim(),
        attendeeInfo: validationResult.attendeeInfo,
        timestamp: new Date()
      };
      
      setScanResult(result);
      setShowResult(true);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]);
      setManualTicketId('');
    } catch (error) {
      console.error('Error validating ticket:', error);
      Alert.alert('Error', 'Failed to validate ticket. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setShowResult(false);
    setScanResult(null);
  };

  const clearHistory = () => {
    setScanHistory([]);
    setShowHistory(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Validation</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.headerButton}>
          <Ionicons name="time-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="qr-code-outline" size={48} color={Colors.primary} />
          <Text style={styles.infoTitle}>Manual Ticket Validation</Text>
          <Text style={styles.infoSubtitle}>
            Enter ticket IDs manually to validate attendee entry
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ticket ID</Text>
          <TextInput
            style={styles.input}
            value={manualTicketId}
            onChangeText={setManualTicketId}
            placeholder="Enter ticket ID or QR code data"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isProcessing}
          />
        </View>

        <TouchableOpacity
          style={[styles.validateButton, isProcessing && styles.disabledButton]}
          onPress={handleManualValidation}
          disabled={isProcessing || !manualTicketId.trim()}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.validateButtonText}>Validate Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scanHistory.filter(r => r.success).length}</Text>
            <Text style={styles.statLabel}>Valid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scanHistory.filter(r => !r.success).length}</Text>
            <Text style={styles.statLabel}>Invalid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{scanHistory.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Scan Result Modal */}
      <Modal
        visible={showResult}
        transparent
        animationType="slide"
        onRequestClose={resetScanner}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={scanResult?.success ? "checkmark-circle" : "close-circle"} 
                size={48} 
                color={scanResult?.success ? Colors.success : Colors.error} 
              />
              <Text style={[
                styles.resultTitle,
                { color: scanResult?.success ? Colors.success : Colors.error }
              ]}>
                {scanResult?.success ? 'Ticket Validated' : 'Validation Failed'}
              </Text>
            </View>

            <ScrollView style={styles.resultContent}>
              <Text style={styles.resultMessage}>{scanResult?.message}</Text>
              
              {scanResult?.attendeeInfo && (
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeTitle}>Attendee Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{scanResult.attendeeInfo.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{scanResult.attendeeInfo.email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ticket Type:</Text>
                    <Text style={styles.infoValue}>{scanResult.attendeeInfo.ticketType}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Event:</Text>
                    <Text style={styles.infoValue}>{scanResult.attendeeInfo.eventTitle}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Purchase Date:</Text>
                    <Text style={styles.infoValue}>
                      {format(new Date(scanResult.attendeeInfo.purchaseDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                  Validated at: {format(scanResult?.timestamp || new Date(), 'MMM dd, yyyy HH:mm:ss')}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
                <Text style={styles.secondaryButtonText}>Validate Another</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scan History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Validations</Text>
              <View style={styles.historyHeaderActions}>
                <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.historyContent}>
              {scanHistory.length === 0 ? (
                <Text style={styles.noHistoryText}>No validations yet</Text>
              ) : (
                scanHistory.map((result, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Ionicons 
                        name={result.success ? "checkmark-circle" : "close-circle"} 
                        size={20} 
                        color={result.success ? Colors.success : Colors.error} 
                      />
                      <Text style={styles.historyTime}>
                        {format(result.timestamp, 'HH:mm:ss')}
                      </Text>
                    </View>
                    <Text style={styles.historyMessage}>{result.message}</Text>
                    {result.ticketId && (
                      <Text style={styles.historyTicketId}>ID: {result.ticketId}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.inputBackground,
    color: Colors.textPrimary,
  },
  validateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
  },
  validateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    margin: 20,
    maxHeight: height * 0.8,
    width: width - 40,
  },
  resultHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  resultContent: {
    padding: 24,
  },
  resultMessage: {
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  attendeeInfo: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  attendeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  timestampContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timestampText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultActions: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    margin: 20,
    maxHeight: height * 0.8,
    width: width - 40,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  historyHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clearButton: {
    padding: 4,
  },
  historyContent: {
    padding: 24,
  },
  noHistoryText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 16,
  },
  historyItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  historyMessage: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyTicketId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
}); 