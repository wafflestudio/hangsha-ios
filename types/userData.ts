export interface ExcludedKeyword {
  id: number;
  keyword: string;
}

interface EventBase {
  id: number;
  title: string;
  imageUrl: string;
  operationMode: string;
  statusId: number;
  eventTypeId: number;
  orgId: number;
  organization: string;
  applyLink: string;
  tags?: string;
  isPeriodEvent: boolean;
  capacity: number;
  location: string;
  applyCount: number;
  isInterested?: boolean;
  matchedInterestPriority?: number;
  isBookmarked?: boolean;
}

export interface EventDTO extends EventBase {
  applyStart: string | null;
  applyEnd: string | null;
  eventStart: string | null;
  eventEnd: string | null;
}

export interface Event extends EventBase {
  applyStart: Date | null;
  applyEnd: Date | null;
  eventStart: Date | null;
  eventEnd: Date | null;
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
