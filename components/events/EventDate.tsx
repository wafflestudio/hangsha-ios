import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

import { formatEventDateRange } from '@/util/calendar/dateFormatter';
import { AdaptiveColors } from '@/util/theme';

type BaseDateProps = {
  label: string | null;
  startDate: Date | null;
  endDate: Date | null;
  style?: StyleProp<TextStyle>;
};

type DateProps = Omit<BaseDateProps, 'label' | 'startDate' | 'endDate'> & {
  label?: string | null;
  applyStart: Date | null;
  applyEnd: Date | null;
};

type StartDateProps = Omit<BaseDateProps, 'label' | 'startDate' | 'endDate'> & {
  label?: string | null;
  eventStart: Date | null;
  eventEnd: Date | null;
};

export function BaseDate({ label, startDate, endDate, style }: BaseDateProps) {
  const date = formatEventDateRange(startDate, endDate);

  if (!date) return null;

  return (
    <View style={styles.row}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text numberOfLines={1} style={[styles.date, style]}>{date}</Text>
    </View>
  );
}

export function ApplyDate({ label = '지원 기간', applyStart, applyEnd, style }: DateProps) {
  return <BaseDate label={label} startDate={applyStart} endDate={applyEnd} style={style} />;
}

export function StartDate({ label = '행사 날짜', eventStart, eventEnd, style }: StartDateProps) {
  return <BaseDate label={label} startDate={eventStart} endDate={eventEnd} style={style} />;
}

type EventDateProps = {
  applyStart: Date | null;
  applyEnd: Date | null;
  eventStart: Date | null;
  eventEnd: Date | null;
};

export function EventDate({ applyStart, applyEnd, eventStart, eventEnd }: EventDateProps) {
  return (
    <View style={styles.column}>
      <StartDate eventStart={eventStart} eventEnd={eventEnd} />
      <ApplyDate applyStart={applyStart} applyEnd={applyEnd} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 4 },
  row: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { flexShrink: 0, color: AdaptiveColors.textSecondary, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  date: { flexShrink: 1, color: AdaptiveColors.textSecondary, fontSize: 14, lineHeight: 20 },
});
