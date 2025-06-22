import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput, Platform, Button } from 'react-native';
import { Camera, CameraType, useCameraPermissions, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, X, RotateCcw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, CreditCard as Edit3, Zap } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore'; // Make sure this is the persistent store with AsyncStorage
import Modal from 'react-native-modal';
import { v4 as uuidv4 } from 'uuid';
import { useScanPerformance } from '@/hooks/useScanPerformance';

const GOOGLE_VISION_API_KEY = 'AIzaSyDsjOqNqBY6albDBbUb_nTalGvwqeeRQ_A';

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const { addCard } = useCardStore();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { startScan, endScan, resetMetrics } = useScanPerformance();

  // Use expo-camera permissions directly - no custom screens
  const [permission, requestPermission] = useCameraPermissions();

  // Memoized regex patterns for better performance
  const regexPatterns = useMemo(() => ({
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    website: /(www\.|https?:\/\/)[^\s]+/gi,
    // Improved name patterns to catch more variations
    name: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/, // Original pattern
    nameSimple: /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Simple two-word names
    nameWithMiddle: /^[A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+$/, // Names with middle initial
    nameWithHyphen: /^[A-Z][a-z]+-[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/, // Hyphenated names
    nameWithApostrophe: /^[A-Z][a-z]+'[a-z]+\s+[A-Z][a-z]+$/, // Names with apostrophes
    nameWithTitle: /^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Miss)\s+[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+$/, // Names with titles
    nameWithSuffix: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+\s+(Jr\.|Sr\.|II|III|IV|V)$/, // Names with suffixes
    nameWithNumbers: /^[A-Z][a-z]+(\s+[A-Z][a-z]*\.?)+\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/, // Names with Roman numerals
    // ALL CAPS name patterns
    nameAllCaps: /^[A-Z]+\s+[A-Z]+$/, // Simple ALL CAPS names (e.g., "MELISSA HIDALGO")
    nameAllCapsWithMiddle: /^[A-Z]+\s+[A-Z]\s+[A-Z]+$/, // ALL CAPS with middle initial
    nameAllCapsWithTitle: /^(DR|PROF|MR|MRS|MS|MISS)\s+[A-Z]+\s+[A-Z]+$/, // ALL CAPS with titles
    address: /\d+.*\b(st|street|ave|avenue|rd|road|blvd|boulevard|suite|ste|floor|fl)\b/i,
    numbersOnly: /^\d+$/,
    nonLetters: /^[^a-zA-Z]*$/,
    nonCompany: /\b(fax|tel|phone|email|www)\b/i
  }), []);

  // Memoized title words
  const titleWords = useMemo(() => [
    'director', 'manager', 'president', 'ceo', 'cfo', 'attorney', 'lawyer', 
    'doctor', 'dr', 'md', 'engineer', 'consultant', 'specialist', 'coordinator', 
    'assistant', 'associate', 'partner', 'founder', 'owner'
  ], []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
      setScanning(false);
      setProcessing(false);
    };
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(f => !f);
  }, []);

  // Optimize camera performance
  const cameraReady = useCallback(() => {
    console.log('📷 Business card scanning camera ready');
  }, []);

  const extractBusinessCardData = useCallback((text: string) => {
    console.log('🔍 Processing text:', text);
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log('📝 Lines found:', lines);

    const data: any = {
      name: '',
      company: '',
      title: '',
      phones: [] as string[],
      email: '',
      addresses: [] as string[],
      website: '',
    };

    console.log('🔍 Initial data structure:', data);

    // Process each line with optimized patterns
    let detectedLogo = ''; // Track logo separately
    
    lines.forEach((line, index) => {
      console.log(`Line ${index}: "${line}"`);
      
      // Logo detection (short words that appear early, likely logos)
      if (index < 3 && line.length <= 6 && line.split(' ').length === 1 && 
          /^[A-Za-z]+$/.test(line) && !detectedLogo) {
        detectedLogo = line;
        console.log('🏷️ Found logo:', detectedLogo);
      }
      
      // Email detection
      const emailMatch = line.match(regexPatterns.email);
      if (emailMatch && !data.email) {
        data.email = emailMatch[0];
        console.log('✉️ Found email:', data.email);
      }
      
      // Phone detection (collect up to 3 unique phone numbers)
      const phoneMatches = line.match(regexPatterns.phone);
      if (phoneMatches) {
        phoneMatches.forEach((match: string) => {
          if ((data.phones || []).length < 3 && !(data.phones || []).includes(match)) {
            data.phones.push(match);
            console.log('📞 Found phone:', match);
          }
        });
      }
      
      // Website detection
      const websiteMatch = line.match(regexPatterns.website);
      if (websiteMatch && !data.website) {
        data.website = websiteMatch[0];
        console.log('🌐 Found website:', data.website);
      }
      
      // Name detection (multiple strategies for better coverage)
      if (!data.name && index < 4) {
        // Strategy 1: Try original pattern
        if (regexPatterns.name.test(line)) {
          data.name = line;
          console.log('👤 Found name (original pattern):', data.name);
        }
        // Strategy 2: Try simple two-word pattern
        else if (regexPatterns.nameSimple.test(line)) {
          data.name = line;
          console.log('👤 Found name (simple pattern):', data.name);
        }
        // Strategy 3: Try name with middle initial
        else if (regexPatterns.nameWithMiddle.test(line)) {
          data.name = line;
          console.log('👤 Found name (with middle):', data.name);
        }
        // Strategy 4: Try hyphenated names
        else if (regexPatterns.nameWithHyphen.test(line)) {
          data.name = line;
          console.log('👤 Found name (hyphenated):', data.name);
        }
        // Strategy 5: Try names with apostrophes
        else if (regexPatterns.nameWithApostrophe.test(line)) {
          data.name = line;
          console.log('👤 Found name (with apostrophe):', data.name);
        }
        // Strategy 6: Try names with titles
        else if (regexPatterns.nameWithTitle.test(line)) {
          data.name = line;
          console.log('👤 Found name (with title):', data.name);
        }
        // Strategy 7: Try names with suffixes
        else if (regexPatterns.nameWithSuffix.test(line)) {
          data.name = line;
          console.log('👤 Found name (with suffix):', data.name);
        }
        // Strategy 8: Try names with Roman numerals
        else if (regexPatterns.nameWithNumbers.test(line)) {
          data.name = line;
          console.log('👤 Found name (with numbers):', data.name);
        }
        // Strategy 9: Try ALL CAPS names
        else if (regexPatterns.nameAllCaps.test(line)) {
          data.name = line;
          console.log('👤 Found name (ALL CAPS):', data.name);
        }
        // Strategy 10: Try ALL CAPS with middle initial
        else if (regexPatterns.nameAllCapsWithMiddle.test(line)) {
          data.name = line;
          console.log('👤 Found name (ALL CAPS with middle):', data.name);
        }
        // Strategy 11: Try ALL CAPS with titles
        else if (regexPatterns.nameAllCapsWithTitle.test(line)) {
          data.name = line;
          console.log('👤 Found name (ALL CAPS with title):', data.name);
        }
        // Strategy 12: Fallback - look for lines that look like names but don't match other patterns
        else if (
          line.length >= 4 && 
          line.length <= 50 && 
          /^[A-Z][a-z]/.test(line) && // Starts with capital letter
          !regexPatterns.email.test(line) && // Not an email
          !regexPatterns.phone.test(line) && // Not a phone number
          !regexPatterns.website.test(line) && // Not a website
          !regexPatterns.address.test(line) && // Not an address
          !titleWords.some(word => line.toLowerCase().includes(word)) && // Not a title
          /^[A-Za-z\s\-'\.]+$/.test(line) && // Only letters, spaces, hyphens, apostrophes, periods
          (line.split(' ').length >= 2 && line.split(' ').length <= 4) // 2-4 words
        ) {
          data.name = line;
          console.log('👤 Found name (fallback pattern):', data.name);
        }
      }
      
      // Title detection (contains common job title words)
      if (!data.title && titleWords.some(word => line.toLowerCase().includes(word))) {
        data.title = line;
        console.log('💼 Found title:', data.title);
      }
      
      // Address detection (collect up to 2 unique addresses)
      if ((data.addresses || []).length < 2 && regexPatterns.address.test(line)) {
        if (!data.addresses.includes(line)) {
          data.addresses.push(line);
          console.log('🏠 Found address:', line);
        }
      }
    });

    // Company detection (more sophisticated)
    if (!data.company) {
      for (let i = 0; i < Math.min((lines || []).length, 5); i++) {
        const line = lines[i];
        
        // Skip if it's already identified as something else
        if (line === data.name || line === data.title || line === data.email || 
            line === data.phones[0] || line === data.phones[1] || line === data.phones[2] || 
            line === data.website || line === data.addresses[0] || line === data.addresses[1] ||
            line === detectedLogo) {
          continue;
        }
        
        // Skip if it looks like an address or contains only numbers/symbols
        if (regexPatterns.numbersOnly.test(line) || regexPatterns.nonLetters.test(line)) {
          continue;
        }
        
        // Skip if it's too short or contains common non-company indicators
        if (line.length < 3 || regexPatterns.nonCompany.test(line)) {
          continue;
        }
        
        // Skip very short words that are likely logos or abbreviations (like "MAM")
        if (line.length <= 4 && line.split(' ').length === 1) {
          console.log('🏢 Skipping short logo/abbreviation:', line);
          continue;
        }
        
        // Prefer longer, more descriptive company names over short ones
        // This will prioritize "THE INJURY ASSISTANCE LAW FIRM" over "MAM"
        if (!data.company || line.length > data.company.length) {
          data.company = line;
          console.log('🏢 Found company:', data.company);
        }
      }
    }

    // Secondary name detection: if no name found in first 4 lines, search all lines
    if (!data.name) {
      console.log('🔍 No name found in first 4 lines, searching all lines...');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip if already identified as something else
        if (line === data.title || line === data.email || 
            line === data.phones[0] || line === data.phones[1] || line === data.phones[2] || 
            line === data.website || line === data.addresses[0] || line === data.addresses[1] ||
            line === data.company || line === detectedLogo) {
          continue;
        }
        
        // Try all name patterns
        if (regexPatterns.name.test(line) || 
            regexPatterns.nameSimple.test(line) ||
            regexPatterns.nameWithMiddle.test(line) ||
            regexPatterns.nameWithHyphen.test(line) ||
            regexPatterns.nameWithApostrophe.test(line) ||
            regexPatterns.nameWithTitle.test(line) ||
            regexPatterns.nameWithSuffix.test(line) ||
            regexPatterns.nameWithNumbers.test(line) ||
            regexPatterns.nameAllCaps.test(line) ||
            regexPatterns.nameAllCapsWithMiddle.test(line) ||
            regexPatterns.nameAllCapsWithTitle.test(line)) {
          data.name = line;
          console.log(`👤 Found name in line ${i} (secondary search):`, data.name);
          break;
        }
        
        // Fallback pattern for secondary search
        if (
          line.length >= 4 && 
          line.length <= 50 && 
          /^[A-Z][a-z]/.test(line) && // Starts with capital letter
          !regexPatterns.email.test(line) && // Not an email
          !regexPatterns.phone.test(line) && // Not a phone number
          !regexPatterns.website.test(line) && // Not a website
          !regexPatterns.address.test(line) && // Not an address
          !titleWords.some(word => line.toLowerCase().includes(word)) && // Not a title
          /^[A-Za-z\s\-'\.]+$/.test(line) && // Only letters, spaces, hyphens, apostrophes, periods
          (line.split(' ').length >= 2 && line.split(' ').length <= 4) // 2-4 words
        ) {
          data.name = line;
          console.log(`👤 Found name in line ${i} (secondary fallback):`, data.name);
          break;
        }
      }
    }

    // Fallback: extract name from email if no name found
    if (!data.name && data.email) {
      const emailName = data.email.split('@')[0];
      
      // Try different patterns for email name extraction
      let nameParts: string[] = [];
      
      // Pattern 1: dot separated (john.doe)
      if (emailName.includes('.')) {
        nameParts = emailName.split('.');
      }
      // Pattern 2: underscore separated (john_doe)
      else if (emailName.includes('_')) {
        nameParts = emailName.split('_');
      }
      // Pattern 3: hyphen separated (john-doe)
      else if (emailName.includes('-')) {
        nameParts = emailName.split('-');
      }
      // Pattern 4: camelCase (johnDoe)
      else if (/[a-z][A-Z]/.test(emailName)) {
        nameParts = emailName.split(/(?=[A-Z])/);
      }
      // Pattern 5: just lowercase (johndoe)
      else {
        // Try to split at reasonable points
        const matches = emailName.match(/[a-z]+/g);
        if (matches && matches.length >= 2) {
          nameParts = matches;
        }
      }
      
      if (nameParts.length >= 2) {
        data.name = nameParts.map((part: string) => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
        console.log('👤 Extracted name from email:', data.name);
      }
    }

    // Assign phones and addresses arrays to data
    data.phones = (data.phones || []).slice(0, 3);
    data.addresses = (data.addresses || []).slice(0, 2);
    // Remove old data.address
    delete data.address;

    // Ensure name field exists and is properly set
    if (!data.name) {
      data.name = '';
    }

    console.log('📊 Final extracted data:', data);
    console.log('📊 Name field in final data:', data.name);
    console.log('📊 Name field type:', typeof data.name);
    return data;
  }, [regexPatterns, titleWords]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || scanning || !isMounted) return;
    
    setScanning(true);
    startScan();
    const scanStartTime = Date.now();
    let captureTime = 0;
    let photo: any = null;
    
    try {
      console.log('📸 Starting business card scan capture...');
      
      photo = await cameraRef.current.takePictureAsync({ 
        base64: true,
        quality: 0.8, // Reduced from 0.9 for faster processing
        skipProcessing: true, // Skip processing for faster capture
        exif: false, // Disable EXIF data to reduce payload
        width: 1920, // Set max width for consistent processing
        height: 1080, // Set max height for consistent processing
      });
      
      if (!isMounted) return; // Check if component is still mounted
      
      captureTime = Date.now() - scanStartTime;
      console.log('📸 Business card photo captured, size:', photo.base64?.length);

      // Switch to processing state
      setProcessing(true);
      const processingStartTime = Date.now();

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

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId); // Clear timeout if request completes

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
        const processingTime = Date.now() - processingStartTime;
        endScan(captureTime, processingTime, photo.base64?.length || 0, false, 'No text detected');
        return;
      }

      if (isMounted) {
        setRawText(detectedText);
        const extractedInfo = extractBusinessCardData(detectedText);
        console.log('🔍 Extracted info before setting state:', extractedInfo);
        console.log('🔍 Name field value:', extractedInfo.name);
        console.log('🔍 Name field type:', typeof extractedInfo.name);
        setExtractedData(extractedInfo);
        setShowPreview(true);
        
        const processingTime = Date.now() - processingStartTime;
        endScan(captureTime, processingTime, photo.base64?.length || 0, true);
      }
      
    } catch (error) {
      console.error('❌ Business card scan error:', error);
      if (captureTime === 0) {
        captureTime = Date.now() - scanStartTime;
      }
      const processingTime = Date.now() - (scanStartTime + captureTime);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      endScan(captureTime, processingTime, photo?.base64?.length || 0, false, errorMessage);
      
      if (isMounted) {
        let errorMessage = 'Unable to process the business card. ';
        const err = error as Error;
        
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (err.message && err.message.includes('API_KEY_INVALID')) {
          errorMessage += 'API key is invalid.';
        } else if (err.message && err.message.includes('QUOTA_EXCEEDED')) {
          errorMessage += 'API quota exceeded.';
        } else if (err.message && err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage += 'Please try again.';
        }
        Alert.alert('Scan Failed', errorMessage);
      }
    } finally {
      if (isMounted) {
        setScanning(false);
        setProcessing(false);
      }
    }
  }, [scanning, isMounted, extractBusinessCardData, startScan, endScan]);

  const handleSaveCard = useCallback(async () => {
    if (!extractedData) {
      console.log('No extractedData');
      return;
    }
    // Validate that we have at least some meaningful data
    const hasData = extractedData.name || extractedData.email || (Array.isArray(extractedData.phones) && (extractedData.phones || []).length > 0) || extractedData.company;
    if (!hasData) {
      Alert.alert('No Data', 'Please ensure at least one field has data before saving.');
      return;
    }
    // If name is missing, prompt for it
    if (!extractedData.name || extractedData.name.trim() === '') {
      setShowNamePrompt(true);
      return;
    }
    const newCard = {
      id: uuidv4(),
      ...extractedData,
      phones: Array.isArray(extractedData.phones) ? extractedData.phones : [],
      addresses: Array.isArray(extractedData.addresses) ? extractedData.addresses : [],
      specialty: [],
      languages: [],
      tags: [],
      notes: 'Added via business card scan',
      favorited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('Attempting to add card:', newCard);
    
    try {
      await addCard(newCard);
      Alert.alert('Success', 'Business card saved successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save business card. Please try again.');
    }
  }, [extractedData, addCard, router]);

  const handleNamePromptSave = useCallback(async () => {
    console.log('handleNamePromptSave called');
    if (!nameInput.trim()) return;
    const newCard = {
      id: uuidv4(),
      ...extractedData,
      name: nameInput.trim(),
      phones: Array.isArray(extractedData.phones) ? extractedData.phones : [],
      addresses: Array.isArray(extractedData.addresses) ? extractedData.addresses : [],
      specialty: [],
      languages: [],
      tags: [],
      notes: 'Added via business card scan',
      favorited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await addCard(newCard);
      setShowNamePrompt(false);
      setNameInput('');
      Alert.alert('Success', 'Business card saved successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save business card. Please try again.');
    }
  }, [nameInput, extractedData, addCard, router]);

  const handleRetry = useCallback(() => {
    setShowPreview(false);
    setExtractedData(null);
    setRawText('');
    resetMetrics();
  }, [resetMetrics]);

  const handleGoBack = useCallback(() => {
    // Clean up state before navigating back
    setScanning(false);
    setShowPreview(false);
    setExtractedData(null);
    setRawText('');
    resetMetrics();
    router.back();
  }, [router, resetMetrics]);

  // Debug extracted data changes
  useEffect(() => {
    if (extractedData) {
      console.log('🔍 Extracted data changed:', extractedData);
      console.log('🔍 Name field value:', extractedData.name);
      console.log('🔍 Name field type:', typeof extractedData.name);
      console.log('🔍 Object.entries result:', Object.entries(extractedData));
    }
  }, [extractedData]);

  const updateField = useCallback((field: string, value: string | string[]) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Permission loading state
  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera permission is required.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  // Preview screen
  if (showPreview && extractedData) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={handleRetry} style={styles.headerButton}>
            <X size={24} color={Colors.cardBackground} />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Review Scanned Data</Text>
          <View style={styles.headerButton} />
        </View>
        
        <ScrollView style={styles.previewContent}>
          <View style={styles.dataCard}>
            <View style={styles.dataHeader}>
              <CheckCircle size={24} color={Colors.success} />
              <Text style={styles.dataTitle}>Extracted Information</Text>
            </View>
            
            {Object.entries(extractedData).map(([key, value]) => {
              // Always render TextInput for direct editing
              if (key === 'addresses' || key === 'phones') {
                return (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    {Array.isArray(value) && value.length > 0 ? (
                      value.map((item: any, idx: number) => (
                        <TextInput
                          key={idx}
                          style={styles.editInput}
                          value={typeof item === 'object' ? item.number || item.address : item}
                          onChangeText={(text) => {
                            const updatedValues = [...value];
                            if (typeof updatedValues[idx] === 'object') {
                              if (key === 'phones') updatedValues[idx].number = text;
                              if (key === 'addresses') updatedValues[idx].address = text;
                            } else {
                              updatedValues[idx] = text;
                            }
                            updateField(key, updatedValues);
                          }}
                          placeholder={`Enter ${key.slice(0, -1)} ${idx + 1}`}
                          placeholderTextColor={Colors.textLight}
                        />
                      ))
                    ) : (
                      <TextInput
                        style={styles.editInput}
                        value=""
                        onChangeText={(text) => updateField(key, [text])}
                        placeholder={`Enter ${key.slice(0, -1)}`}
                        placeholderTextColor={Colors.textLight}
                      />
                    )}
                  </View>
                );
              }
              
              return (
                <View key={key} style={styles.dataRow}>
                  <Text style={styles.dataLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </Text>
                  <TextInput
                    style={styles.editInput}
                    value={typeof value === 'string' ? value : ''}
                    onChangeText={(text) => updateField(key, text)}
                    placeholder={`Enter ${key}`}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
        
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveCard}>
            <Text style={styles.saveButtonText}>Save Contact</Text>
          </TouchableOpacity>
        </View>

        <Modal isVisible={showNamePrompt} onBackdropPress={() => setShowNamePrompt(false)}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Name not detected</Text>
            <Text style={{ marginBottom: 12 }}>Please enter a name for this contact:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 16 }}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter name"
              autoFocus
            />
            <Button title="Save Contact" onPress={handleNamePromptSave} disabled={!nameInput.trim()} />
          </View>
        </Modal>
      </View>
    );
  }

  // Camera screen - DEDICATED FOR BUSINESS CARD SCANNING ONLY
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing={facing}
        flash={flash ? 'on' : 'off'}
        onCameraReady={cameraReady}
        style={styles.camera}
      />
      
      {/* Header Controls - Positioned Absolutely */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
          <X size={24} color={Colors.cardBackground} />
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
            <ActivityIndicator size="large" color={Colors.cardBackground} />
            <Text style={styles.scanningText}>
              {processing ? 'Processing image...' : 'Capturing image...'}
            </Text>
            <Text style={styles.scanningSubtext}>
              {processing ? 'Analyzing text with AI' : 'Please hold steady'}
            </Text>
          </View>
        )}
      </View>

      {/* Camera Controls - Positioned Absolutely */}
      <View style={styles.controls}>
        {/* Flash toggle button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleFlash}
          disabled={scanning}
        >
          <Zap size={24} color={flash ? Colors.warning : Colors.cardBackground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, scanning && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={scanning}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
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
    color: Colors.cardBackground,
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
    color: Colors.cardBackground,
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
    color: Colors.cardBackground,
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
    borderColor: Colors.cardBackground,
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
    color: Colors.cardBackground,
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
    borderColor: Colors.cardBackground,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    backgroundColor: Colors.cardBackground,
    borderRadius: 30,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: Colors.cardBackground,
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
    backgroundColor: Colors.cardBackground,
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
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.cardBackground,
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
    color: Colors.cardBackground,
  },
});