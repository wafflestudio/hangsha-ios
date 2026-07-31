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
