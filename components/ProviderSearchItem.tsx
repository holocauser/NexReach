import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Phone, Globe, Clock, Navigation } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
}

interface ProviderSearchItemProps {
  provider: PlaceDetails;
  onPress: (provider: PlaceDetails) => void;
  onCall: (phone: string) => void;
  onWebsite: (website: string) => void;
  userLocation: {lat: number; lng: number} | null;
  searchLocation: {lat: number; lng: number} | null;
}

const GOOGLE_PLACES_API_KEY = 'AIzaSyDsjOqNqBY6albDBbUb_nTalGvwqeeRQ_A';

const ProviderSearchItem: React.FC<ProviderSearchItemProps> = ({
  provider,
  onPress,
  onCall,
  onWebsite,
  userLocation,
  searchLocation,
}) => {
  
  // Calculate distance using user's actual location if available, otherwise use search location
  const calculateDistance = (): number | null => {
    const referenceLocation = userLocation || searchLocation;
    if (!referenceLocation) return null;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (provider.geometry.location.lat - referenceLocation.lat) * Math.PI / 180;
    const dLon = (provider.geometry.location.lng - referenceLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(referenceLocation.lat * Math.PI / 180) * Math.cos(provider.geometry.location.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = calculateDistance();

  // Get photo URL if available
  const getPhotoUrl = (): string | null => {
    if (provider.photos && provider.photos.length > 0) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${provider.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
    }
    return null;
  };

  // Determine provider type from business types
  const getProviderType = (): string => {
    const types = provider.types.join(' ').toLowerCase();
    const name = provider.name.toLowerCase();
    
    if (types.includes('hospital') || types.includes('health') || name.includes('hospital')) {
      return 'Hospital';
    } else if (types.includes('doctor') || types.includes('physician') || name.includes('dr.') || name.includes('doctor')) {
      return 'Doctor';
    } else if (types.includes('lawyer') || types.includes('attorney') || types.includes('legal') || name.includes('law') || name.includes('attorney') || name.includes('esq')) {
      return 'Attorney';
    } else if (types.includes('dentist') || name.includes('dental')) {
      return 'Dentist';
    } else if (types.includes('pharmacy') || name.includes('pharmacy')) {
      return 'Pharmacy';
    }
    return 'Professional';
  };

  const photoUrl = getPhotoUrl();
  const providerType = getProviderType();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(provider)}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.providerImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {provider.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerContent}>
            <Text style={styles.name} numberOfLines={2}>{provider.name}</Text>
            <Text style={styles.type}>{providerType}</Text>
            
            {provider.rating && (
              <View style={styles.ratingContainer}>
                <Star size={14} color={Colors.favorite} fill={Colors.favorite} />
                <Text style={styles.ratingText}>
                  {provider.rating.toFixed(1)}
                </Text>
                {provider.user_ratings_total && (
                  <Text style={styles.reviewCount}>
                    ({provider.user_ratings_total} reviews)
                  </Text>
                )}
              </View>
            )}
          </View>

          {provider.opening_hours && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: provider.opening_hours.open_now ? Colors.success : Colors.error }
              ]}>
                <Clock size={12} color={Colors.white} />
                <Text style={styles.statusText}>
                  {provider.opening_hours.open_now ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.addressContainer}>
          <MapPin size={16} color={Colors.primary} />
          <Text style={styles.address} numberOfLines={2}>
            {provider.formatted_address}
          </Text>
          {distance !== null && (
            <View style={styles.distanceContainer}>
              <Text style={styles.distance}>
                {distance.toFixed(1)} mi
              </Text>
              {userLocation && (
                <Text style={styles.distanceLabel}>from you</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {provider.formatted_phone_number && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCall(provider.formatted_phone_number!)}
            >
              <Phone size={18} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>Call</Text>
            </TouchableOpacity>
          )}
          
          {provider.website && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onWebsite(provider.website!)}
            >
              <Globe size={18} color={Colors.primary} />
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPress(provider)}
          >
            <Navigation size={18} color={Colors.accent} />
            <Text style={[styles.actionText, { color: Colors.accent }]}>Directions</Text>
          </TouchableOpacity>
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
    marginBottom: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  statusContainer: {
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  address: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  distanceContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  distance: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary,
  },
  distanceLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
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
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginLeft: 6,
  },
});

export default ProviderSearchItem;