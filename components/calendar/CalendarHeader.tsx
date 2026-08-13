import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type CalendarHeaderProps = {
  label: string;
  left?: ReactNode;
  right?: ReactNode;
};

/**
 * 캘린더 월 뷰/일별 뷰가 공유하는 헤더 컨테이너. 좌측 라벨(월/날짜) 옆에
 * left(예: 월 이동 화살표), 우측에 right(예: 필터/검색 버튼)를 끼워 넣는다.
 */
export function CalendarHeader({ label, left, right }: CalendarHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.labelRow}>
        <ThemedText type="subtitle" style={styles.label}>
          {label}
        </ThemedText>
        {left}
      </View>

      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
    paddingTop: 40,
    paddingRight: 19,
    paddingBottom: 10,
    paddingLeft: 19,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  label: {
    fontSize: 20,
    lineHeight: 26,
  },
});
