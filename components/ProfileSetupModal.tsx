import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileSetupModalProps {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export default function ProfileSetupModal({ visible, onComplete, onClose }: ProfileSetupModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'attendee', label: 'Attendee', description: 'I attend events and network' },
    { id: 'organizer', label: 'Organizer', description: 'I create and manage events' },
  ];

  const handleClose = () => {
    // Reset form state
    setName('');
    setCompany('');
    setTitle('');
    setProfileImage(null);
    setSelectedRoles([]);
    onClose();
  };

  const handleGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY } = event.nativeEvent;
      if (translationY > 100) {
        handleClose();
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const uploadProfileImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Use a simpler file name without user ID in path
      const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    if (selectedRoles.length === 0) {
      Alert.alert('Error', 'Please select at least one role.');
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = null;
      if (profileImage) {
        avatarUrl = await uploadProfileImage(profileImage);
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: name.trim(),
          company: company.trim() || null,
          title: title.trim() || null,
          avatar_url: avatarUrl,
          roles: selectedRoles,
          is_setup: true,
        });

      if (error) throw error;

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <PanGestureHandler onGestureEvent={handleGestureEvent}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.swipeIndicator}>
                <View style={styles.swipeBar} />
              </View>
            </View>
            <Text style={styles.headerTitle}>Complete Your Profile</Text>
            <Text style={styles.headerSubtitle}>
              Help us personalize your experience
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Profile Picture Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Picture</Text>
              <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={32} color={Colors.gray} />
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Basic Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.gray}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Company</Text>
                <TextInput
                  style={styles.input}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Enter your company name"
                  placeholderTextColor={Colors.gray}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Job Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter your job title"
                  placeholderTextColor={Colors.gray}
                />
              </View>
            </View>

            {/* Roles Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How will you use the app? *</Text>
              <Text style={styles.sectionSubtitle}>
                Select all that apply
              </Text>

              {roles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRoles.includes(role.id) && styles.roleCardSelected
                  ]}
                  onPress={() => toggleRole(role.id)}
                >
                  <View style={styles.roleContent}>
                    <View style={styles.roleHeader}>
                      <Text style={[
                        styles.roleTitle,
                        selectedRoles.includes(role.id) && styles.roleTitleSelected
                      ]}>
                        {role.label}
                      </Text>
                      <View style={[
                        styles.checkbox,
                        selectedRoles.includes(role.id) && styles.checkboxSelected
                      ]}>
                        {selectedRoles.includes(role.id) && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                    </View>
                    <Text style={[
                      styles.roleDescription,
                      selectedRoles.includes(role.id) && styles.roleDescriptionSelected
                    ]}>
                      {role.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleClose}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={saveProfile}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </PanGestureHandler>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    padding: 8,
  },
  swipeIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  swipeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.gray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.gray,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  roleCard: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#f0f8ff',
  },
  roleContent: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roleTitleSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  roleDescriptionSelected: {
    color: Colors.textPrimary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  skipButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});