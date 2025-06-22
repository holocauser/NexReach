import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Platform } from 'react-native';
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
  location?: {
    lat: number;
    lng: number;
  };
  address?: string;
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
  // Debug log for provider object
  console.log('Provider:', provider);

  // Calculate distance using user's actual location if available, otherwise use search location
  const calculateDistance = (): number | null => {
    const referenceLocation = userLocation || searchLocation;
    if (!referenceLocation || !provider.location) return null;
    const R = 3959; // Earth's radius in miles
    const dLat = (provider.location.lat - referenceLocation.lat) * Math.PI / 180;
    const dLon = (provider.location.lng - referenceLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(referenceLocation.lat * Math.PI / 180) * Math.cos(provider.location.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distance = calculateDistance();

  // Get photo URL if available (use initial search result's photos array)
  const getPhotoUrl = (): string | null => {
    if (provider.photos && provider.photos.length > 0) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${provider.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
    }
    return null;
  };

  const photoUrl = getPhotoUrl();

  // Open directions in maps
  const handleDirections = () => {
    let url = '';
    if (provider.location) {
      // Use coordinates if available
      url = Platform.select({
        ios: `http://maps.apple.com/?daddr=${provider.location.lat},${provider.location.lng}`,
        android: `geo:${provider.location.lat},${provider.location.lng}?q=${provider.location.lat},${provider.location.lng}`,
      }) || '';
    } else if (provider.address || provider.formatted_address) {
      // Fallback to address
      const address = encodeURIComponent(provider.address || provider.formatted_address);
      url = Platform.select({
        ios: `http://maps.apple.com/?daddr=${address}`,
        android: `geo:0,0?q=${address}`,
      }) || '';
    }
    if (url) Linking.openURL(url);
  };

  // Open website
  const handleWebsite = () => {
    if (!provider.website) return;
    let websiteUrl = provider.website;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    Linking.openURL(websiteUrl);
  };

  // Call provider
  const handleCall = () => {
    if (!provider.formatted_phone_number) return;
    const cleanPhone = provider.formatted_phone_number.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    Linking.openURL(phoneUrl);
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.type}>{provider.types && provider.types.length > 0 ? provider.types[0] : ''}</Text>
            
            {(typeof provider.rating !== 'undefined' || typeof provider.user_ratings_total !== 'undefined') && (
              <View style={styles.ratingContainer}>
                <Star size={14} color={Colors.favorite} fill={Colors.favorite} />
                <Text style={styles.ratingText}>
                  {typeof provider.rating !== 'undefined' ? provider.rating.toFixed(1) : '-'}
                </Text>
                {typeof provider.user_ratings_total !== 'undefined' && (
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
                <Clock size={12} color={Colors.cardBackground} />
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
            {provider.address || provider.formatted_address || (provider.location ? `${provider.location.lat}, ${provider.location.lng}` : '')}
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
              onPress={handleCall}
            >
              <Phone size={18} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>Call</Text>
            </TouchableOpacity>
          )}
          
          {provider.website && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWebsite}
            >
              <Globe size={18} color={Colors.primary} />
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDirections}
          >
            <Navigation size={18} color={Colors.accent} />
            <Text style={[styles.actionText, { color: Colors.accent }]}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.cardBackground,
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
    color: Colors.cardBackground,
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
    backgroundColor: Colors.cardBackground,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.cardBackground,
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