import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyEventCard } from '@/components/calendar/DailyEventCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Event } from '@/types/event';
import { eventKeys, getDayEvents } from '@/api/event';
import { parseDateString } from '@/util/calendar/dateFormatter';
import { BottomTabInset, Spacing } from '@/util/theme';
import { useTheme } from '@/hooks/use-theme';

type DailyEventsScreenProps = {
  date: string;
};

export function DailyEventsScreen({ date }: DailyEventsScreenProps) {
  const theme = useTheme();
  const router = useRouter();

  const {
    data,
    isPending,
    isError,
  } = useQuery({
    queryKey: eventKeys.day(date),
    queryFn: () => getDayEvents({ date }),
    enabled: Boolean(date),
  });

  const headerLabel = date
    ? parseDateString(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

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
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ThemedText type="subtitle" style={styles.header}>
          {headerLabel}
        </ThemedText>

        <FlatList
          data={data.items}
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
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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
