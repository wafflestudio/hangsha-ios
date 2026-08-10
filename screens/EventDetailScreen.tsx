import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { eventKeys, getEventDetail } from '@/api/event';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { getDDay } from '@/util/calendar/getDday';
import {
  BottomTabInset,
  EventTypeColors,
  EventTypeLabels,
  Spacing,
  type EventTypeId,
} from '@/util/theme';

const isKnownEventTypeId = (eventTypeId: number): eventTypeId is EventTypeId =>
  eventTypeId in EventTypeColors.light;

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const {
    data: event,
    isPending,
    isError,
  } = useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => getEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });

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

  const categoryColors = isKnownEventTypeId(event.eventTypeId)
    ? EventTypeColors[scheme][event.eventTypeId]
    : EventTypeColors[scheme][7];
  const categoryLabel = isKnownEventTypeId(event.eventTypeId)
    ? EventTypeLabels[event.eventTypeId]
    : EventTypeLabels[7];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.thumbnailWrapper}>
            <Image source={event.imageUrl} style={styles.thumbnail} contentFit="cover" />
            <View style={[styles.bookmarkButton, { backgroundColor: theme.background }]}>
              <SymbolView
                name={event.isBookmarked ? 'bookmark.fill' : 'bookmark'}
                tintColor={theme.text}
                size={20}
              />
            </View>
          </View>

          <ThemedText type="subtitle" style={styles.title}>
            {event.title}
          </ThemedText>

          {event.applyStart && (
            <ThemedText themeColor="textSecondary">
              신청 시작일 {event.applyStart.toLocaleDateString('ko-KR')}
            </ThemedText>
          )}

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: categoryColors.background }]}>
              <ThemedText type="small" style={{ color: categoryColors.text }}>
                {categoryLabel}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">{getDDay(event.applyEnd)}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.detail}>{event.detail}</ThemedText>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  bookmarkButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.two,
  },
  title: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  detail: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
});
