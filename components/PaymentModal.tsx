import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { stripeService } from '@/lib/stripeService';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventData: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

export default function PaymentModal({
  visible,
  onClose,
  onSuccess,
  eventData,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to purchase tickets.');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save ticket purchase to database
      const ticketData = await stripeService.saveTicketPurchase({
        eventId: eventData.id,
        userId: user.id,
        amount: eventData.price * 100,
        currency: eventData.currency,
        quantity: 1,
      });

      // Update ticket status to paid since payment was successful
      await stripeService.updateTicketStatus(ticketData.id, 'paid');

      setPaymentStatus('success');
      
      // Show success message and close modal
      setTimeout(() => {
        onSuccess();
        onClose();
        setPaymentStatus('idle');
        setLoading(false);
      }, 2000);
      return;

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during payment
    setPaymentStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Purchase Ticket</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Event Details */}
          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{eventData.title}</Text>
            <Text style={styles.eventPrice}>
              {formatPrice(eventData.price, eventData.currency)}
            </Text>
          </View>

          {/* Payment Status */}
          {paymentStatus === 'success' && (
            <View style={styles.statusContainer}>
              <CheckCircle size={48} color={Colors.success} />
              <Text style={styles.successText}>Payment Successful!</Text>
              <Text style={styles.successSubtext}>
                Your ticket has been purchased successfully.
              </Text>
            </View>
          )}

          {paymentStatus === 'error' && (
            <View style={styles.statusContainer}>
              <AlertCircle size={48} color={Colors.error} />
              <Text style={styles.errorText}>Payment Failed</Text>
              <Text style={styles.errorSubtext}>{errorMessage}</Text>
            </View>
          )}

          {/* Payment Form */}
          {paymentStatus === 'idle' && (
            <View style={styles.paymentForm}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.fallbackForm}>
                <Text style={styles.fallbackText}>
                  Payment processing is being set up. For now, this is a demo mode.
                </Text>
                <Text style={styles.fallbackSubtext}>
                  Your ticket will be reserved and you'll receive confirmation.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.payButton,
                  loading && styles.payButtonDisabled,
                ]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <CreditCard size={20} color={Colors.white} />
                    <Text style={styles.payButtonText}>
                      Reserve Ticket
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingText}>Processing Payment...</Text>
              <Text style={styles.processingSubtext}>
                Please don't close this window.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  eventDetails: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  eventPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  paymentForm: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  fallbackForm: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
}); 