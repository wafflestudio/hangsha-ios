import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

import { EventTypeColors, type EventTypeId } from '@/util/theme';
import { getDDay } from '@/util/calendar/getDday';

const EVENT_TYPE_LABELS: Record<number, string> = {
  1: '교육(특강/세미나)',
  2: '공모전/경진대회',
  3: '현장학습/인턴',
  4: '사회공헌(봉사)',
  5: '학습/진로상담',
  6: 'OpenLnL',
  7: '기타',
};

const FALLBACK_CHIP_COLORS = { background: '#E0E0E0', text: '#616161' };

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

const getCategoryColors = (categoryId: number) =>
  EventTypeColors.light[categoryId as EventTypeId] ?? FALLBACK_CHIP_COLORS;

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
  const colors = getCategoryColors(categoryId);

  if (variant === 'circle') {
    return (
      <View
        accessibilityLabel={`행사 카테고리: ${EVENT_TYPE_LABELS[categoryId] ?? '기타'}`}
        style={[styles.circle, { backgroundColor: colors.background }]}
      />
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: colors.background }, compact && styles.compact]}>
      <Text
        numberOfLines={1}
        style={[styles.text, { color: colors.text }, compact && styles.compactText, style]}>
        {EVENT_TYPE_LABELS[categoryId] ?? '기타'}
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
  outlined: { borderWidth: 1, borderColor: '#DDDDDD', backgroundColor: '#FFFFFF' },
  plain: { minHeight: undefined, paddingHorizontal: 0, backgroundColor: 'transparent' },
  circle: { width: 27, height: 27, flexShrink: 0, borderRadius: 999 },
  text: { color: '#555555', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  compact: { minHeight: 22, paddingHorizontal: 8 },
  compactText: { fontSize: 11, lineHeight: 15 },
});
