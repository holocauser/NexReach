import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, MapPin, Phone, Mail, Plus } from 'lucide-react-native';
import { Provider } from '@/types';
import Colors from '@/constants/Colors';
import TagList from './TagList';

interface ProviderItemProps {
  provider: Provider;
  onPress: (id: string) => void;
  onAddToFavorites: (id: string) => void;
  inFavorites?: boolean;
}

const ProviderItem: React.FC<ProviderItemProps> = ({
  provider,
  onPress,
  onAddToFavorites,
  inFavorites = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(provider.id)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {provider.name.charAt(0) + provider.name.split(' ')[1]?.charAt(0)}
            </Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.name}>{provider.name}</Text>
            <Text style={styles.company}>{provider.company}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  color={star <= provider.rating ? Colors.favorite : Colors.textLight}
                  fill={star <= provider.rating ? Colors.favorite : 'transparent'}
                />
              ))}
              <Text style={styles.ratingText}>{provider.rating.toFixed(1)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => onAddToFavorites(provider.id)}
          >
            {inFavorites ? (
              <Star size={24} color={Colors.favorite} fill={Colors.favorite} />
            ) : (
              <Plus size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <TagList tags={provider.specialty} style={styles.tagList} />

          {provider.distance !== undefined && (
            <View style={styles.locationContainer}>
              <MapPin size={16} color={Colors.primary} />
              <Text style={styles.locationText}>{provider.distance.toFixed(1)} miles away</Text>
            </View>
          )}

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Phone size={16} color={Colors.primary} />
              <Text style={styles.contactText}>{provider.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={16} color={Colors.primary} />
              <Text style={styles.contactText}>{provider.email}</Text>
            </View>
          </View>
        </View>
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
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  company: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginLeft: 4,
  },
  favoriteButton: {
    justifyContent: 'center',
    padding: 4,
  },
  infoSection: {
    gap: 12,
  },
  tagList: {
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
});

export default ProviderItem;