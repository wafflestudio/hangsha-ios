import { Image } from 'expo-image';
import { useState } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Event } from '@/types/event';
import { CategoryChip, DdayChip } from '@/components/events/EventChip';
import { StartDate } from '@/components/events/EventDate';

type EventCardProps = {
  event: Event;
  isBookmarked: boolean;
  onToggleBookmark?: (event: Event) => Promise<void> | void;
};

export function EventCard({ event, isBookmarked, onToggleBookmark }: EventCardProps) {
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  const toggleBookmark = async (pressEvent: GestureResponderEvent) => {
    pressEvent.stopPropagation();
    if (!onToggleBookmark || isTogglingBookmark) return;

    setIsTogglingBookmark(true);
    try {
      await onToggleBookmark(event);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.metadataRow}>
        <View style={styles.statusGroup}>
          <CategoryChip categoryId={event.eventTypeId} variant="circle" />
          <DdayChip targetDate={event.applyEnd} variant="plain" style={styles.ddayText} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? '찜 해제' : '찜하기'}
          accessibilityState={{ selected: isBookmarked, busy: isTogglingBookmark }}
          disabled={!onToggleBookmark || isTogglingBookmark}
          hitSlop={8}
          onPress={toggleBookmark}
          style={({ pressed }) => [
            styles.bookmarkButton,
            pressed && styles.pressed,
            isTogglingBookmark && styles.pending,
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

      <View style={styles.dateOrganizationRow}>
        <StartDate
          label={null}
          eventStart={event.eventStart}
          eventEnd={event.eventEnd}
          style={styles.dateText}
        />
        <Text numberOfLines={1} style={styles.organizationText}>
          {event.organization}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'flex-start' },
  metadataRow: {
    width: '100%',
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
  ddayText: { color: '#111111', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  bookmarkButton: {
    width: 34,
    height: 34,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: { width: 24, height: 24 },
  title: {
    minHeight: 50,
    marginTop: 13,
    color: '#111111',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.25,
  },
  dateOrganizationRow: {
    width: '100%',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  pressed: { opacity: 0.6 },
  pending: { opacity: 0.5 },
});
