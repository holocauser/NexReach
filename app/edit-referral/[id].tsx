import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReferralStore } from '@/store/referralStore';
import { Referral } from '@/types';
import Colors from '@/constants/Colors';
import { Save, X } from 'lucide-react-native';

export default function EditReferralScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { referrals, updateReferral } = useReferralStore();

  const [referral, setReferral] = useState<Referral | null>(null);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'pending' | 'successful' | 'unsuccessful'>('pending');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const referralToEdit = referrals.find(r => r.id === id);
    if (referralToEdit) {
      setReferral(referralToEdit);
      setAmount(referralToEdit.value.toString());
      setStatus(referralToEdit.outcome);
      setNotes(referralToEdit.notes || '');
    }
  }, [id, referrals]);

  const handleSave = async () => {
    if (!referral || isSaving) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      Alert.alert('Invalid Input', 'Please enter a valid number for the amount.');
      return;
    }

    setIsSaving(true);

    const updatedReferral: Partial<Referral> & { id: string } = {
      id: referral.id,
      value: parsedAmount,
      outcome: status,
      notes: notes,
    };

    try {
      await updateReferral(updatedReferral);
      Alert.alert('Success', 'Referral updated successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      Alert.alert('Update Failed', `Could not update referral: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!referral) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Referral not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Referral</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Amount Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Referral Amount</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="$0.00"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.statusContainer}>
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'successful', label: 'Successful' },
                { key: 'unsuccessful', label: 'Unsuccessful' }
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.statusButton,
                    status === key && styles.statusButtonActive
                  ]}
                  onPress={() => setStatus(key as 'pending' | 'successful' | 'unsuccessful')}
                >
                  <Text style={[
                    styles.statusButtonText,
                    status === key && styles.statusButtonTextActive
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              placeholder="Add any relevant notes here..."
              placeholderTextColor={Colors.textLight}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBFD',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerSection: {
    backgroundColor: Colors.white,
    marginHorizontal: -20,
    marginTop: -24,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'System',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
  },
  section: {
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontFamily: 'System',
  },
  amountInput: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'System',
    minHeight: 48,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    minWidth: 100,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'System',
  },
  statusButtonTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'System',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'System',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: 'System',
  },
}); 