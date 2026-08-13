export type Semester = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type TimeSlot = {
  dayOfweek: DayOfWeek;
  startAt: number;
  endAt: number;
};

type CourseBase = {
  year: number;
  semester: Semester;
  courseTitle: string;
  source: 'CUSTOM' | 'CRAWLED';
  timeSlots: TimeSlot[];
  courseNumber?: string;
  lectureNumber?: string;
  credit?: number;
  instructor?: string;
};

export type Course = CourseBase & { id: number };
export type CreateCustomCourseRequest = Omit<CourseBase, 'source'>;

export type Timetable = {
  id: number;
  name: string;
  year: number;
  semester: Semester;
};

export type CreateTimetableRequest = Omit<Timetable, 'id'>;
export type PatchTimetableRequest = Pick<Timetable, 'name'>;

export type TimetableCourse = {
  enrollId: number;
  course: Course;
};

export const SEMESTER_OPTIONS: { id: Semester; label: string }[] = [
  { id: 'SPRING', label: '1학기' },
  { id: 'SUMMER', label: '여름 학기' },
  { id: 'FALL', label: '2학기' },
  { id: 'WINTER', label: '겨울 계절' },
];

export const DAY_LABELS_KO: Record<DayOfWeek, string> = {
  SUN: '일',
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
};
