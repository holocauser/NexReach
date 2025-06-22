import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.text}>
            We collect the following types of information to provide and improve our business card scanning service:
          </Text>
          <Text style={styles.bulletPoint}>• Camera data (business card images you scan)</Text>
          <Text style={styles.bulletPoint}>• Contact information (from scanned business cards)</Text>
          <Text style={styles.bulletPoint}>• User profile data (name, email, company)</Text>
          <Text style={styles.bulletPoint}>• Location data (if enabled, to find nearby networking events)</Text>
          <Text style={styles.bulletPoint}>• Device information (for app functionality and security)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.text}>We use your information to:</Text>
          <Text style={styles.bulletPoint}>• Process and digitize business card images</Text>
          <Text style={styles.bulletPoint}>• Create and manage your digital contact list</Text>
          <Text style={styles.bulletPoint}>• Provide networking and event features</Text>
          <Text style={styles.bulletPoint}>• Improve our app functionality and user experience</Text>
          <Text style={styles.bulletPoint}>• Ensure app security and prevent fraud</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Sharing</Text>
          <Text style={styles.text}>We share your data with:</Text>
          <Text style={styles.bulletPoint}>• Supabase (database hosting and authentication)</Text>
          <Text style={styles.bulletPoint}>• Google (authentication services)</Text>
          <Text style={styles.bulletPoint}>• Apple (authentication services, iOS only)</Text>
          <Text style={styles.text}>
            We do not sell, rent, or share your personal information with third-party advertisers or marketers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.text}>
            • Business card data: Retained for 2 years or until you delete it{'\n'}
            • User profile data: Retained until you delete your account{'\n'}
            • Location data: Retained for 1 year or until you disable location services{'\n'}
            • Analytics data: Retained for 2 years in anonymized form
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.text}>You have the right to:</Text>
          <Text style={styles.bulletPoint}>• Access all data we have about you</Text>
          <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
          <Text style={styles.bulletPoint}>• Delete your account and all associated data</Text>
          <Text style={styles.bulletPoint}>• Opt-out of data collection (except essential app functionality)</Text>
          <Text style={styles.bulletPoint}>• Export your data in a portable format</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <Text style={styles.bulletPoint}>• All data is encrypted in transit and at rest</Text>
          <Text style={styles.bulletPoint}>• Secure authentication using OAuth 2.0</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
          <Text style={styles.bulletPoint}>• Access controls and monitoring</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.text}>
            Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this privacy policy or our data practices, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: privacy@yourdomain.com</Text>
          <Text style={styles.contactInfo}>Address: [Your Business Address]</Text>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    marginLeft: 16,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
}); 