import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          <Text style={styles.text}>
            By downloading, installing, or using our business card scanning app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description of Service</Text>
          <Text style={styles.text}>
            Our app provides business card scanning, contact management, and networking features. The service includes:
          </Text>
          <Text style={styles.bulletPoint}>• Business card scanning and digitization</Text>
          <Text style={styles.bulletPoint}>• Contact management and organization</Text>
          <Text style={styles.bulletPoint}>• Networking event discovery</Text>
          <Text style={styles.bulletPoint}>• Professional profile management</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptable Use</Text>
          <Text style={styles.text}>You agree to use our app only for legitimate business purposes:</Text>
          <Text style={styles.bulletPoint}>• Scan only business cards you have permission to digitize</Text>
          <Text style={styles.bulletPoint}>• Use the app for professional networking purposes</Text>
          <Text style={styles.bulletPoint}>• Respect others' privacy and data rights</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>
          <Text style={styles.text}>
            You may not use our app to:
          </Text>
          <Text style={styles.bulletPoint}>• Scan cards without permission</Text>
          <Text style={styles.bulletPoint}>• Harass, spam, or abuse other users</Text>
          <Text style={styles.bulletPoint}>• Violate intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to our systems</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Responsibilities</Text>
          <Text style={styles.text}>As a user, you are responsible for:</Text>
          <Text style={styles.bulletPoint}>• Providing accurate and up-to-date information</Text>
          <Text style={styles.bulletPoint}>• Maintaining the security of your account</Text>
          <Text style={styles.bulletPoint}>• Respecting the privacy of scanned contact information</Text>
          <Text style={styles.bulletPoint}>• Reporting any security concerns or violations</Text>
          <Text style={styles.bulletPoint}>• Complying with data protection laws</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Ownership</Text>
          <Text style={styles.text}>
            • You retain ownership of your personal data and scanned business cards{'\n'}
            • We process your data to provide our services{'\n'}
            • You can export, modify, or delete your data at any time{'\n'}
            • We do not claim ownership of your contact information
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intellectual Property</Text>
          <Text style={styles.text}>
            • Our app, software, and content are protected by intellectual property laws{'\n'}
            • You retain rights to your user-generated content{'\n'}
            • You may not copy, modify, or distribute our app without permission{'\n'}
            • Third-party content (like business cards) belongs to their respective owners
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Availability</Text>
          <Text style={styles.text}>
            We strive to provide reliable service but cannot guarantee:
          </Text>
          <Text style={styles.bulletPoint}>• 100% uptime or availability</Text>
          <Text style={styles.bulletPoint}>• Perfect accuracy of OCR scanning</Text>
          <Text style={styles.bulletPoint}>• Compatibility with all devices or operating systems</Text>
          <Text style={styles.bulletPoint}>• Uninterrupted access to all features</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.text}>
            To the maximum extent permitted by law:
          </Text>
          <Text style={styles.bulletPoint}>• Our app is provided "as is" without warranties</Text>
          <Text style={styles.bulletPoint}>• We are not liable for indirect, incidental, or consequential damages</Text>
          <Text style={styles.bulletPoint}>• Our total liability is limited to the amount you paid for our service</Text>
          <Text style={styles.bulletPoint}>• We are not responsible for third-party actions or content</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy and Data Protection</Text>
          <Text style={styles.text}>
            Your privacy is important to us. Our data practices are governed by our Privacy Policy, which is incorporated into these Terms of Service by reference.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Termination</Text>
          <Text style={styles.text}>
            We may terminate or suspend your account if you:
          </Text>
          <Text style={styles.bulletPoint}>• Violate these Terms of Service</Text>
          <Text style={styles.bulletPoint}>• Engage in fraudulent or illegal activities</Text>
          <Text style={styles.bulletPoint}>• Abuse our services or other users</Text>
          <Text style={styles.text}>
            You may terminate your account at any time by contacting us or using the delete account feature in the app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.text}>
            We may update these Terms of Service from time to time. We will notify you of significant changes through the app or by email. Continued use of the app after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Governing Law</Text>
          <Text style={styles.text}>
            These Terms of Service are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            If you have questions about these Terms of Service, please contact us:
          </Text>
          <Text style={styles.contactInfo}>Email: legal@yourdomain.com</Text>
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