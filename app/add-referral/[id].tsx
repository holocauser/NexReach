import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, X, Search, ArrowRight, DollarSign, Calendar, FileText } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useCardStore } from '@/store/cardStore';
import { useReferralStore } from '@/store/referralStore';
import { BusinessCard, Referral } from '@/types';
import { caseTypeOptions } from '@/data/mockData';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStore } from '@/store/userStore';
import * as Crypto from 'expo-crypto';

const { height: screenHeight } = Dimensions.get('window');

export default function AddReferralScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { cards, getCardById } = useCardStore();
  const { addReferral } = useReferralStore();
  const { user } = useAuth();
  const { profile } = useUserStore();
  
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [referralType, setReferralType] = useState<'sent' | 'received'>('sent');
  const [showCaseTypeModal, setShowCaseTypeModal] = useState(false);
  const [caseTypeSearch, setCaseTypeSearch] = useState('');
  
  const [formData, setFormData] = useState({
    caseType: '',
    value: '',
    notes: '',
    date: new Date(),
  });

  useEffect(() => {
    if (id) {
      const card = getCardById(id as string);
      setSelectedCard(card || null);
    }
  }, [id]);

  const getFilteredCaseTypes = () => {
    return caseTypeOptions.filter(caseType =>
      caseType.toLowerCase().includes(caseTypeSearch.toLowerCase())
    );
  };

  const handleSaveReferral = () => {
    if (!selectedCard || !formData.caseType) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Get current user ID
    const userId = user?.id || profile?.id || 'default-user-id';

    const newReferral: Referral = {
      id: Crypto.randomUUID(),
      referrerId: referralType === 'sent' ? userId : selectedCard.id,
      recipientId: referralType === 'sent' ? selectedCard.id : userId,
      date: formData.date,
      caseType: formData.caseType,
      outcome: 'pending',
      value: parseFloat(formData.value) || 0,
      direction: referralType,
      notes: referralType === 'sent' 
        ? `I referred a client to ${selectedCard.name} (${selectedCard.title}) for a ${formData.caseType} case. ${formData.notes}`
        : `${selectedCard.name} (${selectedCard.title}) referred a client to me for a ${formData.caseType} case. ${formData.notes}`,
    };

    addReferral(newReferral);
    
    Alert.alert('Success', 'Referral has been logged successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const selectCaseType = (caseType: string) => {
    setFormData({ ...formData, caseType });
    setShowCaseTypeModal(false);
    setCaseTypeSearch('');
  };

  const openCaseTypeModal = () => {
    setCaseTypeSearch('');
    setShowCaseTypeModal(true);
  };

  if (!selectedCard) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Referral</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contact not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Referral</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Referral Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  referralType === 'sent' && styles.typeButtonActive
                ]}
                onPress={() => setReferralType('sent')}
              >
                <Text style={[
                  styles.typeButtonText,
                  referralType === 'sent' && styles.typeButtonTextActive
                ]}>
                  Referral Sent
                </Text>
                <Text style={styles.typeButtonSubtext}>
                  I referred a client to {selectedCard.name}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  referralType === 'received' && styles.typeButtonActive
                ]}
                onPress={() => setReferralType('received')}
              >
                <Text style={[
                  styles.typeButtonText,
                  referralType === 'received' && styles.typeButtonTextActive
                ]}>
                  Referral Received
                </Text>
                <Text style={styles.typeButtonSubtext}>
                  {selectedCard.name} referred a client to me
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Flow Visualization */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral Flow</Text>
            <View style={styles.flowContainer}>
              <View style={styles.flowCard}>
                <Text style={styles.flowLabel}>
                  {referralType === 'sent' ? 'From (You)' : 'From'}
                </Text>
                <Text style={styles.flowName}>
                  {referralType === 'sent' ? 'Me' : selectedCard.name}
                </Text>
                <Text style={styles.flowCompany}>
                  {referralType === 'sent' ? 'Your Practice' : selectedCard.company}
                </Text>
              </View>

              <View style={styles.arrowContainer}>
                <ArrowRight size={24} color={Colors.primary} />
              </View>

              <View style={styles.flowCard}>
                <Text style={styles.flowLabel}>
                  {referralType === 'sent' ? 'To' : 'To (You)'}
                </Text>
                <Text style={styles.flowName}>
                  {referralType === 'sent' ? selectedCard.name : 'Me'}
                </Text>
                <Text style={styles.flowCompany}>
                  {referralType === 'sent' ? selectedCard.company : 'Your Practice'}
                </Text>
              </View>
            </View>
          </View>

          {/* Case Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Case Type *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={openCaseTypeModal}
            >
              <Text style={[
                styles.selectButtonText,
                !formData.caseType && styles.selectButtonPlaceholder
              ]}>
                {formData.caseType || 'Select case type'}
              </Text>
              <Search size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Referral Value */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimated Value (Optional)</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={formData.value}
                onChangeText={(text) => setFormData({ ...formData, value: text })}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
            <Text style={styles.helpText}>
              Estimated value of this referral (for tracking purposes)
            </Text>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={Colors.textSecondary} />
              <Text style={styles.dateText}>
                {format(formData.date, 'MMMM d, yyyy')}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color={Colors.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Add any additional details about this referral..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !formData.caseType && styles.saveButtonDisabled
            ]}
            onPress={handleSaveReferral}
            disabled={!formData.caseType}
          >
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Log Referral</Text>
          </TouchableOpacity>

          {/* Bottom spacing for keyboard */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Case Type Selection Modal */}
      <Modal
        visible={showCaseTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCaseTypeModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCaseTypeModal(false)}
          />
          
          <KeyboardAvoidingView 
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Case Type</Text>
                <TouchableOpacity 
                  onPress={() => setShowCaseTypeModal(false)} 
                  style={styles.modalCloseButton}
                >
                  <X size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalSearchContainer}>
                <Search size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search case types..."
                  placeholderTextColor={Colors.textLight}
                  value={caseTypeSearch}
                  onChangeText={setCaseTypeSearch}
                  autoFocus={true}
                  returnKeyType="search"
                />
                {caseTypeSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCaseTypeSearch('')}>
                    <X size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={getFilteredCaseTypes()}
                keyExtractor={(item) => item}
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalCaseTypeItem}
                    onPress={() => selectCaseType(item)}
                  >
                    <Text style={styles.modalCaseTypeText}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No case types found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
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
    padding: 16,
    paddingTop: 48,
    backgroundColor: Colors.primary,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  typeButtons: {
    gap: 12,
  },
  typeButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  typeButtonSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowCard: {
    flex: 1,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  flowLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  flowName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  flowCompany: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  arrowContainer: {
    paddingHorizontal: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
    minHeight: 48,
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaIcon: {
    marginTop: 4,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // Modal Styles - Improved positioning
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalKeyboardView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.85,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
    minHeight: screenHeight * 0.5,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  modalList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalCaseTypeItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCaseTypeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editContactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  editContactButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
  },
  cancelEditButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  cancelEditButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.error,
  },
});