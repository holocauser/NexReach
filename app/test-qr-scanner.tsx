import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { QRCodeGenerator } from '@/utils/qrCodeGenerator';
import Colors from '@/constants/Colors';

export default function TestQRScannerScreen() {
  const router = useRouter();
  const [testScenarios, setTestScenarios] = useState(() => QRCodeGenerator.generateTestScenarios());

  const copyToClipboard = (text: string, name: string) => {
    // In a real app, you'd use expo-clipboard
    Alert.alert(
      'QR Code Data',
      `${name}:\n\n${text}\n\nCopy this data and use an online QR code generator to create a QR code for testing.`,
      [
        { text: 'OK' },
        { 
          text: 'Copy', 
          onPress: () => {
            // You can implement clipboard functionality here
            Alert.alert('Copied!', 'QR code data copied to clipboard');
          }
        }
      ]
    );
  };

  const generateNewScenarios = () => {
    setTestScenarios(QRCodeGenerator.generateTestScenarios());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Scanner Test</Text>
        <TouchableOpacity onPress={generateNewScenarios} style={styles.headerButton}>
          <Ionicons name="refresh" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="qr-code" size={48} color={Colors.primary} />
          <Text style={styles.infoTitle}>QR Scanner Testing</Text>
          <Text style={styles.infoSubtitle}>
            Use these test QR codes to validate your scanner implementation
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionsText}>
            1. Tap on any QR code data below{'\n'}
            2. Copy the data to clipboard{'\n'}
            3. Go to qr-code-generator.com{'\n'}
            4. Paste the data and generate QR code{'\n'}
            5. Display QR code on another device{'\n'}
            6. Test scanning in your app
          </Text>
        </View>

        <View style={styles.scenariosContainer}>
          <Text style={styles.sectionTitle}>Test QR Codes</Text>
          
          {testScenarios.map((scenario, index) => (
            <TouchableOpacity
              key={index}
              style={styles.scenarioItem}
              onPress={() => copyToClipboard(scenario.qrData, scenario.name)}
            >
              <View style={styles.scenarioHeader}>
                <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
                <Text style={styles.scenarioName}>{scenario.name}</Text>
                <Ionicons name="copy-outline" size={20} color={Colors.textSecondary} />
              </View>
              <Text style={styles.scenarioData} numberOfLines={2}>
                {scenario.qrData}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/organizer/scan-tickets')}
          >
            <Ionicons name="scan" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Go to Scanner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scenariosContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  scenarioItem: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  scenarioData: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Menlo',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 6,
  },
  actions: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 