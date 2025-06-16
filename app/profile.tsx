import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { User, Camera, ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useUserStore } from '@/store/userStore';
import ImagePicker from '@/components/ImagePicker';
import { useRouter } from 'expo-router';

const { height: screenHeight } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setupProfile, updateProfile } = useUserStore();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Populate fields when profile is loaded
  useEffect(() => {
    if (profile?.isSetup) {
      setIsEditMode(true);
      setName(profile.name || '');
      setCompany(profile.company || '');
      setTitle(profile.title || '');
      setAvatar(profile.avatar || '');
    } else {
      setIsEditMode(false);
      setName('');
      setCompany('');
      setTitle('');
      setAvatar('');
    }
  }, [profile]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.');
      return;
    }

    const profileData = {
      name: name.trim(),
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      avatar: avatar || undefined,
    };

    if (isEditMode) {
      updateProfile(profileData);
    } else {
      setupProfile(profileData);
    }

    router.back();
  };

  const handleSkip = () => {
    if (isEditMode) {
      router.back();
      return;
    }

    setupProfile({
      name: 'Anonymous User',
    });
    router.back();
  };

  const handleImageSelected = (imageUri: string) => {
    setAvatar(imageUri);
  };

  const handleImageRemoved = () => {
    setAvatar('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Profile' : 'Create Profile'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.sparkleContainer}>
            <Sparkles size={32} color={Colors.primary} />
          </View>
          <Text style={styles.welcomeTitle}>
            {isEditMode ? 'Edit Your Profile' : 'Welcome to Events!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isEditMode 
              ? 'Update your profile information and photo'
              : 'Create your profile to interact with events, RSVP, comment, and connect with other professionals'
            }
          </Text>
        </View>

        {/* Avatar Section with ImagePicker */}
        <View style={styles.avatarSection}>
          <View style={styles.imagePickerContainer}>
            <ImagePicker
              currentImage={avatar}
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
              title=""
              placeholder="Add Profile Photo"
              aspectRatio={[1, 1]}
              quality={0.8}
            />
          </View>
          <Text style={styles.avatarLabel}>Profile Photo</Text>
          <Text style={styles.avatarSubtext}>
            {isEditMode ? 'Tap to change your photo' : 'Optional - You can add this later'}
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textLight}
              autoFocus={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Your company or organization"
              placeholderTextColor={Colors.textLight}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Your professional title"
              placeholderTextColor={Colors.textLight}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>

        {/* Benefits Section - Only show for new users */}
        {!isEditMode && (
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>With your profile you can:</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>✨</Text>
                <Text style={styles.benefitText}>RSVP to networking events</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>💬</Text>
                <Text style={styles.benefitText}>Comment and engage with others</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>❤️</Text>
                <Text style={styles.benefitText}>Like and share events</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>🤝</Text>
                <Text style={styles.benefitText}>Connect with professionals</Text>
              </View>
            </View>
          </View>
        )}

        {/* Button Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>
              {isEditMode ? 'Cancel' : 'Skip for now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Check size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Save Changes' : 'Create Profile'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  sparkleContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  imagePickerContainer: {
    width: 120,
    marginBottom: 12,
  },
  avatarLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  avatarSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitBullet: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },
  bottomSpacing: {
    height: 24,
  },
}); 