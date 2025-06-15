import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Users, Clock, Lightbulb, Calendar, Star, Phone, Mail } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useReferralStore } from '@/store/referralStore';
import { useCardStore } from '@/store/cardStore';
import { format, isAfter, subDays, subWeeks, subMonths } from 'date-fns';

export default function DashboardScreen() {
  const { referrals, getTopReferrers, getTopRecipients, getTotalReferralsValue } = useReferralStore();
  const { cards, getCardById, updateLastContacted } = useCardStore();
  
  const topReferrers = getTopReferrers(3);
  const topRecipients = (getTopRecipients(3) || []).slice(0, 3);
  const totalValue = getTotalReferralsValue();
  
  // Get cards that need follow-up (haven't been contacted in 30+ days)
  const getFollowUpNeeded = () => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    return cards.filter(card => {
      if (!card.lastContacted) return true; // Never contacted
      return isAfter(thirtyDaysAgo, card.lastContacted);
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
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Overview</Text>
        <Text style={styles.headerSubtitle}>
          Track your networking and referral activity
        </Text>
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
            <Clock size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>
            ${totalValue.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Referral Value</Text>
          <Text style={styles.statSubtext}>Total earned</Text>
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
              <View style={styles.followUpInfo}>
                <Text style={styles.followUpName}>{card.name}</Text>
                <Text style={styles.followUpCompany}>{card.company}</Text>
                <Text style={styles.followUpDate}>
                  {card.lastContacted 
                    ? `Last contacted: ${format(card.lastContacted, 'MMM d, yyyy')}`
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
                <Text style={styles.recentAvatarText}>
                  {card.name.charAt(0) + (card.name.split(' ')[1]?.charAt(0) || '')}
                </Text>
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
        
        {cards.filter(c => c.tags.includes('Spanish-speaking')).length > 0 && (
          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionText}>
              You have {cards.filter(c => c.tags.includes('Spanish-speaking')).length} Spanish-speaking contacts. Consider expanding your bilingual network for better client service.
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
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentAvatarText: {
    color: Colors.white,
    fontSize: 14,
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
});