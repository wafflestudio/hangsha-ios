import { useQuery } from '@tanstack/react-query';

import {
  eventKeys,
  getDayEvents,
  getEventDetail,
  getMonthEvents,
  searchEvents,
} from '@/api/event';
import { filterEventTimeVariants } from '@/util/calendar/filterEventTimeVariants';

const DEFAULT_SEARCH_PAGE_SIZE = 20;

export function useDayEventsQuery(date: string) {
  return useQuery({
    queryKey: eventKeys.day(date),
    queryFn: () => getDayEvents({ date }),
    enabled: Boolean(date),
  });
}

export function useMonthEventsQuery(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: eventKeys.month(from, to),
    queryFn: () => getMonthEvents({ from, to }),
    enabled: Boolean(from && to && enabled),
  });
}

export function useEventDetailQuery(eventId: number) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });
}

export function useEventSearchQuery(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: eventKeys.search(normalizedQuery),
    queryFn: async () => {
      const firstResult = await searchEvents({
        query: normalizedQuery,
        page: 1,
        size: DEFAULT_SEARCH_PAGE_SIZE,
      });
      const fullResult =
        firstResult.items.length < firstResult.total
          ? await searchEvents({
              query: normalizedQuery,
              page: 1,
              size: firstResult.total,
            })
          : firstResult;
      const items = filterEventTimeVariants(fullResult.items, (item) => item.event);

      return {
        ...fullResult,
        page: 1,
        size: items.length,
        total: items.length,
        items,
      };
    },
    enabled: normalizedQuery.length > 0,
  });
}
