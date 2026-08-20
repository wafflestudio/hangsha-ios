import type {
  CreateCustomCourseRequest,
  CreateTimetableRequest,
  DayOfWeek,
  Semester,
} from '@/types/timetable';

const dayOfWeeks: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const semesterMap: Record<number, Semester> = {
  1: 'SPRING',
  2: 'FALL',
  3: 'SUMMER',
  4: 'WINTER',
};

type SnuttTimeSlot = {
  day: number;
  startMinute: number;
  endMinute: number;
};

type SnuttLecture = {
  courseTitle: string;
  classPlaceAndTimes: SnuttTimeSlot[];
  courseNumber?: string;
  lectureNumber?: string;
  credit?: number;
  instructor?: string;
};

export type SnuttFullTimetable = {
  title: string;
  year: number;
  semester: number;
  lectures: SnuttLecture[];
};

export type SnuttImportData = {
  timetable: CreateTimetableRequest;
  courses: CreateCustomCourseRequest[];
  excludedCourseCount: number;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const readFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const parseTimeSlot = (value: unknown): SnuttTimeSlot | null => {
  if (!isRecord(value)) return null;

  const day = readFiniteNumber(value.day);
  const startMinute = readFiniteNumber(value.startMinute);
  const endMinute = readFiniteNumber(value.endMinute);

  if (
    day === undefined ||
    startMinute === undefined ||
    endMinute === undefined ||
    !Number.isInteger(day) ||
    day < 0 ||
    day > 6 ||
    !Number.isInteger(startMinute) ||
    !Number.isInteger(endMinute) ||
    startMinute < 0 ||
    endMinute > 1440 ||
    startMinute >= endMinute
  ) {
    return null;
  }

  return { day, startMinute, endMinute };
};

const parseLecture = (value: unknown): SnuttLecture | null => {
  if (!isRecord(value)) return null;

  const courseTitle = readString(value.courseTitle ?? value.course_title);
  const rawTimeSlots = value.classPlaceAndTimes ?? value.class_time_json;
  if (!courseTitle || !Array.isArray(rawTimeSlots)) return null;

  const classPlaceAndTimes = rawTimeSlots
    .map(parseTimeSlot)
    .filter((slot): slot is SnuttTimeSlot => slot !== null);

  return {
    courseTitle,
    classPlaceAndTimes,
    courseNumber: readString(value.courseNumber ?? value.course_number),
    lectureNumber: readString(value.lectureNumber ?? value.lecture_number),
    credit: readFiniteNumber(value.credit),
    instructor: readString(value.instructor),
  };
};

export function parseSnuttTimetableSelectedMessage(value: unknown): SnuttFullTimetable | null {
  if (!isRecord(value) || value.type !== 'SNUTT_TIMETABLE_SELECTED') return null;

  const payload = value.payload;
  if (!isRecord(payload)) return null;

  const title = readString(payload.title);
  const year = readFiniteNumber(payload.year);
  const semester = readFiniteNumber(payload.semester);
  const rawLectures = payload.lectures ?? payload.lecture_list;

  if (
    !title ||
    year === undefined ||
    !Number.isInteger(year) ||
    semester === undefined ||
    !Number.isInteger(semester) ||
    !semesterMap[semester] ||
    !Array.isArray(rawLectures)
  ) {
    return null;
  }

  const lectures: SnuttLecture[] = [];
  for (const rawLecture of rawLectures) {
    const lecture = parseLecture(rawLecture);
    if (!lecture) return null;
    lectures.push(lecture);
  }

  return { title, year, semester, lectures };
}

export function parseSnuttWebViewMessage(data: string): SnuttFullTimetable | null {
  try {
    return parseSnuttTimetableSelectedMessage(JSON.parse(data) as unknown);
  } catch {
    return null;
  }
}

export function toSnuttImportData(timetable: SnuttFullTimetable): SnuttImportData {
  const courses = timetable.lectures
    .filter((lecture) => lecture.classPlaceAndTimes.length > 0)
    .map((lecture) => ({
      year: timetable.year,
      semester: semesterMap[timetable.semester],
      courseTitle: lecture.courseTitle,
      timeSlots: lecture.classPlaceAndTimes.map((slot) => ({
        dayOfweek: dayOfWeeks[slot.day],
        startAt: slot.startMinute,
        endAt: slot.endMinute,
      })),
      courseNumber: lecture.courseNumber,
      lectureNumber: lecture.lectureNumber,
      credit: lecture.credit,
      instructor: lecture.instructor,
    }));

  return {
    timetable: {
      name: `${timetable.title.trim() || 'SNUTT 시간표'} (SNUTT)`,
      year: timetable.year,
      semester: semesterMap[timetable.semester],
    },
    courses,
    excludedCourseCount: timetable.lectures.length - courses.length,
  };
}
