import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Platform } from 'react-native';
import { Camera, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, X, RotateCcw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, CreditCard as Edit3, Zap } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';

const GOOGLE_VISION_API_KEY = 'AIzaSyDsjOqNqBY6albDBbUb_nTalGvwqeeRQ_A';

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rawText, setRawText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const { addCard } = useCardStore();

  // Use expo-camera permissions directly - no custom screens
  const [permission, requestPermission] = useCameraPermissions();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
      setScanning(false);
    };
  }, []);

  const extractBusinessCardData = (text: string) => {
    console.log('🔍 Processing text:', text);
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log('📝 Lines found:', lines);

    const data = {
      name: '',
      company: '',
      title: '',
      phone: '',
      email: '',
      address: '',
      website: '',
    };

    // Enhanced regex patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const websiteRegex = /(www\.|https?:\/\/)[^\s]+/gi;
    const nameRegex = /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/;
    
    // Common title words to help identify job titles
    const titleWords = ['director', 'manager', 'president', 'ceo', 'cfo', 'attorney', 'lawyer', 'doctor', 'dr', 'md', 'engineer', 'consultant', 'specialist', 'coordinator', 'assistant', 'associate', 'partner', 'founder', 'owner'];
    
    // Process each line
    lines.forEach((line, index) => {
      console.log(`Line ${index}: "${line}"`);
      
      // Email detection
      const emailMatch = line.match(emailRegex);
      if (emailMatch && !data.email) {
        data.email = emailMatch[0];
        console.log('✉️ Found email:', data.email);
      }
      
      // Phone detection
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch && !data.phone) {
        data.phone = line;
        console.log('📞 Found phone:', data.phone);
      }
      
      // Website detection
      const websiteMatch = line.match(websiteRegex);
      if (websiteMatch && !data.website) {
        data.website = websiteMatch[0];
        console.log('🌐 Found website:', data.website);
      }
      
      // Name detection (first proper name found, usually in first few lines)
      if (nameRegex.test(line) && !data.name && index < 4) {
        data.name = line;
        console.log('👤 Found name:', data.name);
      }
      
      // Title detection (contains common job title words)
      if (!data.title && titleWords.some(word => line.toLowerCase().includes(word))) {
        data.title = line;
        console.log('💼 Found title:', data.title);
      }
      
      // Address detection (contains numbers and address keywords)
      if (!data.address && /\d+.*\b(st|street|ave|avenue|rd|road|blvd|boulevard|suite|ste|floor|fl)\b/i.test(line)) {
        data.address = line;
        console.log('🏠 Found address:', data.address);
      }
    });

    // Company detection (more sophisticated)
    if (!data.company) {
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        
        // Skip if it's already identified as something else
        if (line === data.name || line === data.title || line === data.email || 
            line === data.phone || line === data.website || line === data.address) {
          continue;
        }
        
        // Skip if it looks like an address or contains only numbers/symbols
        if (/^\d+$/.test(line) || /^[^a-zA-Z]*$/.test(line)) {
          continue;
        }
        
        // Skip if it's too short or contains common non-company indicators
        if (line.length < 3 || /\b(fax|tel|phone|email|www)\b/i.test(line)) {
          continue;
        }
        
        data.company = line;
        console.log('🏢 Found company:', data.company);
        break;
      }
    }

    // Fallback: extract name from email if no name found
    if (!data.name && data.email) {
      const emailName = data.email.split('@')[0];
      const nameParts = emailName.split(/[._-]/);
      if (nameParts.length >= 2) {
        data.name = nameParts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
        console.log('👤 Extracted name from email:', data.name);
      }
    }

    console.log('📊 Final extracted data:', data);
    return data;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || scanning || !isMounted) return;
    
    setScanning(true);
    
    try {
      console.log('📸 Starting business card scan capture...');
      
      const photo = await cameraRef.current.takePictureAsync({ 
        base64: true,
        quality: 0.9,
        skipProcessing: false
      });
      
      if (!isMounted) return; // Check if component is still mounted
      
      console.log('📸 Business card photo captured, size:', photo.base64?.length);

      const requestBody = {
        requests: [
          {
            image: { content: photo.base64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 }
            ],
            imageContext: {
              languageHints: ['en']
            }
          },
        ],
      };

      console.log('🚀 Sending business card to Google Vision API...');

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!isMounted) return; // Check if component is still mounted

      console.log('📡 Business card scan response status:', response.status);
      
      const data = await response.json();
      console.log('📡 Full business card scan API response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ Business card scan API Error:', data);
        throw new Error(data.error?.message || `API Error: ${response.status}`);
      }

      const apiResponse = data.responses?.[0];
      
      if (apiResponse?.error) {
        console.error('❌ Business card scan Vision API Error:', apiResponse.error);
        throw new Error(apiResponse.error.message);
      }

      const detectedText = apiResponse?.fullTextAnnotation?.text;
      
      console.log('📝 Raw detected business card text:', detectedText);
      
      if (!detectedText || detectedText.trim().length === 0) {
        if (isMounted) {
          Alert.alert(
            'No Text Detected', 
            'Please ensure the business card is well-lit, clearly visible, and try again. Make sure there is text on the card.'
          );
        }
        return;
      }

      if (isMounted) {
        setRawText(detectedText);
        const extractedInfo = extractBusinessCardData(detectedText);
        setExtractedData(extractedInfo);
        setShowPreview(true);
      }
      
    } catch (error) {
      console.error('❌ Business card scan error:', error);
      
      if (isMounted) {
        let errorMessage = 'Unable to process the business card. ';
        
        if (error.message.includes('API_KEY_INVALID')) {
          errorMessage += 'API key is invalid.';
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          errorMessage += 'API quota exceeded.';
        } else if (error.message.includes('Network')) {
          errorMessage += 'Please check your internet connection.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        Alert.alert('Scan Failed', errorMessage);
      }
    } finally {
      if (isMounted) {
        setScanning(false);
      }
    }
  };

  const handleSaveCard = () => {
    if (!extractedData) return;
    
    // Validate that we have at least some meaningful data
    const hasData = extractedData.name || extractedData.email || extractedData.phone || extractedData.company;
    
    if (!hasData) {
      Alert.alert('No Data', 'Please ensure at least one field has data before saving.');
      return;
    }
    
    const newCard = {
      id: Math.random().toString(36).substring(2, 11),
      ...extractedData,
      specialty: [],
      languages: ['English'],
      tags: ['Scanned'],
      notes: 'Added via business card scan',
      favorited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addCard(newCard);
    
    Alert.alert('Success', 'Business card saved successfully!', [
      { text: 'OK', onPress: () => handleGoBack() }
    ]);
  };

  const handleRetry = () => {
    setShowPreview(false);
    setExtractedData(null);
    setRawText('');
    setEditMode(false);
  };

  const handleGoBack = () => {
    // Clean up state before navigating back
    setScanning(false);
    setShowPreview(false);
    setExtractedData(null);
    setRawText('');
    setEditMode(false);
    router.back();
  };

  const updateField = (field: string, value: string) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle permission states - let expo-camera handle everything natively
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <CameraIcon size={64} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan business cards and extract contact information automatically.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview screen
  if (showPreview && extractedData) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={handleRetry} style={styles.headerButton}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Review Scanned Data</Text>
          <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.headerButton}>
            <Edit3 size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.previewContent}>
          <View style={styles.dataCard}>
            <View style={styles.dataHeader}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={styles.dataTitle}>Extracted Information</Text>
            </View>
            
            {Object.entries(extractedData).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={styles.dataLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </Text>
                {editMode ? (
                  <TextInput
                    style={styles.editInput}
                    value={value}
                    onChangeText={(text) => updateField(key, text)}
                    placeholder={`Enter ${key}`}
                    placeholderTextColor={Colors.textLight}
                  />
                ) : (
                  <Text style={styles.dataValue}>{value || 'Not detected'}</Text>
                )}
              </View>
            ))}
          </View>
          
          {rawText && (
            <View style={styles.rawTextCard}>
              <Text style={styles.rawTextTitle}>Raw Detected Text:</Text>
              <Text style={styles.rawTextContent}>{rawText}</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveCard}>
            <Text style={styles.saveButtonText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera screen - DEDICATED FOR BUSINESS CARD SCANNING ONLY
  return (
    <View style={styles.container}>
      {/* Camera View - NO CHILDREN */}
      <Camera
        style={styles.camera}
        type={facing}
        ref={cameraRef}
        onCameraReady={() => console.log('📷 Business card scanning camera ready')}
        flashMode={flash ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      />
      
      {/* Header Controls - Positioned Absolutely */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
          <X size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Overlay - Positioned Absolutely */}
      <View style={styles.overlay}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Position the business card within the frame
          </Text>
          <Text style={styles.instructionSubtext}>
            Ensure good lighting and the card is flat
          </Text>
        </View>
        
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        
        {scanning && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.scanningText}>Scanning business card...</Text>
            <Text style={styles.scanningSubtext}>Processing image with AI</Text>
          </View>
        )}
      </View>

      {/* Camera Controls - Positioned Absolutely */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          disabled={scanning}
        >
          <RotateCcw size={24} color={scanning ? Colors.textLight : Colors.white} />
        </TouchableOpacity>

        {/* Flash toggle button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setFlash(f => !f)}
          disabled={scanning}
        >
          <Zap size={24} color={flash ? Colors.warning : Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, scanning && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={scanning}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <View style={styles.controlButton} />
      </View>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  backButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    zIndex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 120,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionSubtext: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  scanFrame: {
    width: 320,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.white,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  scanningSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
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
    borderColor: Colors.white,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    backgroundColor: Colors.white,
    borderRadius: 30,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  previewContent: {
    flex: 1,
    padding: 16,
  },
  dataCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dataTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  dataRow: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  editInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  rawTextCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  rawTextTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  rawTextContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  retryButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
});