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
  /** 서버의 행사 카테고리 ID(4~10)를 앱 카테고리 ID(1~7)로 변환해 보관한다. */
  categoryId: number;
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
