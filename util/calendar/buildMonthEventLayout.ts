import type { CalendarEvent, Event } from '@/types/event';

import { calendarEventMapper } from './calendarEventMapper';
import { formatDateToYYYYMMDD } from './dateFormatter';
import { sortMonthCalendarEvents } from './sortMonthCalendarEvents';

const DAYS_PER_WEEK = 7;

export type DayEventSegment = {
  eventId: number;
  title: string;
  eventTypeId: number;
  isPeriodEvent: boolean;
  rowIndex: number;
  isStart: boolean;
  isEnd: boolean;
};

const stripTime = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toSegment = (
  calendarEvent: CalendarEvent,
  rowIndex: number,
  isStart: boolean,
  isEnd: boolean,
): DayEventSegment => ({
  eventId: calendarEvent.resource.event.id,
  title: calendarEvent.title,
  eventTypeId: calendarEvent.resource.event.eventTypeId,
  isPeriodEvent: calendarEvent.resource.isPeriodEvent,
  rowIndex,
  isStart,
  isEnd,
});

/**
 * 한 주(week)에 걸친 이벤트들을 겹치지 않는 행(row)에 배정하고, 주 경계를
 * 넘어가는 구간은 시작/중간/끝 세그먼트로 쪼갠다. hangsha-web에서는
 * react-big-calendar가 대신 처리하던 month-view 화살표 바 레이아웃을
 * RN에서 직접 구현한 것으로, 정렬 순서대로 먼저 배정된 이벤트가 자리를
 * 선점한다(팀 합의: 겹치는 이벤트는 아래 행으로 내림).
 */
const buildWeekSegments = (
  weekDates: readonly Date[],
  calendarEvents: readonly CalendarEvent[],
): Map<string, DayEventSegment[]> => {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const weekEvents = calendarEvents
    .map((calendarEvent) => {
      const start = stripTime(calendarEvent.start);
      const end = stripTime(calendarEvent.end);
      if (end < weekStart || start > weekEnd) {
        return null;
      }
      return {
        calendarEvent,
        clippedStart: start < weekStart ? weekStart : start,
        clippedEnd: end > weekEnd ? weekEnd : end,
        continuesBefore: start < weekStart,
        continuesAfter: end > weekEnd,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  const rowEndDates: Date[] = [];
  const byDate = new Map<string, DayEventSegment[]>();

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

    for (let cursor = clippedStart; cursor <= clippedEnd; cursor = addDays(cursor, 1)) {
      const key = formatDateToYYYYMMDD(cursor);
      const segment = toSegment(
        calendarEvent,
        rowIndex,
        cursor.getTime() === clippedStart.getTime() && !continuesBefore,
        cursor.getTime() === clippedEnd.getTime() && !continuesAfter,
      );
      const existing = byDate.get(key);
      if (existing) {
        existing.push(segment);
      } else {
        byDate.set(key, [segment]);
      }
    }
  }

  return byDate;
};

export const buildMonthEventLayout = (
  gridDates: readonly Date[],
  events: readonly Event[],
): Map<string, DayEventSegment[]> => {
  const calendarEvents = sortMonthCalendarEvents(events.map(calendarEventMapper));
  const byDate = new Map<string, DayEventSegment[]>();

  for (let weekStart = 0; weekStart < gridDates.length; weekStart += DAYS_PER_WEEK) {
    const weekDates = gridDates.slice(weekStart, weekStart + DAYS_PER_WEEK);
    const weekSegments = buildWeekSegments(weekDates, calendarEvents);
    for (const [key, segments] of weekSegments) {
      byDate.set(key, segments);
    }
  }

  return byDate;
};
