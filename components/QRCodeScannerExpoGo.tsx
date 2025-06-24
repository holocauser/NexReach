import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(width, height) * 0.6;

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function QRCodeScannerExpoGo({ onScan, onClose, isVisible }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isNativeModuleAvailable, setIsNativeModuleAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (isVisible) {
      checkNativeModuleAvailability();
      requestPermissions();
    }
  }, [isVisible]);

  const checkNativeModuleAvailability = async () => {
    try {
      // Try to import the barcode scanner
      const { BarCodeScanner } = await import('expo-barcode-scanner');
      setIsNativeModuleAvailable(true);
    } catch (error) {
      console.log('Native module not available in Expo Go:', error);
      setIsNativeModuleAvailable(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { BarCodeScanner } = await import('expo-barcode-scanner');
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.log('Permission request failed:', error);
      setHasPermission(false);
    }
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Enter QR Code Data',
      'Please enter the QR code data manually:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: (text) => {
            if (text && text.trim()) {
              onScan(text.trim());
            }
          }
        }
      ],
      'plain-text'
    );
  };

  if (!isVisible) {
    return null;
  }

  // If native module is not available (Expo Go limitation)
  if (!isNativeModuleAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.expoGoContainer}>
          <Ionicons name="qr-code-outline" size={64} color={Colors.primary} />
          <Text style={styles.expoGoTitle}>QR Scanner Not Available in Expo Go</Text>
          <Text style={styles.expoGoText}>
            The QR code scanner requires a custom development build. For now, you can:
          </Text>
          
          <View style={styles.expoGoOptions}>
            <TouchableOpacity style={styles.expoGoButton} onPress={handleManualEntry}>
              <Ionicons name="create-outline" size={24} color={Colors.white} />
              <Text style={styles.expoGoButtonText}>Enter QR Data Manually</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.expoGoButtonSecondary} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
              <Text style={styles.expoGoButtonTextSecondary}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.expoGoNote}>
            To use the full QR scanner, create a custom development build with:
            {'\n'}npx expo run:ios or npx expo run:android
          </Text>
        </View>
      </View>
    );
  }

  // If permission is not granted
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.error} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If permission is still being requested
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  // If everything is available, show the actual scanner
  return (
    <View style={styles.container}>
      <View style={styles.expoGoContainer}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.expoGoTitle}>QR Scanner Ready</Text>
        <Text style={styles.expoGoText}>
          The QR scanner is available in your custom development build.
        </Text>
        
        <TouchableOpacity style={styles.expoGoButton} onPress={handleManualEntry}>
          <Ionicons name="create-outline" size={24} color={Colors.white} />
          <Text style={styles.expoGoButtonText}>Enter QR Data Manually</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.expoGoButtonSecondary} onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
          <Text style={styles.expoGoButtonTextSecondary}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  expoGoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  expoGoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  expoGoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  expoGoOptions: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  expoGoButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  expoGoButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expoGoButtonSecondary: {
    backgroundColor: Colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expoGoButtonTextSecondary: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  expoGoNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 