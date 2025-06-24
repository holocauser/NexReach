import { mapsService } from '@/lib/mapsService';
import { Alert } from 'react-native';

/**
 * Test maps integration functionality
 */
export const testMapsIntegration = async () => {
  try {
    console.log('🗺️ Testing Maps Integration...');

    // Test 1: Open location in maps
    console.log('1. Testing open location in maps...');
    const testLocation = '123 Main Street, Orlando, FL 32801';
    
    const success = await mapsService.openLocationInMaps(testLocation);
    console.log('Maps opened successfully:', success);

    if (success) {
      Alert.alert(
        'Maps Test Successful!',
        'Maps app should have opened with the test location.',
        [{ text: 'OK' }]
      );
      return true;
    } else {
      Alert.alert(
        'Maps Test Failed',
        'Failed to open maps app. Please check if you have a maps app installed.',
        [{ text: 'OK' }]
      );
      return false;
    }

  } catch (error) {
    console.error('Maps test error:', error);
    Alert.alert(
      'Maps Test Error',
      `An error occurred during maps testing: ${error}`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Test directions functionality
 */
export const testDirectionsIntegration = async () => {
  try {
    console.log('🧭 Testing Directions Integration...');

    // Test 1: Get directions to location
    console.log('1. Testing get directions...');
    const testLocation = 'Disney World, Orlando, FL';
    
    const success = await mapsService.getDirectionsToLocation(testLocation);
    console.log('Directions opened successfully:', success);

    if (success) {
      Alert.alert(
        'Directions Test Successful!',
        'Directions should have opened in your maps app.',
        [{ text: 'OK' }]
      );
      return true;
    } else {
      Alert.alert(
        'Directions Test Failed',
        'Failed to open directions. Please check if you have a maps app installed.',
        [{ text: 'OK' }]
      );
      return false;
    }

  } catch (error) {
    console.error('Directions test error:', error);
    Alert.alert(
      'Directions Test Error',
      `An error occurred during directions testing: ${error}`,
      [{ text: 'OK' }]
    );
    return false;
  }
}; 