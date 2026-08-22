export interface Category {
  id: number;
  name: string;
  sortOrder: number;
}

export type CategoryType = 'EVENT_STATUS' | 'EVENT_TYPE' | 'ORGANIZATION';

export interface InterestCategory extends Category {
  categoryType: CategoryType;
}
