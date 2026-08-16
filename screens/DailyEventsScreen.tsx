import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { DailyEventCard } from '@/components/calendar/DailyEventCard';
import { FilterSheet } from '@/components/calendar/FilterSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDayEventsQuery } from '@/contexts/EventDataContext';
import { useEventFilterParams } from '@/hooks/use-event-filter-params';
import type { Event } from '@/types/event';
import { formatDateToYYYYMMDD, parseDateString } from '@/util/calendar/dateFormatter';
import { filterDayEvents } from '@/util/calendar/filterDayEvents';
import { BottomTabInset, Spacing } from '@/util/theme';
import { useTheme } from '@/hooks/use-theme';

type DailyEventsScreenProps = {
  date: string;
};

const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export function DailyEventsScreen({ date }: DailyEventsScreenProps) {
  const theme = useTheme();
  const router = useRouter();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const filterParams = useEventFilterParams();

  const {
    data,
    isPending,
    isError,
  } = useDayEventsQuery(date, filterParams);

  const selectedDate = date ? parseDateString(date) : null;

  const headerLabel = selectedDate
    ? selectedDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const events = useMemo(
    () => (date && data ? filterDayEvents(parseDateString(date), data.items) : []),
    [date, data],
  );

  const goToDate = (nextDate: Date) => {
    router.setParams({ date: formatDateToYYYYMMDD(nextDate) });
  };

  const goToToday = () => goToDate(new Date());
  const goToPreviousDay = () => selectedDate && goToDate(addDays(selectedDate, -1));
  const goToNextDay = () => selectedDate && goToDate(addDays(selectedDate, 1));

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">행사 정보를 불러오지 못했어요.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <CalendarHeader
          label={headerLabel}
          left={
            <>
              <Pressable
                style={styles.todayButton}
                onPress={goToToday}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="오늘로 이동">
                <ThemedText type="small" themeColor="textSecondary">
                  오늘
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.headerArrow}
                onPress={goToPreviousDay}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="이전 날">
                <SymbolView
                  name="chevron.left"
                  tintColor={theme.textSecondary}
                  size={18}
                  weight="bold"
                />
              </Pressable>

              <Pressable
                style={styles.headerArrow}
                onPress={goToNextDay}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="다음 날">
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
        />

        <FlatList
          data={events}
          keyExtractor={(event: Event) => String(event.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DailyEventCard
              event={item}
              onPress={() =>
                router.push({ pathname: '/event/[id]', params: { id: String(item.id) } })
              }
            />
          )}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText themeColor="textSecondary">
                해당 날짜에 등록된 행사가 없어요.
              </ThemedText>
            </ThemedView>
          }
        />
      </SafeAreaView>

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
    paddingBottom: BottomTabInset,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    paddingHorizontal: 7,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
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
  listContent: {
    paddingHorizontal: Spacing.three,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.six,
  },
});
