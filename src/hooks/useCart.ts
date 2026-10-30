import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookDTO } from '../sharedTypes';

export interface CartItem {
  book: BookDTO;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (book: BookDTO) => void;
  decrement: (bookId: string) => void;
  remove: (bookId: string) => void;
  removeMany: (bookIds: string[]) => void;
  clear: () => void;
}

const useCartStore = create<CartState>()(persist((set) => ({
  items: [],
  add: (book) => set((state) => {
    const current = state.items.find((item) => item.book.id === book.id);
    if (!current) return { items: [...state.items, { book, quantity: 1 }] };
    return { items: state.items.map((item) => item.book.id === book.id
      ? { book, quantity: Math.min(item.quantity + 1, book.stock) }
      : item) };
  }),
  decrement: (bookId) => set((state) => ({ items: state.items.flatMap((item) => {
    if (item.book.id !== bookId) return [item];
    return item.quantity <= 1 ? [] : [{ ...item, quantity: item.quantity - 1 }];
  }) })),
  remove: (bookId) => set((state) => ({ items: state.items.filter((item) => item.book.id !== bookId) })),
  removeMany: (bookIds) => set((state) => ({ items: state.items.filter((item) => !bookIds.includes(item.book.id)) })),
  clear: () => set({ items: [] }),
}), {
  name: 'fubooks-cart-v1',
  storage: createJSONStorage(() => AsyncStorage),
  version: 2,
  migrate: (persisted) => {
    const state = persisted as { items?: unknown[] };
    return {
      items: (state.items ?? []).flatMap((value) => {
        if (!value || typeof value !== 'object') return [];
        if ('book' in value && 'quantity' in value) return [value as CartItem];
        return [{ book: value as BookDTO, quantity: 1 }];
      }),
    };
  },
}));

export const useCart = useCartStore;
