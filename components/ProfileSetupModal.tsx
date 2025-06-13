import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { User, Camera, X, Check, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useUserStore } from '@/store/userStore';
import ImagePicker from './ImagePicker';

interface ProfileSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const { profile, setupProfile, updateProfile } = useUserStore();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if we're in edit mode and populate fields
  useEffect(() => {
    if (visible && profile?.isSetup) {
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
  }, [visible, profile]);

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

    onComplete();
    onClose();
  };

  const handleSkip = () => {
    if (isEditMode) {
      onClose();
      return;
    }

    setupProfile({
      name: 'Anonymous User',
    });
    onComplete();
    onClose();
  };

  const handleImageSelected = (imageUri: string) => {
    setAvatar(imageUri);
  };

  const handleImageRemoved = () => {
    setAvatar('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  welcomeHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
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
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  benefitBullet: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
  },
  skipButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileSetupModal;