import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useCameraPermissions } from 'expo-camera';

interface PermissionStatus {
  camera: boolean;
  allGranted: boolean;
  isLoading: boolean;
}

export function useStartupPermissions() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: false,
    allGranted: false,
    isLoading: true,
  });

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    requestAllPermissions();
  }, []);

  const requestAllPermissions = async () => {
    try {
      console.log('🔐 Requesting camera permission at startup...');
      
      let cameraGranted = false;

      // Request Camera Permission
      if (Platform.OS !== 'web') {
        if (cameraPermission?.granted) {
          cameraGranted = true;
          console.log('✅ Camera permission already granted');
        } else {
          console.log('📷 Requesting camera permission...');
          const cameraResult = await requestCameraPermission();
          cameraGranted = cameraResult.granted;
          console.log('📷 Camera permission result:', cameraGranted);
        }
      } else {
        // On web, camera permission is handled by browser
        cameraGranted = true;
      }

      // Note: Media library permission is now handled per-use in ImagePicker
      // This prevents conflicts and loading issues

      const allGranted = cameraGranted;

      setPermissionStatus({
        camera: cameraGranted,
        allGranted,
        isLoading: false,
      });

      console.log('🎉 Camera permission processed at startup:', {
        camera: cameraGranted,
        allGranted,
      });

    } catch (error) {
      console.error('❌ Error requesting permissions at startup:', error);
      // Don't block the app if permissions fail
      setPermissionStatus({
        camera: Platform.OS === 'web', // Allow on web
        allGranted: Platform.OS === 'web', // Allow on web
        isLoading: false,
      });
    }
  };

  return {
    ...permissionStatus,
    requestAllPermissions,
  };
}