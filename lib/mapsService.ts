import { Platform, Linking, Alert } from 'react-native';

class MapsService {
  /**
   * Open location in native maps app
   */
  async openLocationInMaps(location: string): Promise<boolean> {
    try {
      if (!location || location.trim() === '') {
        Alert.alert(
          'No Location',
          'No location information available for this event.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const encodedLocation = encodeURIComponent(location.trim());
      let mapsUrl: string;

      if (Platform.OS === 'ios') {
        // iOS: Use Apple Maps
        mapsUrl = `http://maps.apple.com/?q=${encodedLocation}`;
      } else if (Platform.OS === 'android') {
        // Android: Use Google Maps
        mapsUrl = `geo:0,0?q=${encodedLocation}`;
      } else {
        // Web: Use Google Maps web
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      }

      const canOpen = await Linking.canOpenURL(mapsUrl);
      
      if (canOpen) {
        await Linking.openURL(mapsUrl);
        return true;
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
          return true;
        } else {
          Alert.alert(
            'Maps Not Available',
            'No maps app found on your device. Please install a maps app and try again.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(
        'Error',
        'Unable to open maps app. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Open location with specific coordinates (if available)
   */
  async openLocationWithCoordinates(
    location: string, 
    latitude?: number, 
    longitude?: number
  ): Promise<boolean> {
    try {
      if (!location || location.trim() === '') {
        Alert.alert(
          'No Location',
          'No location information available for this event.',
          [{ text: 'OK' }]
        );
        return false;
      }

      let mapsUrl: string;

      if (latitude && longitude) {
        // Use coordinates if available
        if (Platform.OS === 'ios') {
          mapsUrl = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(location.trim())}`;
        } else if (Platform.OS === 'android') {
          mapsUrl = `geo:${latitude},${longitude}?q=${encodeURIComponent(location.trim())}`;
        } else {
          mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        }
      } else {
        // Fall back to search by address
        return this.openLocationInMaps(location);
      }

      const canOpen = await Linking.canOpenURL(mapsUrl);
      
      if (canOpen) {
        await Linking.openURL(mapsUrl);
        return true;
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
          return true;
        } else {
          Alert.alert(
            'Maps Not Available',
            'No maps app found on your device. Please install a maps app and try again.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    } catch (error) {
      console.error('Error opening maps with coordinates:', error);
      Alert.alert(
        'Error',
        'Unable to open maps app. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Get directions to location
   */
  async getDirectionsToLocation(location: string): Promise<boolean> {
    try {
      if (!location || location.trim() === '') {
        Alert.alert(
          'No Location',
          'No location information available for this event.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const encodedLocation = encodeURIComponent(location.trim());
      let directionsUrl: string;

      if (Platform.OS === 'ios') {
        // iOS: Use Apple Maps for directions
        directionsUrl = `http://maps.apple.com/?daddr=${encodedLocation}`;
      } else if (Platform.OS === 'android') {
        // Android: Use Google Maps for directions
        directionsUrl = `google.navigation:q=${encodedLocation}`;
      } else {
        // Web: Use Google Maps web for directions
        directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
      }

      const canOpen = await Linking.canOpenURL(directionsUrl);
      
      if (canOpen) {
        await Linking.openURL(directionsUrl);
        return true;
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
          return true;
        } else {
          Alert.alert(
            'Maps Not Available',
            'No maps app found on your device. Please install a maps app and try again.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert(
        'Error',
        'Unable to open maps app for directions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
}

export const mapsService = new MapsService(); 