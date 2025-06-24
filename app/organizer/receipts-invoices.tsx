import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { organizerService, Receipt, ReceiptStats } from '@/lib/organizerService';
import { format } from 'date-fns';

export default function ReceiptsInvoicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [receiptsData, statsData] = await Promise.all([
        organizerService.getReceipts(user.id),
        organizerService.getReceiptStats(user.id)
      ]);
      
      setReceipts(receiptsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading receipts:', error);
      Alert.alert('Error', 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      if (receipt.stripePaymentIntentId) {
        // Get Stripe receipt URL
        const receiptUrl = await organizerService.getStripeReceiptUrl(receipt.stripePaymentIntentId);
        
        if (receiptUrl) {
          // Open Stripe receipt in browser
          const supported = await Linking.canOpenURL(receiptUrl);
          if (supported) {
            await Linking.openURL(receiptUrl);
          } else {
            Alert.alert('Error', 'Cannot open receipt link');
          }
        } else {
          Alert.alert('Error', 'Receipt not available');
        }
      } else {
        // For non-Stripe receipts, show a message
        Alert.alert('Info', 'Receipt download not available for this purchase');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert('Error', 'Failed to download receipt');
    }
  };

  const handleResendReceipt = async (receipt: Receipt) => {
    try {
      const success = await organizerService.resendReceipt(receipt.receiptId, receipt.buyerEmail);
      
      if (success) {
        Alert.alert('Success', 'Receipt has been resent to the buyer');
      } else {
        Alert.alert('Error', 'Failed to resend receipt');
      }
    } catch (error) {
      console.error('Error resending receipt:', error);
      Alert.alert('Error', 'Failed to resend receipt');
    }
  };

  const handleShareReceipt = async (receipt: Receipt) => {
    try {
      const shareText = `Receipt for ${receipt.eventName}\nAmount: $${(receipt.amount / 100).toFixed(2)} ${receipt.currency.toUpperCase()}\nDate: ${format(new Date(receipt.purchaseDate), 'MMM dd, yyyy')}\nReceipt ID: ${receipt.receiptId}`;
      
      await Share.share({
        message: shareText,
        title: `Receipt - ${receipt.eventName}`,
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
      case 'refunded':
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
        return 'time';
      case 'cancelled':
      case 'refunded':
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
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredReceipts = selectedFilter === 'all' 
    ? receipts 
    : receipts.filter(receipt => receipt.status === selectedFilter);

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

  const renderReceipt = ({ item }: { item: Receipt }) => (
    <View style={styles.receiptCard}>
      <View style={styles.receiptHeader}>
        <View style={styles.receiptInfo}>
          <Text style={styles.eventName}>{item.eventName}</Text>
          <Text style={styles.receiptId}>Receipt ID: {item.receiptId}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            ${(item.amount / 100).toFixed(2)} {item.currency.toUpperCase()}
          </Text>
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
      
      <View style={styles.receiptDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Buyer Email:</Text>
          <Text style={styles.detailValue}>{item.buyerEmail}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ticket Type:</Text>
          <Text style={styles.detailValue}>{item.ticketType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Purchase Date:</Text>
          <Text style={styles.detailValue}>
            {format(new Date(item.purchaseDate), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownloadReceipt(item)}
        >
          <Ionicons name="download" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShareReceipt(item)}
        >
          <Ionicons name="share" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleResendReceipt(item)}
        >
          <Ionicons name="mail" size={20} color={Colors.primary} />
          <Text style={styles.actionButtonText}>Resend</Text>
        </TouchableOpacity>
      </View>
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
          <Text style={styles.headerTitle}>Receipts & Invoices</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading receipts...</Text>
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
        <Text style={styles.headerTitle}>Receipts & Invoices</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${(stats.totalRevenue / 100).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReceipts}</Text>
            <Text style={styles.statLabel}>Total Receipts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.paidReceipts}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
        </View>
      )}

      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('paid', 'Paid')}
        {renderFilterButton('pending', 'Pending')}
        {renderFilterButton('cancelled', 'Cancelled')}
      </View>

      <FlatList
        data={filteredReceipts}
        renderItem={renderReceipt}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Receipts Found</Text>
            <Text style={styles.emptyText}>
              Receipts will appear here once tickets are purchased for your events.
            </Text>
          </View>
        }
      />
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
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
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
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  receiptId: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  receiptDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  refreshButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 