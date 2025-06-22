import { create } from 'zustand';

export type BusinessCard = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  isFavorite?: boolean;
  tags: string[];
};

type Store = {
  cards: BusinessCard[];
  addCard: (card: BusinessCard) => void;
  toggleFavorite: (id: string) => void;
};

export const useCardStore = create<Store>((set) => ({
  cards: [],
  addCard: (card) =>
    set((state) => ({
      cards: [...state.cards, card],
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, isFavorite: !card.isFavorite } : card
      ),
    })),
}));
