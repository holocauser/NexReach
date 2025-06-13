import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight, DollarSign, CalendarDays, CreditCard as Edit } from 'lucide-react-native';
import { Referral } from '@/types';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { useCardStore } from '@/store/cardStore';

interface ReferralItemProps {
  referral: Referral;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
}

const ReferralItem: React.FC<ReferralItemProps> = ({ referral, onPress, onEdit }) => {
  const { getCardById } = useCardStore();
  
  const referrer = getCardById(referral.referrerId);
  const recipient = getCardById(referral.recipientId);
  
  const getStatusColor = (outcome: string) => {
    switch (outcome) {
      case 'successful':
        return Colors.success;
      case 'unsuccessful':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(referral.id)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.referralFlow}>
            <View style={styles.contactBubble}>
              <Text style={styles.contactInitial}>
                {referrer?.name.charAt(0) || '?'}
              </Text>
            </View>
            
            <View style={styles.arrowContainer}>
              <ArrowRight size={20} color={Colors.primary} />
            </View>
            
            <View style={styles.contactBubble}>
              <Text style={styles.contactInitial}>
                {recipient?.name.charAt(0) || '?'}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(referral.outcome) }]}>
            <Text style={styles.statusText}>
              {referral.outcome.charAt(0).toUpperCase() + referral.outcome.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.names}>
          <Text style={styles.nameText} numberOfLines={1}>
            {referrer?.name || 'Unknown'} 
          </Text>
          <ArrowRight size={16} color={Colors.textSecondary} style={styles.nameArrow} />
          <Text style={styles.nameText} numberOfLines={1}>
            {recipient?.name || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <CalendarDays size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{format(referral.date, 'MMM d, yyyy')}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <DollarSign size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {referral.value > 0 ? `$${referral.value.toLocaleString()}` : 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.caseContainer}>
          <Text style={styles.caseLabel}>Case Type:</Text>
          <Text style={styles.caseType}>{referral.caseType}</Text>
        </View>
        
        {referral.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {referral.notes}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => onEdit(referral.id)}
        >
          <Edit size={16} color={Colors.primary} />
          <Text style={styles.editText}>Edit Referral</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralFlow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitial: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  arrowContainer: {
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  names: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  nameArrow: {
    marginHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  caseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  caseType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  editText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginLeft: 4,
  },
});

export default ReferralItem;