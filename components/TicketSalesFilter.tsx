import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
}

interface TicketSalesFilterProps {
  events: Event[];
  selectedEvent: string | null;
  selectedStatus: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  searchAttendee: string;
  onEventChange: (eventId: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onSearchAttendeeChange: (search: string) => void;
  onClearFilters: () => void;
}

export default function TicketSalesFilter({
  events,
  selectedEvent,
  selectedStatus,
  dateFrom,
  dateTo,
  searchAttendee,
  onEventChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onSearchAttendeeChange,
  onClearFilters,
}: TicketSalesFilterProps) {
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Paid', value: 'paid' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Refunded', value: 'refunded' },
  ];

  const hasActiveFilters = selectedEvent || selectedStatus || dateFrom || dateTo || searchAttendee;

  const clearAllFilters = () => {
    onEventChange(null);
    onStatusChange(null);
    onDateFromChange(null);
    onDateToChange(null);
    onSearchAttendeeChange('');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return format(date, 'MMM dd, yyyy');
  };

  const getEventTitle = (eventId: string | null) => {
    if (!eventId) return 'All Events';
    const event = events.find(e => e.id === eventId);
    return event?.title || 'All Events';
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'All Statuses';
    const option = statusOptions.find(s => s.value === status);
    return option?.label || 'All Statuses';
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search attendee name or email..."
          placeholderTextColor={Colors.textSecondary}
          value={searchAttendee}
          onChangeText={onSearchAttendeeChange}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={hasActiveFilters ? Colors.primary : Colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Section */}
      {showFilters && (
        <View style={styles.filterSection}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Event Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Event</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowEventPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {getEventTitle(selectedEvent)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Status</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowStatusPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {getStatusLabel(selectedStatus)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date Range Filters */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Date From</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDateFromPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(dateFrom)}
                </Text>
                <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Date To</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDateToPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDate(dateTo)}
                </Text>
                <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearAllFilters}
              >
                <Ionicons name="close-circle" size={16} color={Colors.error} />
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Event Picker Modal */}
      <Modal
        visible={showEventPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event</Text>
              <TouchableOpacity onPress={() => setShowEventPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedEvent}
              onValueChange={(value) => {
                onEventChange(value);
                setShowEventPicker(false);
              }}
            >
              <Picker.Item label="All Events" value={null} />
              {events.map((event) => (
                <Picker.Item key={event.id} label={event.title} value={event.id} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={selectedStatus}
              onValueChange={(value) => {
                onStatusChange(value);
                setShowStatusPicker(false);
              }}
            >
              {statusOptions.map((option) => (
                <Picker.Item key={option.value || 'all'} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showDateFromPicker && (
        <DateTimePicker
          value={dateFrom || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateFromPicker(false);
            if (selectedDate) {
              onDateFromChange(selectedDate);
            }
          }}
        />
      )}

      {showDateToPicker && (
        <DateTimePicker
          value={dateTo || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDateToPicker(false);
            if (selectedDate) {
              onDateToChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  filterButton: {
    padding: 8,
  },
  filterSection: {
    maxHeight: 300,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    minWidth: 120,
  },
  pickerButtonText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginRight: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
}); 