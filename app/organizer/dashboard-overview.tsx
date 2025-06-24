import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Event, Ticket } from '@/types/database';
import Colors from '@/constants/Colors';
import SimpleBarChart from '@/components/SimpleBarChart';

interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  grossRevenue: number;
  upcomingEvents: number;
  recentEvents: Event[];
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'event_created' | 'ticket_sold' | 'payment_received';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export default function DashboardOverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the RPC function for better performance
      const { data, error } = await supabase
        .rpc('get_organizer_dashboard_stats', {
          organizer_user_id: user?.id
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        setStats({
          totalEvents: stats.total_events || 0,
          totalTicketsSold: stats.total_tickets_sold || 0,
          grossRevenue: parseFloat(stats.gross_revenue) || 0,
          upcomingEvents: stats.upcoming_events || 0,
          recentEvents: stats.recent_events || [],
          recentActivity: stats.recent_activity || [],
        });
      } else {
        // No data found, set default values
        setStats({
          totalEvents: 0,
          totalTicketsSold: 0,
          grossRevenue: 0,
          upcomingEvents: 0,
          recentEvents: [],
          recentActivity: [],
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      
      // Fallback to individual queries if RPC fails
      try {
        await fetchDashboardDataFallback();
      } catch (fallbackErr) {
        console.error('Fallback queries also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardDataFallback = async () => {
    // Fallback to individual queries if RPC function is not available
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    const eventIds = events?.map(event => event.id) || [];
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .in('event_id', eventIds);

    if (ticketsError) throw ticketsError;

    const now = new Date();
    const upcomingEvents = events?.filter(event => 
      new Date(event.start_time) > now
    ).length || 0;

    const totalTicketsSold = tickets?.length || 0;
    const grossRevenue = totalTicketsSold * 50;
    const recentEvents = events?.slice(0, 5) || [];
    const recentActivity = generateRecentActivity(events, tickets);

    setStats({
      totalEvents: events?.length || 0,
      totalTicketsSold,
      grossRevenue,
      upcomingEvents,
      recentEvents,
      recentActivity,
    });
  };

  const generateRecentActivity = (events: Event[], tickets: Ticket[]): ActivityItem[] => {
    const activity: ActivityItem[] = [];
    const now = new Date();

    // Add recent events
    events?.slice(0, 3).forEach(event => {
      activity.push({
        id: `event-${event.id}`,
        type: 'event_created',
        title: `Event "${event.title}" published`,
        description: `Created on ${new Date(event.created_at).toLocaleDateString()}`,
        timestamp: event.created_at,
      });
    });

    // Add recent ticket sales
    tickets?.slice(0, 2).forEach(ticket => {
      const event = events?.find(e => e.id === ticket.event_id);
      if (event) {
        activity.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket_sold',
          title: `Ticket sold for "${event.title}"`,
          description: `Ticket type: ${ticket.ticket_type}`,
          timestamp: ticket.created_at,
          amount: 50, // Mock amount
        });
      }
    });

    // Sort by timestamp and take top 5
    return activity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'checkmark-circle';
      case 'ticket_sold':
        return 'ticket';
      case 'payment_received':
        return 'card';
      default:
        return 'help-circle';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event_created':
        return Colors.success;
      case 'ticket_sold':
        return Colors.warning;
      case 'payment_received':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

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
          <Text style={styles.headerTitle}>Dashboard Overview</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard Overview</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Overview</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="trending-up" size={24} color={Colors.primary} />
              <View style={styles.changeBadge}>
                <Text style={styles.changeText}>+15.3%</Text>
              </View>
            </View>
            <Text style={styles.statValue}>{formatCurrency(stats.grossRevenue)}</Text>
            <Text style={styles.statTitle}>Gross Revenue</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="ticket" size={24} color={Colors.primary} />
              <View style={styles.changeBadge}>
                <Text style={styles.changeText}>+8.7%</Text>
              </View>
            </View>
            <Text style={styles.statValue}>{stats.totalTicketsSold}</Text>
            <Text style={styles.statTitle}>Tickets Sold</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
              <View style={styles.changeBadge}>
                <Text style={styles.changeText}>+2</Text>
              </View>
            </View>
            <Text style={styles.statValue}>{stats.totalEvents}</Text>
            <Text style={styles.statTitle}>Total Events</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="star" size={24} color={Colors.primary} />
              <View style={styles.changeBadge}>
                <Text style={styles.changeText}>+0.2</Text>
              </View>
            </View>
            <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
            <Text style={styles.statTitle}>Upcoming Events</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.chartCard}>
            <SimpleBarChart
              data={[
                {
                  label: 'Events',
                  value: stats.totalEvents,
                  maxValue: Math.max(stats.totalEvents, 10),
                  color: Colors.primary,
                },
                {
                  label: 'Tickets',
                  value: stats.totalTicketsSold,
                  maxValue: Math.max(stats.totalTicketsSold, 20),
                  color: Colors.success,
                },
                {
                  label: 'Revenue',
                  value: Math.round(stats.grossRevenue / 100), // Show in hundreds
                  maxValue: Math.max(Math.round(stats.grossRevenue / 100), 50),
                  color: Colors.warning,
                },
                {
                  label: 'Upcoming',
                  value: stats.upcomingEvents,
                  maxValue: Math.max(stats.upcomingEvents, 5),
                  color: Colors.info,
                },
              ]}
              height={140}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {stats.recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                  <Ionicons 
                    name={getActivityIcon(activity.type)} 
                    size={20} 
                    color={getActivityColor(activity.type)} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>{formatDate(activity.timestamp)}</Text>
                  {activity.amount && (
                    <Text style={styles.activityAmount}>{formatCurrency(activity.amount)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/events/create')}
            >
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Create Event</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="qr-code" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Scan Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/organizer/tickets-sold')}
            >
              <Ionicons name="analytics" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.success,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 