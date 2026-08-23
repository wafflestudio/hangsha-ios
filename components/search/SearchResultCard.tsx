import { Image } from 'expo-image';
import { useState } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryChip, DdayChip } from '@/components/events/EventChip';
import { HighlightedText } from '@/components/search/HighlightedText';
import type { Event, EventSearchItem } from '@/types/event';
import { formatEventDateRange } from '@/util/calendar/dateFormatter';
import { AdaptiveColors } from '@/util/theme';

type SearchResultCardProps = {
  item: EventSearchItem;
  onPress: () => void;
  onToggleBookmark: (event: Event) => Promise<void>;
};

export function SearchResultCard({
  item: { event, highlight },
  onPress,
  onToggleBookmark,
}: SearchResultCardProps) {
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [failedImageSource, setFailedImageSource] = useState<Event['imageUrl'] | null>(null);
  const imageFailed = failedImageSource === event.imageUrl;
  const date = formatEventDateRange(event.eventStart, event.eventEnd);

  const toggleBookmark = async (pressEvent: GestureResponderEvent) => {
    pressEvent.stopPropagation();
    if (isBookmarkPending) return;

    setIsBookmarkPending(true);
    try {
      await onToggleBookmark(event);
    } finally {
      setIsBookmarkPending(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title} 행사 상세 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.bookmarkColumn}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={event.isBookmarked ? '찜 해제' : '찜하기'}
          accessibilityState={{ selected: event.isBookmarked, busy: isBookmarkPending }}
          disabled={isBookmarkPending}
          hitSlop={10}
          onPress={toggleBookmark}
          style={isBookmarkPending && styles.pending}>
          <Image
            source={
              event.isBookmarked
                ? require('@/assets/images/Bookmarked.svg')
                : require('@/assets/images/notBookmarked.svg')
            }
            style={styles.bookmarkIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <HighlightedText html={highlight.title} numberOfLines={2} style={styles.title} />

        {highlight.contentSnippet ? (
          <HighlightedText
            html={highlight.contentSnippet}
            numberOfLines={2}
            style={styles.snippet}
          />
        ) : null}

        <View style={styles.footer}>
          {event.applyEnd ? (
            <DdayChip compact prefix="" targetDate={event.applyEnd} />
          ) : null}
          <CategoryChip compact categoryId={event.eventTypeId} />
          {date ? (
            <Text numberOfLines={1} style={styles.date}>
              {date}
            </Text>
          ) : null}
          {date && event.organization ? <Text style={styles.separator}>·</Text> : null}
          {event.organization ? (
            <Text numberOfLines={1} style={styles.organization}>
              {event.organization}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.thumbnailFrame}>
        <Image
          accessibilityLabel={`${event.title} 행사 이미지`}
          source={
            imageFailed ? require('@/assets/images/default-event-thumbnail.png') : event.imageUrl
          }
          style={styles.thumbnail}
          contentFit="cover"
          transition={150}
          onError={() => setFailedImageSource(event.imageUrl)}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 130,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AdaptiveColors.border,
  },
  bookmarkColumn: {
    width: 25,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: { width: 22, height: 22 },
  content: { minWidth: 0, flex: 1, gap: 5 },
  title: { color: AdaptiveColors.text, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  snippet: { color: AdaptiveColors.textSecondary, fontSize: 13.5, lineHeight: 20 },
  footer: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 3,
  },
  date: { color: AdaptiveColors.textMuted, fontSize: 12, lineHeight: 17 },
  separator: { color: AdaptiveColors.borderStrong, fontSize: 12 },
  organization: {
    minWidth: 0,
    flexShrink: 1,
    color: AdaptiveColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  thumbnailFrame: {
    width: 110,
    height: 76,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AdaptiveColors.border,
    borderRadius: 9,
    backgroundColor: AdaptiveColors.backgroundElement,
  },
  thumbnail: { width: '100%', height: '100%' },
  pressed: { backgroundColor: AdaptiveColors.pressed },
  pending: { opacity: 0.45 },
});
