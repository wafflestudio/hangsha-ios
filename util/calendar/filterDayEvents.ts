import { isWithinInterval, startOfDay } from 'date-fns';

import type { CalendarEvent, Event } from '@/types/event';

import { calendarEventMapper } from './calendarEventMapper';
import { sortMonthCalendarEvents } from './sortMonthCalendarEvents';

/**
 * events/day API는 그 날짜가 신청기간이든 행사기간이든 걸치기만 하면
 * 느슨하게 이벤트를 내려준다(서버 기준: applyStart~applyEnd 또는
 * eventStart~eventEnd 중 하나라도 day를 포함). 화면에는 calendarEventMapper가
 * 계산한 "실제 표시 기간"(모집형=신청기간, 참여형=행사기간) 안에 day가
 * 들어가는 이벤트만 남겨야 한다 — hangsha-web EventCardView.tsx의
 * 필터링 규칙과 동일.
 */
export const filterDayEvents = (day: Date, events: readonly Event[]): Event[] => {
  const dayStart = startOfDay(day);

  const calendarEvents = events
    .map(calendarEventMapper)
    .filter((event): event is CalendarEvent => event !== null)
    .filter((event) => {
      const start = event.start ?? event.end;
      const end = event.end ?? event.start;
      if (!start || !end) {
        return false;
      }
      return isWithinInterval(dayStart, { start: startOfDay(start), end: startOfDay(end) });
    });

  return sortMonthCalendarEvents(calendarEvents).map(
    (calendarEvent) => calendarEvent.resource.event as Event,
  );
};
