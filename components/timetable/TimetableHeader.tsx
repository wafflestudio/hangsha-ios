import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Semester } from '@/types/timetable';
import { SEMESTER_OPTIONS } from '@/types/timetable';
import { AdaptiveColors } from '@/util/theme';

type SelectionMenu = 'year' | 'semester' | null;

type TimetableHeaderProps = {
  title: string;
  year: number;
  semester: Semester;
  years: number[];
  weekLabel: string;
  eventOverlayOn: boolean;
  loading?: boolean;
  onYearChange: (year: number) => void;
  onSemesterChange: (semester: Semester) => void;
  onToggleOverlay: () => void;
  onMoveWeek: (amount: number) => void;
};

export function TimetableHeader({
  title,
  year,
  semester,
  years,
  weekLabel,
  eventOverlayOn,
  loading = false,
  onYearChange,
  onSemesterChange,
  onToggleOverlay,
  onMoveWeek,
}: TimetableHeaderProps) {
  const [menu, setMenu] = useState<SelectionMenu>(null);
  const semesterLabel = SEMESTER_OPTIONS.find((option) => option.id === semester)?.label;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text numberOfLines={1} style={styles.title}>{title || '나의 시간표'}</Text>

        <View style={styles.weekGroup}>
          <Text style={styles.weekLabel}>{weekLabel}</Text>
          <View style={styles.weekButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="이전 주"
              style={({ pressed }) => [styles.weekButton, pressed && styles.pressed]}
              onPress={() => onMoveWeek(-1)}>
              <SymbolView name="chevron.left" tintColor={AdaptiveColors.text} size={16} weight="bold" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="다음 주"
              style={({ pressed }) => [styles.weekButton, pressed && styles.pressed]}
              onPress={() => onMoveWeek(1)}>
              <SymbolView name="chevron.right" tintColor={AdaptiveColors.text} size={16} weight="bold" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.selectRow}>
        <Pressable
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="학년도 선택"
          style={styles.selectButton}
          onPress={() => setMenu('year')}>
          <Text style={styles.selectText}>{year}학년도</Text>
          <SymbolView name="chevron.down" tintColor={AdaptiveColors.icon} size={14} weight="semibold" />
        </Pressable>

        <Pressable
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="학기 선택"
          style={styles.selectButton}
          onPress={() => setMenu('semester')}>
          <Text style={styles.selectText}>{semesterLabel}</Text>
          <SymbolView name="chevron.down" tintColor={AdaptiveColors.icon} size={14} weight="semibold" />
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>행사 함께 보기</Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: eventOverlayOn }}
          accessibilityLabel="행사 함께 보기"
          style={[styles.toggle, eventOverlayOn && styles.toggleOn]}
          onPress={onToggleOverlay}>
          <View style={[styles.toggleThumb, eventOverlayOn && styles.toggleThumbOn]} />
        </Pressable>
      </View>

      <Modal transparent visible={menu !== null} animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable style={styles.modalDim} onPress={() => setMenu(null)}>
          <Pressable style={styles.menuCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.menuTitle}>{menu === 'year' ? '학년도' : '학기'}</Text>
            <ScrollView style={styles.menuScroll} bounces={false}>
              {menu === 'year'
                ? years.map((option) => (
                    <MenuOption
                      key={option}
                      label={`${option}학년도`}
                      selected={option === year}
                      onPress={() => {
                        onYearChange(option);
                        setMenu(null);
                      }}
                    />
                  ))
                : SEMESTER_OPTIONS.map((option) => (
                    <MenuOption
                      key={option.id}
                      label={option.label}
                      selected={option.id === semester}
                      onPress={() => {
                        onSemesterChange(option.id);
                        setMenu(null);
                      }}
                    />
                  ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.menuOption, selected && styles.menuOptionSelected]}
      onPress={onPress}>
      <Text style={[styles.menuOptionText, selected && styles.menuOptionTextSelected]}>{label}</Text>
      {selected && <SymbolView name="checkmark" tintColor={AdaptiveColors.accent} size={16} weight="bold" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: AdaptiveColors.background,
  },
  topRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    marginTop: 2,
    color: AdaptiveColors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  weekGroup: { alignItems: 'flex-end', gap: 5 },
  weekLabel: { color: AdaptiveColors.textSecondary, fontSize: 13, fontWeight: '600' },
  weekButtons: { flexDirection: 'row', gap: 5 },
  weekButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: AdaptiveColors.backgroundElement,
  },
  pressed: { opacity: 0.55 },
  selectRow: { flexDirection: 'row', gap: 22 },
  selectButton: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  selectText: { color: AdaptiveColors.text, fontSize: 15, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel: { color: AdaptiveColors.textSecondary, fontSize: 13, fontWeight: '600' },
  toggle: {
    width: 44,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 13,
    backgroundColor: AdaptiveColors.borderStrong,
  },
  toggleOn: { backgroundColor: '#20C4DD' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AdaptiveColors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },
  modalDim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: AdaptiveColors.overlay,
  },
  menuCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: 430,
    padding: 18,
    borderRadius: 18,
    backgroundColor: AdaptiveColors.surfaceElevated,
  },
  menuTitle: { marginBottom: 10, color: AdaptiveColors.text, fontSize: 18, fontWeight: '700' },
  menuScroll: { flexGrow: 0 },
  menuOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  menuOptionSelected: { backgroundColor: AdaptiveColors.backgroundSelected },
  menuOptionText: { color: AdaptiveColors.text, fontSize: 16 },
  menuOptionTextSelected: { color: '#0A8397', fontWeight: '700' },
});
