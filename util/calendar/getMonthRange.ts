export type MonthRange = {
  from: Date;
  to: Date;
};

export const getMonthRange = (year: number, month: number): MonthRange => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const from = new Date(startOfMonth);
  from.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  const to = new Date(endOfMonth);
  to.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

  return { from, to };
};
