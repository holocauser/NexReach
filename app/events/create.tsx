import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, StyleSheet, Platform, Image, Alert, KeyboardAvoidingView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEventStore } from '@/store/eventStore';
import { useUserStore } from '@/store/userStore';
import { format } from 'date-fns';
import { useAuthGuard } from '@/utils/authUtils';

const TAG_OPTIONS = ['Networking', 'Tech', 'Business', 'Startup', 'Workshop', 'Social'];

// Generate date options for next 30 days
const generateDateOptions = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Generate time options
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      times.push(time);
    }
  }
  return times;
};

const CreateEventScreen = () => {
  const router = useRouter();
  const { addEvent } = useEventStore();
  const { profile } = useUserStore();
  const { requireAuthForEventCreation } = useAuthGuard();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const dateOptions = generateDateOptions();
  const timeOptions = generateTimeOptions();

  // Validation
  const validate = () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Event title is required.');
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert('Validation', 'Event title must be at least 3 characters long.');
      return false;
    }
    if (!date) {
      Alert.alert('Validation', 'Event date is required.');
      return false;
    }
    if (!startTime) {
      Alert.alert('Validation', 'Start time is required.');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation', 'Location is required.');
      return false;
    }
    if (isPaid && !price) {
      Alert.alert('Validation', 'Please enter a price for paid events.');
      return false;
    }
    if (isPaid && parseFloat(price) <= 0) {
      Alert.alert('Validation', 'Price must be greater than $0 for paid events.');
      return false;
    }
    return true;
  };

  // Image Picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Preview Event
  const handlePreview = () => {
    if (!validate()) return;
    setShowPreview(true);
  };

  // Save/publish logic
  const handleSave = async (publish: boolean) => {
    console.log('🚀 handleSave called with publish:', publish);
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }
    
    if (!profile) {
      console.log('❌ No profile found');
      Alert.alert('Error', 'Please set up your profile first.');
      return;
    }

    console.log('📝 Starting to save event...');
    setLoading(true);

    try {
      // Format time string
      const timeString = startTime && endTime
        ? `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`
        : startTime
        ? format(startTime, 'h:mm a')
        : '';

      // Create event object
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: date!,
        time: timeString,
        location: location.trim(),
        organizer: profile.name,
        organizerAvatar: profile.avatar,
        image: image || undefined,
        tags: selectedTags,
        price: isPaid ? parseFloat(price) : null,
        currency: 'usd', // Add currency for paid events
      };

      console.log('📋 Event data to save:', eventData);
      console.log('💳 Is paid event:', isPaid);
      console.log('💰 Price:', eventData.price);
      console.log('📝 Title details:', {
        originalTitle: title,
        trimmedTitle: title.trim(),
        titleLength: title.trim().length,
        titleInEventData: eventData.title,
        titleInEventDataLength: eventData.title.length
      });

      // Add event to store (this now includes Stripe integration for paid events)
      console.log('🔄 Calling addEvent...');
      await addEvent(eventData);
      console.log('✅ Event added to store successfully');

      setLoading(false);
      Alert.alert(
        publish ? 'Event Published' : 'Draft Saved',
        publish ? 'Your event is now visible in Events.' : 'Your draft has been saved.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🎯 Navigating to events page');
              router.push('/events');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error saving event:', error);
      setLoading(false);
      
      // Show appropriate error message
      let errorMessage = 'Failed to save event. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Stripe')) {
          errorMessage = 'Event was saved but there was an issue with payment setup. You can still manage the event.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🎯 Navigating to events page');
              router.push('/events');
            }
          }
        ]
      );
    }
  };

  const handleCreateEventWithAuth = async () => {
    const authResult = await requireAuthForEventCreation(() => {
      // This callback will be executed after successful authentication
      handleSave(true);
    });
    return authResult;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.content} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Event Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Event Info</Text>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Event Title <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title (min 3 characters)"
                placeholderTextColor="#aaa"
                maxLength={100}
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Description</Text>
              </View>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your event"
                placeholderTextColor="#aaa"
                multiline
              />
            </View>
          </View>

          {/* Date & Time Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Date & Time</Text>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: date ? Colors.textPrimary : '#aaa' }}>{date ? formatDate(date) : 'Select date'}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
                </TouchableOpacity>
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
                <View style={styles.labelContainer}>
                  <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.label}>Start Time <Text style={styles.required}>*</Text></Text>
                </View>
                <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
                  <Text style={{ color: startTime ? Colors.textPrimary : '#aaa' }}>{startTime ? formatTime(startTime) : 'Start time'}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>End Time</Text>
              </View>
              <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
                <Text style={{ color: endTime ? Colors.textPrimary : '#aaa' }}>{endTime ? formatTime(endTime) : 'End time'}</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
              </View>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Search or enter location"
                placeholderTextColor="#aaa"
              />
            </View>
          </View>
          
          {/* Ticketing Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ticketing</Text>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="options-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Event Type</Text>
              </View>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !isPaid && styles.toggleOptionActive
                  ]}
                  onPress={() => setIsPaid(false)}
                >
                  <Ionicons 
                    name="gift-outline" 
                    size={20} 
                    color={!isPaid ? '#fff' : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.toggleText,
                    !isPaid && styles.toggleTextActive
                  ]}>
                    Free Event
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    isPaid && styles.toggleOptionActive
                  ]}
                  onPress={() => setIsPaid(true)}
                >
                  <Ionicons 
                    name="card-outline" 
                    size={20} 
                    color={isPaid ? '#fff' : Colors.textSecondary} 
                  />
                  <Text style={[
                    styles.toggleText,
                    isPaid && styles.toggleTextActive
                  ]}>
                    Paid Event
                  </Text>
                </TouchableOpacity>
              </View>
              {isPaid && (
                <View style={styles.stripeBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#fff" />
                  <Text style={styles.stripeBadgeText}>
                    Secure payment with Stripe
                  </Text>
                </View>
              )}
            </View>
            
            {isPaid && (
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="card-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.label}>Ticket Price (USD) <Text style={styles.required}>*</Text></Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={price}
                    onChangeText={(text) => {
                      // Only allow numbers and decimal point
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      // Prevent multiple decimal points
                      const parts = cleaned.split('.');
                      if (parts.length <= 2) {
                        setPrice(cleaned);
                      }
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#aaa"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}
          </View>
          
          {/* Additional Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Additional Details</Text>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="pricetag-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Tags</Text>
              </View>
              <View style={styles.tagsContainer}>
                {TAG_OPTIONS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.tagSelected
                    ]}
                    onPress={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    <Text style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected
                    ]}>
                      {tag}
                    </Text>
                    {selectedTags.includes(tag) && (
                      <Ionicons name="checkmark" size={14} color="#fff" style={styles.tagCheckmark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="image-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.label}>Flyer / Image</Text>
              </View>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.imageOverlayText}>Change Image</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color={Colors.primary} />
                    <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bottom spacing for sticky button */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Buttons */}
      <View style={styles.stickyBottom}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.previewBtn]} 
            onPress={handlePreview}
            disabled={loading}
          >
            <Ionicons name="eye-outline" size={18} color={Colors.primary} />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.draftBtn]} 
            onPress={() => handleSave(false)} 
            disabled={loading}
          >
            <Text style={styles.draftButtonText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.publishBtn]} 
            onPress={handleCreateEventWithAuth} 
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                  {isPaid ? 'Setting up payment...' : 'Creating event...'}
                </Text>
              </View>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Create Event</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {dateOptions.map((dateOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    date && date.toDateString() === dateOption.toDateString() && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setDate(dateOption);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    date && date.toDateString() === dateOption.toDateString() && styles.modalOptionTextSelected
                  ]}>
                    {formatDate(dateOption)}
                  </Text>
                  {date && date.toDateString() === dateOption.toDateString() && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal
        visible={showStartTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Start Time</Text>
              <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {timeOptions.map((timeOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    startTime && startTime.getTime() === timeOption.getTime() && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setStartTime(timeOption);
                    setShowStartTimePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    startTime && startTime.getTime() === timeOption.getTime() && styles.modalOptionTextSelected
                  ]}>
                    {formatTime(timeOption)}
                  </Text>
                  {startTime && startTime.getTime() === timeOption.getTime() && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={showEndTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select End Time</Text>
              <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {timeOptions.map((timeOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modalOption,
                    endTime && endTime.getTime() === timeOption.getTime() && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setEndTime(timeOption);
                    setShowEndTimePicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    endTime && endTime.getTime() === timeOption.getTime() && styles.modalOptionTextSelected
                  ]}>
                    {formatTime(timeOption)}
                  </Text>
                  {endTime && endTime.getTime() === timeOption.getTime() && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Event Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.previewScrollView}>
              <View style={styles.previewCard}>
                {image && (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                )}
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>{title || 'Event Title'}</Text>
                  <Text style={styles.previewDescription}>{description || 'Event description will appear here...'}</Text>
                  
                  <View style={styles.previewDetails}>
                    <View style={styles.previewDetail}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.previewDetailText}>
                        {date ? formatDate(date) : 'Date not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.previewDetail}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.previewDetailText}>
                        {startTime ? formatTime(startTime) : 'Time not set'}
                        {endTime && ` - ${formatTime(endTime)}`}
                      </Text>
                    </View>
                    
                    <View style={styles.previewDetail}>
                      <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.previewDetailText}>
                        {location || 'Location not set'}
                      </Text>
                    </View>
                    
                    <View style={styles.previewDetail}>
                      <Ionicons name="card-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.previewDetailText}>
                        {isPaid ? `$${price || '0.00'}` : 'Free Event'}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedTags.length > 0 && (
                    <View style={styles.previewTags}>
                      {selectedTags.map(tag => (
                        <View key={tag} style={styles.previewTag}>
                          <Text style={styles.previewTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={[styles.button, styles.previewCloseBtn]} 
                onPress={() => setShowPreview(false)}
              >
                <Text style={styles.previewCloseButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.previewPublishBtn]} 
                onPress={() => {
                  setShowPreview(false);
                  handleCreateEventWithAuth();
                }}
              >
                <Text style={styles.buttonText}>Publish Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  required: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  stripeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stripeBadgeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
  },
  tagCheckmark: {
    marginLeft: 4,
  },
  imagePicker: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    height: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  previewBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  draftBtn: {
    backgroundColor: Colors.inputBackground,
  },
  publishBtn: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  draftButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  modalOptionSelected: {
    backgroundColor: Colors.primary + '20',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Preview Modal Styles
  previewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  previewScrollView: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  previewContent: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  previewDetails: {
    gap: 12,
  },
  previewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  previewTag: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewTagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewCloseBtn: {
    backgroundColor: Colors.inputBackground,
  },
  previewCloseButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  previewPublishBtn: {
    backgroundColor: Colors.primary,
  },
});

export default CreateEventScreen; 