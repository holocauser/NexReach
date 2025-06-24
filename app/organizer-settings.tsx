import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    subtitle: 'View your event analytics and performance',
    icon: 'stats-chart',
    route: '/organizer/dashboard-overview',
  },
  {
    id: 'tickets-sold',
    title: 'Tickets Sold',
    subtitle: 'Track ticket sales and revenue',
    icon: 'ticket',
    route: '/organizer/tickets-sold',
  },
  {
    id: 'payments-payouts',
    title: 'Payments & Payouts',
    subtitle: 'Manage your earnings and transfers',
    icon: 'card',
    route: '/organizer/payments-payouts',
  },
  {
    id: 'tax-documents',
    title: 'Tax Documents',
    subtitle: 'Download tax forms and reports',
    icon: 'document-text',
    route: '/organizer/tax-documents',
  },
  {
    id: 'bank-account',
    title: 'Bank Account Info',
    subtitle: 'Update your payment information',
    icon: 'business',
    route: '/organizer/bank-account',
  },
  {
    id: 'receipts-invoices',
    title: 'Receipts & Invoices',
    subtitle: 'View and download receipts',
    icon: 'receipt',
    route: '/organizer/receipts-invoices',
  },
  {
    id: 'organizer-settings',
    title: 'Organizer Settings',
    subtitle: 'Manage your account preferences',
    icon: 'settings',
    route: '/organizer/settings',
  },
  {
    id: 'scan-tickets',
    title: 'Scan Tickets',
    subtitle: 'QR scanner for event check-in',
    icon: 'qr-code',
    route: '/scan',
    badge: 'New',
  },
];

export default function OrganizerSettingsScreen() {
  const router = useRouter();

  const handleMenuItemPress = (item: MenuItem) => {
    router.push(item.route as any);
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textLight}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Organizer Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your events and business
        </Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
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
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  menuItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
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
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
}); 