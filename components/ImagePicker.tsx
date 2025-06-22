import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  Platform,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from '@/constants/Colors';

interface ImagePickerProps {
  currentImage?: string;
  onImageSelected: (imageUri: string) => void;
  onImageRemoved: () => void;
  title?: string;
  placeholder?: string;
  aspectRatio?: [number, number];
  quality?: number;
  openCameraOnPress?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImagePicker: React.FC<ImagePickerProps> = ({
  currentImage,
  onImageSelected,
  onImageRemoved,
  title,
  placeholder = "Add Photo",
  aspectRatio = [4, 3],
  quality = 0.8,
  openCameraOnPress = false,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = React.useRef<any>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Check camera permissions
  const [cameraPermission] = useCameraPermissions();

  const openImagePicker = () => {
    setError(null);
    if (openCameraOnPress) {
      openCamera();
    } else {
      // Show options for both camera and gallery
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Gallery', onPress: pickFromLibrary }
        ]
      );
    }
  };

  const pickFromLibrary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🖼️ Starting image library picker...');
      
      // Request permission first if needed
      const permissionResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        setError('Photo library access is required to select images.');
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to select images.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Launch image picker with correct MediaTypeOptions
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images, // Fixed import
        allowsEditing: true,
        aspect: aspectRatio,
        quality: quality,
      });

      console.log('📸 Image picker completed:', {
        canceled: result.canceled,
        hasAssets: (result.assets || []).length > 0
      });

      // Handle the result properly
      if (!result.canceled && (result.assets || []).length > 0) {
        const selectedAsset = result.assets[0];
        if (selectedAsset.uri) {
          console.log('✅ Image selected successfully');
          onImageSelected(selectedAsset.uri);
          setError(null);
        } else {
          throw new Error('Selected image has no URI');
        }
      } else {
        console.log('ℹ️ Image selection cancelled by user');
      }
    } catch (error) {
      console.error('❌ Error in pickFromLibrary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to select image: ${errorMessage}`);
      Alert.alert(
        'Photo Selection Error',
        'Unable to access photo library. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    setError(null);
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Camera Not Available',
        'Camera is not available on web. Please select a photo from your files.',
        [
          { text: 'Select File', onPress: pickFromLibrary },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Check if camera permission is granted
    if (!cameraPermission?.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is required to take photos. Please grant permission in your device settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('📷 Opening camera...');
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log('❌ Camera ref not available');
      setError('Camera not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📸 Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: quality,
        base64: false,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        console.log('✅ Picture taken successfully');
        setShowCamera(false);
        onImageSelected(photo.uri);
        setError(null);
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (error) {
      console.error('❌ Error taking picture:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to take photo: ${errorMessage}`);
      Alert.alert('Camera Error', 'Failed to take picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            onImageRemoved();
            setError(null);
          }
        }
      ]
    );
  };

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <TouchableOpacity
        style={[
          styles.imageContainer,
          currentImage && styles.imageContainerWithImage,
          error && styles.imageContainerError
        ]}
        onPress={openImagePicker}
        activeOpacity={0.8}
        disabled={loading}
        onPressIn={() => setOverlayVisible(true)}
        onPressOut={() => setOverlayVisible(false)}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : currentImage ? (
          <>
            <Image source={{ uri: currentImage }} style={styles.image} />
            <View style={[styles.imageOverlay, overlayVisible && { opacity: 1 }] }>
              <ImageIcon size={24} color={Colors.cardBackground} />
              <Text style={styles.overlayText}>Change Photo</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon size={32} color={Colors.textLight} />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {currentImage && !loading && (
        <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
          <Trash2 size={16} color={Colors.error} />
          <Text style={styles.removeButtonText}>Remove Photo</Text>
        </TouchableOpacity>
      )}

      {/* Camera Modal */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showCamera}
          animationType="slide"
          onRequestClose={() => setShowCamera(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.cameraContainer}>
            {/* Camera View - NO CHILDREN */}
            <CameraView style={styles.camera} ref={cameraRef} />
            
            {/* Camera Controls - Positioned Absolutely */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>

            {/* Loading Overlay for Camera */}
            {loading && (
              <View style={styles.cameraLoadingOverlay}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.cameraLoadingText}>Taking photo...</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainerWithImage: {
    borderStyle: 'solid',
    borderColor: Colors.primary,
  },
  imageContainerError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}05`,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  overlayText: {
    color: Colors.cardBackground,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.error,
    lineHeight: 20,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
  },
  removeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.error,
    marginLeft: 4,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.cardBackground,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    backgroundColor: Colors.cardBackground,
    borderRadius: 30,
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  cameraLoadingText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
});

export default ImagePicker;