import apiClient from "@/api/client";
import type {
  DayViewParams,
  DayViewResponse,
  DayViewResponseDTO,
  EventDetail,
  EventDetailDTO,
  EventSearchParams,
  EventSearchResponse,
  EventSearchResponseDTO,
  MonthViewParams,
  MonthViewResponse,
  MonthViewResponseDTO,
} from "@/types/event";
import { transformEvent, transformEventDetail } from "@/util/calendar/transformEvent";

export const eventKeys = {
  all: ["events"] as const,
  detail: (id: number) => [...eventKeys.all, "detail", id] as const,
  day: (date: string) => [...eventKeys.all, "day", date] as const,
  month: (from: string, to: string) => [...eventKeys.all, "month", from, to] as const,
  search: (query: string) => [...eventKeys.all, "search", query] as const,
};

export async function getEventDetail(id: number): Promise<EventDetail> {
  const response = await apiClient.get<EventDetailDTO>(`events/${id}`);
  return transformEventDetail(response.data);
}

export async function getDayEvents(params: DayViewParams): Promise<DayViewResponse> {
  const response = await apiClient.get<DayViewResponseDTO>("events/day", { params });
  const data = response.data;

  return {
    page: data.page,
    size: data.size,
    total: data.total,
    date: data.date,
    items: data.items.map((item) => transformEvent(item)),
  };
}

export async function getMonthEvents(params: MonthViewParams): Promise<MonthViewResponse> {
  const response = await apiClient.get<MonthViewResponseDTO>("events/month", { params });
  const data = response.data;

  const byDate = Object.entries(data.byDate).reduce<MonthViewResponse["byDate"]>(
    (acc, [dateKey, bucket]) => {
      acc[dateKey] = { events: bucket.events.map((item) => transformEvent(item)) };
      return acc;
    },
    {},
  );

  return {
    range: {
      from: new Date(data.range.from),
      to: new Date(data.range.to),
    },
    byDate,
  };
}

export async function searchEvents(params: EventSearchParams): Promise<EventSearchResponse> {
  const response = await apiClient.get<EventSearchResponseDTO>('events/search', { params });

  return {
    ...response.data,
    items: (response.data.items ?? []).map((item) => ({
      event: transformEvent(item.event),
      highlight: item.highlight,
    })),
  };
}
