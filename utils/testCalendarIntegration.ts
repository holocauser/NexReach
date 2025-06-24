import { calendarService } from '@/lib/calendarService';
import { Alert } from 'react-native';

/**
 * Test calendar integration functionality
 */
export const testCalendarIntegration = async () => {
  try {
    console.log('🧪 Testing Calendar Integration...');

    // Test 1: Check permissions
    console.log('1. Checking calendar permissions...');
    const hasPermissions = await calendarService.hasPermissions();
    console.log('Has permissions:', hasPermissions);

    // Test 2: Get default calendar
    console.log('2. Getting default calendar...');
    const calendarId = await calendarService.getDefaultCalendarId();
    console.log('Default calendar ID:', calendarId);

    // Test 3: Add test event
    console.log('3. Adding test event to calendar...');
    const testEvent = {
      title: 'ScanCard Test Event',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
      location: 'Test Location',
      notes: 'This is a test event from ScanCard App to verify calendar integration.',
    };

    const success = await calendarService.addEventToCalendar(testEvent);
    console.log('Test event added successfully:', success);

    if (success) {
      Alert.alert(
        'Calendar Test Successful!',
        'Test event has been processed. Check the console for details.',
        [{ text: 'OK' }]
      );
      return true;
    } else {
      Alert.alert(
        'Calendar Test Failed',
        'Failed to process test event. Please check the console for errors.',
        [{ text: 'OK' }]
      );
      return false;
    }

  } catch (error) {
    console.error('Calendar test error:', error);
    Alert.alert(
      'Calendar Test Error',
      `An error occurred during calendar testing: ${error}`,
      [{ text: 'OK' }]
    );
    return false;
  }
}; 