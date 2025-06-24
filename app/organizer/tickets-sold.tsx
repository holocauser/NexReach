import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { organizerService, TicketSale, TicketSaleStats } from '@/lib/organizerService';
import TicketSalesFilter from '@/components/TicketSalesFilter';

interface Event {
  id: string;
  title: string;
}

export default function TicketsSoldScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State for data
  const [tickets, setTickets] = useState<TicketSale[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketSale[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<TicketSaleStats>({
    totalRevenue: 0,
    totalTickets: 0,
    completedTickets: 0,
    pendingTickets: 0,
    cancelledTickets: 0,
  });
  
  // State for loading and refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for filters
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [searchAttendee, setSearchAttendee] = useState('');

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [tickets, selectedEvent, selectedStatus, dateFrom, dateTo, searchAttendee]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load events and tickets in parallel
      const [eventsData, ticketsData, statsData] = await Promise.all([
        organizerService.getOrganizerEvents(user.id),
        organizerService.getTicketsSold(user.id),
        organizerService.getTicketSalesStats(user.id),
      ]);
      
      setEvents(eventsData);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tickets sold data:', error);
      Alert.alert('Error', 'Failed to load tickets data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Filter by event
    if (selectedEvent) {
      filtered = filtered.filter(ticket => ticket.event_id === selectedEvent);
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(ticket => ticket.status === selectedStatus);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate <= dateTo;
      });
    }

    // Filter by attendee search
    if (searchAttendee) {
      const searchTerm = searchAttendee.toLowerCase();
      filtered = filtered.filter(ticket => 
        (ticket.attendee_name && ticket.attendee_name.toLowerCase().includes(searchTerm)) ||
        (ticket.attendee_email && ticket.attendee_email.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredTickets(filtered);
  };

  const clearAllFilters = () => {
    setSelectedEvent(null);
    setSelectedStatus(null);
    setDateFrom(null);
    setDateTo(null);
    setSearchAttendee('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
      case 'refunded':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
      case 'refunded':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderTicketSale = ({ item }: { item: TicketSale }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <Text style={styles.eventName}>{item.event_title}</Text>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.saleDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Attendee:</Text>
          <Text style={styles.detailValue}>
            {item.attendee_name || item.attendee_email || 'Unknown'}
          </Text>
        </View>
        {item.attendee_email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.attendee_email}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ticket Type:</Text>
          <Text style={styles.detailValue}>{item.ticket_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date Purchased:</Text>
          <Text style={styles.detailValue}>
            {format(new Date(item.created_at), 'MMM dd, yyyy')}
          </Text>
        </View>
        {item.event_location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.event_location}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Event Date:</Text>
          <Text style={styles.detailValue}>
            {format(new Date(item.event_start_time), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="ticket-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Tickets Sold</Text>
      <Text style={styles.emptyStateSubtitle}>
        {filteredTickets.length === 0 && tickets.length > 0 
          ? 'No tickets match your current filters'
          : 'Tickets sold for your events will appear here'
        }
      </Text>
      {filteredTickets.length === 0 && tickets.length > 0 && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tickets Sold</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tickets Sold</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTickets}</Text>
          <Text style={styles.statLabel}>Total Tickets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedTickets}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingTickets}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.cancelledTickets}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Filter Component */}
      <TicketSalesFilter
        events={events}
        selectedEvent={selectedEvent}
        selectedStatus={selectedStatus}
        dateFrom={dateFrom}
        dateTo={dateTo}
        searchAttendee={searchAttendee}
        onEventChange={setSelectedEvent}
        onStatusChange={setSelectedStatus}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onSearchAttendeeChange={setSearchAttendee}
        onClearFilters={clearAllFilters}
      />

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        renderItem={renderTicketSale}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredTickets.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
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
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  saleCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
}); 