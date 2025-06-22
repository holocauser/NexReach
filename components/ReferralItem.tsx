import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarDays, CreditCard as Edit } from 'lucide-react-native';
import { Referral } from '@/types';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';
import { useCardStore } from '@/store/cardStore';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStore } from '@/store/userStore';

interface ReferralItemProps {
  referral: Referral;
  onPress: (id: string) => void;
  onEdit: (id: string) => void;
}

const ReferralItem: React.FC<ReferralItemProps> = ({ referral, onPress, onEdit }) => {
  const { getCardById } = useCardStore();
  const { user } = useAuth();
  const { profile } = useUserStore();

  const getContactName = (id: string) => {
    if (user && id === user.id) return 'Me';
    if (profile && id === profile.id) return 'Me';
    const card = getCardById(id);
    return card?.name || 'Unknown';
  };

  const sender = getContactName(referral.referrerId);
  const receiver = getContactName(referral.recipientId);
  const isUserCreated = user && (referral.referrerId === user.id || referral.recipientId === user.id);

  const getStatusStyle = (outcome: string) => {
    switch (outcome) {
      case 'successful': return styles.statusSuccessful;
      case 'unsuccessful': return styles.statusUnsuccessful;
      default: return styles.statusPending;
    }
  };

  const getDirectionStyle = (direction: 'sent' | 'received') => {
    return direction === 'sent' ? styles.directionSent : styles.directionReceived;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(referral.id)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.statusTag, getStatusStyle(referral.outcome)]}>
            <Text style={styles.statusText}>{referral.outcome}</Text>
          </View>
        </View>

        <Text style={styles.referralFlow} numberOfLines={1}>
          <Text style={styles.name}>{sender}</Text> → <Text style={styles.name}>{receiver}</Text>
        </Text>

        <Text style={styles.caseType} numberOfLines={1}>{referral.caseType}</Text>

        <View style={styles.infoRow}>
          <View style={styles.dateContainer}>
            <CalendarDays size={14} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{format(new Date(referral.date), 'MMM d, yyyy')}</Text>
          </View>
        </View>

        {referral.notes && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {referral.notes}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={[styles.directionTag, getDirectionStyle(referral.direction)]}>
            <Text style={styles.directionText}>{referral.direction}</Text>
          </View>
          <Text style={styles.amountText}>${referral.value.toLocaleString()}</Text>
        </View>

        {isUserCreated && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(referral.id)}
          >
            <Edit size={14} color={Colors.primary} />
            <Text style={styles.editText}>Edit Referral</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusSuccessful: { backgroundColor: Colors.success },
  statusPending: { backgroundColor: Colors.warning },
  statusUnsuccessful: { backgroundColor: Colors.error },
  referralFlow: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  name: {
    fontWeight: '600',
  },
  caseType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  directionTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  directionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  directionSent: { backgroundColor: '#3b82f6' },
  directionReceived: { backgroundColor: '#10b981' },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a3b9c',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  editText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 6,
  },
});

export default ReferralItem;