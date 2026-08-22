import type {
  Course,
  CourseFormDraft,
  CourseFormSlotRow,
  DayOfWeek,
  PatchCustomCourseRequest,
  TimeSlot,
} from '@/types/timetable';

const DAY_ORDER: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
let rowSequence = 0;

export const createCourseFormRow = (
  patch: Partial<Omit<CourseFormSlotRow, 'rowId'>> = {},
): CourseFormSlotRow => ({
  rowId: `course-form-${Date.now()}-${rowSequence++}`,
  dayOfweeks: patch.dayOfweeks ?? ['MON'],
  startAt: patch.startAt ?? 8 * 60 + 10,
  endAt: patch.endAt ?? 11 * 60,
});

export const createEmptyCourseFormDraft = (): CourseFormDraft => ({
  title: '',
  instructor: '',
  credit: '',
  rows: [createCourseFormRow()],
});

export function courseToFormDraft(course: Course): CourseFormDraft {
  const grouped = new Map<string, CourseFormSlotRow>();

  for (const slot of course.timeSlots) {
    const key = `${slot.startAt}-${slot.endAt}`;
    const row = grouped.get(key);
    if (row) {
      row.dayOfweeks.push(slot.dayOfweek);
      continue;
    }
    grouped.set(
      key,
      createCourseFormRow({
        dayOfweeks: [slot.dayOfweek],
        startAt: slot.startAt,
        endAt: slot.endAt,
      }),
    );
  }

  const rows = [...grouped.values()].map((row) => ({
    ...row,
    dayOfweeks: [...row.dayOfweeks].sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
    ),
  }));

  return {
    title: course.courseTitle,
    instructor: course.instructor ?? '',
    credit: course.credit == null ? '' : String(course.credit),
    rows: rows.length > 0 ? rows : [createCourseFormRow()],
  };
}

export function expandCourseFormSlots(rows: CourseFormSlotRow[]): TimeSlot[] {
  return rows.flatMap((row) =>
    row.dayOfweeks.map((dayOfweek) => ({
      dayOfweek,
      startAt: row.startAt,
      endAt: row.endAt,
    })),
  );
}

const normalizeSlots = (slots: TimeSlot[]) =>
  slots
    .map(({ dayOfweek, startAt, endAt }) => ({ dayOfweek, startAt, endAt }))
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.dayOfweek) - DAY_ORDER.indexOf(b.dayOfweek) ||
        a.startAt - b.startAt ||
        a.endAt - b.endAt,
    );

const slotsEqual = (left: TimeSlot[], right: TimeSlot[]) =>
  JSON.stringify(normalizeSlots(left)) === JSON.stringify(normalizeSlots(right));

export function buildCoursePatch(
  course: Course,
  draft: CourseFormDraft,
): PatchCustomCourseRequest {
  const patch: PatchCustomCourseRequest = {};
  const title = draft.title.trim();
  const instructor = draft.instructor.trim();
  const credit = draft.credit.trim() ? Number(draft.credit) : null;
  const slots = expandCourseFormSlots(draft.rows);

  if (title !== course.courseTitle.trim()) patch.courseTitle = title;
  if (!slotsEqual(slots, course.timeSlots)) patch.timeSlots = slots;
  if (instructor !== (course.instructor ?? '').trim()) {
    patch.instructor = instructor || null;
  }
  if (credit !== (course.credit ?? null)) patch.credit = credit;

  return patch;
}
