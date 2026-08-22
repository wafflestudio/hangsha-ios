import { parseDateString } from "./dateFormatter";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDateTimestamp = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

export const getDDay = (
  targetDate: Date | string | null | undefined,
  today = new Date(),
): string => {
  if (!targetDate) {
    return "";
  }

  const target =
    typeof targetDate === "string"
      ? parseDateString(targetDate)
      : new Date(targetDate);
  const differenceInDays = Math.ceil(
    (toUtcDateTimestamp(target) - toUtcDateTimestamp(today)) /
      MILLISECONDS_PER_DAY,
  );

  if (differenceInDays === 0) {
    return "D-DAY";
  }

  return differenceInDays > 0
    ? `D-${differenceInDays}`
    : `D+${Math.abs(differenceInDays)}`;
};
