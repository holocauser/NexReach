import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { organizerService, StripeAccountInfo } from '@/lib/organizerService';

export default function BankAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stripeInfo, setStripeInfo] = useState<StripeAccountInfo | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadStripeAccountInfo();
  }, []);

  const loadStripeAccountInfo = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const info = await organizerService.getStripeAccountInfo(user.id);
      setStripeInfo(info);
    } catch (error) {
      console.error('Error loading Stripe account info:', error);
      Alert.alert('Error', 'Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user) return;

    try {
      setConnecting(true);
      
      // Create onboarding link
      const returnUrl = 'scancard123://organizer/bank-account';
      const onboardingUrl = await organizerService.createStripeOnboardingLink(user.id, returnUrl);
      
      if (!onboardingUrl) {
        Alert.alert('Error', 'Failed to create Stripe connection link');
        return;
      }

      // Open the onboarding URL
      const supported = await Linking.canOpenURL(onboardingUrl);
      if (supported) {
        await Linking.openURL(onboardingUrl);
      } else {
        Alert.alert('Error', 'Cannot open Stripe onboarding link');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      Alert.alert('Error', 'Failed to connect to Stripe');
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateBankInfo = async () => {
    if (!user || !stripeInfo?.accountId) return;

    try {
      setConnecting(true);
      
      // Create account link for updating bank info
      const returnUrl = 'scancard123://organizer/bank-account';
      const updateUrl = await organizerService.createStripeOnboardingLink(user.id, returnUrl);
      
      if (!updateUrl) {
        Alert.alert('Error', 'Failed to create bank update link');
        return;
      }

      // Open the update URL
      const supported = await Linking.canOpenURL(updateUrl);
      if (supported) {
        await Linking.openURL(updateUrl);
      } else {
        Alert.alert('Error', 'Cannot open bank update link');
      }
    } catch (error) {
      console.error('Error updating bank info:', error);
      Alert.alert('Error', 'Failed to update bank information');
    } finally {
      setConnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'restricted':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Verification';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Not Connected';
    }
  };

  const renderConnectedAccount = () => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="card" size={24} color={Colors.success} />
        <Text style={styles.cardTitle}>Connected Account</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Account Status</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(stripeInfo?.status || 'disconnected') }]} />
          <Text style={[styles.statusText, { color: getStatusColor(stripeInfo?.status || 'disconnected') }]}>
            {getStatusText(stripeInfo?.status || 'disconnected')}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Account ID</Text>
        <Text style={styles.infoValue}>{stripeInfo?.accountId?.slice(0, 8)}...</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Payouts Enabled</Text>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={stripeInfo?.payoutsEnabled ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={stripeInfo?.payoutsEnabled ? Colors.success : Colors.error} 
          />
          <Text style={[styles.statusText, { color: stripeInfo?.payoutsEnabled ? Colors.success : Colors.error }]}>
            {stripeInfo?.payoutsEnabled ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Charges Enabled</Text>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={stripeInfo?.chargesEnabled ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={stripeInfo?.chargesEnabled ? Colors.success : Colors.error} 
          />
          <Text style={[styles.statusText, { color: stripeInfo?.chargesEnabled ? Colors.success : Colors.error }]}>
            {stripeInfo?.chargesEnabled ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.updateButton} 
        onPress={handleUpdateBankInfo}
        disabled={connecting}
      >
        {connecting ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name="create" size={16} color={Colors.white} />
            <Text style={styles.updateButtonText}>Update Bank Info</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDisconnectedState = () => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <Ionicons name="card-outline" size={24} color={Colors.textSecondary} />
        <Text style={styles.cardTitle}>Bank Account</Text>
      </View>

      <Text style={styles.disconnectedText}>
        Connect your Stripe account to receive payouts from ticket sales. This allows you to securely receive payments directly to your bank account.
      </Text>

      <TouchableOpacity 
        style={styles.connectButton} 
        onPress={handleConnectStripe}
        disabled={connecting}
      >
        {connecting ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name="link" size={16} color={Colors.white} />
            <Text style={styles.connectButtonText}>Connect Stripe</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Account Info</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Account Info</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadStripeAccountInfo}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {stripeInfo?.accountId ? renderConnectedAccount() : renderDisconnectedState()}

        <View style={styles.securityCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
            <Text style={styles.cardTitle}>Security</Text>
          </View>
          <Text style={styles.securityText}>
            Your bank account information is securely managed by Stripe, a PCI-compliant payment processor. We never store your banking details directly.
          </Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="chatbubble" size={20} color={Colors.primary} />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  disconnectedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.white,
  },
  securityCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  placeholder: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 16,
  },
}); 