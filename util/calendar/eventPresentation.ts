
export const EVENT_TYPE_COLORS: Record<number, string> = {
  1: "rgba(255, 140, 40, 0.6)",
  2: "rgba(186, 158, 49, 0.6)",
  3: "rgba(11, 206, 131, 0.6)",
  4: "rgba(0, 193, 232, 0.6)",
  5: "rgba(0, 136, 255, 0.6)",
  6: "rgba(162, 90, 255, 0.6)",
  7: "rgba(255, 45, 83, 0.6)",
};

const FALLBACK_EVENT_TYPE_COLOR = "#BDBDBD";

export const getEventTypeColor = (eventTypeId: number) =>
  EVENT_TYPE_COLORS[eventTypeId] ?? FALLBACK_EVENT_TYPE_COLOR;
