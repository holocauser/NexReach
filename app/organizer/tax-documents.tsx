import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { stripeService } from '@/lib/stripeService';

interface TaxDocument {
  id: string;
  year: number;
  type: '1099-K' | '1099-MISC';
  status: 'available' | 'pending' | 'unavailable';
  downloadUrl?: string;
  amount: number;
  created: number;
}

interface TaxYearSummary {
  year: number;
  totalPayouts: number;
  documents: TaxDocument[];
}

export default function TaxDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [taxYears, setTaxYears] = useState<TaxYearSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchTaxDocuments();
    }
  }, [user?.id]);

  const fetchTaxDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current year and previous 3 years
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
      
      const taxData: TaxYearSummary[] = [];

      for (const year of years) {
        try {
          // Fetch tax documents for this year
          const documents = await stripeService.getTaxDocuments(year);
          
          // Calculate total payouts for this year
          const totalPayouts = documents.reduce((sum, doc) => sum + doc.amount, 0);
          
          if (totalPayouts > 0 || documents.length > 0) {
            taxData.push({
              year,
              totalPayouts,
              documents,
            });
          }
        } catch (yearError) {
          console.error(`Error fetching tax documents for ${year}:`, yearError);
          // Continue with other years even if one fails
        }
      }

      setTaxYears(taxData);
    } catch (err) {
      console.error('Error fetching tax documents:', err);
      setError('Failed to load tax documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTaxDocuments();
    setRefreshing(false);
  };

  const handleDownloadDocument = async (document: TaxDocument) => {
    if (!document.downloadUrl) {
      Alert.alert('Download Unavailable', 'This document is not available for download yet.');
      return;
    }

    try {
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(document.downloadUrl);
      
      if (canOpen) {
        await Linking.openURL(document.downloadUrl);
      } else {
        Alert.alert(
          'Download Error',
          'Unable to open the document. Please try again or contact support.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Contact Support', onPress: () => router.push('/help-support') }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Download Error', 'Failed to open the document. Please try again.');
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
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'unavailable':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'pending':
        return 'Processing';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case '1099-K':
        return 'document-text';
      case '1099-MISC':
        return 'document';
      default:
        return 'document-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Documents</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tax documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Documents</Text>
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
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTaxDocuments}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tax Documents</Text>
            <Text style={styles.infoText}>
              Tax forms (1099-K, 1099-MISC) are automatically generated when your payouts exceed $600 in a calendar year.
            </Text>
          </View>
        </View>

        {taxYears.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Tax Documents Available</Text>
            <Text style={styles.emptyText}>
              Tax documents will appear here when your payouts exceed $600 in a calendar year.
            </Text>
          </View>
        ) : (
          taxYears.map((yearData) => (
            <View key={yearData.year} style={styles.yearContainer}>
              <View style={styles.yearHeader}>
                <Text style={styles.yearTitle}>{yearData.year}</Text>
                <Text style={styles.yearTotal}>
                  Total: {formatCurrency(yearData.totalPayouts)}
                </Text>
              </View>

              {yearData.documents.map((document) => (
                <View key={document.id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentInfo}>
                      <Ionicons 
                        name={getDocumentIcon(document.type)} 
                        size={24} 
                        color={Colors.primary} 
                      />
                      <View style={styles.documentDetails}>
                        <Text style={styles.documentType}>{document.type}</Text>
                        <Text style={styles.documentDate}>
                          {formatDate(document.created)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.documentStatus}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getDocumentStatusColor(document.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getDocumentStatusColor(document.status) }
                        ]}>
                          {getDocumentStatusText(document.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.documentAmount}>
                    <Text style={styles.amountLabel}>Amount:</Text>
                    <Text style={styles.amountValue}>
                      {formatCurrency(document.amount)}
                    </Text>
                  </View>

                  {document.status === 'available' && document.downloadUrl && (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownloadDocument(document)}
                    >
                      <Ionicons name="download" size={20} color={Colors.white} />
                      <Text style={styles.downloadButtonText}>Download Tax Form</Text>
                    </TouchableOpacity>
                  )}

                  {document.status === 'pending' && (
                    <View style={styles.pendingContainer}>
                      <Ionicons name="time" size={16} color={Colors.warning} />
                      <Text style={styles.pendingText}>
                        Document is being processed. Check back later.
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you have questions about your tax documents or need assistance, please contact our support team.
          </Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => router.push('/help-support')}
          >
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
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.error,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  yearContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  yearTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  yearTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  documentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  documentType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  documentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  documentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  documentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  helpSection: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
}); 