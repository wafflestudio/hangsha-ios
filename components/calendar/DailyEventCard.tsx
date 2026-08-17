import { Image } from 'expo-image';
import { useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { StartDate } from '@/components/events/EventDate';
import type { Event } from '@/types/event';
import { getDDay } from '@/util/calendar/getDday';
import { getEventTypeColors, getEventTypeLabel } from '@/util/theme';

type DailyEventCardProps = {
  event: Event;
  onPress?: () => void;
  onToggleBookmark?: (event: Event) => Promise<void> | void;
};

export function DailyEventCard({ event, onPress, onToggleBookmark }: DailyEventCardProps) {
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(event.isBookmarked ?? false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const categoryColors = getEventTypeColors('light', event.eventTypeId);
  const dday = getDDay(event.applyEnd);

  const toggleCategory = (pressEvent: GestureResponderEvent) => {
    pressEvent.stopPropagation();
    setIsCategoryExpanded((expanded) => !expanded);
  };

  const toggleBookmark = async (pressEvent: GestureResponderEvent) => {
    pressEvent.stopPropagation();
    if (!onToggleBookmark || isBookmarkPending) return;

    const previousState = isBookmarked;
    setIsBookmarked(!previousState);
    setIsBookmarkPending(true);
    try {
      await onToggleBookmark(event);
    } catch {
      setIsBookmarked(previousState);
    } finally {
      setIsBookmarkPending(false);
    }
  };

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${event.title} 행사 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.metadataRow}>
        <View style={styles.statusGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`행사 종류: ${getEventTypeLabel(event.eventTypeId)}`}
            accessibilityState={{ expanded: isCategoryExpanded }}
            hitSlop={5}
            onPress={toggleCategory}
            style={[
              styles.category,
              { backgroundColor: categoryColors.background },
              isCategoryExpanded && styles.categoryExpanded,
            ]}>
            {isCategoryExpanded ? (
              <Text numberOfLines={1} style={styles.categoryLabel}>
                {getEventTypeLabel(event.eventTypeId)}
              </Text>
            ) : null}
          </Pressable>

          {dday ? <Text style={styles.ddayText}>{`지원 ${dday}`}</Text> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? '찜 해제' : '찜하기'}
          accessibilityState={{ selected: isBookmarked, busy: isBookmarkPending }}
          disabled={!onToggleBookmark || isBookmarkPending}
          hitSlop={10}
          onPress={toggleBookmark}
          style={({ pressed }) => [
            styles.bookmarkButton,
            pressed && styles.bookmarkPressed,
            isBookmarkPending && styles.pending,
          ]}>
          <Image
            source={
              isBookmarked
                ? require('@/assets/images/Bookmarked.svg')
                : require('@/assets/images/notBookmarked.svg')
            }
            style={styles.bookmarkIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {event.title}
      </Text>

      <View style={styles.footer}>
        <StartDate
          label={null}
          eventStart={event.eventStart}
          eventEnd={event.eventEnd}
          style={styles.dateText}
        />
        {event.organization ? (
          <Text numberOfLines={1} style={styles.organizationText}>
            {event.organization}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 120,
    paddingVertical: 14,
  },
  metadataRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  category: {
    width: 27,
    height: 27,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 999,
  },
  categoryExpanded: { width: 'auto', maxWidth: 190, paddingHorizontal: 10 },
  categoryLabel: { color: '#111111', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  ddayText: { color: '#111111', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  bookmarkButton: {
    width: 38,
    height: 32,
    marginRight: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bookmarkIcon: { width: 24, height: 24 },
  title: {
    marginTop: 12,
    color: '#111111',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  footer: {
    minHeight: 20,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateText: { color: '#555555', fontSize: 13, lineHeight: 19 },
  organizationText: {
    minWidth: 0,
    flex: 1,
    color: '#555555',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'right',
  },
  pressed: { opacity: 0.68 },
  bookmarkPressed: { opacity: 0.55 },
  pending: { opacity: 0.4 },
});
