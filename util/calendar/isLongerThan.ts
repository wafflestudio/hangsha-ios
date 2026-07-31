const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDateTimestamp = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

export const isLongerThan = (
  start: Date,
  end: Date,
  daysThreshold: number,
): boolean => {
  const differenceInDays =
    (toUtcDateTimestamp(end) - toUtcDateTimestamp(start)) /
    MILLISECONDS_PER_DAY;

  return differenceInDays > daysThreshold;
};
