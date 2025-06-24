import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { organizerService } from '@/lib/organizerService';
import OrganizerProfileForm from '@/components/OrganizerProfileForm';

interface SettingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  route?: string;
  action?: () => void;
}

export default function OrganizerSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    autoPayout: false,
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => router.push('/auth') }
      ]
    );
  };

  const handleProfileSave = () => {
    setShowProfileModal(false);
    // Optionally refresh profile data here
  };

  const settingItems: SettingItem[] = [
    {
      id: 'profile',
      title: 'Organization Profile',
      subtitle: 'Edit your organization information',
      icon: 'business',
      type: 'action',
      action: () => setShowProfileModal(true),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: 'notifications',
      type: 'navigation',
      route: '/organizer/notification-settings',
    },
    {
      id: 'emailNotifications',
      title: 'Email Notifications',
      subtitle: 'Receive updates via email',
      icon: 'mail',
      type: 'toggle',
      value: settings.emailNotifications,
    },
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      subtitle: 'Receive push notifications',
      icon: 'phone-portrait',
      type: 'toggle',
      value: settings.pushNotifications,
    },
    {
      id: 'smsNotifications',
      title: 'SMS Notifications',
      subtitle: 'Receive updates via SMS',
      icon: 'chatbubble',
      type: 'toggle',
      value: settings.smsNotifications,
    },
    {
      id: 'marketingEmails',
      title: 'Marketing Emails',
      subtitle: 'Receive promotional content',
      icon: 'megaphone',
      type: 'toggle',
      value: settings.marketingEmails,
    },
    {
      id: 'autoPayout',
      title: 'Auto Payout',
      subtitle: 'Automatically transfer earnings',
      icon: 'card',
      type: 'toggle',
      value: settings.autoPayout,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: 'shield-checkmark',
      type: 'navigation',
      route: '/privacy-security',
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      type: 'navigation',
      route: '/help-support',
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and information',
      icon: 'information-circle',
      type: 'navigation',
      route: '/about',
    },
    {
      id: 'logout',
      title: 'Logout',
      subtitle: 'Sign out of your account',
      icon: 'log-out',
      type: 'action',
      action: handleLogout,
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={() => {
        if (item.type === 'toggle') {
          handleToggle(item.id as keyof typeof settings);
        } else if (item.type === 'navigation' && item.route) {
          router.push(item.route as any);
        } else if (item.type === 'action' && item.action) {
          item.action();
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={() => handleToggle(item.id as keyof typeof settings)}
            trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
            thumbColor={item.value ? Colors.primary : Colors.textLight}
          />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textLight}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizer Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsContainer}>
            {settingItems.slice(0, 1).map(renderSettingItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsContainer}>
            {settingItems.slice(2, 6).map(renderSettingItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <View style={styles.settingsContainer}>
            {settingItems.slice(6, 7).map(renderSettingItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsContainer}>
            {settingItems.slice(7, 10).map(renderSettingItem)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingsContainer}>
            {settingItems.slice(10).map(renderSettingItem)}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Organization Profile</Text>
            <View style={styles.placeholder} />
          </View>
          <OrganizerProfileForm
            onSave={handleProfileSave}
            onCancel={() => setShowProfileModal(false)}
          />
        </SafeAreaView>
      </Modal>
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 16,
  },
  settingsContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
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
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
}); 