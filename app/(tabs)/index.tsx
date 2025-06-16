import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { Search, X, Settings, Star, FileText, Mic, File } from 'lucide-react-native';
import { useCardStore } from '@/store/cardStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import BusinessCardItem from '@/components/BusinessCardItem';
import { tagOptions } from '@/data/mockData';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { filterProviders } from '@/utils/locationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FileStorageScreen from '../../components/FileStorageScreen';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function MyCardsScreen() {
  const router = useRouter();
  const { cards, toggleFavorite, favorites } = useCardStore();
  console.log('MyCardsScreen cards from store:', cards);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [globalFilesTab, setGlobalFilesTab] = useState<'files' | 'voice'>('files');
  const [tagSearch, setTagSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('Orlando'); // Default city
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Sort cards by creation date (newest first) to show scanned cards at the top
  const sortedCards = [...cards].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get filtered tags based on search
  const getFilteredTags = () => {
    return tagOptions.filter(tag =>
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  };

  const handleCardPress = (id: string) => {
    router.push(`/contact-details/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/edit-card/${id}`);
  };

  const handleAddVoiceNote = (id: string) => {
    console.log('Add voice note to card:', id);
  };

  const handleLogReferral = (id: string) => {
    router.push(`/add-referral/${id}`);
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTag(prev => (prev === tag ? null : tag));
    setShowTagModal(false);
    setTagSearch('');
  };

  const clearTagFilter = () => {
    setSelectedTag(null);
    setShowTagModal(false);
    setTagSearch('');
  };

  // Get popular tags from existing cards
  const getPopularTags = () => {
    const tagCounts: Record<string, number> = {};
    cards.forEach(card => {
      (card.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  };

  const popularTags = getPopularTags();

  const handleFileIconPress = (cardId: string) => {
    setSelectedCardId(cardId);
    setModalVisible(true);
  };

  const handleOpenFile = async (url: string) => {
    const fileInfo = await FileSystem.getInfoAsync(url);
    if (fileInfo.exists) {
      try {
        const sharedFile = await FileSystem.readAsStringAsync(url);
        await Sharing.shareAsync(sharedFile, { mimeType: 'text/plain' });
      } catch (error) {
        console.error('Error sharing file:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>My Cards</Text>
              <Text style={styles.headerSubtitle}>
                {sortedCards.length} {sortedCards.length === 1 ? 'card' : 'cards'}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowFavoritesModal(true)}
              >
                <Star size={20} color={Colors.favorite} fill={Colors.favorite} />
                {cards.length > 0 && favorites.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{favorites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* File icon with total file count */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowFilesModal(true)}
              >
                <FileText size={20} color={Colors.textSecondary} />
                {cards && cards.reduce((sum, card) => sum + (card.files ? card.files.length : 0), 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cards.reduce((sum, card) => sum + (card.files ? card.files.length : 0), 0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Debug: Clear all cards button (only in dev) */}
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={async () => {
                    await AsyncStorage.removeItem('@cardlink_business_cards');
                    Alert.alert('Storage Cleared', 'All cards have been removed. Restart the app to see changes.');
                  }}
                >
                  <Text style={{ color: Colors.error, fontWeight: 'bold', fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Settings size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainerRow}>
          <TouchableOpacity
            onPress={() => router.push('/scan')}
            style={styles.scanButton}
          >
            <Text style={styles.scanButtonText}>Scan New Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tagFilterButton}
            onPress={() => setShowTagModal(true)}
          >
            <Search size={16} color={Colors.primary} />
            <Text style={styles.tagFilterButtonText}>
              {selectedTag ? `Tag: ${selectedTag}` : 'Filter by Tag'}
            </Text>
            {selectedTag && (
              <TouchableOpacity
                onPress={clearTagFilter}
                style={styles.clearTagButton}
              >
                <X size={14} color={Colors.error} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={sortedCards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusinessCardItem
              card={item}
              onPress={handleCardPress}
              onToggleFavorite={toggleFavorite}
              onEdit={handleEdit}
              onAddVoiceNote={handleAddVoiceNote}
              onFileIconPress={() => handleFileIconPress(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No business cards found</Text>
              <Text style={styles.emptySubtext}>
                Add new cards by scanning business cards or creating them manually.
              </Text>
            </View>
          }
        />

        {/* Favorites Modal */}
        <Modal
          visible={showFavoritesModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFavoritesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Favorite Contacts</Text>
                <TouchableOpacity 
                  onPress={() => setShowFavoritesModal(false)} 
                  style={styles.modalCloseButton}
                >
                  <X size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                style={styles.favoritesList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.favoriteItem}
                    onPress={() => {
                      setShowFavoritesModal(false);
                      handleCardPress(item.id);
                    }}
                  >
                    <View style={styles.favoriteAvatar}>
                      <Text style={styles.favoriteAvatarText}>
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.favoriteInfo}>
                      <Text style={styles.favoriteName}>{item.name}</Text>
                      <Text style={styles.favoriteCompany}>{item.company}</Text>
                    </View>
                    <Star size={20} color={Colors.favorite} fill={Colors.favorite} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyFavoritesContainer}>
                    <Star size={48} color={Colors.textLight} />
                    <Text style={styles.emptyFavoritesText}>No favorites yet</Text>
                    <Text style={styles.emptyFavoritesSubtext}>
                      Tap the star on any contact to add them to favorites
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Tag Search Modal */}
        <Modal
          visible={showTagModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTagModal(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
              <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter by Tag</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowTagModal(false);
                      setTagSearch('');
                    }} 
                    style={styles.modalCloseButton}
                  >
                    <X size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalSearchContainer}>
                  <Search size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Type to search tags..."
                    placeholderTextColor={Colors.textLight}
                    value={tagSearch}
                    onChangeText={setTagSearch}
                    autoFocus={true}
                  />
                  {tagSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setTagSearch('')}>
                      <X size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <FlatList
                  data={getFilteredTags()}
                  keyExtractor={(item) => item}
                  style={styles.modalTagsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.modalTagItem,
                        selectedTag === item && styles.modalTagItemSelected
                      ]}
                      onPress={() => toggleTagFilter(item)}
                    >
                      <Text style={[
                        styles.modalTagText,
                        selectedTag === item && styles.modalTagTextSelected
                      ]}>
                        {item}
                      </Text>
                      {selectedTag === item && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No tags found matching "{tagSearch}"
                      </Text>
                    </View>
                  }
                />
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    onPress={clearTagFilter}
                    style={styles.clearAllButton}
                  >
                    <Text style={styles.clearAllButtonText}>Clear Filter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowTagModal(false);
                      setTagSearch('');
                    }}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Global Files Modal */}
        <Modal
          visible={showFilesModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Files & Voice Notes</Text>
                <TouchableOpacity onPress={() => setShowFilesModal(false)} style={styles.modalCloseButton}>
                  <X size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              
              {/* Tab Switcher */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, globalFilesTab === 'files' && styles.tabBtnActive]}
                  onPress={() => setGlobalFilesTab('files')}
                >
                  <FileText size={20} color={globalFilesTab === 'files' ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.tabLabel, globalFilesTab === 'files' && styles.tabLabelActive]}>Files</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, globalFilesTab === 'voice' && styles.tabBtnActive]}
                  onPress={() => setGlobalFilesTab('voice')}
                >
                  <Mic size={20} color={globalFilesTab === 'voice' ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.tabLabel, globalFilesTab === 'voice' && styles.tabLabelActive]}>Voice Notes</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <FlatList
                data={globalFilesTab === 'files' 
                  ? cards.flatMap(card => (card.files || []).map(file => ({ 
                      ...file, 
                      cardName: card.name,
                      type: file.type || 'unknown'
                    })))
                  : cards.flatMap(card => (card.voiceNotes || []).map(note => ({ 
                      id: note.id,
                      url: note.url,
                      createdAt: note.createdAt,
                      cardName: card.name,
                      name: `Voice Note ${note.id}`,
                      type: 'audio'
                    })))
                }
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.fileCard}
                    onPress={() => handleOpenFile(item.url)}
                  >
                    <View style={styles.fileIconContainer}>
                      {globalFilesTab === 'files' ? (
                        <File size={24} color={Colors.primary} />
                      ) : (
                        <Mic size={24} color={Colors.primary} />
                      )}
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>{item.name}</Text>
                      <Text style={styles.fileMeta}>
                        {item.cardName} • {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleOpenFile(item.url)}
                      style={styles.fileAction}
                    >
                      <File size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No {globalFilesTab === 'files' ? 'files' : 'voice notes'} yet
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Add {globalFilesTab === 'files' ? 'files' : 'voice notes'} to your contacts to see them here
                    </Text>
                  </View>
                }
                contentContainerStyle={styles.filesList}
              />
            </View>
          </View>
        </Modal>

        <FileStorageScreen
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          cardId={selectedCardId || ''}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBackground,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: Colors.cardBackground,
  },
  actionContainerRow: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: Colors.cardBackground,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  tagFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tagFilterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  clearTagButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
    width: '95%',
    alignSelf: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
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
  favoritesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  favoriteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteAvatarText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  favoriteCompany: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  emptyFavoritesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyFavoritesText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyFavoritesSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  modalTagsList: {
    flex: 2,
    paddingHorizontal: 16,
    maxHeight: 350,
    minHeight: 100,
    overflow: 'scroll',
  },
  modalTagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: 8,
  },
  modalTagItemSelected: {
    backgroundColor: `${Colors.primary}10`,
  },
  modalTagText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textPrimary,
    flex: 1,
  },
  modalTagTextSelected: {
    color: Colors.primary,
    fontFamily: 'Inter-Medium',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.cardBackground,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearAllButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.cardBackground,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  fileAction: {
    padding: 8,
  },
  filesList: {
    padding: 16,
  },
});