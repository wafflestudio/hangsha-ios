import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect } from 'react';

import * as userApi from '@/api/user';
import type { BookmarksResponse } from '@/api/user';
import { eventKeys } from '@/api/event';
import { useAuth } from '@/contexts/AuthProvider';
import type { Category } from '@/types/category';
import type { Event } from '@/types/event';
import type { ExcludedKeyword, Memo, MemoUpdates } from '@/types/userData';

const BOOKMARK_PREVIEW_SIZE = 5;
const BOOKMARK_PAGE_SIZE = 20;

export const userDataKeys = {
  all: ['user-data'] as const,
  excludedKeywords: () => [...userDataKeys.all, 'excluded-keywords'] as const,
  bookmarksAll: () => [...userDataKeys.all, 'bookmarks'] as const,
  bookmarks: (page: number, size: number) => [...userDataKeys.bookmarksAll(), page, size] as const,
  interests: () => [...userDataKeys.all, 'interest-categories'] as const,
  memos: () => [...userDataKeys.all, 'memos'] as const,
  memosByTag: (tagId: number) => [...userDataKeys.memos(), 'tag', tagId] as const,
};

interface UserDataContextValue {
  bookmarkedEvents: Event[];
  interestCategories: Category[];
  excludedKeywords: ExcludedKeyword[];
  eventMemos: Memo[];
  isLoading: boolean;
  bookmarksLoading: boolean;
  interestCategoriesLoading: boolean;
  interestCategoriesSaving: boolean;
  interestCategoriesError: Error | null;
  memoLoading: boolean;
  excludedKeywordLoading: boolean;
  refreshUserData: () => Promise<void>;
  refreshBookmarks: () => Promise<void>;
  saveInterestPreferences: (categories: Category[]) => Promise<void>;
  addExcludedKeyword: (keyword: string) => Promise<void>;
  deleteExcludedKeyword: (id: number) => Promise<void>;
  toggleBookmark: (event: Event) => Promise<void>;
  getMemoByTag: (tagId: number) => Promise<Memo[]>;
  addMemo: (eventId: number, content: string, tagNames: string[]) => Promise<void>;
  deleteMemo: (id: number) => Promise<void>;
  updateMemo: (id: number, updates: MemoUpdates) => Promise<Memo>;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

export function useBookmarksPreview() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userDataKeys.bookmarks(1, BOOKMARK_PREVIEW_SIZE),
    queryFn: () => userApi.getBookmarks(1, BOOKMARK_PREVIEW_SIZE),
    enabled: isAuthenticated,
  });
}

export function useBookmarksInfinite() {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: [...userDataKeys.bookmarksAll(), 'infinite', BOOKMARK_PAGE_SIZE] as const,
    queryFn: ({ pageParam }) => userApi.getBookmarks(pageParam, BOOKMARK_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.size < lastPage.total ? lastPage.page + 1 : undefined,
    enabled: isAuthenticated,
  });
}

export function UserDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const excludedKeywordsQuery = useQuery({
    queryKey: userDataKeys.excludedKeywords(),
    queryFn: userApi.getExcludedKeywords,
    enabled: isAuthenticated,
  });
  const bookmarksPreviewQuery = useBookmarksPreview();
  const interestsQuery = useQuery({
    queryKey: userDataKeys.interests(),
    queryFn: userApi.getInterestCategories,
    enabled: isAuthenticated,
  });
  const memosQuery = useQuery({
    queryKey: userDataKeys.memos(),
    queryFn: userApi.getMemos,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) queryClient.removeQueries({ queryKey: userDataKeys.all });
  }, [isAuthenticated, queryClient]);

  const saveInterestsMutation = useMutation({
    mutationFn: userApi.saveInterestCategories,
    onSuccess: (_, categories) => {
      queryClient.setQueryData(userDataKeys.interests(), categories);
    },
  });
  const addExcludedKeywordMutation = useMutation({
    mutationFn: userApi.addExcludedKeyword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userDataKeys.excludedKeywords() }),
  });
  const deleteExcludedKeywordMutation = useMutation({
    mutationFn: userApi.deleteExcludedKeyword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userDataKeys.excludedKeywords() }),
  });
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (event: Event) => {
      const cachedBookmarkPages = queryClient.getQueriesData<BookmarksResponse>({
        queryKey: userDataKeys.bookmarksAll(),
      });
      const isBookmarked =
        cachedBookmarkPages.some(([, page]) => page?.items.some(({ id }) => id === event.id)) ||
        event.isBookmarked === true;
      await (isBookmarked ? userApi.removeBookmark(event.id) : userApi.addBookmark(event.id));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userDataKeys.bookmarksAll() }),
        queryClient.invalidateQueries({ queryKey: eventKeys.all }),
      ]);
    },
  });
  const addMemoMutation = useMutation({
    mutationFn: ({ eventId, content, tagNames }: { eventId: number; content: string; tagNames: string[] }) =>
      userApi.addMemo(eventId, content, tagNames),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userDataKeys.memos() }),
  });
  const deleteMemoMutation = useMutation({
    mutationFn: userApi.deleteMemo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userDataKeys.memos() }),
  });
  const updateMemoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: MemoUpdates }) =>
      userApi.updateMemo(id, updates),
    onSuccess: (updatedMemo) => {
      queryClient.setQueryData<Memo[]>(userDataKeys.memos(), (memos = []) =>
        memos.map((memo) => (memo.id === updatedMemo.id ? updatedMemo : memo)),
      );
      queryClient.invalidateQueries({ queryKey: [...userDataKeys.memos(), 'tag'] });
    },
  });

  const value: UserDataContextValue = {
    bookmarkedEvents: bookmarksPreviewQuery.data?.items ?? [],
    interestCategories: interestsQuery.data ?? [],
    excludedKeywords: excludedKeywordsQuery.data ?? [],
    eventMemos: memosQuery.data ?? [],
    isLoading:
      excludedKeywordsQuery.isPending ||
      bookmarksPreviewQuery.isPending ||
      interestsQuery.isPending ||
      memosQuery.isPending,
    bookmarksLoading: bookmarksPreviewQuery.isPending,
    interestCategoriesLoading: interestsQuery.isPending,
    interestCategoriesSaving: saveInterestsMutation.isPending,
    interestCategoriesError: interestsQuery.error,
    memoLoading:
      memosQuery.isPending ||
      addMemoMutation.isPending ||
      deleteMemoMutation.isPending ||
      updateMemoMutation.isPending,
    excludedKeywordLoading:
      excludedKeywordsQuery.isPending ||
      addExcludedKeywordMutation.isPending ||
      deleteExcludedKeywordMutation.isPending,
    refreshUserData: async () => {
      await queryClient.refetchQueries({ queryKey: userDataKeys.all, type: 'active' });
    },
    refreshBookmarks: async () => {
      await bookmarksPreviewQuery.refetch();
    },
    saveInterestPreferences: async (categories) => {
      await saveInterestsMutation.mutateAsync(categories);
    },
    addExcludedKeyword: async (keyword) => {
      await addExcludedKeywordMutation.mutateAsync(keyword);
    },
    deleteExcludedKeyword: async (id) => {
      await deleteExcludedKeywordMutation.mutateAsync(id);
    },
    toggleBookmark: async (event) => {
      await toggleBookmarkMutation.mutateAsync(event);
    },
    getMemoByTag: (tagId) =>
      queryClient.fetchQuery({
        queryKey: userDataKeys.memosByTag(tagId),
        queryFn: () => userApi.getMemosByTag(tagId),
      }),
    addMemo: async (eventId, content, tagNames) => {
      await addMemoMutation.mutateAsync({ eventId, content, tagNames });
    },
    deleteMemo: async (id) => {
      await deleteMemoMutation.mutateAsync(id);
    },
    updateMemo: (id, updates) => updateMemoMutation.mutateAsync({ id, updates }),
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useUserData must be used within UserDataProvider.');
  return context;
}
