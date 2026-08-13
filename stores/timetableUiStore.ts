import { create } from 'zustand';

import type { Semester } from '@/types/timetable';

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
  setYear: (year: number) => void;
  setSemester: (semester: Semester) => void;
  selectTimetable: (id: number | null) => void;
  toggleEventOverlay: () => void;
  moveWeek: (amount: number) => void;
  setOpenSheet: (sheet: TimetableSheet) => void;
};

const now = new Date();

export const useTimetableUiStore = create<TimetableUiState>((set) => ({
  year: now.getFullYear(),
  semester: getSemesterByDate(now),
  selectedTimetableId: null,
  eventOverlayOn: false,
  weekAnchor: now.getTime(),
  openSheet: 'none',
  setYear: (year) => set({ year, selectedTimetableId: null }),
  setSemester: (semester) => set({ semester, selectedTimetableId: null }),
  selectTimetable: (selectedTimetableId) => set({ selectedTimetableId }),
  toggleEventOverlay: () => set((state) => ({ eventOverlayOn: !state.eventOverlayOn })),
  moveWeek: (amount) =>
    set((state) => {
      const next = new Date(state.weekAnchor);
      next.setDate(next.getDate() + amount * 7);
      return { weekAnchor: next.getTime() };
    }),
  setOpenSheet: (openSheet) => set({ openSheet }),
}));
