export interface Category {
  id: number;
  groupId: number;
  name: string;
  sortOrder: number;
}

export interface CategoryGroupWithCategories {
  group: {
    id: number;
    name: string;
    sortOrder: number;
  };
  categories: Category[];
}
