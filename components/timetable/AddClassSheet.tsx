import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  Course,
  CourseFormDraft,
  DayOfWeek,
  TimeSlot,
} from '@/types/timetable';
import { DAY_LABELS_KO } from '@/types/timetable';
import { hasOverlap, VISIBLE_DAYS } from '@/util/timetable/layout';
import {
  buildCoursePatch,
  createCourseFormRow,
  expandCourseFormSlots,
} from '@/util/timetable/courseForm';
import { TimePickerSection } from '@/components/timetable/TimePickerSection';

const ALL_DAYS: DayOfWeek[] = ['SUN', ...VISIBLE_DAYS, 'SAT'];

type AddClassSheetProps = {
  mode: 'create' | 'edit';
  draft: CourseFormDraft;
  originalCourse?: Course;
  existingSlots: TimeSlot[];
  saving?: boolean;
  onClose: () => void;
  onDraftChange: (draft: CourseFormDraft) => void;
  onSave: () => Promise<void>;
};

export function AddClassSheet({
  mode,
  draft,
  originalCourse,
  existingSlots,
  saving = false,
  onClose,
  onDraftChange,
  onSave,
}: AddClassSheetProps) {
  const { title, instructor, credit, rows } = draft;
  const updateDraft = (patch: Partial<CourseFormDraft>) =>
    onDraftChange({ ...draft, ...patch });
  const updateRow = (rowId: string, patch: Partial<(typeof rows)[number]>) =>
    updateDraft({
      rows: rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
    });

  const toggleDay = (rowId: string, day: DayOfWeek) =>
    updateDraft({
      rows: rows.map((row) => {
        if (row.rowId !== rowId) return row;
        const dayOfweeks = row.dayOfweeks.includes(day)
          ? row.dayOfweeks.filter((item) => item !== day)
          : [...row.dayOfweeks, day];
        return { ...row, dayOfweeks };
      }),
    });

  const expandedSlots = useMemo(() => expandCourseFormSlots(rows), [rows]);

  const timeRangeValid = rows.every((row) => row.endAt > row.startAt);
  const hasSelectedDay = rows.length > 0 && rows.every((row) => row.dayOfweeks.length > 0);
  const conflict = expandedSlots.some(
    (slot, index) =>
      hasOverlap(existingSlots, slot) || hasOverlap(expandedSlots.slice(0, index), slot),
  );
  const hasChanges =
    mode === 'create' ||
    Boolean(originalCourse && Object.keys(buildCoursePatch(originalCourse, draft)).length > 0);
  const canSave =
    title.trim().length > 0 &&
    timeRangeValid &&
    hasSelectedDay &&
    !conflict &&
    hasChanges;

  const save = async () => {
    if (!canSave) return;
    await onSave();
  };

  return (
    <>
      <Pressable style={styles.dim} accessibilityLabel="수업 추가 닫기" onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={70}
        style={styles.sheet}>
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={styles.content}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {mode === 'edit' ? '수업 정보 수정' : '새 수업 추가'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="수업 추가 닫기"
              hitSlop={10}
              onPress={onClose}>
              <SymbolView name="xmark.circle.fill" tintColor="#A8A8A8" size={22} />
            </Pressable>
          </View>

          <Field label="과목명 (필수)">
            <TextInput
              value={title}
              placeholder="경제학개론"
              placeholderTextColor="#A3A3A3"
              style={styles.input}
              onChangeText={(value) => updateDraft({ title: value })}
            />
          </Field>

          <Field label="교수명 (선택)">
            <TextInput
              value={instructor}
              placeholder="박이택"
              placeholderTextColor="#A3A3A3"
              style={styles.input}
              onChangeText={(value) => updateDraft({ instructor: value })}
            />
          </Field>

          <Field label="학점 (선택)">
            <TextInput
              value={credit}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor="#A3A3A3"
              style={styles.input}
              onChangeText={(value) => updateDraft({ credit: value.replace(/[^0-9]/g, '') })}
            />
          </Field>

          <Text style={styles.timeSectionTitle}>시간 (필수)</Text>

          {rows.map((row, rowIndex) => (
            <View key={row.rowId} style={styles.slotSection}>
              {rows.length > 1 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${rowIndex + 1}번째 시간 삭제`}
                  hitSlop={8}
                  style={styles.removeSlot}
                  onPress={() => updateDraft({ rows: rows.filter((item) => item.rowId !== row.rowId) })}>
                  <SymbolView name="xmark.circle.fill" tintColor="#A8A8A8" size={20} />
                </Pressable>
              )}

              <View style={styles.dayRow}>
                {ALL_DAYS.map((day) => {
                  const selected = row.dayOfweeks.includes(day);
                  return (
                    <Pressable
                      key={day}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.dayButton, selected && styles.dayButtonSelected]}
                      onPress={() => toggleDay(row.rowId, day)}>
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                        {DAY_LABELS_KO[day]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TimePickerSection
                label="시작 시간"
                value={row.startAt}
                onChange={(startAt) => updateRow(row.rowId, { startAt })}
              />

              <Text style={styles.rangeArrow}>↓</Text>

              <TimePickerSection
                label="종료 시간"
                value={row.endAt}
                onChange={(endAt) => updateRow(row.rowId, { endAt })}
              />
            </View>
          ))}

          <Pressable
            style={styles.addTimeButton}
            onPress={() => updateDraft({ rows: [...rows, createCourseFormRow()] })}>
            <Text style={styles.addTimeText}>+ 시간 추가</Text>
          </Pressable>

          {!title.trim() && <Text style={styles.error}>과목 이름은 필수입니다.</Text>}
          {!hasSelectedDay && <Text style={styles.error}>요일을 하나 이상 선택해 주세요.</Text>}
          {!timeRangeValid && <Text style={styles.error}>종료 시간은 시작 시간보다 늦어야 합니다.</Text>}
          {conflict && <Text style={styles.error}>시간이 겹치는 수업이 있습니다.</Text>}

          <Pressable
            disabled={!canSave || saving}
            style={[styles.saveButton, (!canSave || saving) && styles.disabled]}
            onPress={() => void save()}>
            <Text style={styles.saveText}>{saving ? '저장 중…' : '저장'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFill, zIndex: 80, backgroundColor: 'transparent' },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    maxHeight: '74%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFEFF1',
    borderTopLeftRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { color: '#111111', fontSize: 20, fontWeight: '700' },
  field: { gap: 8, marginBottom: 14 },
  fieldLabel: { color: '#202020', fontSize: 14, fontWeight: '600' },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    borderRadius: 9,
    color: '#111111',
    fontSize: 16,
  },
  timeSectionTitle: { marginTop: 2, marginBottom: 14, color: '#111111', fontSize: 16, fontWeight: '700' },
  slotSection: { marginBottom: 14 },
  removeSlot: { alignSelf: 'flex-end', marginBottom: 5 },
  dayRow: { flexDirection: 'row', gap: 4, marginBottom: 20 },
  dayButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: { borderWidth: 1.5, borderColor: '#222222' },
  dayText: { color: '#333333', fontSize: 15, fontWeight: '500' },
  dayTextSelected: { color: '#111111', fontWeight: '700' },
  rangeArrow: { alignSelf: 'center', marginVertical: 7, color: '#7B818A', fontSize: 23 },
  addTimeButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#AEAEAE',
  },
  addTimeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  error: { marginTop: 4, color: '#CC243B', fontSize: 13 },
  saveButton: { alignItems: 'center', marginTop: 16, paddingVertical: 13, borderRadius: 24, backgroundColor: '#FF365E' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.42 },
});
