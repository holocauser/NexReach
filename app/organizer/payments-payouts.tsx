import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { stripeService, Payout, PayoutSummary, StripeAccount } from '@/lib/stripeService';
import Colors from '@/constants/Colors';

interface UserProfile {
  stripe_account_id?: string;
  stripe_account_status?: 'disconnected' | 'pending' | 'active' | 'restricted';
}

export default function PaymentsPayoutsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending' | 'in_transit'>('all');

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_account_status')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(profileData || { stripe_account_status: 'disconnected' });

      // If user has a connected Stripe account, load payout data
      if (profileData?.stripe_account_id && profileData?.stripe_account_status === 'active') {
        await loadStripeData(profileData.stripe_account_id);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStripeData = async (accountId: string) => {
    try {
      // Load Stripe account information
      const account = await stripeService.getStripeAccount(accountId);
      setStripeAccount(account);

      if (account) {
        // Load payout summary
        const summary = await stripeService.getPayoutSummary(accountId);
        setPayoutSummary(summary);

        // Load recent payouts
        const recentPayouts = await stripeService.getPayouts(accountId, 50);
        setPayouts(recentPayouts);
      }
    } catch (error) {
      console.error('Error loading Stripe data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);
      
      // Create onboarding URL
      const returnUrl = 'scancard123://organizer/payments-payouts';
      const onboardingUrl = await stripeService.createOnboardingUrl(user?.id || '', returnUrl);
      
      if (onboardingUrl) {
        // Open onboarding URL
        const canOpen = await Linking.canOpenURL(onboardingUrl);
        if (canOpen) {
          await Linking.openURL(onboardingUrl);
        } else {
          Alert.alert('Error', 'Unable to open Stripe onboarding. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to create Stripe onboarding URL. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      Alert.alert('Error', 'Failed to connect Stripe account. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      if (!profile?.stripe_account_id || payouts.length === 0) {
        Alert.alert('No Data', 'No payout data available to export.');
        return;
      }

      const csvContent = stripeService.exportPayoutsToCSV(payouts);
      
      // Share the CSV content
      await Share.share({
        message: csvContent,
        title: 'Payout Data Export',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export payout data. Please try again.');
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!profile?.stripe_account_id) {
      Alert.alert('No Account', 'No Stripe account connected.');
      return;
    }

    const dashboardUrl = stripeService.getStripeDashboardUrl(profile.stripe_account_id);
    const canOpen = await Linking.canOpenURL(dashboardUrl);
    
    if (canOpen) {
      await Linking.openURL(dashboardUrl);
    } else {
      Alert.alert('Error', 'Unable to open Stripe dashboard. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'pending':
      case 'in_transit':
        return Colors.warning;
      case 'canceled':
      case 'failed':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'pending':
      case 'in_transit':
        return 'time';
      case 'canceled':
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'in_transit':
        return 'In Transit';
      case 'canceled':
        return 'Canceled';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const filteredPayouts = selectedFilter === 'all' 
    ? payouts 
    : payouts.filter(payout => payout.status === selectedFilter);

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPayout = ({ item }: { item: Payout }) => (
    <View style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutId}>Payout {item.id.slice(-8)}</Text>
          <Text style={styles.payoutDate}>{formatDate(item.created)}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(item.status)} 
              size={16} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.payoutDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fees:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.fees)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Net Amount:</Text>
          <Text style={[styles.detailValue, styles.netAmount]}>
            {formatCurrency(item.net)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Method:</Text>
          <Text style={styles.detailValue}>{item.method}</Text>
        </View>
        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{item.description}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payments & Payouts</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show Stripe Connect onboarding if not connected
  if (!profile?.stripe_account_id || profile?.stripe_account_status !== 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payments & Payouts</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.connectCard}>
            <Ionicons name="card-outline" size={64} color={Colors.primary} />
            <Text style={styles.connectTitle}>Connect Your Stripe Account</Text>
            <Text style={styles.connectDescription}>
              To receive payouts from your events, you need to connect your Stripe account. 
              This allows us to securely transfer your earnings to your bank account.
            </Text>
            
            <TouchableOpacity
              style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
              onPress={handleConnectStripe}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="link" size={20} color={Colors.white} />
              )}
              <Text style={styles.connectButtonText}>
                {connecting ? 'Connecting...' : 'Connect Stripe Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.connectInfo}>
              <Text style={styles.connectInfoTitle}>Why connect Stripe?</Text>
              <Text style={styles.connectInfoText}>
                • Receive payouts directly to your bank account{'\n'}
                • Track all your earnings and fees{'\n'}
                • Access detailed payment history{'\n'}
                • Export data for accounting{'\n'}
                • Secure and compliant payment processing
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments & Payouts</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payoutSummary && (
          <>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(payoutSummary.pendingPayouts)}
              </Text>
              <Text style={styles.balanceSubtitle}>Pending payouts</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatCurrency(payoutSummary.totalPayouts)}
                </Text>
                <Text style={styles.statLabel}>Total Payouts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatCurrency(payoutSummary.totalNet)}
                </Text>
                <Text style={styles.statLabel}>Net Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatCurrency(payoutSummary.totalFees)}
                </Text>
                <Text style={styles.statLabel}>Total Fees</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
            <Ionicons name="download" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenStripeDashboard}>
            <Ionicons name="open-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Stripe Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('paid', 'Paid')}
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('in_transit', 'In Transit')}
        </View>

        {filteredPayouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Payouts Found</Text>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'You haven\'t received any payouts yet. Payouts will appear here once your events start generating revenue.'
                : `No ${selectedFilter} payouts found.`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPayouts}
            renderItem={renderPayout}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  connectCard: {
    margin: 16,
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  connectDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectInfo: {
    width: '100%',
  },
  connectInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  connectInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceTitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  payoutCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payoutDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  payoutDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  netAmount: {
    color: Colors.primary,
    fontWeight: '600',
  },
}); 