import { create } from 'zustand';

import type { CourseFormDraft, Semester, TimetableCourse } from '@/types/timetable';
import {
  courseToFormDraft,
  createEmptyCourseFormDraft,
} from '@/util/timetable/courseForm';

export type TimetableSheet = 'none' | 'manager' | 'addClass';

const getSemesterByDate = (date: Date): Semester => {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 8) return 'SUMMER';
  if (month >= 9 && month <= 12) return 'FALL';
  return 'WINTER';
};

type TimetableUiState = {
  year: number;
  semester: Semester;
  selectedTimetableId: number | null;
  eventOverlayOn: boolean;
  weekAnchor: number;
  openSheet: TimetableSheet;
  createCourseDraft: CourseFormDraft;
  editingEnrollId: number | null;
  editCourseDrafts: Record<number, CourseFormDraft>;
  setYear: (year: number) => void;
  setSemester: (semester: Semester) => void;
  selectTimetable: (id: number | null) => void;
  toggleEventOverlay: () => void;
  moveWeek: (amount: number) => void;
  setOpenSheet: (sheet: TimetableSheet) => void;
  openCreateCourseSheet: () => void;
  openEditCourseSheet: (item: TimetableCourse) => void;
  updateActiveCourseDraft: (draft: CourseFormDraft) => void;
  resetCreateCourseDraft: () => void;
  clearEditCourseDraft: (enrollId: number) => void;
};

const now = new Date();

export const useTimetableUiStore = create<TimetableUiState>((set) => ({
  year: now.getFullYear(),
  semester: getSemesterByDate(now),
  selectedTimetableId: null,
  eventOverlayOn: false,
  weekAnchor: now.getTime(),
  openSheet: 'none',
  createCourseDraft: createEmptyCourseFormDraft(),
  editingEnrollId: null,
  editCourseDrafts: {},
  setYear: (year) =>
    set({ year, selectedTimetableId: null, editingEnrollId: null, openSheet: 'none' }),
  setSemester: (semester) =>
    set({ semester, selectedTimetableId: null, editingEnrollId: null, openSheet: 'none' }),
  selectTimetable: (selectedTimetableId) => set({ selectedTimetableId, editingEnrollId: null }),
  toggleEventOverlay: () => set((state) => ({ eventOverlayOn: !state.eventOverlayOn })),
  moveWeek: (amount) =>
    set((state) => {
      const next = new Date(state.weekAnchor);
      next.setDate(next.getDate() + amount * 7);
      return { weekAnchor: next.getTime() };
    }),
  setOpenSheet: (openSheet) => set({ openSheet }),
  openCreateCourseSheet: () => set({ openSheet: 'addClass', editingEnrollId: null }),
  openEditCourseSheet: (item) =>
    set((state) => ({
      openSheet: 'addClass',
      editingEnrollId: item.enrollId,
      editCourseDrafts: state.editCourseDrafts[item.enrollId]
        ? state.editCourseDrafts
        : {
            ...state.editCourseDrafts,
            [item.enrollId]: courseToFormDraft(item.course),
          },
    })),
  updateActiveCourseDraft: (draft) =>
    set((state) =>
      state.editingEnrollId === null
        ? { createCourseDraft: draft }
        : {
            editCourseDrafts: {
              ...state.editCourseDrafts,
              [state.editingEnrollId]: draft,
            },
          },
    ),
  resetCreateCourseDraft: () => set({ createCourseDraft: createEmptyCourseFormDraft() }),
  clearEditCourseDraft: (enrollId) =>
    set((state) => {
      const editCourseDrafts = { ...state.editCourseDrafts };
      delete editCourseDrafts[enrollId];
      return {
        editCourseDrafts,
        editingEnrollId: state.editingEnrollId === enrollId ? null : state.editingEnrollId,
      };
    }),
}));
