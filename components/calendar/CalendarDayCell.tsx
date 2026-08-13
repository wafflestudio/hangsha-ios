import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/util/theme';

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
  const dateColor = !isCurrentMonth ? '#9CA3AF' : isSunday ? '#ac3a4f' : undefined;

  return (
    <Pressable
      style={[styles.container, { width, minHeight }]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${date.getDate()}일 행사 보기` : undefined}>
      <View style={[styles.dateBadge, isToday && styles.todayBadge]}>
        <ThemedText
          type="small"
          style={[dateColor && { color: dateColor }, isToday && styles.todayText]}>
          {date.getDate()}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.25)',
    paddingTop: Spacing.one,
    paddingHorizontal: 2,
  },
  dateBadge: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.one,
  },
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3a90b2',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  todayText: {
    color: '#ffffff',
  },
});
