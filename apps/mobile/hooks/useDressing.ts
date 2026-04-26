import type { DressingItem, ClothingCategory } from '@outfit-now/shared-types';
import { create } from 'zustand';


import { getDressingItems, markAsWorn, deleteDressingItem } from '../lib/dressing';

interface DressingState {
  items: DressingItem[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  page: number;
  categoryFilter: ClothingCategory | null;
  loadItems: (reset?: boolean) => Promise<void>;
  setCategoryFilter: (cat: ClothingCategory | null) => void;
  markWorn: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  addItem: (item: DressingItem) => void;
}

export const useDressingStore = create<DressingState>((set, get) => ({
  items: [],
  total: 0,
  hasMore: true,
  isLoading: false,
  page: 1,
  categoryFilter: null,

  loadItems: async (reset = false) => {
    const { page, categoryFilter, isLoading, hasMore } = get();
    if (isLoading || (!reset && !hasMore)) return;

    const currentPage = reset ? 1 : page;
    set({ isLoading: true });

    try {
      const res = await getDressingItems({
        page: currentPage,
        pageSize: 20,
        ...(categoryFilter && { category: categoryFilter }),
      });

      set((s) => ({
        items: reset ? res.data : [...s.items, ...res.data],
        total: res.total,
        hasMore: res.hasMore,
        page: currentPage + 1,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  setCategoryFilter: (cat) => {
    set({ categoryFilter: cat, page: 1, items: [], hasMore: true });
    void get().loadItems(true);
  },

  markWorn: async (id) => {
    await markAsWorn(id);
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, wornCount: item.wornCount + 1, lastWornAt: new Date().toISOString() } : item,
      ),
    }));
  },

  removeItem: async (id) => {
    await deleteDressingItem(id);
    set((s) => ({ items: s.items.filter((item) => item.id !== id), total: s.total - 1 }));
  },

  addItem: (item) => {
    set((s) => ({ items: [item, ...s.items], total: s.total + 1 }));
  },
}));
