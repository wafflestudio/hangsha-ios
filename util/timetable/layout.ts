import type { CalendarEvent, Event } from '@/types/event';
import type { DayOfWeek, TimetableCourse } from '@/types/timetable';

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 24;
export const PIXELS_PER_MINUTE = 0.9;
export const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * 60 * PIXELS_PER_MINUTE;

export const VISIBLE_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export type CourseGridBlock = {
  key: string;
  enrollId: number;
  dayIndex: number;
  top: number;
  height: number;
  title: string;
  startMin: number;
  endMin: number;
  item: TimetableCourse;
};

/** 한 장에 나란히 그리는 겹친 행사 칸의 최대 개수. 안드로이드 시간표와 같은 값이어야 한다. */
export const MAX_EVENT_LANES_PER_PAGE = 2;

/**
 * 요일 열 안에서 넘겨 보는 장(page) 단위로 배치된 시간 지정 행사.
 * laneIndex·laneCount는 그 장 안에서의 칸 위치와 칸 수이고,
 * pageCount는 요일 전체가 아니라 이 행사가 속한 겹침 묶음이 가진 장 수다.
 */
export type EventGridBlock = {
  key: string;
  event: Event;
  dayIndex: number;
  top: number;
  height: number;
  startMin: number;
  endMin: number;
  visibleStartMin: number;
  visibleEndMin: number;
  laneIndex: number;
  laneCount: number;
  pageIndex: number;
  pageCount: number;
};

export type SpanningEventGridBlock = {
  key: string;
  event: Event;
  startDayIndex: number;
  endDayIndex: number;
  spanDays: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const minutesToTop = (minutes: number) =>
  (minutes - GRID_START_HOUR * 60) * PIXELS_PER_MINUTE;

const durationToHeight = (start: number, end: number) =>
  (end - start) * PIXELS_PER_MINUTE;

export const formatAmPmFromMinutes = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

export const formatHourLabel = (hour: number) => String(hour % 12 || 12);

export function flattenCourses(courses: TimetableCourse[]): CourseGridBlock[] {
  return courses.flatMap(({ enrollId, course }) =>
    course.timeSlots.flatMap((slot, index) => {
      const dayIndex = VISIBLE_DAYS.indexOf(slot.dayOfweek);
      if (dayIndex < 0) return [];

      const visibleStart = Math.max(slot.startAt, GRID_START_HOUR * 60);
      const visibleEnd = Math.min(slot.endAt, GRID_END_HOUR * 60);
      if (visibleEnd <= visibleStart) return [];

      return [{
        key: `${enrollId}-${slot.dayOfweek}-${slot.startAt}-${index}`,
        enrollId,
        dayIndex,
        top: minutesToTop(visibleStart),
        height: durationToHeight(visibleStart, visibleEnd),
        title: course.courseTitle,
        startMin: slot.startAt,
        endMin: slot.endAt,
        item: { enrollId, course },
      }];
    }),
  );
}

const isSameDay = (start: Date, end: Date) =>
  start.getFullYear() === end.getFullYear() &&
  start.getMonth() === end.getMonth() &&
  start.getDate() === end.getDate();

type BaseEventBlock = Omit<
  EventGridBlock,
  'laneIndex' | 'laneCount' | 'pageIndex' | 'pageCount'
>;

/**
 * 시간이 사슬처럼 이어 겹치는 행사들을 한 묶음으로 보고, 묶음 안에서 칸(lane)을 나눈 뒤
 * MAX_EVENT_LANES_PER_PAGE 칸씩 장으로 자른다. 안드로이드 시간표의 배치 규칙과 같은 결과를 내야 한다.
 * 칸은 시작이 이른 행사부터 비어 있는 가장 앞 칸에 채우므로, 칸 수는 한순간에 동시에 겹친 최대 행사 수와 같다.
 */
function assignLanesWithinGroup(group: BaseEventBlock[]): EventGridBlock[] {
  const laneEnds: number[] = [];
  const withLanes = group.map((block) => {
    const reusableLane = laneEnds.findIndex((end) => end <= block.visibleStartMin);
    const lane = reusableLane === -1 ? laneEnds.length : reusableLane;
    laneEnds[lane] = block.visibleEndMin;
    return { block, lane };
  });

  const totalLanes = Math.max(1, laneEnds.length);
  const pageCount = Math.ceil(totalLanes / MAX_EVENT_LANES_PER_PAGE);

  return withLanes.map(({ block, lane }) => {
    const pageIndex = Math.floor(lane / MAX_EVENT_LANES_PER_PAGE);
    const firstLaneOnPage = pageIndex * MAX_EVENT_LANES_PER_PAGE;
    return {
      ...block,
      laneIndex: lane % MAX_EVENT_LANES_PER_PAGE,
      laneCount: Math.min(MAX_EVENT_LANES_PER_PAGE, totalLanes - firstLaneOnPage),
      pageIndex,
      pageCount,
    };
  });
}

function layoutEventDay(blocks: BaseEventBlock[]): EventGridBlock[] {
  const sorted = [...blocks].sort(
    (a, b) => a.visibleStartMin - b.visibleStartMin || a.visibleEndMin - b.visibleEndMin,
  );
  const result: EventGridBlock[] = [];
  let group: BaseEventBlock[] = [];
  let groupEnd = Number.NEGATIVE_INFINITY;

  for (const block of sorted) {
    if (group.length > 0 && block.visibleStartMin >= groupEnd) {
      result.push(...assignLanesWithinGroup(group));
      group = [];
      groupEnd = Number.NEGATIVE_INFINITY;
    }
    group.push(block);
    groupEnd = Math.max(groupEnd, block.visibleEndMin);
  }
  if (group.length > 0) result.push(...assignLanesWithinGroup(group));

  return result;
}

export const getDayPageCount = (blocks: EventGridBlock[]) =>
  blocks.reduce((count, block) => Math.max(count, block.pageCount), 1);

/**
 * pageIndex 장에서 보이는 행사. 장 수가 적은 묶음은 자기 마지막 장을 계속 보여주므로,
 * 겹치지 않는 행사는 모든 장에서 보인다.
 */
export const getBlocksOnPage = (blocks: EventGridBlock[], pageIndex: number) =>
  blocks.filter((block) => block.pageIndex === Math.min(pageIndex, block.pageCount - 1));

/** 시간 지정 행사를 요일 열마다 배치한다. 돌려주는 배열의 n번째가 VISIBLE_DAYS의 n번째 요일이다. */
export function layoutEventsByDay(events: CalendarEvent[]): EventGridBlock[][] {
  const blocks: BaseEventBlock[] = [];

  for (const calendarEvent of events) {
    const { start, end } = calendarEvent;
    const event = calendarEvent.resource.event;
    if (calendarEvent.allDay || calendarEvent.resource.isPeriodEvent || !isSameDay(start, end)) {
      continue;
    }

    const dayIndex = start.getDay() - 1;
    if (dayIndex < 0 || dayIndex > 4) continue;

    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const visibleStart = Math.max(startMin, GRID_START_HOUR * 60);
    const visibleEnd = Math.min(endMin, GRID_END_HOUR * 60);
    if (visibleEnd <= visibleStart) continue;

    blocks.push({
      key: `event-${event.id}`,
      event,
      dayIndex,
      top: minutesToTop(visibleStart),
      height: durationToHeight(visibleStart, visibleEnd),
      startMin,
      endMin,
      visibleStartMin: visibleStart,
      visibleEndMin: visibleEnd,
    });
  }

  return VISIBLE_DAYS.map((_day, dayIndex) =>
    layoutEventDay(blocks.filter((block) => block.dayIndex === dayIndex)),
  );
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const ceilToDay = (date: Date) => {
  const dayStart = startOfDay(date);
  return dayStart.getTime() === date.getTime() ? dayStart : addDays(dayStart, 1);
};

const dayDifference = (from: Date, to: Date) => {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
};

/**
 * 월~금 열에 걸쳐 표시할 종일/기간 행사를 겹치지 않는 lane으로 배치한다.
 * weekStart는 일요일 기준이며 주말에만 존재하는 행사는 주간 시간표에서 제외한다.
 */
export function flattenSpanningEvents(
  events: CalendarEvent[],
  weekStart: Date,
  keepAdjacentLanesSeparate = false,
): SpanningEventGridBlock[] {
  const visibleStart = addDays(startOfDay(weekStart), 1);
  const visibleEndExclusive = addDays(visibleStart, VISIBLE_DAYS.length);

  const candidates = events
    .map((calendarEvent) => {
      const rangeStart = startOfDay(calendarEvent.start);
      let rangeEndExclusive = ceilToDay(calendarEvent.end);
      if (rangeEndExclusive <= rangeStart) rangeEndExclusive = addDays(rangeStart, 1);

      if (rangeEndExclusive <= visibleStart || rangeStart >= visibleEndExclusive) return null;

      const clippedStart = rangeStart < visibleStart ? visibleStart : rangeStart;
      const clippedEnd =
        rangeEndExclusive > visibleEndExclusive ? visibleEndExclusive : rangeEndExclusive;
      const startDayIndex = dayDifference(visibleStart, clippedStart);
      const endDayIndex = dayDifference(visibleStart, clippedEnd) - 1;

      return {
        key: `spanning-event-${calendarEvent.resource.event.id}`,
        event: calendarEvent.resource.event,
        startDayIndex,
        endDayIndex,
        spanDays: endDayIndex - startDayIndex + 1,
        continuesBefore: rangeStart < visibleStart,
        continuesAfter: rangeEndExclusive > visibleEndExclusive,
      };
    })
    .filter((block): block is NonNullable<typeof block> => block !== null)
    .sort(
      (a, b) =>
        a.startDayIndex - b.startDayIndex ||
        a.endDayIndex - b.endDayIndex ||
        a.event.id - b.event.id,
    );

  const lanes: { start: number; end: number }[][] = [];

  return candidates.map((block) => {
    const separation = keepAdjacentLanesSeparate ? 1 : 0;
    let lane = lanes.findIndex((items) =>
      items.every(
        (item) =>
          block.endDayIndex + separation < item.start ||
          block.startDayIndex > item.end + separation,
      ),
    );
    if (lane === -1) lane = lanes.length;
    (lanes[lane] ??= []).push({ start: block.startDayIndex, end: block.endDayIndex });

    return { ...block, lane };
  });
}

export function getWeekRange(anchor: Date) {
  const from = new Date(anchor);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - from.getDay());

  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export function hasOverlap(existing: { dayOfweek: DayOfWeek; startAt: number; endAt: number }[], next: { dayOfweek: DayOfWeek; startAt: number; endAt: number }) {
  return existing.some(
    (slot) =>
      slot.dayOfweek === next.dayOfweek &&
      next.startAt < slot.endAt &&
      slot.startAt < next.endAt,
  );
}
