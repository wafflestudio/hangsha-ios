import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import type { Event } from '@/types/event';
import { getDDay } from '@/util/calendar/getDday';
import { getEventTypeColors, Spacing } from '@/util/theme';
import { useTheme } from '@/hooks/use-theme';

type DailyEventCardProps = {
  event: Event;
  onPress?: () => void;
};

export function DailyEventCard({ event, onPress }: DailyEventCardProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const ddayTargetDate = event.applyEnd ?? null;
  const displayDate = event.eventStart ?? event.applyStart;
  const colors = getEventTypeColors(scheme, event.eventTypeId);

  return (
    <Pressable
      style={[styles.container, { borderColor: theme.backgroundElement }]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={event.title}>
      {ddayTargetDate && (
        <View style={[styles.ddayBadge, { backgroundColor: colors.background }]}>
          <ThemedText type="small" style={{ color: colors.text }}>
            {getDDay(ddayTargetDate)}
          </ThemedText>
        </View>
      )}

      <View style={styles.body}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {event.title}
        </ThemedText>
        {displayDate && (
          <ThemedText type="small" themeColor="textSecondary">
            {displayDate.toLocaleDateString('ko-KR')}
          </ThemedText>
        )}
        {event.organization && (
          <ThemedText type="small" themeColor="textSecondary">
            {event.organization}
          </ThemedText>
        )}
      </View>

      <SymbolView
        name={event.isBookmarked ? 'bookmark.fill' : 'bookmark'}
        tintColor={theme.text}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ddayBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: '600',
  },
});
