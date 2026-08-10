import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { eventKeys, getMonthEvents } from '@/api/event';
import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { buildMonthEventLayout } from '@/util/calendar/buildMonthEventLayout';
import { formatDateToYYYYMMDD } from '@/util/calendar/dateFormatter';
import { getMonthRange } from '@/util/calendar/getMonthRange';
import { Spacing } from '@/util/theme';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_VISIBLE_ROWS = 4;

const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const buildMonthGridDates = (year: number, month: number): Date[] => {
  const { from, to } = getMonthRange(year, month);
  const dates: Date[] = [];

  for (let cursor = new Date(from); cursor <= to; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }

  return dates;
};

type CalendarScreenProps = {
  onSelectDate?: (dateKey: string) => void;
};

export function CalendarScreen({ onSelectDate }: CalendarScreenProps) {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const gridDates = useMemo(() => buildMonthGridDates(year, month), [year, month]);
  const rangeFrom = useMemo(() => formatDateToYYYYMMDD(gridDates[0]), [gridDates]);
  const rangeTo = useMemo(
    () => formatDateToYYYYMMDD(gridDates[gridDates.length - 1]),
    [gridDates],
  );

  const {
    data: monthData,
    isPending,
    isError,
  } = useQuery({
    queryKey: eventKeys.month(rangeFrom, rangeTo),
    queryFn: () => getMonthEvents({ from: rangeFrom, to: rangeTo }),
  });

  const events = useMemo(
    () => Object.values(monthData?.byDate ?? {}).flatMap((bucket) => bucket.events),
    [monthData],
  );
  const segmentsByDate = useMemo(
    () => buildMonthEventLayout(gridDates, events),
    [gridDates, events],
  );
  const todayKey = useMemo(() => formatDateToYYYYMMDD(today), [today]);

  const goToPreviousMonth = () => {
    setVisibleMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setVisibleMonth(new Date(year, month + 1, 1));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={goToPreviousMonth}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel="이전 달">
            <ThemedText type="subtitle" style={styles.headerArrow}>
              ‹
            </ThemedText>
          </Pressable>

          <ThemedText type="subtitle">
            {year}년 {month + 1}월
          </ThemedText>

          <Pressable
            onPress={goToNextMonth}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel="다음 달">
            <ThemedText type="subtitle" style={styles.headerArrow}>
              ›
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS_KO.map((label, index) => (
            <View key={label} style={styles.weekdayCell}>
              <ThemedText
                type="small"
                themeColor={index === 0 ? 'text' : 'textSecondary'}
                style={index === 0 && styles.sundayText}>
                {label}
              </ThemedText>
            </View>
          ))}
        </View>

        {isPending && (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.text} />
          </View>
        )}

        {isError && (
          <View style={styles.centered}>
            <ThemedText themeColor="textSecondary">행사 정보를 불러오지 못했어요.</ThemedText>
          </View>
        )}

        {!isPending && !isError && (
          <View style={[styles.grid, { borderColor: theme.backgroundElement }]}>
            {gridDates.map((date) => {
              const dateKey = formatDateToYYYYMMDD(date);

              return (
                <CalendarDayCell
                  key={dateKey}
                  date={date}
                  isCurrentMonth={date.getMonth() === month}
                  isToday={dateKey === todayKey}
                  isSunday={date.getDay() === 0}
                  segments={segmentsByDate.get(dateKey) ?? []}
                  maxVisibleRows={MAX_VISIBLE_ROWS}
                  onPress={onSelectDate ? () => onSelectDate(dateKey) : undefined}
                />
              );
            })}
          </View>
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="calendar" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerArrow: {
    paddingHorizontal: Spacing.three,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: Spacing.one,
  },
  sundayText: {
    color: '#ac3a4f',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
