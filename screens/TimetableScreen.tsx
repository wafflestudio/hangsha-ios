import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { AddClassSheet } from '@/components/timetable/AddClassSheet';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { TimetableHeader } from '@/components/timetable/TimetableHeader';
import { TimetableManagerSheet } from '@/components/timetable/TimetableManagerSheet';
import { useMonthEventsQuery } from '@/contexts/EventDataContext';
import {
  useAddCustomCourseMutation,
  useCreateTimetableMutation,
  useDeleteTimetableCourseMutation,
  useDeleteTimetableMutation,
  usePatchCustomCourseMutation,
  useRenameTimetableMutation,
  useTimetableCoursesQuery,
  useTimetablesQuery,
} from '@/contexts/TimetableContext';
import { useTimetableUiStore } from '@/stores/timetableUiStore';
import type { Event } from '@/types/event';
import type { Timetable } from '@/types/timetable';
import {
  buildCoursePatch,
  expandCourseFormSlots,
} from '@/util/timetable/courseForm';
import {
  formatLocalDate,
  formatMonthDay,
  getWeekRange,
} from '@/util/timetable/layout';

export function TimetableScreen() {
  const router = useRouter();
  const {
    year,
    semester,
    selectedTimetableId,
    eventOverlayOn,
    weekAnchor,
    openSheet,
    createCourseDraft,
    editingEnrollId,
    editCourseDrafts,
    setYear,
    setSemester,
    selectTimetable,
    toggleEventOverlay,
    moveWeek,
    setOpenSheet,
    openCreateCourseSheet,
    openEditCourseSheet,
    updateActiveCourseDraft,
    resetCreateCourseDraft,
    clearEditCourseDraft,
  } = useTimetableUiStore();

  const timetableQuery = useTimetablesQuery(year, semester);
  const timetables = timetableQuery.data ?? [];
  const selectedTimetable = timetables.find((item) => item.id === selectedTimetableId) ?? null;
  const coursesQuery = useTimetableCoursesQuery(selectedTimetable?.id ?? null);
  const courses = coursesQuery.data ?? [];

  const weekRange = useMemo(() => getWeekRange(new Date(weekAnchor)), [weekAnchor]);
  const from = useMemo(() => formatLocalDate(weekRange.from), [weekRange.from]);
  const to = useMemo(() => formatLocalDate(weekRange.to), [weekRange.to]);
  const eventQuery = useMonthEventsQuery(from, to, eventOverlayOn);

  const weekEvents = useMemo(() => {
    if (!eventOverlayOn) return [];
    const unique = new Map<number, Event>();
    for (const bucket of Object.values(eventQuery.data?.byDate ?? {})) {
      for (const event of bucket.events) unique.set(event.id, event);
    }
    return [...unique.values()];
  }, [eventOverlayOn, eventQuery.data]);

  const createMutation = useCreateTimetableMutation(year, semester);
  const renameMutation = useRenameTimetableMutation(year, semester);
  const deleteMutation = useDeleteTimetableMutation(year, semester);
  const addCourseMutation = useAddCustomCourseMutation(selectedTimetable?.id ?? null);
  const patchCourseMutation = usePatchCustomCourseMutation(selectedTimetable?.id ?? null);
  const deleteCourseMutation = useDeleteTimetableCourseMutation(selectedTimetable?.id ?? null);
  const editingItem = 
    editingEnrollId === null
      ? null
      : courses.find((item) => item.enrollId === editingEnrollId) ?? null;
  const activeCourseDraft =
    editingEnrollId === null
      ? createCourseDraft
      : editCourseDrafts[editingEnrollId];
  const canRenderCourseEditor =
    activeCourseDraft !== undefined &&
    (editingEnrollId === null || editingItem !== null);

  useEffect(() => {
    if (timetableQuery.isPending) return;
    if (timetables.length === 0) {
      if (selectedTimetableId !== null) selectTimetable(null);
      return;
    }
    if (!timetables.some((item) => item.id === selectedTimetableId)) {
      selectTimetable(timetables[0].id);
    }
  }, [selectTimetable, selectedTimetableId, timetableQuery.isPending, timetables]);

  const years = useMemo(
    () => Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index),
    [],
  );
  const existingSlotsForEditor = useMemo(
    () =>
      courses
        .filter((item) => item.enrollId !== editingEnrollId)
        .flatMap(({ course }) => course.timeSlots),
    [courses, editingEnrollId],
  );
  const isManaging =
    createMutation.isPending || renameMutation.isPending || deleteMutation.isPending;

  const showError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    Alert.alert('오류', message);
  };

  const createTimetable = async (name: string) => {
    try {
      const created = await createMutation.mutateAsync({ name, year, semester });
      selectTimetable(created.id);
    } catch (error) {
      showError(error, '시간표를 추가하지 못했어요.');
    }
  };

  const renameTimetable = async (timetable: Timetable, name: string) => {
    try {
      await renameMutation.mutateAsync({ timetableId: timetable.id, request: { name } });
    } catch (error) {
      showError(error, '시간표 이름을 변경하지 못했어요.');
    }
  };

  const removeTimetable = async (timetable: Timetable) => {
    try {
      await deleteMutation.mutateAsync(timetable.id);
      if (selectedTimetableId === timetable.id) selectTimetable(null);
    } catch (error) {
      showError(error, '시간표를 삭제하지 못했어요.');
    }
  };

  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        <TimetableHeader
          title={selectedTimetable?.name ?? '나의 시간표'}
          year={year}
          semester={semester}
          years={years}
          weekLabel={`${formatMonthDay(weekRange.from)} ~ ${formatMonthDay(weekRange.to)}`}
          eventOverlayOn={eventOverlayOn}
          loading={timetableQuery.isPending}
          onYearChange={setYear}
          onSemesterChange={setSemester}
          onToggleOverlay={toggleEventOverlay}
          onMoveWeek={moveWeek}
        />

        {timetableQuery.isError ? (
          <View style={styles.centered}>
            <Text style={styles.message}>시간표를 불러오지 못했어요.</Text>
            <Pressable style={styles.retryButton} onPress={() => void timetableQuery.refetch()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : !timetableQuery.isPending && timetables.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>선택된 시간표가 없어요</Text>
            <Text style={styles.message}>시간표 변경에서 새 시간표를 추가해 주세요.</Text>
          </View>
        ) : (
          <TimetableGrid
            courses={courses}
            events={weekEvents}
            isLoading={
              timetableQuery.isPending ||
              coursesQuery.isPending ||
              (eventOverlayOn && eventQuery.isFetching)
            }
            onDeleteCourse={(enrollId) => {
              deleteCourseMutation.mutate(enrollId, {
                onSuccess: () => clearEditCourseDraft(enrollId),
                onError: (error) => showError(error, '수업을 삭제하지 못했어요.'),
              });
            }}
            onSelectCourse={(item) => {
              if (item.course.source !== 'CUSTOM') {
                Alert.alert('수정할 수 없는 수업', '직접 추가한 수업만 수정할 수 있어요.');
                return;
              }
              openEditCourseSheet(item);
            }}
            onSelectEvent={(event) =>
              router.push({ pathname: '/event/[id]', params: { id: String(event.id) } })
            }
          />
        )}

        <View pointerEvents="box-none" style={styles.floatingActions}>
          <Pressable
            style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
            onPress={() => setOpenSheet('manager')}>
            <Text style={styles.floatingText}>시간표 변경</Text>
          </Pressable>

          {selectedTimetable && (
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              onPress={openCreateCourseSheet}>
              <Text style={styles.backGlyph}>‹</Text>
              <Text style={styles.floatingText}>수업 추가</Text>
            </Pressable>
          )}
        </View>

        {openSheet === 'manager' && (
          <TimetableManagerSheet
            timetables={timetables}
            selectedTimetableId={selectedTimetableId}
            busy={isManaging}
            onClose={() => setOpenSheet('none')}
            onSelect={(timetable) => {
              selectTimetable(timetable.id);
              setOpenSheet('none');
            }}
            onCreate={createTimetable}
            onRename={renameTimetable}
            onDelete={removeTimetable}
          />
        )}

        {openSheet === 'addClass' && selectedTimetable && canRenderCourseEditor && (
          <AddClassSheet
            mode={editingEnrollId === null ? 'create' : 'edit'}
            draft={activeCourseDraft}
            originalCourse={editingItem?.course}
            existingSlots={existingSlotsForEditor}
            saving={addCourseMutation.isPending || patchCourseMutation.isPending}
            onClose={() => setOpenSheet('none')}
            onDraftChange={updateActiveCourseDraft}
            onSave={async () => {
              if (editingItem) {
                try {
                  await patchCourseMutation.mutateAsync({
                    enrollId: editingItem.enrollId,
                    request: buildCoursePatch(editingItem.course, activeCourseDraft),
                  });
                  clearEditCourseDraft(editingItem.enrollId);
                  setOpenSheet('none');
                } catch (error) {
                  showError(error, '수업 정보를 수정하지 못했어요.');
                }
                return;
              }

              try {
                await addCourseMutation.mutateAsync({
                  year: selectedTimetable.year,
                  semester: selectedTimetable.semester,
                  courseTitle: activeCourseDraft.title.trim(),
                  timeSlots: expandCourseFormSlots(activeCourseDraft.rows),
                  instructor: activeCourseDraft.instructor.trim() || undefined,
                  credit: activeCourseDraft.credit.trim()
                    ? Number(activeCourseDraft.credit)
                    : undefined,
                });
                resetCreateCourseDraft();
                setOpenSheet('none');
              } catch (error) {
                showError(error, '수업을 추가하지 못했어요.');
              }
            }}
          />
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="timetable" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { marginBottom: 8, color: '#222222', fontSize: 17, fontWeight: '700' },
  message: { color: '#777777', fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: '#20C4DD' },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  floatingActions: {
    position: 'absolute',
    right: 20,
    bottom: 18,
    zIndex: 60,
    alignItems: 'flex-end',
    gap: 10,
  },
  changeButton: {
    minWidth: 126,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,192,232,0.60)',
    shadowColor: '#00C0E8',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  addButton: {
    minWidth: 126,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 22,
    backgroundColor: '#FF5B7D',
    shadowColor: '#FF5B7D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
  },
  floatingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  backGlyph: { marginTop: -2, color: '#FFFFFF', fontSize: 28, fontWeight: '300', lineHeight: 26 },
  pressed: { opacity: 0.66 },
});
