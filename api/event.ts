import apiClient from "@/api/client";
import type {
  DayViewParams,
  DayViewResponse,
  DayViewResponseDTO,
  EventDetail,
  EventDetailDTO,
} from "@/types/event";
import { transformEvent, transformEventDetail } from "@/util/calendar/transformEvent";

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
