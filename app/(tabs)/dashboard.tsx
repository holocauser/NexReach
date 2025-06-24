import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { TrendingUp, Users, Clock, Lightbulb, Calendar, Star, Settings } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useReferralStore } from '@/store/referralStore';
import { useCardStore } from '@/store/cardStore';
import { useAuth } from '@/contexts/AuthContext';
import { format, isAfter, subDays, subWeeks, subMonths } from 'date-fns';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Referral } from '@/types';
import * as Crypto from 'expo-crypto';

type TopListItem = {
  id: string;
  count: number;
  value: number;
};

export default function DashboardScreen() {
  const { referrals, getTopReferrers, getTopRecipients, getTotalReferralsValue, getTotalSentValue, getTotalReceivedValue, regenerateReferrals, forceRegenerateReferrals, cleanInvalidReferrals } = useReferralStore();
  const { cards, isLoaded, getCardById, updateLastContacted, clearStorageAndReload, cleanupDatabaseAndSync } = useCardStore();
  const { user } = useAuth();
  const router = useRouter();
  
  const [topReferrers, setTopReferrers] = useState<TopListItem[]>([]);
  const [topRecipients, setTopRecipients] = useState<TopListItem[]>([]);
  const [receivedValue, setReceivedValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const referrers = await getTopReferrers(3);
      const recipients = await getTopRecipients(3);
      const value = await getTotalReceivedValue();

      setTopReferrers(referrers);
      setTopRecipients(recipients.slice(0, 3));
      setReceivedValue(value);
    };

    fetchData();
  }, [referrals, getTopReferrers, getTopRecipients, getTotalReceivedValue]);
  
  const totalValue = getTotalReferralsValue();
  const sentValue = getTotalSentValue();
  
  // Calculate success rates for sent and received referrals
  const sentReferrals = referrals.filter(r => r.referrerId === user?.id);
  const receivedReferrals = referrals.filter(r => r.recipientId === user?.id);
  
  const sentSuccessRate = sentReferrals.length > 0 
    ? Math.round((sentReferrals.filter(r => r.outcome === 'successful').length / sentReferrals.length) * 100)
    : 0;
    
  const receivedSuccessRate = receivedReferrals.length > 0 
    ? Math.round((receivedReferrals.filter(r => r.outcome === 'successful').length / receivedReferrals.length) * 100)
    : 0;

  // Get cards that need follow-up (haven't been contacted in 30+ days)
  const getFollowUpNeeded = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return cards.filter(card => {
      if (!card.lastContacted) return true; // Never contacted
      const lastContactedDate = new Date(card.lastContacted);
      return isAfter(thirtyDaysAgo, lastContactedDate);
    }).slice(0, 5);
  };

  // Get recently added cards (last 7 days)
  const getRecentlyAdded = () => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return cards.filter(card => 
      isAfter(card.createdAt, sevenDaysAgo)
    ).slice(0, 3);
  };

  // Get activity stats
  const getActivityStats = () => {
    const lastWeek = subWeeks(new Date(), 1);
    const lastMonth = subMonths(new Date(), 1);
    
    const cardsAddedThisWeek = cards.filter(card => 
      isAfter(card.createdAt, lastWeek)
    ).length;
    
    const referralsThisMonth = referrals.filter(referral => 
      isAfter(referral.date, lastMonth)
    ).length;
    
    return { cardsAddedThisWeek, referralsThisMonth };
  };

  const followUpCards = getFollowUpNeeded();
  const recentCards = getRecentlyAdded();
  const { cardsAddedThisWeek, referralsThisMonth } = getActivityStats();
  
  // Get top tags
  const tagCounts: Record<string, number> = {};
  cards.forEach(card => {
    card.tags.forEach(tag => {
      if (!tagCounts[tag]) {
        tagCounts[tag] = 0;
      }
      tagCounts[tag] += 1;
    });
  });
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const markAsContacted = (cardId: string) => {
    updateLastContacted(cardId, new Date());
  };

  const handleClearAndReload = async () => {
    console.log('Clearing storage and reloading fresh mock data...');
    await useCardStore.getState().clearStorageAndReload();
    Alert.alert('Success', 'Local mock data has been reloaded.');
  };

  const handleRegenerateReferrals = async () => {
    console.log('Regenerating referrals...');
    await useReferralStore.getState().regenerateReferrals();
    Alert.alert('Success', 'Referrals have been regenerated.');
  };

  const handleResetEvents = async () => {
    console.log('Resetting events...');
    const { useEventStore } = await import('@/store/eventStore');
    await useEventStore.getState().resetEventsToMock();
    Alert.alert('Success', 'Events have been reset to mock data.');
  };

  const handleCleanupDatabaseAndSync = async () => {
    console.log('Cleaning up database and syncing...');
    const result = await useCardStore.getState().cleanupDatabaseAndSync();
    if (result.success) {
      Alert.alert('Success', 'Database cleaned and synced successfully!');
    } else {
      Alert.alert('Error', `Failed to cleanup database: ${result.error}`);
    }
  };

  const showDebugMenu = () => {
    Alert.alert(
      "Debug Options",
      "Select a debugging action. Use with caution.",
      [
        {
          text: "Full Reset & Sync",
          onPress: handleCleanupDatabaseAndSync,
          style: "destructive",
        },
        {
          text: "Reload Local Mock Data",
          onPress: handleClearAndReload,
        },
        {
          text: "Regenerate Referrals",
          onPress: handleRegenerateReferrals,
        },
        {
          text: "Reset Events",
          onPress: handleResetEvents,
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Your networking and referral activity
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={showDebugMenu} style={styles.settingsButton}>
            <Settings size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Users size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{cards.length}</Text>
          <Text style={styles.statLabel}>Total Contacts</Text>
          <Text style={styles.statSubtext}>+{cardsAddedThisWeek} this week</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{referrals.length}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
          <Text style={styles.statSubtext}>+{referralsThisMonth} this month</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Clock size={24} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>
            ${sentValue.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Value Sent</Text>
          <Text style={styles.statSubtext}>{sentSuccessRate}% success rate</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Clock size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>
            ${receivedValue.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Value Received</Text>
          <Text style={styles.statSubtext}>{receivedSuccessRate}% success rate</Text>
        </View>
      </View>

      {/* Follow-up Needed Section */}
      {followUpCards.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Follow-up Needed</Text>
          </View>
          
          {followUpCards.map((card, index) => (
            <View key={index} style={styles.followUpItem}>
              <View style={styles.followUpAvatar}>
                {card.profileImage ? (
                  <Image source={{ uri: card.profileImage }} style={styles.followUpAvatarImage} />
                ) : (
                  <Text style={styles.followUpAvatarText}>
                    {card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')}
                  </Text>
                )}
              </View>
              <View style={styles.followUpInfo}>
                <Text style={styles.followUpName}>{card.name}</Text>
                <Text style={styles.followUpCompany}>{card.company}</Text>
                <Text style={styles.followUpDate}>
                  {card.lastContacted 
                    ? `Last contacted: ${format(new Date(card.lastContacted), 'MMM d, yyyy')}`
                    : 'Never contacted'
                  }
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => markAsContacted(card.id)}
              >
                <Text style={styles.contactButtonText}>Mark Contacted</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Recently Added Section */}
      {recentCards.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Star size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>Recently Added</Text>
          </View>
          
          {recentCards.map((card, index) => (
            <View key={index} style={styles.recentItem}>
              <View style={styles.recentAvatar}>
                {card.profileImage ? (
                  <Image source={{ uri: card.profileImage }} style={styles.recentAvatarImage} />
                ) : (
                  <Text style={styles.recentAvatarText}>
                    {card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')}
                  </Text>
                )}
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{card.name}</Text>
                <Text style={styles.recentCompany}>{card.company}</Text>
                <Text style={styles.recentDate}>
                  Added {format(card.createdAt, 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Referrers</Text>
        
        {topReferrers.length > 0 ? (
          topReferrers.map((referrer, index) => {
            const card = getCardById(referrer.id);
            return (
              <View key={index} style={styles.rankItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.rankAvatar}>
                  {card?.profileImage ? (
                    <Image source={{ uri: card.profileImage }} style={styles.rankAvatarImage} />
                  ) : (
                    <Text style={styles.rankAvatarText}>
                      {card?.name ? (card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')) : '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{card?.name || 'Unknown'}</Text>
                  <Text style={styles.rankCompany}>{card?.company || ''}</Text>
                </View>
                <View style={styles.rankStats}>
                  <Text style={styles.rankCount}>{referrer.count} referrals</Text>
                  <Text style={styles.rankValue}>${referrer.value.toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No referrers yet</Text>
        )}
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Recipients</Text>
        
        {topRecipients.length > 0 ? (
          topRecipients.map((recipient, index) => {
            const card = getCardById(recipient.id);
            return (
              <View key={index} style={styles.rankItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.rankAvatar}>
                  {card?.profileImage ? (
                    <Image source={{ uri: card.profileImage }} style={styles.rankAvatarImage} />
                  ) : (
                    <Text style={styles.rankAvatarText}>
                      {card?.name ? (card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')) : '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{card?.name || 'Unknown'}</Text>
                  <Text style={styles.rankCompany}>{card?.company || ''}</Text>
                </View>
                <View style={styles.rankStats}>
                  <Text style={styles.rankCount}>{recipient.count} received</Text>
                  <Text style={styles.rankValue}>${recipient.value.toLocaleString()}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No recipients yet</Text>
        )}
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Tags</Text>
        
        {topTags.length > 0 ? (
          <View style={styles.tagGrid}>
            {topTags.map((tagData, index) => (
              <View key={index} style={styles.tagItem}>
                <Text style={styles.tagName}>{tagData.tag}</Text>
                <Text style={styles.tagCount}>{tagData.count} contacts</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No tags yet</Text>
        )}
      </View>
      
      <View style={styles.suggestionContainer}>
        <View style={styles.suggestionHeader}>
          <Lightbulb size={20} color={Colors.primary} />
          <Text style={styles.suggestionTitle}>Smart Suggestions</Text>
        </View>
        
        {followUpCards.length > 0 && (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionText}>
              You have {followUpCards.length} contacts that haven't been reached out to in over 30 days. Consider following up to maintain relationships.
            </Text>
          </View>
        )}
        
        {cards.filter(c => (c.tags || []).includes('Spanish-speaking')).length > 0 && (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionText}>
              You have {cards.filter(c => (c.tags || []).includes('Spanish-speaking')).length} Spanish-speaking contacts. Consider expanding your bilingual network for better client service.
            </Text>
          </View>
        )}
        
        {referrals.length > 0 && (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionText}>
              Your referral network is growing! Consider reaching out to your top referrers to strengthen those relationships.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -30,
  },
  statCard: {
    width: '48%', // Two cards per row
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.success,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: `${Colors.warning}10`,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  followUpAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  followUpAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  followUpAvatarText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  followUpInfo: {
    flex: 1,
  },
  followUpName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  followUpCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  followUpDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.warning,
    marginTop: 2,
  },
  contactButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  contactButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: `${Colors.success}10`,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  recentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  recentAvatarText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  recentCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  recentDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.success,
    marginTop: 2,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },
  rankAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  rankAvatarText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  rankCompany: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  rankStats: {
    alignItems: 'flex-end',
  },
  rankCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  rankValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    width: '48%',
  },
  tagName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tagCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  suggestionContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  suggestionCard: {
    backgroundColor: `${Colors.accent}10`,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  debugButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  debugButtonText: {
    color: Colors.white,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
});