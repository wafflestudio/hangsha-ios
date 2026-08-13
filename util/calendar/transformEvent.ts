import type { Event, EventDetail, EventDetailDTO, EventDTO } from "@/types/event";

import { parseDateString } from "./dateFormatter";

const CATEGORY_MIN_INDEX = 4;
const CATEGORY_MAX_INDEX = 10;
const FALLBACK_EVENT_TYPE_ID = 6;
const BROKEN_THUMBNAIL_PATH = "extra.snu.ac.kr/comm/cmfile/";

export const DEFAULT_EVENT_THUMBNAIL = require(
  "@/assets/images/default-event-thumbnail.png",
) as number;

const normalizeEventTypeId = (eventTypeId: number): number =>
  eventTypeId && eventTypeId >= CATEGORY_MIN_INDEX && eventTypeId <= CATEGORY_MAX_INDEX
    ? eventTypeId - 3
    : FALLBACK_EVENT_TYPE_ID;

const inferStatusId = (
  statusId: number,
  applyEnd: Date | null,
  today: Date,
): number => {
  if (statusId) {
    return statusId;
  }

  if (!applyEnd) {
    return 2;
  }

  return applyEnd < today ? 2 : 1;
};

export const transformEvent = (
  dto: EventDTO,
  today = new Date(),
): Event => {
  const applyStart = dto.applyStart ? parseDateString(dto.applyStart) : null;
  const applyEnd = dto.applyEnd ? parseDateString(dto.applyEnd) : null;

  return {
    ...dto,
    imageUrl: dto.imageUrl.includes(BROKEN_THUMBNAIL_PATH)
      ? DEFAULT_EVENT_THUMBNAIL
      : dto.imageUrl,
    eventTypeId: normalizeEventTypeId(dto.eventTypeId),
    statusId: inferStatusId(dto.statusId, applyEnd, today),
    applyStart,
    applyEnd,
    eventStart: dto.eventStart ? parseDateString(dto.eventStart) : null,
    eventEnd: dto.eventEnd ? parseDateString(dto.eventEnd) : null,
  };
};

export const transformEventDetail = (
  dto: EventDetailDTO,
  today = new Date(),
): EventDetail => ({
  ...transformEvent(dto, today),
  bookmarkCount: dto.bookmarkCount,
  detail: dto.detail,
});
