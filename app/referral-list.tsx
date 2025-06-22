import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useReferralStore } from '../store/referralStore';
import { useCardStore } from '../store/useCardStore';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import { Referral } from '../types';

export default function ReferralListScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { referrals } = useReferralStore();
  const { cards } = useCardStore();
  const { user } = useAuth();
  const { profile } = useUserStore();
  
  const contactId = params.contactId as string;
  const contactName = params.contactName as string;
  const initialMode = params.mode as 'sent' | 'received';
  
  const [mode, setMode] = useState<'sent' | 'received'>(initialMode || 'sent');
  
  // Get current user ID
  const currentUserId = user?.id || profile?.id;
  
  // Filter referrals based on mode and current user
  const filteredReferrals = referrals.filter(referral => {
    if (!currentUserId) return false;
    
    if (mode === 'sent') {
      // Show referrals where current user is the referrer and contact is the recipient
      return referral.referrerId === currentUserId && referral.recipientId === contactId;
    } else {
      // Show referrals where contact is the referrer and current user is the recipient
      return referral.referrerId === contactId && referral.recipientId === currentUserId;
    }
  });
  
  // Get contact names for display, showing "Me" for current user
  const getContactName = (id: string) => {
    // Check if this is the current user
    if (currentUserId && id === currentUserId) {
      return 'Me';
    }
    
    // First, try to get the contact name from saved cards
    const card = cards.find(c => c.id === id);
    if (card?.name) {
      return card.name;
    }
    
    // If not found in cards, check if this is the contact we're viewing
    if (id === contactId) {
      return contactName || 'Unknown Contact';
    }
    
    // Last resort fallback
    return 'Unknown Contact';
  };
  
  // Generate header title based on mode and contact name
  const getHeaderTitle = () => {
    const displayContactName = contactName || 'Unknown Contact';
    
    if (mode === 'received') {
      return `Referrals from ${displayContactName}`;
    } else {
      return `Referrals to ${displayContactName}`;
    }
  };
  
  // Generate referral direction text based on sender/receiver relationship
  const getReferralDirection = (referral: Referral) => {
    if (!currentUserId) return 'Unknown → Unknown';
    
    const senderName = getContactName(referral.referrerId);
    const receiverName = getContactName(referral.recipientId);
    
    // If senderId === currentUserId → "Me → [Contact Name]"
    if (referral.referrerId === currentUserId) {
      return `Me → ${receiverName}`;
    }
    
    // If receiverId === currentUserId → "[Contact Name] → Me"
    if (referral.recipientId === currentUserId) {
      return `${senderName} → Me`;
    }
    
    // Fallback: show actual names
    return `${senderName} → ${receiverName}`;
  };
  
  const renderReferralItem = ({ item }: { item: Referral }) => {
    return (
      <View style={styles.referralItem}>
        <Text style={styles.referralDirection}>
          {getReferralDirection(item)}
        </Text>

        <Text style={styles.caseType} numberOfLines={2}>
          {item.caseType}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.referralDate}>
            {new Date(item.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.referralValue}>
            ${item.value.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>
      </View>
      
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, mode === 'sent' && styles.toggleButtonActive]}
          onPress={() => setMode('sent')}
        >
          <Text style={[styles.toggleButtonText, mode === 'sent' && styles.toggleButtonTextActive]}>
            Sent ({referrals.filter(r => currentUserId && r.referrerId === currentUserId && r.recipientId === contactId).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toggleButton, mode === 'received' && styles.toggleButtonActive]}
          onPress={() => setMode('received')}
        >
          <Text style={[styles.toggleButtonText, mode === 'received' && styles.toggleButtonTextActive]}>
            Received ({referrals.filter(r => currentUserId && r.referrerId === contactId && r.recipientId === currentUserId).length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Referrals List */}
      <FlatList
        data={filteredReferrals}
        renderItem={renderReferralItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No {mode} referrals found
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: Colors.white,
    fontFamily: 'Inter-SemiBold',
  },
  list: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  referralItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referralDirection: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  caseType: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  referralValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
}); 