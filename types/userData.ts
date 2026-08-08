export interface ExcludedKeyword {
  id: number;
  keyword: string;
}

export interface MemoTag {
  id: number;
  name: string;
}

export interface Memo {
  id: number;
  eventId: number;
  eventTitle: string;
  content: string;
  tags: MemoTag[];
  createdAt: Date;
}

export interface MemoDTO extends Omit<Memo, 'createdAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface MemoUpdates {
  content?: string;
  tagNames?: string[];
}
