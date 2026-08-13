import type { Event } from '@/types/event';
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

export type EventGridBlock = {
  key: string;
  event: Event;
  dayIndex: number;
  top: number;
  height: number;
  startMin: number;
  endMin: number;
  leftPct: number;
  widthPct: number;
  opacity: number;
  zIndex: number;
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

type BaseEventBlock = Omit<EventGridBlock, 'leftPct' | 'widthPct' | 'opacity' | 'zIndex'>;

function layoutEventDay(blocks: BaseEventBlock[]): EventGridBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const laneEnds: number[] = [];
  const laneByKey = new Map<string, number>();

  for (const block of sorted) {
    const reusableLane = laneEnds.findIndex((end) => block.startMin >= end);
    const lane = reusableLane === -1 ? laneEnds.length : reusableLane;
    laneEnds[lane] = block.endMin;
    laneByKey.set(block.key, lane);
  }

  return sorted.map((block) => {
    const lane = laneByKey.get(block.key) ?? 0;
    const overlap = sorted.filter(
      (candidate) => candidate.startMin < block.endMin && block.startMin < candidate.endMin,
    ).length;

    if (overlap === 2) {
      return { ...block, leftPct: (lane % 2) * 50, widthPct: 50, opacity: 1, zIndex: 3 };
    }

    if (overlap >= 3) {
      return lane <= 1
        ? { ...block, leftPct: lane * 50, widthPct: 50, opacity: 1, zIndex: 3 }
        : { ...block, leftPct: 0, widthPct: 100, opacity: 0.5, zIndex: 1 };
    }

    return { ...block, leftPct: 0, widthPct: 100, opacity: 1, zIndex: 2 };
  });
}

export function flattenEvents(events: Event[]): EventGridBlock[] {
  const blocks: BaseEventBlock[] = [];

  for (const event of events) {
    const start = event.eventStart;
    const end = event.eventEnd;
    if (!start || !end || event.isPeriodEvent || !isSameDay(start, end)) continue;

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
    });
  }

  return VISIBLE_DAYS.flatMap((_day, dayIndex) =>
    layoutEventDay(blocks.filter((block) => block.dayIndex === dayIndex)),
  );
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
