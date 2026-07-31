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
  applyStart: string;
  applyEnd: string;
  eventStart: string;
  eventEnd: string;
};

export type Event = EventBase<EventImageSource> & {
  applyStart: Date;
  applyEnd: Date;
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
