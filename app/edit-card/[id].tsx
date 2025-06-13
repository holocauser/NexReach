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

export default function EditCardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getCardById, updateCard, deleteCard } = useCardStore();
  
  const [formData, setFormData] = useState<Partial<BusinessCard>>({
    name: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    specialty: [],
    languages: [],
    tags: [],
    notes: '',
    profileImage: '',
    cardImage: '',
  });
  
  const [showSpecialty, setShowSpecialty] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showTags, setShowTags] = useState(false);
  
  // Search states for filtering options
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  
  useEffect(() => {
    if (id) {
      const card = getCardById(id as string);
      if (card) {
        setFormData(card);
      } else {
        Alert.alert('Error', 'Card not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id]);
  
  const toggleSelection = (type: 'specialty' | 'languages' | 'tags', value: string) => {
    const currentValues = formData[type] as string[] || [];
    if (currentValues.includes(value)) {
      setFormData({
        ...formData,
        [type]: currentValues.filter(item => item !== value)
      });
    } else {
      setFormData({
        ...formData,
        [type]: [...currentValues, value]
      });
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleSaveCard = () => {
    if (!formData.name || !formData.phone || !formData.email) {
      Alert.alert('Missing Information', 'Please fill in at least name, phone, and email.');
      return;
    }
    
    const updatedCard: BusinessCard = {
      ...formData as BusinessCard,
      id: id as string,
      updatedAt: new Date(),
    };
    
    updateCard(updatedCard);
    
    Alert.alert('Success', 'Contact updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
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
  
  // Filter functions
  const getFilteredSpecialties = () => {
    return specialtyOptions.filter(specialty =>
      specialty.toLowerCase().includes(specialtySearch.toLowerCase())
    );
  };
  
  const getFilteredLanguages = () => {
    return languageOptions.filter(language =>
      language.toLowerCase().includes(languageSearch.toLowerCase())
    );
  };
  
  const getFilteredTags = () => {
    return tagOptions.filter(tag =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  };

  const renderDropdownModal = (
    visible: boolean,
    title: string,
    searchValue: string,
    onSearchChange: (text: string) => void,
    options: string[],
    selectedValues: string[],
    onToggle: (value: string) => void,
    onClose: () => void
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSearchContainer}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={Colors.textLight}
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>
          
          <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={true}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOptionItem,
                  selectedValues.includes(option) && styles.modalOptionItemSelected
                ]}
                onPress={() => onToggle(option)}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedValues.includes(option) && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
                {selectedValues.includes(option) && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Text style={styles.selectedCount}>
              {selectedValues.length} selected
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
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
      
      <ScrollView style={styles.formContainer}>
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
          <Text style={styles.label}>Phone *</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="Enter phone number"
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
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            placeholder="Enter address"
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
            onPress={() => setShowSpecialty(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {(formData.specialty?.length || 0) > 0 
                ? `${formData.specialty?.length} selected` 
                : 'Select specialties'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {(formData.specialty?.length || 0) > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.specialty?.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelection('specialty', item)}
                    style={styles.removeButton}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Languages</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowLanguages(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {(formData.languages?.length || 0) > 0 
                ? `${formData.languages?.length} selected` 
                : 'Select languages'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {(formData.languages?.length || 0) > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.languages?.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelection('languages', item)}
                    style={styles.removeButton}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Tags</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTags(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {(formData.tags?.length || 0) > 0 
                ? `${formData.tags?.length} selected` 
                : 'Select tags'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {(formData.tags?.length || 0) > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.tags?.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelection('tags', item)}
                    style={styles.removeButton}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="Add notes about this contact"
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
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
              (!formData.name || !formData.phone || !formData.email) && styles.saveButtonDisabled
            ]}
            onPress={handleSaveCard}
            disabled={!formData.name || !formData.phone || !formData.email}
          >
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Specialty Modal */}
      {renderDropdownModal(
        showSpecialty,
        'Select Specialties',
        specialtySearch,
        setSpecialtySearch,
        getFilteredSpecialties(),
        formData.specialty || [],
        (value) => toggleSelection('specialty', value),
        () => {
          setShowSpecialty(false);
          setSpecialtySearch('');
        }
      )}

      {/* Languages Modal */}
      {renderDropdownModal(
        showLanguages,
        'Select Languages',
        languageSearch,
        setLanguageSearch,
        getFilteredLanguages(),
        formData.languages || [],
        (value) => toggleSelection('languages', value),
        () => {
          setShowLanguages(false);
          setLanguageSearch('');
        }
      )}

      {/* Tags Modal */}
      {renderDropdownModal(
        showTags,
        'Select Tags',
        tagSearch,
        setTagSearch,
        getFilteredTags(),
        formData.tags || [],
        (value) => toggleSelection('tags', value),
        () => {
          setShowTags(false);
          setTagSearch('');
        }
      )}
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
  dropdownGroup: {
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
  dropdownButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  selectedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedItemText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginRight: 6,
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
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
    color: Colors.white,
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
});