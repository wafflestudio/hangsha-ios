import apiClient from '@/api/client';
import type { Category } from '@/types/category';

type CategoryListResponse = {
  items: Category[];
};

export async function getEventStatuses() {
  const response = await apiClient.get<CategoryListResponse>('event-statuses');
  return response.data.items;
}

export async function getEventTypes() {
  const response = await apiClient.get<CategoryListResponse>('event-types');
  return response.data.items;
}

export async function getOrganizations() {
  const response = await apiClient.get<CategoryListResponse>('organizations');
  return response.data.items;
}
