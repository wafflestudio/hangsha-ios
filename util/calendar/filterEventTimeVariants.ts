import type { Event } from '@/types/event';

type EventRange = {
  start: Date;
  end: Date;
};

const normalizeRange = (start: Date | null, end: Date | null): EventRange | null => {
  const fallback = start ?? end;
  if (!fallback) return null;

  return {
    start: start ?? fallback,
    end: end ?? fallback,
  };
};

const getDisplayedRange = (event: Event): EventRange | null => {
  const eventRange = normalizeRange(event.eventStart, event.eventEnd);
  const applyRange = normalizeRange(event.applyStart, event.applyEnd);

  return event.isPeriodEvent ? (applyRange ?? eventRange) : (eventRange ?? applyRange);
};

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const getGroupKey = (event: Event, range: EventRange) => {
  const contentIdentity = event.applyLink?.trim();
  if (!contentIdentity) return null;

  return JSON.stringify([
    event.title.trim(),
    contentIdentity,
    getLocalDateKey(range.start),
    getLocalDateKey(range.end),
  ]);
};

const getTimeKey = (range: EventRange) =>
  `${range.start.getTime()}-${range.end.getTime()}`;

/** 같은 행사·날짜에서 시간만 다른 회차는 월별 뷰와 검색 결과에 하나만 표시한다. */
export function filterEventTimeVariants<T>(items: T[], getEvent: (item: T) => Event): T[] {
  const itemMetadata = items.map((item) => {
    const event = getEvent(item);
    const range = getDisplayedRange(event);
    if (!range) return { groupKey: null, timeKey: null };

    return {
      groupKey: getGroupKey(event, range),
      timeKey: getTimeKey(range),
    };
  });

  const timeKeysByGroup = new Map<string, Set<string>>();
  for (const { groupKey, timeKey } of itemMetadata) {
    if (!groupKey || !timeKey) continue;

    const timeKeys = timeKeysByGroup.get(groupKey) ?? new Set<string>();
    timeKeys.add(timeKey);
    timeKeysByGroup.set(groupKey, timeKeys);
  }

  const keptVariantGroups = new Set<string>();
  return items.filter((_, index) => {
    const { groupKey } = itemMetadata[index];
    if (!groupKey || (timeKeysByGroup.get(groupKey)?.size ?? 0) <= 1) return true;
    if (keptVariantGroups.has(groupKey)) return false;

    keptVariantGroups.add(groupKey);
    return true;
  });
}
