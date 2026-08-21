import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import {
  CalendarWeekRow,
  MONTH_DATE_BADGE_HEIGHT,
  MONTH_EVENT_ROW_HEIGHT,
  MONTH_WEEK_ROW_GAP,
  MONTH_WEEK_ROW_HEIGHT,
} from '@/components/calendar/CalendarWeekRow';
import { FilterSheet } from '@/components/calendar/FilterSheet';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMonthEventsQuery } from '@/contexts/EventDataContext';
import { useEventFilterParams } from '@/hooks/use-event-filter-params';
import { useTheme } from '@/hooks/use-theme';
import type { Event, MonthViewResponse } from '@/types/event';
import { buildMonthEventLayout } from '@/util/calendar/buildMonthEventLayout';
import { formatDateToYYYYMMDD } from '@/util/calendar/dateFormatter';
import { filterEventTimeVariants } from '@/util/calendar/filterEventTimeVariants';
import { getMonthRange } from '@/util/calendar/getMonthRange';
import { getEventTypeColors, Spacing } from '@/util/theme';

const WEEKDAY_LABELS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_VISIBLE_ROWS = 4;
const DAYS_PER_WEEK = 7;
const GRID_HORIZONTAL_MARGIN = 20;
const LONG_PRESS_DURATION_MS = 250;

type MonthEventHitTarget = {
  key: string;
  eventId: number;
  title: string;
  eventTypeId: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type MonthEventPreviewState = MonthEventHitTarget & {
  backgroundColor: string;
  placement: 'above' | 'below';
};

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
  onSearch?: () => void;
};

export function CalendarScreen({ onSelectDate, onSearch }: CalendarScreenProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { width: windowWidth } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);
  const [gridWidth, setGridWidth] = useState(() => windowWidth - GRID_HORIZONTAL_MARGIN);
  const [preview, setPreview] = useState<MonthEventPreviewState | null>(null);
  const filterParams = useEventFilterParams();

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
  } = useMonthEventsQuery(rangeFrom, rangeTo, filterParams);

  const events = useMemo(
    () => filterEventTimeVariants(flattenByDate(monthData?.byDate), (event) => event),
    [monthData],
  );
  const weeks = useMemo(
    () => buildMonthEventLayout(gridDates, events),
    [gridDates, events],
  );
  const todayKey = useMemo(() => formatDateToYYYYMMDD(today), [today]);
  const cellWidth = gridWidth / DAYS_PER_WEEK;

  const previewHitTargets = useMemo<MonthEventHitTarget[]>(
    () =>
      weeks.flatMap((weekBars, weekIndex) =>
        weekBars
          .filter((bar) => !bar.isPeriodEvent && bar.rowIndex < MAX_VISIBLE_ROWS)
          .map((bar) => {
            const top =
              weekIndex * (MONTH_WEEK_ROW_HEIGHT + MONTH_WEEK_ROW_GAP) +
              MONTH_DATE_BADGE_HEIGHT +
              bar.rowIndex * MONTH_EVENT_ROW_HEIGHT;

            return {
              key: `${weekIndex}-${bar.eventId}-${bar.rowIndex}`,
              eventId: bar.eventId,
              title: bar.title,
              eventTypeId: bar.eventTypeId,
              left: bar.dayIndex * cellWidth,
              right: (bar.dayIndex + bar.spanDays) * cellWidth,
              top,
              bottom: top + MONTH_EVENT_ROW_HEIGHT,
            };
          }),
      ),
    [cellWidth, weeks],
  );

  const updatePreviewAt = useCallback(
    (x: number, y: number) => {
      const target = previewHitTargets.find(
        (candidate) =>
          x >= candidate.left &&
          x <= candidate.right &&
          y >= candidate.top &&
          y <= candidate.bottom,
      );

      if (!target) return;

      const visibleCenterY =
        scrollOffsetRef.current + scrollViewportHeightRef.current / 2;
      const backgroundColor = getEventTypeColors(scheme, target.eventTypeId).background;

      setPreview((current) =>
        current?.key === target.key
          ? current
          : {
              ...target,
              backgroundColor,
              placement: target.top < visibleCenterY ? 'below' : 'above',
            },
      );
    },
    [previewHitTargets, scheme],
  );

  const closePreview = useCallback(() => setPreview(null), []);

  const previewGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(previewHitTargets.length > 0)
        .activateAfterLongPress(LONG_PRESS_DURATION_MS)
        .maxPointers(1)
        .shouldCancelWhenOutside(false)
        .runOnJS(true)
        .onStart(({ x, y }) => updatePreviewAt(x, y))
        .onUpdate(({ x, y }) => updatePreviewAt(x, y))
        .onFinalize(closePreview),
    [closePreview, previewHitTargets.length, updatePreviewAt],
  );

  const handleGridLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setGridWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth,
    );
  }, []);

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
                accessibilityLabel="필터"
                onPress={() => filterSheetRef.current?.present()}>
                <Image
                  source={require('@/assets/images/filter.svg')}
                  style={styles.filterIcon}
                  contentFit="contain"
                />
              </Pressable>
            </>
          }
          right={
            <Pressable
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel="검색"
              onPress={onSearch}>
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
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onLayout={(event) => {
              scrollViewportHeightRef.current = event.nativeEvent.layout.height;
            }}
            onScroll={(event) => {
              scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            contentContainerStyle={styles.grid}>
            <GestureDetector gesture={previewGesture}>
              <View collapsable={false} onLayout={handleGridLayout}>
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
                      cellWidth={cellWidth}
                      onSelectDate={onSelectDate}
                    />
                  );
                })}

                {preview ? (
                  <MonthEventPreview
                    key={preview.key}
                    preview={preview}
                    containerWidth={gridWidth}
                  />
                ) : null}
              </View>
            </GestureDetector>
          </ScrollView>
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="calendar" />
      <FilterSheet ref={filterSheetRef} applyLabel={`${events.length}개의 행사 보기`} />
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
    paddingHorizontal: GRID_HORIZONTAL_MARGIN / 2,
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
    marginHorizontal: GRID_HORIZONTAL_MARGIN / 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  previewText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});

type MonthEventPreviewProps = {
  preview: MonthEventPreviewState;
  containerWidth: number;
};

function MonthEventPreview({ preview, containerWidth }: MonthEventPreviewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isMeasured = size.width > 0 && size.height > 0;
  const centerX = (preview.left + preview.right) / 2;
  const left = Math.max(8, Math.min(centerX - size.width / 2, containerWidth - size.width - 8));
  const top =
    preview.placement === 'below'
      ? preview.bottom + 8
      : preview.top - size.height - 8;

  return (
    <View
      pointerEvents="none"
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
      style={[
        styles.preview,
        {
          left: isMeasured ? left : centerX,
          top,
          maxWidth: Math.max(containerWidth - 16, 0),
          opacity: isMeasured ? 1 : 0,
          backgroundColor: preview.backgroundColor,
        },
      ]}>
      <Text style={styles.previewText}>{preview.title}</Text>
    </View>
  );
}
