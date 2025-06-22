import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Plus, TrendingUp, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import ReferralItem from '@/components/ReferralItem';
import { useReferralStore } from '@/store/referralStore';
import { useCardStore } from '@/store/cardStore';

export default function ReferralsScreen() {
  const router = useRouter();
  const { referrals } = useReferralStore();
  const { cards } = useCardStore();
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'successful' | 'unsuccessful'>('all');
  
  const filteredReferrals = filter === 'all' 
    ? referrals
    : referrals.filter(referral => referral.outcome === filter);
  
  // Sort referrals by date (newest first)
  const sortedReferrals = [...filteredReferrals].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const totalValue = filteredReferrals.reduce((sum, referral) => sum + referral.value, 0);
  
  const handleReferralPress = (id: string) => {
    // This could navigate to referral details in a real app
    console.log('Referral pressed:', id);
  };
  
  const handleEdit = (id: string) => {
    router.push(`/edit-referral/${id}`);
  };
  
  const handleAddReferral = () => {
    // This would navigate to add referral screen in a real app
    console.log('Add new referral');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Referrals</Text>
          <Text style={styles.summaryValue}>{filteredReferrals.length}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>${totalValue.toLocaleString()}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Success Rate</Text>
          <Text style={styles.summaryValue}>
            {referrals.length > 0 
              ? `${Math.round((referrals.filter(r => r.outcome === 'successful').length / referrals.length) * 100)}%`
              : 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Filter size={20} color={Colors.primary} />
          <Text style={styles.filterTitle}>Filter Referrals</Text>
        </View>
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'successful' && styles.filterButtonActive]}
            onPress={() => setFilter('successful')}
          >
            <Text style={[styles.filterButtonText, filter === 'successful' && styles.filterButtonTextActive]}>
              Successful
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unsuccessful' && styles.filterButtonActive]}
            onPress={() => setFilter('unsuccessful')}
          >
            <Text style={[styles.filterButtonText, filter === 'unsuccessful' && styles.filterButtonTextActive]}>
              Unsuccessful
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={sortedReferrals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReferralItem
            referral={item}
            onPress={handleReferralPress}
            onEdit={handleEdit}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No referrals found</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your referrals by adding a new referral
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddReferral}
      >
        <Plus size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});