import { formatDateToYYYYMMDD } from "./dateFormatter";

export type WeekRange = {
  from: string;
  to: string;
};

export const getWeekRangeByDate = (date: Date): WeekRange => {
  const from = new Date(date);
  from.setDate(from.getDate() - from.getDay());

  const to = new Date(from);
  to.setDate(to.getDate() + 6);

  return {
    from: formatDateToYYYYMMDD(from),
    to: formatDateToYYYYMMDD(to),
  };
};
