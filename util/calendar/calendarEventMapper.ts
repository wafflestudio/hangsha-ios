import type {
  CalendarEvent,
  Event,
  EventDetail,
} from "@/types/event";

type DateRange = Pick<CalendarEvent, "start" | "end">;

const normalizeRange = (
  start: Date | null,
  end: Date | null,
): DateRange | null => {
  const fallback = start ?? end;

  if (!fallback) {
    return null;
  }

  return {
    start: start ?? fallback,
    end: end ?? fallback,
  };
};

const mapCalendarEvent = (
  event: Event | EventDetail,
  allDay: (isPeriodEvent: boolean) => boolean,
): CalendarEvent | null => {
  const { isPeriodEvent } = event;
  const eventRange = normalizeRange(event.eventStart, event.eventEnd);
  const applyRange = normalizeRange(event.applyStart, event.applyEnd);
  const range = isPeriodEvent ? (applyRange ?? eventRange) : (eventRange ?? applyRange);

  if (!range) {
    return null;
  }

  return {
    ...range,
    title: event.title,
    allDay: allDay(isPeriodEvent),
    resource: { event, isPeriodEvent },
  };
};

/** 월 뷰에서는 모든 행사를 날짜 막대로 표시한다. */
export const calendarEventMapper = (
  event: Event | EventDetail,
): CalendarEvent | null => mapCalendarEvent(event, () => true);

/** 주 뷰에서는 모집형 행사만 우선 종일로 취급한다. */
export const weekCalendarEventMapper = (
  event: Event | EventDetail,
): CalendarEvent | null => mapCalendarEvent(event, (isPeriodEvent) => isPeriodEvent);
