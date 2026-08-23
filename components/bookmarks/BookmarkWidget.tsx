import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { BookmarksHeader } from '@/components/bookmarks/BookmarksHeader';
import { GalleryEventCard } from '@/components/events/GalleryEventCard';
import type { Event } from '@/types/event';
import { AdaptiveColors } from '@/util/theme';

const PREVIEW_CARD_WIDTH = 180;

type BookmarkWidgetProps = {
  events: Event[];
  isLoading: boolean;
  onShowAll: () => void;
  onToggleBookmark: (event: Event) => Promise<void> | void;
};

export function BookmarkWidget({
  events,
  isLoading,
  onShowAll,
  onToggleBookmark,
}: BookmarkWidgetProps) {
  return (
    <View style={styles.container}>
      <BookmarksHeader variant="widget" onAction={onShowAll} />

      {isLoading && events.length === 0 ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={AdaptiveColors.icon} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.feedback}>
          <Text style={styles.emptyText}>
            아직 찜된 행사가 없습니다.{`\n`}관심있는 행사를 찜해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={events}
          keyExtractor={(event) => String(event.id)}
          renderItem={({ item }) => (
            <GalleryEventCard
              event={item}
              width={PREVIEW_CARD_WIDTH}
              isBookmarked
              onToggleBookmark={onToggleBookmark}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AdaptiveColors.border,
    backgroundColor: AdaptiveColors.background,
  },
  listContent: { paddingTop: 16, paddingHorizontal: 20 },
  separator: { width: 6 },
  feedback: { minHeight: 134, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: AdaptiveColors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
