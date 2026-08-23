import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

import { AdaptiveColors, getEventTypeColors, getEventTypeLabel } from '@/util/theme';
import { getDDay } from '@/util/calendar/getDday';
import { useColorScheme } from '@/hooks/use-color-scheme';

type EventChipProps = {
  compact?: boolean;
  style?: StyleProp<TextStyle>;
};

type CategoryChipProps = EventChipProps & {
  categoryId: number;
  variant?: 'chip' | 'circle';
};

type DdayChipProps = EventChipProps & {
  prefix?: string;
  targetDate: Date | string | null | undefined;
  variant?: 'outlined' | 'plain';
};

export function DdayChip({
  compact = false,
  prefix = '지원 ',
  style,
  targetDate,
  variant = 'outlined',
}: DdayChipProps) {
  const dday = getDDay(targetDate);

  if (!dday) return null;

  return (
    <View
      style={[
        styles.chip,
        variant === 'outlined' && styles.outlined,
        variant === 'plain' && styles.plain,
        compact && styles.compact,
      ]}>
      <Text style={[styles.text, compact && styles.compactText, style]}>{`${prefix}${dday}`}</Text>
    </View>
  );
}

export function CategoryChip({
  categoryId,
  compact = false,
  style,
  variant = 'chip',
}: CategoryChipProps) {
  const colorScheme = useColorScheme();
  const colors = getEventTypeColors(colorScheme, categoryId);
  const label = getEventTypeLabel(categoryId);

  if (variant === 'circle') {
    return (
      <View
        accessibilityLabel={`행사 카테고리: ${label}`}
        style={[styles.circle, { backgroundColor: colors.background }]}
      />
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: colors.background }, compact && styles.compact]}>
      <Text
        numberOfLines={1}
        style={[styles.text, { color: colors.text }, compact && styles.compactText, style]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    maxWidth: '100%',
    minHeight: 27,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  outlined: { borderWidth: 1, borderColor: AdaptiveColors.border, backgroundColor: AdaptiveColors.surface },
  plain: { minHeight: undefined, paddingHorizontal: 0, backgroundColor: 'transparent' },
  circle: { width: 27, height: 27, flexShrink: 0, borderRadius: 999 },
  text: { color: AdaptiveColors.textSecondary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  compact: { minHeight: 22, paddingHorizontal: 8 },
  compactText: { fontSize: 11, lineHeight: 15 },
});
