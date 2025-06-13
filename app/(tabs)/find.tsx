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
    
    // Add specialties to query
    if (filter.specialty.length > 0) {
      query += filter.specialty.join(' OR ') + ' ';
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

  const searchProviders = async () => {
    if (!filter.location) {
      Alert.alert('Location Required', 'Please enter a location to search for providers.');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Determine which location to use for search
      let searchCoords: {lat: number; lng: number} | null = null;
      
      if (filter.location && userLocation) {
        // Check if the search location is the same as user's current location
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        });

        if (reverseGeocode.length > 0) {
          const currentLocationString = `${reverseGeocode[0].city}, ${reverseGeocode[0].region}`;
          
          if (filter.location.toLowerCase().includes(reverseGeocode[0].city?.toLowerCase() || '')) {
            // Use user's actual location for more accurate results
            searchCoords = userLocation;
          }
        }
      }
      
      // If not using user location, geocode the search location
      if (!searchCoords) {
        searchCoords = await getLocationCoordinates(filter.location);
      }
      
      if (!searchCoords) {
        Alert.alert('Invalid Location', 'Could not find the specified location. Please try a different location.');
        setLoading(false);
        return;
      }

      setSearchLocation(searchCoords);

      const query = buildSearchQuery();
      console.log('Searching for:', query);
      console.log('Search coordinates:', searchCoords);

      // Use Nearby Search API with location and radius for more accurate results
      const radiusInMeters = filter.radius * 1609.34; // Convert miles to meters
      
      let searchUrl = '';
      
      if (filter.specialty.length > 0) {
        // Use Text Search for specific specialties
        searchUrl = `${PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(query)}&location=${searchCoords.lat},${searchCoords.lng}&radius=${radiusInMeters}&key=${GOOGLE_PLACES_API_KEY}`;
      } else {
        // Use Nearby Search for general professional services
        searchUrl = `${PLACES_API_BASE}/nearbysearch/json?location=${searchCoords.lat},${searchCoords.lng}&radius=${radiusInMeters}&type=establishment&keyword=doctor attorney lawyer physician surgeon&key=${GOOGLE_PLACES_API_KEY}`;
      }

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        // Get detailed information for each place
        const detailedResults = await Promise.all(
          data.results.slice(0, 20).map(async (place: PlaceResult) => {
            return await getPlaceDetails(place.place_id);
          })
        );

        // Filter out null results and apply additional filters
        const validResults = detailedResults
          .filter((result): result is PlaceDetails => result !== null)
          .filter(result => applyAdditionalFilters(result));

        setResults(validResults);
      } else {
        console.error('Places API error:', data.status, data.error_message);
        if (data.status === 'ZERO_RESULTS') {
          Alert.alert('No Results', 'No providers found in this area. Try expanding your search radius or changing your location.');
        } else {
          Alert.alert('Search Error', data.error_message || 'Unable to search for providers. Please try again.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Network Error', 'Unable to connect to search service. Please check your internet connection.');
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
              `Call this provider?\n\nPhone: ${phoneNumber}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Call', 
                  onPress: () => Linking.openURL(phoneUrl)
                }
              ]
            );
          } else {
            Alert.alert('Cannot Make Call', 'Phone calling is not supported on this device.');
          }
        });
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

  return (
    <View style={styles.container}>
      <SearchFilter
        filter={filter}
        onUpdateFilter={updateFilter}
        onSearch={searchProviders}
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
              <MapPin size={48} color={Colors.textLight} />
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
          ListHeaderComponent={
            results.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                  Found {results.length} provider{results.length !== 1 ? 's' : ''}
                  {filter.location && ` near ${filter.location}`}
                </Text>
                {userLocation && (
                  <View style={styles.locationStatus}>
                    <LocationIcon size={14} color={Colors.success} />
                    <Text style={styles.locationStatusText}>Using your location for accurate distances</Text>
                  </View>
                )}
              </View>
            ) : null
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.success,
    marginLeft: 4,
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