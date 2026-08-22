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

export const calendarEventMapper = (
  event: Event | EventDetail,
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
    // 월 뷰 전용: 원본(hangsha-web)의 Views.MONTH 분기와 동일하게 항상 종일 이벤트로 취급
    allDay: true,
    resource: { event, isPeriodEvent },
  };
};
