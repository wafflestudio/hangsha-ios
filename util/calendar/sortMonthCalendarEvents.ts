import type { CalendarEvent } from "@/types/event";

import { isLongerThan } from "./isLongerThan";

const isMultiDayEvent = (event: CalendarEvent): boolean =>
  isLongerThan(event.start, event.end, 0);

const compareDates = (left: Date, right: Date): number =>
  left.getTime() - right.getTime();

export const compareMonthCalendarEvents = (
  left: CalendarEvent,
  right: CalendarEvent,
): number => {
  const durationOrder =
    Number(isMultiDayEvent(right)) - Number(isMultiDayEvent(left));

  if (durationOrder !== 0) {
    return durationOrder;
  }

  const startOrder = compareDates(left.start, right.start);
  if (startOrder !== 0) {
    return startOrder;
  }

  const endOrder = compareDates(left.end, right.end);
  if (endOrder !== 0) {
    return endOrder;
  }

  return left.resource.event.id - right.resource.event.id;
};

export const sortMonthCalendarEvents = (
  events: readonly CalendarEvent[],
): CalendarEvent[] => [...events].sort(compareMonthCalendarEvents);
