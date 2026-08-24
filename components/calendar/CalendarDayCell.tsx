import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AdaptiveColors, Spacing } from '@/util/theme';

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  width: number;
  minHeight: number;
  onPress?: () => void;
};

export function CalendarDayCell({
  date,
  isCurrentMonth,
  isToday,
  isSunday,
  width,
  minHeight,
  onPress,
}: CalendarDayCellProps) {
  const dateColor = isSunday ? '#FF8797' : AdaptiveColors.textMuted;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { width, height: minHeight },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${date.getDate()}일 행사 보기` : undefined}>
      <View style={styles.card}>
        {isCurrentMonth ? (
          <View style={styles.dateBadge}>
            <ThemedText
              type="small"
              style={[styles.dateText, { color: dateColor }, isToday && styles.todayText]}>
              {date.getDate()}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 1,
    paddingBottom: 2,
  },
  card: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: AdaptiveColors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    paddingTop: Spacing.one,
  },
  dateBadge: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.one,
  },
  dateText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  todayText: {
    color: AdaptiveColors.text,
    fontWeight: '700',
  },
  pressed: { opacity: 0.72 },
});
