export interface ExcludedKeyword {
  id: number;
  keyword: string;
}

export interface MemoTag {
  id: number;
  name: string;
}

export interface MemoOrganization {
  id: number;
  name: string;
}

export interface Memo {
  id: number;
  eventId: number;
  /** event-types API의 ID */
  eventTypeId: number;
  eventTitle: string;
  content: string;
  tags: MemoTag[];
  createdAt: Date;
  updatedAt: Date;
  applyEnd: Date | null;
  organization: MemoOrganization | null;
  isBookmarked: boolean;
}

export interface MemoDTO extends Omit<Memo, 'createdAt' | 'updatedAt' | 'applyEnd'> {
  createdAt: string;
  updatedAt: string;
  applyEnd: string | null;
}

export interface MemoUpdates {
  content?: string;
  tagNames?: string[];
}
