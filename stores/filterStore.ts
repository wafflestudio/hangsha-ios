import { create } from 'zustand';

import type { Category } from '@/types/category';

export type FilterTab = 'category' | 'org' | 'status' | 'exclude';

type FilterUiState = {
  activeTab: FilterTab;
  selectedCategory: Category[];
  selectedOrg: Category[];
  selectedStatus: Category[];
  hasAppliedDefaultStatus: boolean;
  setActiveTab: (tab: FilterTab) => void;
  toggle: (tab: FilterTab, item: Category) => void;
  toggleAll: (tab: FilterTab, list: Category[]) => void;
  resetAll: () => void;
  applyDefaultStatus: (defaultStatus: Category) => void;
};

const getSelection = (state: FilterUiState, tab: FilterTab): Category[] => {
  if (tab === 'category') return state.selectedCategory;
  if (tab === 'org') return state.selectedOrg;
  if (tab === 'status') return state.selectedStatus;
  return [];
};

const setSelection = (tab: FilterTab, next: Category[]) => {
  if (tab === 'category') return { selectedCategory: next };
  if (tab === 'org') return { selectedOrg: next };
  if (tab === 'status') return { selectedStatus: next };
  return {};
};

export const useFilterStore = create<FilterUiState>((set, get) => ({
  activeTab: 'category',
  selectedCategory: [],
  selectedOrg: [],
  selectedStatus: [],
  hasAppliedDefaultStatus: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  toggle: (tab, item) => {
    if (tab === 'exclude') return;
    const current = getSelection(get(), tab);
    const isSelected = current.some((c) => c.id === item.id);
    const next = isSelected ? current.filter((c) => c.id !== item.id) : [...current, item];
    set(setSelection(tab, next));
  },
  toggleAll: (tab, list) => {
    if (tab === 'exclude') return;
    const current = getSelection(get(), tab);
    const next = current.length === list.length ? [] : [...list];
    set(setSelection(tab, next));
  },
  resetAll: () => set({ selectedCategory: [], selectedOrg: [], selectedStatus: [] }),
  applyDefaultStatus: (defaultStatus) => {
    if (get().hasAppliedDefaultStatus) return;
    set({ selectedStatus: [defaultStatus], hasAppliedDefaultStatus: true });
  },
}));
