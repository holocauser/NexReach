import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView, Alert } from 'react-native';
import { Search, X, Settings, Star, FileText, Mic, File, Trash2 } from 'lucide-react-native';
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
import { Swipeable } from 'react-native-gesture-handler';
import GlobalFileStorageScreen from '@/components/GlobalFileStorageScreen';
import { FileService } from '@/lib/fileService';
import { useAuth } from '@/contexts/AuthContext';
import { useReferralStore } from '@/store/referralStore';

export default function MyCardsScreen() {
  const router = useRouter();
  const { cards, toggleFavorite, favorites, resetToMockCards, syncDatabaseWithLocalState, clearAllCardsFromDatabase, cleanupDuplicateScannedCards } = useCardStore();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGlobalFileStorage, setShowGlobalFileStorage] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('Orlando'); // Default city
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [totalFileCount, setTotalFileCount] = useState(0);
  const cardRefreshRefs = useRef<{ [key: string]: () => void }>({});

  // Fetch real-time file counts
  useEffect(() => {
    if (user) {
      fetchTotalFileCount();
    }
  }, [user]);

  const fetchTotalFileCount = async () => {
    if (!user) return;
    try {
      const [filesData, voiceNotesData] = await Promise.all([
        FileService.getAllFiles(user.id),
        FileService.getAllVoiceNotes(user.id),
      ]);
      
      const totalCount = (filesData?.length || 0) + (voiceNotesData?.length || 0);
      setTotalFileCount(totalCount);
    } catch (error) {
      console.error('Error fetching file count:', error);
    }
  };

  const refreshCardFileCount = async (cardId: string) => {
    // Call the specific card's refresh function
    if (cardRefreshRefs.current[cardId]) {
      cardRefreshRefs.current[cardId]();
    }
  };

  const registerCardRefresh = (cardId: string, refreshFunction: () => void) => {
    cardRefreshRefs.current[cardId] = refreshFunction;
  };

  // Sort cards by creation date (newest first) to show scanned cards at the top
  const sortedCards = [...cards].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Filter cards based on selected tag
  const filteredCards = selectedTag 
    ? sortedCards.filter(card => card.tags && card.tags.includes(selectedTag))
    : sortedCards;

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
    console.log('toggleTagFilter called with tag:', tag);
    console.log('Current selectedTag:', selectedTag);
    setSelectedTag(prev => {
      const newTag = prev === tag ? null : tag;
      console.log('New selectedTag will be:', newTag);
      return newTag;
    });
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

  const handleDeleteFile = async (item: any, type: 'file' | 'voice') => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { cards, updateCard, getCardById } = useCardStore.getState();
              
              // Find the card that contains this file/voice note
              const card = cards.find(c => 
                type === 'file' 
                  ? (c.files || []).some(f => f.id === item.id)
                  : (c.voiceNotes || []).some(v => v.id === item.id)
              );
              
              if (!card) {
                Alert.alert('Error', 'Could not find the associated card');
                return;
              }

              // Delete from file system - handle both possible path structures
              try {
                // Try the direct URL first
                await FileSystem.deleteAsync(item.url);
              } catch (fileError) {
                // If that fails, try constructing the path based on type
                try {
                  if (type === 'file') {
                    const filesDir = `${FileSystem.documentDirectory}files/${card.id}`;
                    await FileSystem.deleteAsync(`${filesDir}/${item.id}`);
                  } else {
                    const recordingsDir = `${FileSystem.documentDirectory}recordings/${card.id}`;
                    await FileSystem.deleteAsync(`${recordingsDir}/${item.id}`);
                  }
                } catch (pathError) {
                  console.log('File not found in file system, but will remove from store:', pathError);
                  // Continue with store update even if file doesn't exist
                }
              }

              // Update card store
              if (type === 'file') {
                const updatedCard = {
                  ...card,
                  files: (card.files || []).filter(f => f.id !== item.id)
                };
                updateCard(updatedCard);
              } else {
                const updatedCard = {
                  ...card,
                  voiceNotes: (card.voiceNotes || []).filter(v => v.id !== item.id)
                };
                updateCard(updatedCard);
              }

              Alert.alert('Success', 'File deleted successfully');
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          }
        }
      ]
    );
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status. Please try again.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteCard } = useCardStore.getState();
              await deleteCard(id);
              console.log('Card deleted successfully');
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderSwipeableCard = ({ item }: { item: any }) => {
    const renderRightActions = () => {
      return (
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={() => handleDeleteCard(item.id)}
        >
          <Trash2 size={24} color="white" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={40}
        overshootRight={false}
      >
        <BusinessCardItem
          card={item}
          onPress={handleCardPress}
          onToggleFavorite={handleToggleFavorite}
          onEdit={handleEdit}
          onAddVoiceNote={handleAddVoiceNote}
          onFileIconPress={() => handleFileIconPress(item.id)}
          onFileChange={fetchTotalFileCount}
          registerRefresh={registerCardRefresh}
        />
      </Swipeable>
    );
  };

  const handleReset = async () => {
    try {
      console.log('🔄 Starting reset process...');
      
      // Clear all data and reset to mock cards
      await resetToMockCards(true, true);
      
      // Reset events to mock data
      const { useEventStore } = await import('@/store/eventStore');
      await useEventStore.getState().resetEventsToMock();
      
      console.log('✅ Reset completed successfully');
      Alert.alert('Success', 'Database reset successfully. Mock cards and events loaded.');
    } catch (error) {
      console.error('❌ Error during reset:', error);
      Alert.alert('Error', 'Failed to reset database. Please try again.');
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
                {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
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
                {totalFileCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalFileCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Reset to Mock Cards Button (Development) */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  Alert.alert(
                    'Reset & Seed Database',
                    'This will DELETE all data in the database and replace it with mock cards and events. This cannot be undone. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Reset', style: 'destructive', onPress: handleReset }
                    ]
                  );
                }}
              >
                <Text style={[styles.headerButtonText, { fontSize: 12 }]}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/profile')}
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
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={renderSwipeableCard}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedTag ? `No cards found with tag "${selectedTag}"` : 'No business cards found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedTag 
                  ? 'Try selecting a different tag or clear the filter'
                  : 'Add new cards by scanning business cards or creating them manually.'
                }
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
                  data={['Show All', ...getFilteredTags()]}
                  keyExtractor={(item) => item}
                  style={styles.modalTagsList}
                  renderItem={({ item }) => {
                    const isSelected = item === 'Show All' ? selectedTag === null : selectedTag === item;
                    console.log(`Rendering tag: ${item}, isSelected: ${isSelected}, selectedTag: ${selectedTag}`);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.modalTagItem,
                          isSelected && styles.modalTagItemSelected
                        ]}
                        onPress={() => item === 'Show All' ? clearTagFilter() : toggleTagFilter(item)}
                      >
                        <Text style={[
                          styles.modalTagText,
                          isSelected && styles.modalTagTextSelected
                        ]}>
                          {item}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        No tags found matching "{tagSearch}"
                      </Text>
                      <Text style={styles.noResultsSubtext}>
                        Try a different search term or use "Show All" to see all available tags
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
        <GlobalFileStorageScreen
          visible={showFilesModal}
          onClose={() => setShowFilesModal(false)}
          onFileChange={fetchTotalFileCount}
        />

        <FileStorageScreen
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          cardId={selectedCardId || ''}
          onFileChange={fetchTotalFileCount}
          onCardFileChange={refreshCardFileCount}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
    width: '90%',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
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
    margin: 20,
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
  modalTagsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalTagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRadius: 8,
    marginBottom: 4,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmarkText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    justifyContent: 'space-between',
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
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileAction: {
    padding: 8,
  },
  filesList: {
    padding: 16,
  },
  swipeDeleteButton: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  swipeDeleteText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  headerButtonText: {
    color: Colors.textSecondary,
    fontFamily: 'Inter-Medium',
  },
});