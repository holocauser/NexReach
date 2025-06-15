import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronDown, Save, X, Trash2, Search } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { tagOptions, specialtyOptions, languageOptions } from '@/data/mockData';
import { useCardStore } from '@/store/cardStore';
import { BusinessCard } from '@/types';
import ImagePicker from '@/components/ImagePicker';

interface FormData {
  name: string;
  company?: string;
  title?: string;
  phones: string[];
  email: string;
  addresses: string[];
  website?: string;
  specialty: string;
  languages: string[];
  tags: string[];
  notes: string;
  profileImage: string;
  cardImage: string;
}

export default function EditCardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getCardById, updateCard, deleteCard } = useCardStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    title: '',
    phones: ['', '', ''],
    email: '',
    addresses: ['', ''],
    website: '',
    specialty: '',
    languages: [],
    tags: [],
    notes: '',
    profileImage: '',
    cardImage: '',
  });
  
  const [showModal, setShowModal] = useState<'specialty' | 'language' | 'tag' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (id) {
      const card = getCardById(id as string);
      if (card) {
        setFormData({
          name: card.name || '',
          company: card.company || '',
          title: card.title || '',
          phones: card.phones || ['', '', ''],
          email: card.email || '',
          addresses: card.addresses || ['', ''],
          website: card.website || '',
          specialty: card.specialty || '',
          languages: card.languages || [],
          tags: card.tags || [],
          notes: card.notes || '',
          profileImage: card.profileImage || '',
          cardImage: card.cardImage || '',
        });
      } else {
        Alert.alert('Error', 'Card not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id]);
  
  const toggleSelection = (type: 'specialty' | 'language' | 'tag', value: string) => {
    if (type === 'specialty') {
      setFormData(prev => ({
        ...prev,
        specialty: value
      }));
    } else {
      const currentValues = type === 'language' ? formData.languages : formData.tags;
      if (currentValues.includes(value)) {
        setFormData(prev => ({
          ...prev,
          [type]: currentValues.filter(item => item !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [type]: [...currentValues, value]
        }));
      }
    }
  };
  
  const handleInputChange = (field: keyof FormData, value: string | string[], index?: number) => {
    if (field === 'phones' || field === 'addresses') {
      const newArray = [...formData[field]];
      if (typeof index === 'number') {
        newArray[index] = value as string;
      }
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handleSaveCard = async () => {
    try {
      const card = getCardById(id as string);
      if (!card) {
        Alert.alert('Error', 'Card not found');
        return;
      }

      const updatedCard: BusinessCard = {
        ...card,
        ...formData,
        id: card.id,
        phones: formData.phones || [],
        addresses: formData.addresses || [],
        tags: formData.tags || [],
        languages: formData.languages || [],
        specialty: formData.specialty || '',
        notes: formData.notes || '',
        profileImage: formData.profileImage || '',
        cardImage: formData.cardImage || '',
        updatedAt: new Date().toISOString(),
        createdAt: card.createdAt
      };

      await updateCard(updatedCard);
      router.back();
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    }
  };
  
  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteCard(id as string);
            Alert.alert('Deleted', 'Contact has been deleted.', [
              { text: 'OK', onPress: () => router.back() }
            ]);
          }
        }
      ]
    );
  };
  
  const renderDropdownModal = (type: 'specialty' | 'language' | 'tag') => {
    const title = type === 'specialty' ? 'Select Specialty' : type === 'language' ? 'Select Languages' : 'Select Tags';
    const options = type === 'specialty' ? specialtyOptions : type === 'language' ? languageOptions : tagOptions;
    const selectedValues = type === 'specialty' ? [formData.specialty].filter(Boolean) : type === 'language' ? formData.languages : formData.tags;
    const isMultiSelect = type !== 'specialty';

    return (
      <Modal
        visible={showModal === type}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowModal(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModal(null)}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(null)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search..."
                placeholderTextColor={Colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView
              style={styles.modalOptionsList}
              keyboardShouldPersistTaps="handled">
              {options.filter(option =>
                option.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modalOptionItem,
                    selectedValues?.includes(option) && styles.modalOptionItemSelected,
                  ]}
                  onPress={() => toggleSelection(type, option)}>
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedValues?.includes(option) && styles.modalOptionTextSelected,
                    ]}>
                    {option}
                  </Text>
                  {selectedValues?.includes(option) && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              {isMultiSelect && (
                <Text style={styles.selectedCount}>
                  {selectedValues?.length || 0} selected
                </Text>
              )}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowModal(null)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Contact</Text>
        <TouchableOpacity onPress={handleDeleteCard} style={styles.headerButton}>
          <Trash2 size={24} color={Colors.error} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContentContainer}
      >
        {/* Profile Picture Section */}
        <View style={styles.imageSection}>
          <ImagePicker
            currentImage={formData.profileImage}
            onImageSelected={(uri) => handleInputChange('profileImage', uri)}
            onImageRemoved={() => handleInputChange('profileImage', '')}
            title="Profile Picture"
            placeholder="Add profile photo"
            aspectRatio={[1, 1]}
          />
        </View>

        {/* Business Card Photo Section */}
        <View style={styles.imageSection}>
          <ImagePicker
            currentImage={formData.cardImage}
            onImageSelected={(uri) => handleInputChange('cardImage', uri)}
            onImageRemoved={() => handleInputChange('cardImage', '')}
            title="Business Card Photo"
            placeholder="Take a photo of the business card"
            aspectRatio={[16, 10]}
            openCameraOnPress={true}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter full name"
            placeholderTextColor={Colors.textLight}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            style={styles.input}
            value={formData.company}
            onChangeText={(text) => handleInputChange('company', text)}
            placeholder="Enter company name"
            placeholderTextColor={Colors.textLight}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title/Position</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Enter job title"
            placeholderTextColor={Colors.textLight}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone 1 *</Text>
          <TextInput
            style={styles.input}
            value={formData.phones?.[0] || ''}
            onChangeText={(text) => handleInputChange('phones', text, 0)}
            placeholder="Enter phone number"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone 2</Text>
          <TextInput
            style={styles.input}
            value={formData.phones?.[1] || ''}
            onChangeText={(text) => handleInputChange('phones', text, 1)}
            placeholder="Enter phone number (optional)"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone 3</Text>
          <TextInput
            style={styles.input}
            value={formData.phones?.[2] || ''}
            onChangeText={(text) => handleInputChange('phones', text, 2)}
            placeholder="Enter phone number (optional)"
            placeholderTextColor={Colors.textLight}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Enter email address"
            placeholderTextColor={Colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address 1</Text>
          <TextInput
            style={styles.input}
            value={formData.addresses?.[0] || ''}
            onChangeText={(text) => handleInputChange('addresses', text, 0)}
            placeholder="Enter address"
            placeholderTextColor={Colors.textLight}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address 2</Text>
          <TextInput
            style={styles.input}
            value={formData.addresses?.[1] || ''}
            onChangeText={(text) => handleInputChange('addresses', text, 1)}
            placeholder="Enter address (optional)"
            placeholderTextColor={Colors.textLight}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(text) => handleInputChange('website', text)}
            placeholder="Enter website URL"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Specialty</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowModal('specialty')}>
            <Text style={styles.dropdownButtonText}>
              {formData.specialty ? formData.specialty : 'Select specialty'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Languages</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowModal('language')}>
            <Text style={styles.dropdownButtonText}>
              {formData.languages?.length > 0 
                ? `${formData.languages.length} selected` 
                : 'Select languages'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Tags</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowModal('tag')}>
            <Text style={styles.dropdownButtonText}>
              {formData.tags?.length > 0 
                ? `${formData.tags.length} selected` 
                : 'Select tags'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <X size={20} color={Colors.textSecondary} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!formData.name || !formData.email || !formData.phones || !formData.phones[0]) && styles.saveButtonDisabled
            ]}
            onPress={handleSaveCard}
            disabled={!formData.name || !formData.email || !formData.phones || !formData.phones[0]}
          >
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderDropdownModal('specialty')}
      {renderDropdownModal('language')}
      {renderDropdownModal('tag')}
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingTop: 48,
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formContentContainer: {
    paddingBottom: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  modalOptionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionItemSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: Colors.primary,
    fontFamily: 'Inter-Medium',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.cardBackground,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  dropdownGroup: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginRight: 8,
  },
});