const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const assertValidDate = (date: Date): void => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }
};

export const parseDateString = (value: string): Date => {
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);

  if (!dateOnlyMatch) {
    const parsed = new Date(value);
    assertValidDate(parsed);
    return parsed;
  }

  const [, yearText, monthText, dayText] = dateOnlyMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new RangeError(`Invalid date-only value: ${value}`);
  }

  return parsed;
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  assertValidDate(date);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const formatDateDotParsed = (date: Date): string =>
  formatDateToYYYYMMDD(date).replaceAll("-", ".");

export const formatDateToMMDD = (date: Date): string => {
  assertValidDate(date);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}.${day}`;
};

const formatRangeEnd = (start: Date, end: Date) => {
  const isSameYear = start.getFullYear() === end.getFullYear();
  const isSameMonth = isSameYear && start.getMonth() === end.getMonth();

  if (isSameMonth) return String(end.getDate()).padStart(2, "0");
  if (isSameYear) return formatDateToMMDD(end);
  return formatDateDotParsed(end);
};

export const formatEventDateRange = (
  start: Date | null,
  end: Date | null,
): string => {
  if (start && end) {
    return start.toDateString() === end.toDateString()
      ? formatDateDotParsed(start)
      : `${formatDateDotParsed(start)}~${formatRangeEnd(start, end)}`;
  }

  return end
    ? formatDateDotParsed(end)
    : start
      ? formatDateDotParsed(start)
      : "";
};
