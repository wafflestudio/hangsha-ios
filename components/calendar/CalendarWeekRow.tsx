import { StyleSheet, View } from 'react-native';

import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { ThemedText } from '@/components/themed-text';
import type { WeekEventBar } from '@/util/calendar/buildMonthEventLayout';
import { formatDateToYYYYMMDD } from '@/util/calendar/dateFormatter';
import { AdaptiveColors, getEventTypeColors, Spacing } from '@/util/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const MONTH_EVENT_ROW_HEIGHT = 18;
export const MONTH_DATE_BADGE_HEIGHT = 30;
export const MONTH_WEEK_ROW_HEIGHT = 118;
export const MONTH_WEEK_ROW_GAP = 2;

const DAYS_PER_WEEK = 7;

type CalendarWeekRowProps = {
  weekDates: readonly Date[];
  currentMonth: number;
  todayKey: string;
  bars: readonly WeekEventBar[];
  maxVisibleRows: number;
  cellWidth: number;
  onSelectDate?: (dateKey: string) => void;
};

export function CalendarWeekRow({
  weekDates,
  currentMonth,
  todayKey,
  bars,
  maxVisibleRows,
  cellWidth,
  onSelectDate,
}: CalendarWeekRowProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const visibleBars = bars.filter((bar) => bar.rowIndex < maxVisibleRows);
  const overflowCountByDay = new Array(DAYS_PER_WEEK).fill(0) as number[];

  for (const bar of bars) {
    if (bar.rowIndex < maxVisibleRows) continue;
    for (let day = bar.dayIndex; day < bar.dayIndex + bar.spanDays; day += 1) {
      overflowCountByDay[day] += 1;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dayCells}>
        {weekDates.map((date) => {
          const dateKey = formatDateToYYYYMMDD(date);
          return (
            <CalendarDayCell
              key={dateKey}
              date={date}
              isCurrentMonth={date.getMonth() === currentMonth}
              isToday={dateKey === todayKey}
              isSunday={date.getDay() === 0}
              width={cellWidth}
              minHeight={MONTH_WEEK_ROW_HEIGHT}
              onPress={onSelectDate ? () => onSelectDate(dateKey) : undefined}
            />
          );
        })}
      </View>

      <View style={styles.barLayer} pointerEvents="none">
        {visibleBars.map((bar) => {
          const colors = getEventTypeColors(scheme, bar.eventTypeId);
          const left = bar.dayIndex * cellWidth;
          const width = bar.spanDays * cellWidth;
          const top = MONTH_DATE_BADGE_HEIGHT + bar.rowIndex * MONTH_EVENT_ROW_HEIGHT;

          return (
            <View
              key={`${bar.eventId}-${bar.rowIndex}`}
              style={[styles.barSlot, { left, width, top }]}>
              {bar.isPeriodEvent ? (
                <View style={styles.periodEvent}>
                  <ThemedText
                    numberOfLines={1}
                    style={[styles.periodEventText, { color: colors.text }]}>
                    {bar.title}
                  </ThemedText>
                  <View style={[styles.arrowLine, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.arrowHead,
                        styles.arrowHeadLeft,
                        { borderRightColor: colors.background },
                      ]}
                    />
                    <View
                      style={[
                        styles.arrowHead,
                        styles.arrowHeadRight,
                        { borderLeftColor: colors.background },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.blockEvent, { backgroundColor: colors.background }]}>
                  <ThemedText numberOfLines={1} style={styles.blockEventText}>
                    {bar.title}
                  </ThemedText>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.overflowLayer} pointerEvents="none">
        {overflowCountByDay.map((count, dayIndex) =>
          count > 0 ? (
            <ThemedText
              key={dayIndex}
              type="small"
              themeColor="textSecondary"
              style={[styles.overflowText, { left: dayIndex * cellWidth, width: cellWidth }]}>
              +{count}
            </ThemedText>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: MONTH_WEEK_ROW_HEIGHT,
    marginBottom: MONTH_WEEK_ROW_GAP,
  },
  dayCells: {
    flexDirection: 'row',
  },
  barLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  barSlot: {
    position: 'absolute',
    height: MONTH_EVENT_ROW_HEIGHT,
    justifyContent: 'center',
  },
  periodEvent: {
    height: 17,
    justifyContent: 'flex-start',
  },
  periodEventText: {
    height: 11,
    paddingHorizontal: 12,
    fontSize: 11,
    lineHeight: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  arrowLine: {
    height: 2,
    marginTop: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    position: 'relative',
  },
  blockEvent: {
    height: 15,
    marginHorizontal: 1,
    borderRadius: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blockEventText: {
    color: AdaptiveColors.text,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
    paddingVertical: 1,
    paddingHorizontal: 0.5,
    textAlign: 'center',
  },
  arrowHead: {
    position: 'absolute',
    top: -4,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowHeadLeft: {
    left: -4,
    borderRightWidth: 8,
  },
  arrowHeadRight: {
    right: -4,
    borderLeftWidth: 8,
  },
  overflowLayer: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    height: 13,
  },
  overflowText: {
    position: 'absolute',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'left',
    paddingHorizontal: Spacing.one,
  },
});
