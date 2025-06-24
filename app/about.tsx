import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Ionicons name="business" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>ScanCard</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your complete business networking and event management solution
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="qr-code" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Business Card Scanning</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Event Management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Referral Tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Payment Processing</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>support@scancard.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="globe" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>www.scancard.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => router.push('/privacy-policy')}
            >
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.legalLink}
              onPress={() => router.push('/terms-of-service')}
            >
              <Text style={styles.legalLinkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 ScanCard. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  featureList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contactInfo: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  legalLinks: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legalLinkText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
}); 