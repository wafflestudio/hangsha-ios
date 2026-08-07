import type {
  CalendarEvent,
  Event,
  EventDetail,
} from "@/types/event";

export const calendarEventMapper = (
  event: Event | EventDetail,
): CalendarEvent => {
  const { isPeriodEvent } = event;
  const start =
    (isPeriodEvent ? event.applyStart : event.eventStart) ??
    event.eventStart ??
    event.applyStart;
  const end =
    (isPeriodEvent ? event.applyEnd : event.eventEnd) ??
    event.eventEnd ??
    event.applyEnd;

  return {
    start,
    end,
    title: event.title,
    // 월 뷰 전용: 원본(hangsha-web)의 Views.MONTH 분기와 동일하게 항상 종일 이벤트로 취급
    allDay: true,
    resource: { event, isPeriodEvent },
  };
};
