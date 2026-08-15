import { create } from 'zustand';

export const SEARCH_PAGE_SIZES = [5, 10, 20] as const;
export type SearchPageSize = (typeof SEARCH_PAGE_SIZES)[number];

type SearchUiState = {
  inputValue: string;
  submittedQuery: string;
  page: number;
  pageSize: SearchPageSize;
  isPageSizeMenuOpen: boolean;
  hydrateQuery: (query: string) => void;
  setInputValue: (value: string) => void;
  submitSearch: () => void;
  clearSearch: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: SearchPageSize) => void;
  setPageSizeMenuOpen: (isOpen: boolean) => void;
};

export const useSearchUiStore = create<SearchUiState>((set, get) => ({
  inputValue: '',
  submittedQuery: '',
  page: 1,
  pageSize: 20,
  isPageSizeMenuOpen: false,
  hydrateQuery: (query) => {
    const submittedQuery = query.trim();
    if (!submittedQuery) return;
    set({ inputValue: submittedQuery, submittedQuery, page: 1, isPageSizeMenuOpen: false });
  },
  setInputValue: (inputValue) => set({ inputValue }),
  submitSearch: () => {
    const submittedQuery = get().inputValue.trim();
    if (!submittedQuery) return;
    set({ submittedQuery, inputValue: submittedQuery, page: 1, isPageSizeMenuOpen: false });
  },
  clearSearch: () =>
    set({ inputValue: '', submittedQuery: '', page: 1, isPageSizeMenuOpen: false }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1, isPageSizeMenuOpen: false }),
  setPageSizeMenuOpen: (isPageSizeMenuOpen) => set({ isPageSizeMenuOpen }),
}));
