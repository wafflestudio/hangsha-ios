import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarWeekRow } from '@/components/calendar/CalendarWeekRow';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMonthEventsQuery } from '@/contexts/EventDataContext';
import { useTheme } from '@/hooks/use-theme';
import type { Event, MonthViewResponse } from '@/types/event';
import { buildMonthEventLayout } from '@/util/calendar/buildMonthEventLayout';
import { formatDateToYYYYMMDD } from '@/util/calendar/dateFormatter';
import { getMonthRange } from '@/util/calendar/getMonthRange';
import { Spacing } from '@/util/theme';

const WEEKDAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_VISIBLE_ROWS = 4;
const DAYS_PER_WEEK = 7;

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

/**
 * byDate 버킷을 날짜 키 오름차순으로 순회하며 이벤트를 평탄화한다. 같은
 * 이벤트가 여러 날짜 버킷에 중복으로 들어있을 수 있어(여러 날에 걸친
 * 이벤트) id 기준으로 처음 등장한 자리만 남긴다. hangsha-web
 * CalendarView.tsx의 flattenByDate와 동일한 규칙 — 없으면 여러 날에 걸친
 * 이벤트가 걸친 일수만큼 중복 카운트된다.
 */
const flattenByDate = (byDate: MonthViewResponse['byDate'] | undefined): Event[] => {
  const seen = new Map<number, Event>();
  const buckets = byDate ?? {};

  for (const dateKey of Object.keys(buckets).sort()) {
    for (const event of buckets[dateKey].events) {
      if (!seen.has(event.id)) {
        seen.set(event.id, event);
      }
    }
  }

  return Array.from(seen.values());
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
  } = useMonthEventsQuery(rangeFrom, rangeTo);

  const events = useMemo(() => flattenByDate(monthData?.byDate), [monthData]);
  const weeks = useMemo(
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
        <CalendarHeader
          label={`${year}년 ${month + 1}월`}
          left={
            <>
              <Pressable
                style={styles.headerArrow}
                onPress={goToPreviousMonth}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="이전 달">
                <SymbolView
                  name="chevron.left"
                  tintColor={theme.textSecondary}
                  size={18}
                  weight="bold"
                />
              </Pressable>

              <Pressable
                style={styles.headerArrow}
                onPress={goToNextMonth}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="다음 달">
                <SymbolView
                  name="chevron.right"
                  tintColor={theme.textSecondary}
                  size={18}
                  weight="bold"
                />
              </Pressable>

              <Pressable
                style={styles.filterButton}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="필터">
                <Image
                  source={require('@/assets/images/filter.svg')}
                  style={styles.filterIcon}
                  contentFit="contain"
                />
              </Pressable>
            </>
          }
          right={
            <Pressable hitSlop={Spacing.two} accessibilityRole="button" accessibilityLabel="검색">
              <SymbolView name="magnifyingglass" tintColor={theme.text} size={20} />
            </Pressable>
          }
        />

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
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={[styles.grid, { borderColor: theme.backgroundElement }]}>
            {weeks.map((weekBars, weekIndex) => {
              const weekDates = gridDates.slice(
                weekIndex * DAYS_PER_WEEK,
                weekIndex * DAYS_PER_WEEK + DAYS_PER_WEEK,
              );

              return (
                <CalendarWeekRow
                  key={formatDateToYYYYMMDD(weekDates[0])}
                  weekDates={weekDates}
                  currentMonth={month}
                  todayKey={todayKey}
                  bars={weekBars}
                  maxVisibleRows={MAX_VISIBLE_ROWS}
                  onSelectDate={onSelectDate}
                />
              );
            })}
          </ScrollView>
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
  headerArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  filterButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterIcon: {
    width: 19,
    height: 19,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  gridScroll: {
    flex: 1,
  },
  grid: {
    marginHorizontal: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
