import type { CalendarEvent, Event } from '@/types/event';

import { calendarEventMapper } from './calendarEventMapper';
import { sortMonthCalendarEvents } from './sortMonthCalendarEvents';

const DAYS_PER_WEEK = 7;

/**
 * 한 주(week) 그리드 위에 절대배치할 이벤트 바. dayIndex는 그 주 내에서
 * 이벤트 바가 시작하는 열(0=일요일~6=토요일), spanDays는 그 주 안에서
 * 차지하는 칸 수. 여러 날에 걸친 이벤트라도 주 하나당 바 하나로 표현되므로
 * (react-big-calendar가 하듯) 제목이 칸 경계에서 끊기지 않고 이어진다.
 */
export type WeekEventBar = {
  eventId: number;
  title: string;
  eventTypeId: number;
  isPeriodEvent: boolean;
  rowIndex: number;
  dayIndex: number;
  spanDays: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const stripTime = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const diffInDays = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

/**
 * 한 주(week)에 걸친 이벤트들을 겹치지 않는 행(row)에 배정하고, 주 경계를
 * 넘어가는 구간은 그 주 안에서의 시작 열/칸 수로 클리핑한다. hangsha-web
 * 에서는 react-big-calendar가 대신 처리하던 month-view 화살표 바
 * 레이아웃을 RN에서 직접 구현한 것으로, 정렬 순서대로 먼저 배정된 이벤트가
 * 자리를 선점한다(팀 합의: 겹치는 이벤트는 아래 행으로 내림).
 */
const buildWeekBars = (
  weekDates: readonly Date[],
  calendarEvents: readonly CalendarEvent[],
): WeekEventBar[] => {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const weekEvents = calendarEvents
    .map((calendarEvent) => {
      const start = stripTime(calendarEvent.start);
      const end = stripTime(calendarEvent.end);
      if (end < weekStart || start > weekEnd) {
        return null;
      }
      const clippedStart = start < weekStart ? weekStart : start;
      const clippedEnd = end > weekEnd ? weekEnd : end;
      return {
        calendarEvent,
        clippedStart,
        clippedEnd,
        continuesBefore: start < weekStart,
        continuesAfter: end > weekEnd,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const rowEndDates: Date[] = [];
  const bars: WeekEventBar[] = [];

  for (const {
    calendarEvent,
    clippedStart,
    clippedEnd,
    continuesBefore,
    continuesAfter,
  } of weekEvents) {
    let rowIndex = rowEndDates.findIndex((rowEnd) => rowEnd < clippedStart);
    if (rowIndex === -1) {
      rowIndex = rowEndDates.length;
    }
    rowEndDates[rowIndex] = clippedEnd;

    bars.push({
      eventId: calendarEvent.resource.event.id,
      title: calendarEvent.title,
      eventTypeId: calendarEvent.resource.event.eventTypeId,
      isPeriodEvent: calendarEvent.resource.isPeriodEvent,
      rowIndex,
      dayIndex: diffInDays(weekStart, clippedStart),
      spanDays: diffInDays(clippedStart, clippedEnd) + 1,
      continuesBefore,
      continuesAfter,
    });
  }

  return bars;
};

export const buildMonthEventLayout = (
  gridDates: readonly Date[],
  events: readonly Event[],
): WeekEventBar[][] => {
  const calendarEvents = sortMonthCalendarEvents(
    events.map(calendarEventMapper).filter((event): event is CalendarEvent => event !== null),
  );
  const weeks: WeekEventBar[][] = [];

  for (let weekStart = 0; weekStart < gridDates.length; weekStart += DAYS_PER_WEEK) {
    const weekDates = gridDates.slice(weekStart, weekStart + DAYS_PER_WEEK);
    weeks.push(buildWeekBars(weekDates, calendarEvents));
  }

  return weeks;
};
