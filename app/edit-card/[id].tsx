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
  specialty: string[];
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
    specialty: [],
    languages: [],
    tags: [],
    notes: '',
    profileImage: '',
    cardImage: '',
  });
  
  const [showModal, setShowModal] = useState<'specialty' | 'language' | 'tag' | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  
  // Debug modal state
  useEffect(() => {
    console.log('showModal state changed to:', showModal);
  }, [showModal]);
  
  useEffect(() => {
    if (id) {
      const card = getCardById(id as string);
      console.log('🔍 Loading card for editing:', { id, card });
      
      if (card) {
        console.log('🔍 Original card structure:', {
          id: card.id,
          name: card.name,
          phones: card.phones,
          phone: card.phone,
          addresses: card.addresses,
          address: card.address,
          specialty: card.specialty,
          languages: card.languages,
          tags: card.tags
        });
        
        // Handle both singular and array versions of phones and addresses
        // Prioritize arrays, but if only singular exists, convert to array
        // If both exist, use the array but ensure no duplicates
        let phones: string[];
        if (card.phones && card.phones.length > 0) {
          // Use existing array, but filter out empty values and convert objects to strings
          phones = card.phones
            .map(phone => {
              if (typeof phone === 'string') {
                return phone;
              } else if (phone && typeof phone === 'object') {
                return phone.number || '';
              }
              return '';
            })
            .filter(phone => phone && phone.trim() !== '');
          // If array is empty after filtering, check singular
          if (phones.length === 0 && card.phone) {
            phones = [card.phone];
          }
        } else if (card.phone) {
          // Only singular exists, convert to array
          phones = [card.phone];
        } else {
          // Neither exists, use empty array
          phones = ['', '', ''];
        }
        
        let addresses: string[];
        if (card.addresses && card.addresses.length > 0) {
          // Use existing array, but filter out empty values and convert objects to strings
          addresses = card.addresses
            .map(address => {
              if (typeof address === 'string') {
                return address;
              } else if (address && typeof address === 'object') {
                return address.address || '';
              }
              return '';
            })
            .filter(address => address && address.trim() !== '');
          // If array is empty after filtering, check singular
          if (addresses.length === 0 && card.address) {
            addresses = [card.address];
          }
        } else if (card.address) {
          // Only singular exists, convert to array
          addresses = [card.address];
        } else {
          // Neither exists, use empty array
          addresses = ['', ''];
        }
        
        console.log('📞 Phone data:', { 
          originalPhones: card.phones, 
          originalPhone: card.phone, 
          processedPhones: phones 
        });
        console.log('📍 Address data:', { 
          originalAddresses: card.addresses, 
          originalAddress: card.address, 
          processedAddresses: addresses 
        });
        
        const formDataToSet = {
          name: card.name || '',
          company: card.company || '',
          title: card.title || '',
          phones: phones,
          email: card.email || '',
          addresses: addresses,
          website: card.website || '',
          specialty: Array.isArray(card.specialty) ? card.specialty.filter(s => s && s.trim() !== '') : (card.specialty ? [card.specialty] : []),
          languages: card.languages || [],
          tags: card.tags || [],
          notes: card.notes || '',
          profileImage: card.profileImage || '',
          cardImage: card.cardImage || '',
        };
        
        console.log('📝 Setting form data:', formDataToSet);
        setFormData(formDataToSet);
      } else {
        console.error('❌ Card not found for ID:', id);
        Alert.alert('Error', 'Card not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    }
  }, [id]);
  
  const toggleSelection = (type: 'specialty' | 'language' | 'tag', value: string) => {
    console.log('toggleSelection called:', { type, value, currentFormData: formData });
    
    let fieldName: keyof FormData;
    switch (type) {
      case 'specialty':
        fieldName = 'specialty';
        break;
      case 'language':
        fieldName = 'languages';
        break;
      case 'tag':
        fieldName = 'tags';
        break;
    }
    
    const currentValues = formData[fieldName] as string[];
    console.log('Current values for', fieldName, ':', currentValues);
    
    if (currentValues.includes(value)) {
      console.log('Removing value:', value);
      setFormData(prev => ({
        ...prev,
        [fieldName]: currentValues.filter(item => item !== value)
      }));
    } else {
      console.log('Adding value:', value);
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...currentValues, value]
      }));
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

      // Convert languages to language tags (e.g., "English" -> "English-speaking")
      const languageTags = (formData.languages || []).map(lang => `${lang}-speaking`);
      
      // Combine existing tags with language tags, removing duplicates
      const allTags = [...new Set([...(formData.tags || []), ...languageTags])];

      const updatedCard: BusinessCard = {
        id: card.id,
        name: formData.name,
        company: formData.company || '',
        title: formData.title || '',
        email: formData.email,
        website: formData.website,
        phones: (formData.phones || []).filter(phone => phone && phone.trim() !== '').map(phone => ({ label: 'Phone', number: phone as string })),
        addresses: (formData.addresses || []).filter(address => address && address.trim() !== '').map(address => ({ label: 'Address', address: address as string })),
        tags: allTags,
        languages: formData.languages || [],
        specialty: formData.specialty || [],
        notes: formData.notes || '',
        profileImage: formData.profileImage || '',
        cardImage: formData.cardImage || '',
        favorited: card.favorited,
        lastContacted: card.lastContacted,
        files: card.files,
        voiceNotes: card.voiceNotes,
        city: card.city,
        state: card.state,
        zip: card.zip,
        latitude: card.latitude,
        longitude: card.longitude,
        updatedAt: new Date().toISOString(),
        createdAt: card.createdAt
      };

      console.log('💾 Saving card data:', {
        phones: updatedCard.phones,
        addresses: updatedCard.addresses,
        cardId: updatedCard.id,
        name: updatedCard.name
      });

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
          onPress: async () => {
            try {
              await deleteCard(id as string);
              Alert.alert('Deleted', 'Contact has been deleted.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  const closeModal = () => {
    setShowModal(null);
    setSpecialtySearch('');
    setLanguageSearch('');
    setTagSearch('');
  };

  const openModal = (type: 'specialty' | 'language' | 'tag') => {
    console.log('Opening modal for type:', type);
    setShowModal(type);
  };
  
  const renderDropdownModal = (type: 'specialty' | 'language' | 'tag') => {
    const title = type === 'specialty' ? 'Select Specialty' : type === 'language' ? 'Select Languages' : 'Select Tags';
    const options = type === 'specialty' ? specialtyOptions : type === 'language' ? languageOptions : tagOptions;
    const selectedValues = type === 'specialty' ? formData.specialty : type === 'language' ? formData.languages : formData.tags;
    
    console.log('renderDropdownModal:', { type, title, optionsCount: options.length, selectedValues, formData });
    console.log('Modal rendering for type:', type, 'visible:', showModal === type);

    return (
      <Modal
        visible={showModal === type}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search..."
                placeholderTextColor={Colors.textLight}
                value={type === 'specialty' ? specialtySearch : type === 'language' ? languageSearch : tagSearch}
                onChangeText={(text) => {
                  if (type === 'specialty') {
                    setSpecialtySearch(text);
                  } else if (type === 'language') {
                    setLanguageSearch(text);
                  } else if (type === 'tag') {
                    setTagSearch(text);
                  }
                }}
              />
            </View>
            <ScrollView
              style={styles.modalOptionsList}
              keyboardShouldPersistTaps="handled">
              {options.filter(option =>
                option.toLowerCase().includes(type === 'specialty' ? specialtySearch.toLowerCase() : type === 'language' ? languageSearch.toLowerCase() : tagSearch.toLowerCase())
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
              <Text style={styles.selectedCount}>
                {selectedValues?.length || 0} selected
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={closeModal}>
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
        
        <View style={styles.dropdownGroup}>
          <Text style={styles.label}>Specialty</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => openModal('specialty')}>
            <Text style={styles.dropdownButtonText}>
              {formData.specialty?.length > 0 
                ? `${formData.specialty.length} selected` 
                : 'Select specialties'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {formData.specialty?.length > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.specialty.map((item, index) => (
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
            onPress={() => openModal('language')}>
            <Text style={styles.dropdownButtonText}>
              {formData.languages?.length > 0 
                ? `${formData.languages.length} selected` 
                : 'Select languages'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {formData.languages?.length > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.languages.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelection('language', item)}
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
            onPress={() => openModal('tag')}>
            <Text style={styles.dropdownButtonText}>
              {formData.tags?.length > 0 
                ? `${formData.tags.length} selected` 
                : 'Select tags'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {formData.tags?.length > 0 && (
            <View style={styles.selectedItemsContainer}>
              {formData.tags.map((item, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{item}</Text>
                  <TouchableOpacity
                    onPress={() => toggleSelection('tag', item)}
                    style={styles.removeButton}
                  >
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
});