import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { organizerService, OrganizerProfile } from '@/lib/organizerService';

interface OrganizerProfileFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export default function OrganizerProfileForm({ onSave, onCancel }: OrganizerProfileFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
    contactEmail: '',
    phone: '',
    website: '',
    company: '',
    title: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await organizerService.getOrganizerProfile(user.id);
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          fullName: profileData.fullName || '',
          orgName: profileData.orgName || '',
          contactEmail: profileData.contactEmail || '',
          phone: profileData.phone || '',
          website: profileData.website || '',
          company: profileData.company || '',
          title: profileData.title || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!formData.orgName.trim()) {
      Alert.alert('Error', 'Organization name is required');
      return;
    }

    try {
      setSaving(true);
      const success = await organizerService.updateOrganizerProfile(user.id, {
        fullName: formData.fullName.trim(),
        orgName: formData.orgName.trim(),
        contactEmail: formData.contactEmail.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        company: formData.company.trim() || null,
        title: formData.title.trim() || null,
      });

      if (success) {
        Alert.alert('Success', 'Profile updated successfully');
        onSave?.();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getStripeStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'restricted':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStripeStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Connected';
      case 'pending':
        return 'Pending Verification';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Not Connected';
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    required: boolean = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'url' = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organization Information</Text>
        
        {renderInputField(
          'Full Name',
          formData.fullName,
          (text) => setFormData({ ...formData, fullName: text }),
          'Enter your full name',
          true
        )}

        {renderInputField(
          'Organization Name',
          formData.orgName,
          (text) => setFormData({ ...formData, orgName: text }),
          'Enter organization name',
          true
        )}

        {renderInputField(
          'Contact Email',
          formData.contactEmail,
          (text) => setFormData({ ...formData, contactEmail: text }),
          'Enter contact email',
          false,
          'email-address'
        )}

        {renderInputField(
          'Phone Number',
          formData.phone,
          (text) => setFormData({ ...formData, phone: text }),
          'Enter phone number',
          false,
          'phone-pad'
        )}

        {renderInputField(
          'Website',
          formData.website,
          (text) => setFormData({ ...formData, website: text }),
          'Enter website URL',
          false,
          'url'
        )}

        {renderInputField(
          'Company',
          formData.company,
          (text) => setFormData({ ...formData, company: text }),
          'Enter company name'
        )}

        {renderInputField(
          'Job Title',
          formData.title,
          (text) => setFormData({ ...formData, title: text }),
          'Enter job title'
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Integration</Text>
        <View style={styles.stripeStatusCard}>
          <View style={styles.stripeStatusHeader}>
            <Ionicons 
              name="card" 
              size={24} 
              color={getStripeStatusColor(profile?.stripeAccountStatus)} 
            />
            <Text style={styles.stripeStatusTitle}>Stripe Connection</Text>
          </View>
          <View style={styles.stripeStatusContent}>
            <View style={styles.statusIndicator}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getStripeStatusColor(profile?.stripeAccountStatus) }
                ]} 
              />
              <Text style={[
                styles.statusText, 
                { color: getStripeStatusColor(profile?.stripeAccountStatus) }
              ]}>
                {getStripeStatusText(profile?.stripeAccountStatus)}
              </Text>
            </View>
            <Text style={styles.stripeStatusDescription}>
              {profile?.stripeAccountStatus === 'active' 
                ? 'Your Stripe account is connected and ready to receive payments.'
                : profile?.stripeAccountStatus === 'pending'
                ? 'Your Stripe account is being verified. You can still create events.'
                : 'Connect your Stripe account to receive payments for ticket sales.'
              }
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  stripeStatusCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
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
  stripeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stripeStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  stripeStatusContent: {
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stripeStatusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
}); 