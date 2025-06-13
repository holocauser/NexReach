import { Tabs } from 'expo-router';
import { CreditCard, Search, CirclePlus as PlusCircle, ArrowLeftRight, LayoutDashboard, Calendar } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 18,
          color: Colors.textPrimary,
        },
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerTintColor: Colors.primary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Cards',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
          headerTitle: 'My Cards',
        }}
      />
      <Tabs.Screen
        name="find"
        options={{
          title: 'Find',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          headerTitle: 'Find Providers',
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          headerTitle: 'Events',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add New',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
          headerTitle: 'Add New Card',
        }}
      />
      <Tabs.Screen
        name="referrals"
        options={{
          title: 'Referrals',
          tabBarIcon: ({ color, size }) => <ArrowLeftRight size={size} color={color} />,
          headerTitle: 'Referral Tracker',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          headerTitle: 'Dashboard',
        }}
      />
    </Tabs>
  );
}