import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookDTO } from '../sharedTypes';

interface CartState {
  items: BookDTO[];
  add: (book: BookDTO) => void;
  remove: (bookId: string) => void;
  removeMany: (bookIds: string[]) => void;
  clear: () => void;
}

const useCartStore = create<CartState>()(persist((set) => ({
  items: [],
  add: (book) => set((state) => state.items.some((item) => item.id === book.id)
    ? state
    : { items: [...state.items, book] }),
  remove: (bookId) => set((state) => ({ items: state.items.filter((item) => item.id !== bookId) })),
  removeMany: (bookIds) => set((state) => ({ items: state.items.filter((item) => !bookIds.includes(item.id)) })),
  clear: () => set({ items: [] }),
}), {
  name: 'fubooks-cart-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));

export const useCart = useCartStore;
