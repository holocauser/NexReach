import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCard } from '@/types';
import { mockCards } from '@/data/mockData';

interface CardState {
  cards: BusinessCard[];
  favorites: BusinessCard[];
  isLoaded: boolean;
  addCard: (card: BusinessCard) => void;
  updateCard: (card: BusinessCard) => void;
  deleteCard: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setReminder: (id: string, hasReminder: boolean) => void;
  updateLastContacted: (id: string, date: Date) => void;
  getCardById: (id: string) => BusinessCard | undefined;
  filterCardsByTag: (tag: string) => BusinessCard[];
  loadCards: () => Promise<void>;
  saveCards: (cards: BusinessCard[]) => Promise<void>;
}

const STORAGE_KEY = '@cardlink_business_cards';

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  favorites: [],
  isLoaded: false,
  
  loadCards: async () => {
    try {
      const storedCards = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (storedCards) {
        const parsedCards: BusinessCard[] = JSON.parse(storedCards).map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
          lastContacted: card.lastContacted ? new Date(card.lastContacted) : undefined,
        }));
        
        set({
          cards: parsedCards,
          favorites: parsedCards.filter(card => card.favorited),
          isLoaded: true,
        });
      } else {
        // First time loading - use mock data and save it
        const cardsWithDates = mockCards.map(card => ({
          ...card,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
          lastContacted: card.lastContacted ? new Date(card.lastContacted) : undefined,
        }));
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cardsWithDates));
        
        set({
          cards: cardsWithDates,
          favorites: cardsWithDates.filter(card => card.favorited),
          isLoaded: true,
        });
      }
    } catch (error) {
      console.error('Error loading cards from storage:', error);
      // Fallback to mock data if storage fails
      set({
        cards: mockCards,
        favorites: mockCards.filter(card => card.favorited),
        isLoaded: true,
      });
    }
  },
  
  saveCards: async (cards: BusinessCard[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards to storage:', error);
    }
  },
  
  addCard: (card) => {
    const newCards = [card, ...get().cards];
    set({
      cards: newCards,
      favorites: card.favorited ? [card, ...get().favorites] : get().favorites
    });
    get().saveCards(newCards);
  },
  
  updateCard: (updatedCard) => {
    const updatedCards = get().cards.map(card => 
      card.id === updatedCard.id ? { ...updatedCard, updatedAt: new Date() } : card
    );
    
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
  },
  
  deleteCard: (id) => {
    const updatedCards = get().cards.filter(card => card.id !== id);
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
  },
  
  toggleFavorite: (id) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, favorited: !card.favorited, updatedAt: new Date() } : card
    );
    
    set({
      cards: updatedCards,
      favorites: updatedCards.filter(card => card.favorited)
    });
    get().saveCards(updatedCards);
  },
  
  setReminder: (id, hasReminder) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, reminder: hasReminder, updatedAt: new Date() } : card
    );
    
    set({ cards: updatedCards });
    get().saveCards(updatedCards);
  },
  
  updateLastContacted: (id, date) => {
    const updatedCards = get().cards.map(card => 
      card.id === id ? { ...card, lastContacted: date, updatedAt: new Date() } : card
    );
    
    set({ cards: updatedCards });
    get().saveCards(updatedCards);
  },
  
  getCardById: (id) => {
    return get().cards.find(card => card.id === id);
  },
  
  filterCardsByTag: (tag) => {
    return get().cards.filter(card => card.tags.includes(tag));
  }
}));