import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, StyleSheet, Platform, Image, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEventStore } from '@/store/eventStore';
import { useUserStore } from '@/store/userStore';
import { format } from 'date-fns';

const CreateEventScreen = () => {
  const router = useRouter();
  const { addEvent } = useEventStore();
  const { profile } = useUserStore();
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

  // Validation
  const validate = () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Event title is required.');
      return false;
    }
    if (!date) {
      Alert.alert('Validation', 'Event date is required.');
      return false;
    }
    if (!isPaid && price) {
      setPrice('');
    }
    if (isPaid && !price) {
      Alert.alert('Validation', 'Please enter a price for paid events.');
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

  // Save/publish logic
  const handleSave = (publish: boolean) => {
    if (!validate()) return;
    if (!profile) {
      Alert.alert('Error', 'Please set up your profile first.');
      return;
    }

    setLoading(true);

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
      tags: [], // TODO: Add tag selection
      price: isPaid ? parseFloat(price) : null,
    };

    // Add event to store
    addEvent(eventData);

    setLoading(false);
    Alert.alert(
      publish ? 'Event Published' : 'Draft Saved',
      publish ? 'Your event is now visible in Events.' : 'Your draft has been saved.',
      [
        {
          text: 'OK',
          onPress: () => router.push('/events')
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your event"
            placeholderTextColor="#aaa"
            multiline
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}> 
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: date ? Colors.textPrimary : '#aaa' }}>{date ? date.toDateString() : 'Select date'}</Text>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
              <Text style={{ color: startTime ? Colors.textPrimary : '#aaa' }}>{startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Start time'}</Text>
              <Ionicons name="time-outline" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedTime) => {
                  setShowStartTimePicker(false);
                  if (selectedTime) setStartTime(selectedTime);
                }}
              />
            )}
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}> 
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
              <Text style={{ color: endTime ? Colors.textPrimary : '#aaa' }}>{endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End time'}</Text>
              <Ionicons name="time-outline" size={20} color={Colors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedTime) => {
                  setShowEndTimePicker(false);
                  if (selectedTime) setEndTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          {/* <GooglePlacesAutocomplete ... /> */}
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Search or enter location"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={[styles.formGroup, styles.row, { alignItems: 'center' }]}> 
          <Text style={styles.label}>Free Event</Text>
          <Switch
            value={!isPaid}
            onValueChange={v => setIsPaid(!v)}
            thumbColor={isPaid ? Colors.error : Colors.success}
            trackColor={{ false: Colors.success, true: Colors.error }}
          />
          <Text style={[styles.label, { marginLeft: 12 }]}>Paid Event</Text>
        </View>
        {isPaid && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Price ($)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              placeholderTextColor="#aaa"
              keyboardType="decimal-pad"
            />
          </View>
        )}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Flyer / Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <Ionicons name="image-outline" size={48} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.draftBtn]} onPress={() => handleSave(false)} disabled={loading}>
            <Text style={styles.buttonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.publishBtn]} onPress={() => handleSave(true)} disabled={loading}>
            <Text style={styles.buttonText}>Publish Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    color: Colors.textPrimary,
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
  imagePicker: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  draftBtn: {
    backgroundColor: Colors.inputBackground,
  },
  publishBtn: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CreateEventScreen; 