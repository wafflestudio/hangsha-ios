import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/events/EventCard';
import type { Event } from '@/types/event';

type GalleryEventCardProps = {
  event: Event;
  width: number;
  isBookmarked: boolean;
  onToggleBookmark?: (event: Event) => Promise<void> | void;
};

export function GalleryEventCard({
  event,
  width,
  isBookmarked,
  onToggleBookmark,
}: GalleryEventCardProps) {
  const [failedImageSource, setFailedImageSource] = useState<Event['imageUrl'] | null>(null);
  const imageFailed = failedImageSource === event.imageUrl;

  return (
    <View style={[styles.container, { width }]}>
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

      <EventCard
        event={event}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 0, alignItems: 'flex-start' },
  thumbnailFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  thumbnail: { width: '100%', height: '100%' },
});
