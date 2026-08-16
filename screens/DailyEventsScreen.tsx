import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { DailyEventCard } from '@/components/calendar/DailyEventCard';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useDayEventsQuery } from '@/contexts/EventDataContext';
import { useUserData } from '@/contexts/UserDataContext';
import type { Event } from '@/types/event';
import { filterDayEvents } from '@/util/calendar/filterDayEvents';
import { formatDateToYYYYMMDD, parseDateString } from '@/util/calendar/dateFormatter';
import { Spacing } from '@/util/theme';

type DailyEventsScreenProps = {
  date: string;
};

const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export function DailyEventsScreen({ date }: DailyEventsScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleBookmark } = useUserData();
  const dayEventsQuery = useDayEventsQuery(date);
  const { data, isPending, isError, isRefetching } = dayEventsQuery;
  const selectedDate = date ? parseDateString(date) : null;

  const headerLabel = selectedDate
    ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`
    : '';

  const events = useMemo(
    () => (date && data ? filterDayEvents(parseDateString(date), data.items) : []),
    [date, data],
  );

  const goToDate = (nextDate: Date) => {
    router.setParams({ date: formatDateToYYYYMMDD(nextDate) });
  };

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/calendar');
  };

  const toggleEventBookmark = async (event: Event) => {
    if (!user) {
      Alert.alert('로그인이 필요해요', '행사를 찜하려면 로그인해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.replace('/') },
      ]);
      throw new Error('Authentication is required to toggle a bookmark.');
    }

    try {
      await toggleBookmark(event);
    } catch (error) {
      Alert.alert('찜 변경 실패', '찜 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.');
      throw error;
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <CalendarHeader
          label={headerLabel}
          left={
            <>
              <Pressable
                style={({ pressed }) => [styles.todayButton, pressed && styles.controlPressed]}
                onPress={() => goToDate(new Date())}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="오늘로 이동">
                <Text style={styles.todayText}>오늘</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.headerArrow, pressed && styles.controlPressed]}
                onPress={() => selectedDate && goToDate(addDays(selectedDate, -1))}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="이전 날">
                <SymbolView name="chevron.left" tintColor="#ABABAB" size={18} weight="bold" />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.headerArrow, pressed && styles.controlPressed]}
                onPress={() => selectedDate && goToDate(addDays(selectedDate, 1))}
                hitSlop={Spacing.two}
                accessibilityRole="button"
                accessibilityLabel="다음 날">
                <SymbolView name="chevron.right" tintColor="#ABABAB" size={18} weight="bold" />
              </Pressable>

              <Pressable
                disabled
                style={styles.filterButton}
                accessibilityRole="button"
                accessibilityLabel="필터"
                accessibilityState={{ disabled: true }}>
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
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="일별 행사 닫기"
              style={({ pressed }) => [styles.closeButton, pressed && styles.controlPressed]}>
              <SymbolView name="xmark" tintColor="#ABABAB" size={22} weight="semibold" />
            </Pressable>
          }
        />

        {isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#828282" />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.stateText}>행사 정보를 불러오지 못했어요.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => dayEventsQuery.refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.controlPressed]}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(event: Event) => String(event.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              events.length === 0 && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => dayEventsQuery.refetch()}
                tintColor="#828282"
              />
            }
            renderItem={({ item }) => (
              <DailyEventCard
                event={item}
                onPress={() =>
                  router.push({ pathname: '/event/[id]', params: { id: String(item.id) } })
                }
                onToggleBookmark={toggleEventBookmark}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.stateText}>행사가 없습니다.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="calendar" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  todayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  todayText: { color: '#555555', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  headerArrow: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterIcon: { width: 19, height: 19 },
  closeButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 1, paddingBottom: 18 },
  emptyListContent: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { color: '#888888', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  retryButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, backgroundColor: '#F0F0F0' },
  retryText: { color: '#555555', fontSize: 13, fontWeight: '700' },
  controlPressed: { opacity: 0.55 },
});
