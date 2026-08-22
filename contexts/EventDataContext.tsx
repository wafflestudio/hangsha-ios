import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  type EventFilterParams,
  eventKeys,
  getDayEvents,
  getEventDetail,
  getMonthEvents,
  searchEvents,
} from '@/api/event';
import { getEventStatuses, getEventTypes, getOrganizations } from '@/api/category';
import { filterEventTimeVariants } from '@/util/calendar/filterEventTimeVariants';

const DEFAULT_SEARCH_PAGE_SIZE = 20;

const categoryMetadataKeys = {
  statuses: ['event-statuses'] as const,
  types: ['event-types'] as const,
  orgs: ['organizations'] as const,
};

export function useEventStatusesQuery() {
  return useQuery({
    queryKey: categoryMetadataKeys.statuses,
    queryFn: getEventStatuses,
  });
}

export function useEventTypesQuery() {
  return useQuery({
    queryKey: categoryMetadataKeys.types,
    queryFn: getEventTypes,
  });
}

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: categoryMetadataKeys.orgs,
    queryFn: getOrganizations,
  });
}

export function useDayEventsQuery(date: string, filters: EventFilterParams = {}) {
  return useQuery({
    queryKey: eventKeys.day(date, filters),
    queryFn: () => getDayEvents({ date, ...filters }),
    enabled: Boolean(date),
    placeholderData: keepPreviousData,
  });
}

export function useMonthEventsQuery(
  from: string,
  to: string,
  filters: EventFilterParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.month(from, to, filters),
    queryFn: () => getMonthEvents({ from, to, ...filters }),
    enabled: Boolean(from && to && enabled),
    placeholderData: keepPreviousData,
  });
}

export function useEventDetailQuery(eventId: number) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });
}

export function useEventSearchQuery(query: string, filters: EventFilterParams = {}) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: eventKeys.search(normalizedQuery, filters),
    queryFn: async () => {
      const firstResult = await searchEvents({
        query: normalizedQuery,
        page: 1,
        size: DEFAULT_SEARCH_PAGE_SIZE,
        ...filters,
      });
      const fullResult =
        firstResult.items.length < firstResult.total
          ? await searchEvents({
              query: normalizedQuery,
              page: 1,
              size: firstResult.total,
              ...filters,
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
    placeholderData: keepPreviousData,
  });
}
