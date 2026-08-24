import type {
  Event,
  EventDetail,
  EventDetailDTO,
  EventDTO,
} from "@/types/event";

import { parseDateString } from "./dateFormatter";

const BROKEN_THUMBNAIL_PATH = "extra.snu.ac.kr/comm/cmfile/";

export const DEFAULT_EVENT_THUMBNAIL =
  require("@/assets/images/default-event-thumbnail.png") as number;

export const transformEvent = (dto: EventDTO): Event => {
  const applyEnd = dto.applyEnd ? parseDateString(dto.applyEnd) : null;

  return {
    ...dto,
    imageUrl: dto.imageUrl.includes(BROKEN_THUMBNAIL_PATH)
      ? DEFAULT_EVENT_THUMBNAIL
      : dto.imageUrl,
    applyStart: dto.applyStart ? parseDateString(dto.applyStart) : null,
    applyEnd: applyEnd,
    eventStart: dto.eventStart ? parseDateString(dto.eventStart) : null,
    eventEnd: dto.eventEnd ? parseDateString(dto.eventEnd) : null,
  };
};

export const transformEventDetail = (
  dto: EventDetailDTO,
): EventDetail => ({
  ...transformEvent(dto),
  bookmarkCount: dto.bookmarkCount,
  detail: dto.detail,
});
