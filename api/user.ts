import apiClient from '@/api/client';
import type { Category, CategoryGroupWithCategories } from '@/types/category';
import type { EventDTO } from '@/types/event';
import type {
  ExcludedKeyword,
  Memo,
  MemoDTO,
  MemoUpdates,
} from '@/types/userData';
import { normalizeEventTypeId, transformEvent } from '@/util/calendar/transformEvent';
import { parseDateString } from '@/util/calendar/dateFormatter';

export type BookmarksResponse = {
  page: number;
  size: number;
  total: number;
  items: ReturnType<typeof transformEvent>[];
};

function transformMemo(memo: MemoDTO): Memo {
  return {
    ...memo,
    categoryId: normalizeEventTypeId(memo.categoryId),
    createdAt: parseDateString(memo.createdAt),
    updatedAt: parseDateString(memo.updatedAt),
    applyEnd: memo.applyEnd ? parseDateString(memo.applyEnd) : null,
  };
}

export async function getCategoryGroups() {
  const response = await apiClient.get<{ items: CategoryGroupWithCategories[] }>(
    'category-groups/with-categories',
  );
  return response.data.items;
}

export async function getOrganizations() {
  const response = await apiClient.get<{ items: Category[] }>('categories/orgs');
  return response.data.items;
}

export async function saveInterestCategories(categories: Category[]) {
  await apiClient.put('users/me/interest-categories', {
    items: categories.map((category, index) => ({
      categoryId: category.id,
      priority: index + 1,
    })),
  });
}

export async function getInterestCategories() {
  const response = await apiClient.get<{
    items: { category: Category; priority: number }[];
  }>('users/me/interest-categories');

  return [...response.data.items]
    .sort((left, right) => left.priority - right.priority)
    .map(({ category }) => category);
}

export async function getExcludedKeywords() {
  const response = await apiClient.get<{
    items: (ExcludedKeyword & { createdAt: string })[];
  }>('users/me/excluded-keywords');

  return response.data.items.map(({ id, keyword }) => ({ id, keyword }));
}

export async function addExcludedKeyword(keyword: string) {
  await apiClient.post('users/me/excluded-keywords', { keyword });
}

export async function deleteExcludedKeyword(id: number) {
  await apiClient.delete(`users/me/excluded-keywords/${id}`);
}

export async function getBookmarks(page = 1, size = 20) {
  const response = await apiClient.get<Omit<BookmarksResponse, 'items'> & { items: EventDTO[] }>(
    'users/me/bookmarks',
    { params: { page, size } },
  );
  return { ...response.data, items: response.data.items.map((item) => transformEvent(item)) };
}

export async function addBookmark(eventId: number) {
  await apiClient.post(`events/${eventId}/bookmark`);
}

export async function removeBookmark(eventId: number) {
  await apiClient.delete(`events/${eventId}/bookmark`);
}

export async function getMemos() {
  const response = await apiClient.get<{ items: MemoDTO[] }>('memos');
  return response.data.items.map(transformMemo);
}

export async function getMemosByTag(tagId: number) {
  const response = await apiClient.get<{ items: MemoDTO[] }>(`memos/by-tag/${tagId}`);
  return response.data.items.map(transformMemo);
}

export async function addMemo(eventId: number, content: string, tagNames: string[]) {
  await apiClient.post('memos', { eventId, content, tagNames });
}

export async function deleteMemo(id: number) {
  await apiClient.delete(`memos/${id}`);
}

export async function updateMemo(id: number, updates: MemoUpdates) {
  const response = await apiClient.patch<MemoDTO>(`memos/${id}`, updates);
  return transformMemo(response.data);
}
