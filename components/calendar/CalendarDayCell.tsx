import { Dimensions, Pressable, StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { DayEventSegment } from '@/util/calendar/buildMonthEventLayout';
import { EventTypeColors, Spacing, type EventTypeId } from '@/util/theme';

const ROW_HEIGHT = 18;
const CELL_MIN_HEIGHT = 34 + ROW_HEIGHT * 3;
const DAYS_PER_WEEK = 7;
const GRID_HORIZONTAL_MARGIN = Spacing.three * 2;
const CELL_WIDTH = Math.floor(
  (Dimensions.get('window').width - GRID_HORIZONTAL_MARGIN) / DAYS_PER_WEEK,
);

const isKnownEventTypeId = (eventTypeId: number): eventTypeId is EventTypeId =>
  eventTypeId in EventTypeColors.light;

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  segments: readonly DayEventSegment[];
  maxVisibleRows: number;
  onPress?: () => void;
};

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  isSunday,
  segments,
  maxVisibleRows,
  onPress,
}: CalendarDayCellProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const eventTypeColors = EventTypeColors[scheme];

  const visibleSegments = segments.filter((segment) => segment.rowIndex < maxVisibleRows);
  const overflowCount = new Set(
    segments.filter((segment) => segment.rowIndex >= maxVisibleRows).map((segment) => segment.eventId),
  ).size;

  const dateColor = !isCurrentMonth ? '#9CA3AF' : isSunday ? '#ac3a4f' : undefined;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${date.getDate()}일 행사 보기` : undefined}>
      <View style={[styles.dateBadge, isToday && styles.todayBadge]}>
        <ThemedText
          type="small"
          style={[dateColor && { color: dateColor }, isToday && styles.todayText]}>
          {date.getDate()}
        </ThemedText>
      </View>

      <View style={styles.rows}>
        {Array.from({ length: maxVisibleRows }, (_, rowIndex) => {
          const segment = visibleSegments.find((s) => s.rowIndex === rowIndex);
          if (!segment) {
            return <View key={rowIndex} style={styles.rowSlot} />;
          }

          const colors = isKnownEventTypeId(segment.eventTypeId)
            ? eventTypeColors[segment.eventTypeId]
            : eventTypeColors[7];

          return (
            <View key={rowIndex} style={styles.rowSlot}>
              <View
                style={[
                  styles.eventBar,
                  { backgroundColor: colors.background },
                  segment.isStart && styles.eventBarStart,
                  segment.isEnd && styles.eventBarEnd,
                ]}>
                {segment.isPeriodEvent && segment.isStart && (
                  <View style={[styles.arrowHead, styles.arrowHeadLeft, { borderRightColor: colors.background }]} />
                )}
                {segment.isStart && (
                  <ThemedText
                    numberOfLines={1}
                    style={[styles.eventBarText, { color: colors.text }]}>
                    {segment.title}
                  </ThemedText>
                )}
                {segment.isPeriodEvent && segment.isEnd && (
                  <View style={[styles.arrowHead, styles.arrowHeadRight, { borderLeftColor: colors.background }]} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {overflowCount > 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.overflowText}>
          +{overflowCount}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CELL_WIDTH,
    minHeight: CELL_MIN_HEIGHT,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.25)',
    paddingTop: Spacing.one,
    paddingHorizontal: 2,
  },
  dateBadge: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.one,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a90b2',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  todayText: {
    color: '#ffffff',
  },
  rows: {
    marginTop: Spacing.half,
  },
  rowSlot: {
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
  overflowText: {
    fontSize: 9,
    lineHeight: 11,
    paddingHorizontal: Spacing.one,
  },
});
