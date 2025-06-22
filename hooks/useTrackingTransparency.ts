import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';

export const useTrackingTransparency = () => {
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only run on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    // Check current tracking status
    const checkTrackingStatus = async () => {
      try {
        const status = await TrackingTransparency.getTrackingPermissionsAsync();
        setTrackingStatus(status.status);
      } catch (error) {
        console.error('Error checking tracking status:', error);
      }
    };

    checkTrackingStatus();
  }, []);

  const requestTrackingPermission = async (): Promise<string> => {
    if (Platform.OS !== 'ios') {
      return 'unavailable';
    }

    setIsRequesting(true);
    
    try {
      const status = await TrackingTransparency.requestTrackingPermissionsAsync();
      setTrackingStatus(status.status);
      return status.status;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return 'denied';
    } finally {
      setIsRequesting(false);
    }
  };

  const canTrack = trackingStatus === 'authorized';

  return {
    trackingStatus,
    isRequesting,
    requestTrackingPermission,
    canTrack,
    isIOS: Platform.OS === 'ios'
  };
}; 