import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Filter, ChevronDown, MapPin, Search as SearchIcon, X, FileSliders as Sliders, Navigation } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Filter as FilterType } from '@/types';
import { specialtyOptions, languageOptions, serviceOptions } from '@/data/mockData';

interface SearchFilterProps {
  filter: FilterType;
  onUpdateFilter: (filter: Partial<FilterType>) => void;
  onSearch: () => void;
  onReset: () => void;
  onUseMyLocation: () => void;
  hasLocationPermission: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const GOOGLE_PLACES_API_KEY = 'AIzaSyDsjOqNqBY6albDBbUb_nTalGvwqeeRQ_A';

const SearchFilter: React.FC<SearchFilterProps> = ({
  filter,
  onUpdateFilter,
  onSearch,
  onReset,
  onUseMyLocation,
  hasLocationPermission,
}) => {
  const [showSpecialty, setShowSpecialty] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Search states for filtering options
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  
  const locationInputRef = useRef<TextInput>(null);
  
  const toggleSelection = (type: 'specialty' | 'languages' | 'services', value: string) => {
    const currentValues = filter[type];
    if (currentValues.includes(value)) {
      onUpdateFilter({ [type]: currentValues.filter(item => item !== value) });
    } else {
      onUpdateFilter({ [type]: [...currentValues, value] });
    }
  };

  // Location autocomplete functionality
  const searchLocationSuggestions = async (input: string) => {
    if (input.length < 3) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&components=country:us&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        setLocationSuggestions(data.predictions);
        setShowLocationSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleLocationChange = (text: string) => {
    onUpdateFilter({ location: text });
    searchLocationSuggestions(text);
  };

  const selectLocationSuggestion = (suggestion: PlacePrediction) => {
    onUpdateFilter({ location: suggestion.description });
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    Keyboard.dismiss();
    locationInputRef.current?.blur();
  };

  const handleLocationFocus = () => {
    if (filter.location && filter.location.length >= 3) {
      searchLocationSuggestions(filter.location);
    }
  };

  const handleLocationBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowLocationSuggestions(false);
    }, 200);
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
  
  const getFilteredServices = () => {
    return serviceOptions.filter(service =>
      service.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  };

  const openModal = (modalType: 'specialty' | 'languages' | 'services') => {
    // Dismiss keyboard before opening modal
    Keyboard.dismiss();
    
    // Small delay to ensure keyboard is dismissed
    setTimeout(() => {
      switch (modalType) {
        case 'specialty':
          setShowSpecialty(true);
          break;
        case 'languages':
          setShowLanguages(true);
          break;
        case 'services':
          setShowServices(true);
          break;
      }
    }, 100);
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalSearchContainer}>
            <SearchIcon size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={Colors.textLight}
              value={searchValue}
              onChangeText={onSearchChange}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchValue.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            style={styles.modalOptionsList} 
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
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
      </KeyboardAvoidingView>
    </Modal>
  );
  
  return (
    <View style={styles.container}>
      {/* Location Search with Autocomplete */}
      <View style={styles.locationContainer}>
        <View style={styles.searchBar}>
          <MapPin size={20} color={Colors.textSecondary} />
          <TextInput
            ref={locationInputRef}
            style={styles.input}
            placeholder="Enter city, state, or zip code"
            placeholderTextColor={Colors.textSecondary}
            value={filter.location}
            onChangeText={handleLocationChange}
            onFocus={handleLocationFocus}
            onBlur={handleLocationBlur}
            returnKeyType="done"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              locationInputRef.current?.blur();
            }}
          />
          
          {/* Use My Location Button */}
          <TouchableOpacity 
            onPress={onUseMyLocation}
            style={[
              styles.locationButton,
              hasLocationPermission && styles.locationButtonActive
            ]}
          >
            <Navigation size={16} color={hasLocationPermission ? Colors.primary : Colors.textSecondary} />
          </TouchableOpacity>
          
          {filter.location.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                onUpdateFilter({ location: '' });
                setShowLocationSuggestions(false);
                setLocationSuggestions([]);
              }}
              style={styles.clearButton}
            >
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Suggestions */}
        {showLocationSuggestions && locationSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={locationSuggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectLocationSuggestion(item)}
                >
                  <MapPin size={16} color={Colors.primary} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionMainText}>
                      {item.structured_formatting.main_text}
                    </Text>
                    <Text style={styles.suggestionSecondaryText}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>
      
      {/* Quick Filter Buttons */}
      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={[styles.filterButton, filter.specialty.length > 0 && styles.filterButtonActive]}
          onPress={() => openModal('specialty')}
        >
          <Text style={[
            styles.filterButtonText,
            filter.specialty.length > 0 && styles.filterButtonTextActive
          ]}>
            Specialty {filter.specialty.length > 0 ? `(${filter.specialty.length})` : ''}
          </Text>
          <ChevronDown size={16} color={filter.specialty.length > 0 ? Colors.cardBackground : Colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter.languages.length > 0 && styles.filterButtonActive]}
          onPress={() => openModal('languages')}
        >
          <Text style={[
            styles.filterButtonText,
            filter.languages.length > 0 && styles.filterButtonTextActive
          ]}>
            Languages {filter.languages.length > 0 ? `(${filter.languages.length})` : ''}
          </Text>
          <ChevronDown size={16} color={filter.languages.length > 0 ? Colors.cardBackground : Colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.advancedButton}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Sliders size={16} color={Colors.primary} />
          <Text style={styles.advancedButtonText}>More</Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showAdvanced && (
        <View style={styles.advancedContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter.services.length > 0 && styles.filterButtonActive]}
            onPress={() => openModal('services')}
          >
            <Text style={[
              styles.filterButtonText,
              filter.services.length > 0 && styles.filterButtonTextActive
            ]}>
              Services {filter.services.length > 0 ? `(${filter.services.length})` : ''}
            </Text>
            <ChevronDown size={16} color={filter.services.length > 0 ? Colors.cardBackground : Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.radiusContainer}>
            <Text style={styles.radiusLabel}>Search Radius:</Text>
            <View style={styles.radiusButtons}>
              {[5, 10, 25, 50].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusButton,
                    filter.radius === radius && styles.radiusButtonActive
                  ]}
                  onPress={() => onUpdateFilter({ radius })}
                >
                  <Text style={[
                    styles.radiusButtonText,
                    filter.radius === radius && styles.radiusButtonTextActive
                  ]}>
                    {radius} mi
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
        >
          <X size={16} color={Colors.textSecondary} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            Keyboard.dismiss();
            onSearch();
          }}
        >
          <SearchIcon size={16} color={Colors.cardBackground} />
          <Text style={styles.searchText}>Search Providers</Text>
        </TouchableOpacity>
      </View>

      {/* Specialty Modal */}
      {renderDropdownModal(
        showSpecialty,
        'Select Specialties',
        specialtySearch,
        setSpecialtySearch,
        getFilteredSpecialties(),
        filter.specialty,
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
        filter.languages,
        (value) => toggleSelection('languages', value),
        () => {
          setShowLanguages(false);
          setLanguageSearch('');
        }
      )}

      {/* Services Modal */}
      {renderDropdownModal(
        showServices,
        'Select Services',
        serviceSearch,
        setServiceSearch,
        getFilteredServices(),
        filter.services,
        (value) => toggleSelection('services', value),
        () => {
          setShowServices(false);
          setServiceSearch('');
        }
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  locationContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  locationButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationButtonActive: {
    backgroundColor: `${Colors.primary}10`,
    borderColor: Colors.primary,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  suggestionSecondaryText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginRight: 4,
  },
  filterButtonTextActive: {
    color: Colors.cardBackground,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  advancedButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginLeft: 4,
  },
  advancedContainer: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  radiusContainer: {
    marginTop: 12,
  },
  radiusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  radiusButtonTextActive: {
    color: Colors.cardBackground,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  resetText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.cardBackground,
    marginLeft: 8,
  },
  // Modal Styles - Updated for better positioning
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0, // Account for safe area
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
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
    maxHeight: 350,
    minHeight: 100,
    overflow: 'scroll',
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: 8,
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
    color: Colors.cardBackground,
  },
});

export default SearchFilter;