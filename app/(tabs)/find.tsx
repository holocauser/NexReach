import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Platform,
  Linking
} from 'react-native';
import { MapPin, Phone, Mail, Star, Navigation, Globe, Clock, MapPin as LocationIcon } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/Colors';
import SearchFilter from '@/components/SearchFilter';
import ProviderSearchItem from '@/components/ProviderSearchItem';
import { Filter } from '@/types';
import { searchProviders as googleSearchProviders } from '@/utils/googlePlaces';
import axios from 'axios';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = 'AIzaSyDsjOqNqBY6albDBbUb_nTalGvwqeeRQ_A';
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
  business_status?: string;
}

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
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export default function FindProvidersScreen() {
  const [results, setResults] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [searchLocation, setSearchLocation] = useState<{lat: number; lng: number} | null>(null);
  
  const [filter, setFilter] = useState<Filter>({
    specialty: [],
    languages: [],
    services: [],
    location: '',
    radius: 25,
  });

  // Request location permissions and get user location
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });

        // Reverse geocode to get current city
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const locationString = `${address.city}, ${address.region}`;
          updateFilter({ location: locationString });
        }
      } else {
        Alert.alert(
          'Location Permission Required',
          'To show accurate distances, please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  // Get coordinates for the search location
  const getLocationCoordinates = async (locationString: string): Promise<{lat: number; lng: number} | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationString)}&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  };

  const buildSearchQuery = (): string => {
    let query = '';

    // Add specialties/tags to query
    if (filter.specialty.length > 0) {
      // For legal-related tags, append 'Attorney' and 'Lawyer'
      const legalKeywords = ['injury', 'law', 'attorney', 'legal', 'trial', 'pi', 'malpractice', 'defense', 'estate', 'real estate', 'immigration', 'comp', 'criminal'];
      const isLegal = filter.specialty.some(s => legalKeywords.some(k => s.toLowerCase().includes(k)));
      if (isLegal) {
        query += filter.specialty.join(' OR ') + ' Attorney Lawyer ';
      } else {
        // For medical-related tags, append 'Doctor' and 'Physician'
        const medicalKeywords = ['doctor', 'dr', 'surgeon', 'chiropractor', 'orthopedic', 'pain', 'spine', 'medical', 'physician', 'clinic', 'hospital'];
        const isMedical = filter.specialty.some(s => medicalKeywords.some(k => s.toLowerCase().includes(k)));
        if (isMedical) {
          query += filter.specialty.join(' OR ') + ' Doctor Physician ';
        } else {
          // For other tags, just use the tag
          query += filter.specialty.join(' OR ') + ' ';
        }
      }
    }

    // Add default professional types if no specialty selected
    if (filter.specialty.length === 0) {
      query += 'doctor attorney lawyer physician surgeon ';
    }

    // Add location
    if (filter.location) {
      query += `in ${filter.location}`;
    }

    return query.trim();
  };

  const handleSearch = async () => {
    if (!filter.location || filter.specialty.length === 0) {
      Alert.alert('Please enter a location and select a specialty.');
      return;
    }
    setLoading(true);
    try {
      const specialty = filter.specialty[0];
      const city = filter.location;
      const providers = await googleSearchProviders(specialty, city);
      // Fetch details for each provider
      const providersWithDetails = await Promise.all(
        providers.map(async (provider: any) => {
          const details = await fetchPlaceDetails(provider.place_id);
          // Prefer details.photos if available, otherwise use provider.photos
          return { ...provider, ...details, photos: details.photos || provider.photos };
        })
      );
      setResults(providersWithDetails);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch providers.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const detailsUrl = `${PLACES_API_BASE}/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry,photos,types,reviews&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return data.result;
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  const applyAdditionalFilters = (result: PlaceDetails): boolean => {
    // Filter by business types (doctors, lawyers, etc.)
    const professionalTypes = [
      'doctor', 'hospital', 'health', 'medical', 'clinic', 'physician',
      'lawyer', 'attorney', 'legal', 'law_firm', 'legal_services'
    ];

    const resultText = `${result.name} ${result.formatted_address} ${result.types.join(' ')}`.toLowerCase();
    
    // Check if it's a professional service
    const isProfessional = professionalTypes.some(type => 
      resultText.includes(type) || result.types.some(t => t.includes(type))
    );

    if (!isProfessional) return false;

    // Apply specialty filter if specified
    if (filter.specialty.length > 0) {
      const hasSpecialty = filter.specialty.some(specialty =>
        resultText.includes(specialty.toLowerCase())
      );
      if (!hasSpecialty) return false;
    }

    return true;
  };

  const updateFilter = (newFilter: Partial<Filter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const resetFilter = () => {
    setFilter({
      specialty: [],
      languages: [],
      services: [],
      location: '',
      radius: 25,
    });
    setResults([]);
    setSearchLocation(null);
  };

  const handleProviderPress = (provider: PlaceDetails) => {
    // Open in maps app
    const address = encodeURIComponent(provider.formatted_address);
    
    if (Platform.OS === 'web') {
      window.open(`https://maps.google.com/maps?q=${address}`, '_blank');
    } else {
      const mapsUrl = Platform.select({
        ios: `http://maps.apple.com/?q=${address}`,
        android: `geo:0,0?q=${address}`,
      });
      
      if (mapsUrl) {
        Linking.openURL(mapsUrl);
      }
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This provider does not have a phone number listed.');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const phoneUrl = `tel:${cleanPhone}`;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Call Provider',
        `Would you like to call this provider?\n\nPhone: ${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => window.open(phoneUrl, '_self')
          }
        ]
      );
    } else {
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) {
            Alert.alert(
              'Call Provider',
              'Call this provider?'
            );
          } else {
            Alert.alert('Call Error', 'Unable to call this provider. Please check your internet connection.');
          }
        });
    }
  };

  const handleUseMyLocation = async () => {
    if (!userLocation) {
      await requestLocationPermission();
      return;
    }
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      });
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = `${address.city}, ${address.region}`;
        updateFilter({ location: locationString });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    }
  };

  const handleWebsite = (website: string) => {
    if (!website) {
      Alert.alert('No Website', 'This provider does not have a website listed.');
      return;
    }
    let websiteUrl = website;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
    }
    if (Platform.OS === 'web') {
      window.open(websiteUrl, '_blank');
    } else {
      Linking.openURL(websiteUrl);
    }
  };

  // Fetch Place Details for phone number and website
  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const detailsUrl = `${PLACES_API_BASE}/details/json?place_id=${placeId}&fields=place_id,formatted_phone_number,website,photos,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
      const res = await axios.get(detailsUrl);
      if (res.data.status === 'OK' && res.data.result) {
        return {
          formatted_phone_number: res.data.result.formatted_phone_number,
          website: res.data.result.website,
          photos: res.data.result.photos,
          user_ratings_total: res.data.result.user_ratings_total,
        };
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
    return {};
  };

  return (
    <View style={styles.container}>
      <SearchFilter
        filter={filter}
        onUpdateFilter={updateFilter}
        onSearch={handleSearch}
        onReset={resetFilter}
        onUseMyLocation={handleUseMyLocation}
        hasLocationPermission={!!userLocation}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching providers...</Text>
          <Text style={styles.loadingSubtext}>Finding professionals near {filter.location}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <ProviderSearchItem
              provider={item}
              onPress={handleProviderPress}
              onCall={handleCall}
              onWebsite={handleWebsite}
              userLocation={userLocation}
              searchLocation={searchLocation}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter.location || filter.specialty.length > 0 
                  ? 'No providers found' 
                  : 'Search for providers'}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter.location || filter.specialty.length > 0
                  ? 'Try adjusting your search criteria or expanding your radius'
                  : 'Enter your location and specialty to find professionals near you'
                }
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
