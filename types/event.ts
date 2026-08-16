import type { ImageSourcePropType } from "react-native";

export type EventImageSource = string | ImageSourcePropType;

export type EventBase<TImageSource = string> = {
  id: number;
  title: string;
  imageUrl: TImageSource;
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
};

export type EventDTO = EventBase<string> & {
  applyStart: string | null;
  applyEnd: string | null;
  eventStart: string | null;
  eventEnd: string | null;
};

export type Event = EventBase<EventImageSource> & {
  applyStart: Date | null;
  applyEnd: Date | null;
  eventStart: Date | null;
  eventEnd: Date | null;
};

type EventDetailExtras = {
  bookmarkCount: number;
  detail: string;
};

export type EventDetailDTO = EventDTO & EventDetailExtras;
export type EventDetail = Event & EventDetailExtras;

export type CalendarEvent = {
  start: Date;
  end: Date;
  title: string;
  allDay: boolean;
  resource: {
    event: Event | EventDetail;
    isPeriodEvent: boolean;
  };
};

export type DayViewParams = {
  date: string;
  page?: number;
  size?: number;
  statusId?: number[];
  eventTypeId?: number[];
  orgId?: number[];
  /** 비로그인 사용자용 — 넘기면 서버가 이 목록으로 필터링, 안 넘기면 로그인된 유저의 저장된 제외 키워드 사용 */
  excludedKeywords?: string[];
};

export type DayViewResponseDTO = {
  page: number;
  size: number;
  total: number;
  date: string;
  items: EventDTO[];
};

export type DayViewResponse = {
  page: number;
  size: number;
  total: number;
  date: string;
  items: Event[];
};

export type MonthViewParams = {
  from: string;
  to: string;
  statusId?: number[];
  eventTypeId?: number[];
  orgId?: number[];
  /** 비로그인 사용자용 — 넘기면 서버가 이 목록으로 필터링, 안 넘기면 로그인된 유저의 저장된 제외 키워드 사용 */
  excludedKeywords?: string[];
};

export type MonthViewResponseDTO = {
  range: {
    from: string;
    to: string;
  };
  byDate: Record<string, { events: EventDTO[] }>;
};

export type MonthViewResponse = {
  range: {
    from: Date;
    to: Date;
  };
  byDate: Record<string, { events: Event[] }>;
};

export type EventSearchParams = {
  query: string;
  page?: number;
  size?: number;
  statusId?: number[];
  eventTypeId?: number[];
  orgId?: number[];
  /** 비로그인 사용자용 — 넘기면 서버가 이 목록으로 필터링, 안 넘기면 로그인된 유저의 저장된 제외 키워드 사용 */
  excludedKeywords?: string[];
};

export type EventSearchHighlight = {
  title: string;
  contentSnippet: string | null;
};

export type EventSearchItemDTO = {
  event: EventDTO;
  highlight: EventSearchHighlight;
};

export type EventSearchItem = {
  event: Event;
  highlight: EventSearchHighlight;
};

export type EventSearchResponseDTO = {
  page: number;
  size: number;
  total: number;
  items: EventSearchItemDTO[];
};

export type EventSearchResponse = {
  page: number;
  size: number;
  total: number;
  items: EventSearchItem[];
};
