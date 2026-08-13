import { useQuery } from '@tanstack/react-query';

import { eventKeys, getDayEvents, getEventDetail, getMonthEvents } from '@/api/event';

export function useDayEventsQuery(date: string) {
  return useQuery({
    queryKey: eventKeys.day(date),
    queryFn: () => getDayEvents({ date }),
    enabled: Boolean(date),
  });
}

export function useMonthEventsQuery(from: string, to: string) {
  return useQuery({
    queryKey: eventKeys.month(from, to),
    queryFn: () => getMonthEvents({ from, to }),
    enabled: Boolean(from && to),
  });
}

export function useEventDetailQuery(eventId: number) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });
}
