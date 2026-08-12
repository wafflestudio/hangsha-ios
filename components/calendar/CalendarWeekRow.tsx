import { Dimensions, StyleSheet, View, useColorScheme } from 'react-native';

import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { ThemedText } from '@/components/themed-text';
import { formatDateToYYYYMMDD } from '@/util/calendar/dateFormatter';
import type { WeekEventBar } from '@/util/calendar/buildMonthEventLayout';
import { EventTypeColors, Spacing, type EventTypeId } from '@/util/theme';

const ROW_HEIGHT = 18;
const DATE_BADGE_HEIGHT = 34;
const DAYS_PER_WEEK = 7;
const GRID_HORIZONTAL_MARGIN = Spacing.three * 2;
const CELL_WIDTH = Math.floor(
  (Dimensions.get('window').width - GRID_HORIZONTAL_MARGIN) / DAYS_PER_WEEK,
);

const isKnownEventTypeId = (eventTypeId: number): eventTypeId is EventTypeId =>
  eventTypeId in EventTypeColors.light;

type CalendarWeekRowProps = {
  weekDates: readonly Date[];
  currentMonth: number;
  todayKey: string;
  bars: readonly WeekEventBar[];
  maxVisibleRows: number;
  onSelectDate?: (dateKey: string) => void;
};

export function CalendarWeekRow({
  weekDates,
  currentMonth,
  todayKey,
  bars,
  maxVisibleRows,
  onSelectDate,
}: CalendarWeekRowProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const eventTypeColors = EventTypeColors[scheme];

  const visibleBars = bars.filter((bar) => bar.rowIndex < maxVisibleRows);
  const overflowCountByDay = new Array(DAYS_PER_WEEK).fill(0) as number[];
  for (const bar of bars) {
    if (bar.rowIndex < maxVisibleRows) continue;
    for (let day = bar.dayIndex; day < bar.dayIndex + bar.spanDays; day += 1) {
      overflowCountByDay[day] += 1;
    }
  }

  const minHeight = DATE_BADGE_HEIGHT + ROW_HEIGHT * maxVisibleRows;

  return (
    <View style={[styles.container, { minHeight }]}>
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
              width={CELL_WIDTH}
              minHeight={minHeight}
              onPress={onSelectDate ? () => onSelectDate(dateKey) : undefined}
            />
          );
        })}
      </View>

      <View style={styles.barLayer} pointerEvents="none">
        {visibleBars.map((bar) => {
          const colors = isKnownEventTypeId(bar.eventTypeId)
            ? eventTypeColors[bar.eventTypeId]
            : eventTypeColors[7];
          const left = bar.dayIndex * CELL_WIDTH;
          const width = bar.spanDays * CELL_WIDTH;
          const top = DATE_BADGE_HEIGHT + bar.rowIndex * ROW_HEIGHT;
          const isStart = !bar.continuesBefore;
          const isEnd = !bar.continuesAfter;

          return (
            <View
              key={`${bar.eventId}-${bar.rowIndex}`}
              style={[styles.barSlot, { left, width, top }]}>
              <View
                style={[
                  styles.eventBar,
                  { backgroundColor: colors.background },
                  isStart && styles.eventBarStart,
                  isEnd && styles.eventBarEnd,
                ]}>
                {bar.isPeriodEvent && isStart && (
                  <View
                    style={[
                      styles.arrowHead,
                      styles.arrowHeadLeft,
                      { borderRightColor: colors.background },
                    ]}
                  />
                )}
                <ThemedText
                  numberOfLines={1}
                  style={[styles.eventBarText, { color: colors.text }]}>
                  {bar.title}
                </ThemedText>
                {bar.isPeriodEvent && isEnd && (
                  <View
                    style={[
                      styles.arrowHead,
                      styles.arrowHeadRight,
                      { borderLeftColor: colors.background },
                    ]}
                  />
                )}
              </View>
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
              style={[styles.overflowText, { left: dayIndex * CELL_WIDTH, width: CELL_WIDTH }]}>
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
    height: ROW_HEIGHT,
    justifyContent: 'center',
  },
  eventBar: {
    height: 14,
    justifyContent: 'center',
  },
  eventBarStart: {
    marginLeft: 2,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  eventBarEnd: {
    marginRight: 2,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  eventBarText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '600',
    paddingHorizontal: 3,
  },
  arrowHead: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowHeadLeft: {
    left: -6,
    borderRightWidth: 6,
  },
  arrowHeadRight: {
    right: -6,
    borderLeftWidth: 6,
  },
  overflowLayer: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 11,
  },
  overflowText: {
    position: 'absolute',
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'right',
    paddingHorizontal: Spacing.one,
  },
});
