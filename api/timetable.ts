import axios from 'axios';

import apiClient from '@/api/client';
import type {
  Course,
  CreateCustomCourseRequest,
  CreateTimetableRequest,
  DayOfWeek,
  PatchTimetableRequest,
  Semester,
  Timetable,
  TimetableCourse,
  TimeSlot,
} from '@/types/timetable';

type TimetableDTO = {
  id: number;
  name: string;
  year: number;
  semester: Semester;
};

type CourseTimeSlotDTO = {
  dayOfWeek: DayOfWeek;
  startAt: number;
  endAt: number;
};

type CourseDTO = {
  id: number;
  year: number;
  semester: Semester;
  courseTitle: string;
  source: 'CUSTOM' | 'CRAWLED';
  timeSlots: CourseTimeSlotDTO[];
  courseNumber?: string;
  lectureNumber?: string;
  credit?: number;
  instructor?: string;
};

type EnrollDTO = { enrollId: number; course: CourseDTO };
type ApiErrorDTO = { code?: string; message?: string };

type CreateCustomCourseRequestDTO = {
  year: number;
  semester: Semester;
  courseTitle: string;
  timeSlots: CourseTimeSlotDTO[];
  courseNumber?: string;
  lectureNumber?: string;
  credit?: number;
  instructor?: string;
};

const toTimetable = (dto: TimetableDTO): Timetable => ({ ...dto });

const toTimeSlot = (dto: CourseTimeSlotDTO): TimeSlot => ({
  dayOfweek: dto.dayOfWeek,
  startAt: dto.startAt,
  endAt: dto.endAt,
});

const toCourse = (dto: CourseDTO): Course => ({
  ...dto,
  timeSlots: dto.timeSlots.map(toTimeSlot),
});

const toCourseRequest = (request: CreateCustomCourseRequest): CreateCustomCourseRequestDTO => ({
  year: request.year,
  semester: request.semester,
  courseTitle: request.courseTitle,
  timeSlots: request.timeSlots.map(({ dayOfweek, startAt, endAt }) => ({
    dayOfWeek: dayOfweek,
    startAt,
    endAt,
  })),
  courseNumber: request.courseNumber,
  lectureNumber: request.lectureNumber,
  credit: request.credit,
  instructor: request.instructor,
});

function toTimetableApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError<ApiErrorDTO>(error)) {
    const responseMessage = error.response?.data?.message?.trim();
    const responseCode = error.response?.data?.code?.trim();
    const detail = responseMessage || responseCode;
    if (detail) return new Error(detail);
  }
  return error instanceof Error ? error : new Error(fallback);
}

export async function getTimetables(year: number, semester: Semester): Promise<Timetable[]> {
  const response = await apiClient.get<{ items: TimetableDTO[] }>('timetables', {
    params: { year, semester },
  });
  return response.data.items.map(toTimetable);
}

export async function createTimetable(request: CreateTimetableRequest): Promise<Timetable> {
  const response = await apiClient.post<TimetableDTO>('timetables', request);
  return toTimetable(response.data);
}

export async function patchTimetableName(
  timetableId: number,
  request: PatchTimetableRequest,
): Promise<Timetable> {
  const response = await apiClient.patch<TimetableDTO>(`timetables/${timetableId}`, request);
  return toTimetable(response.data);
}

export async function deleteTimetable(timetableId: number): Promise<void> {
  await apiClient.delete(`timetables/${timetableId}`);
}

export async function getTimetableCourses(timetableId: number): Promise<TimetableCourse[]> {
  const response = await apiClient.get<{ items: EnrollDTO[] }>(
    `timetables/${timetableId}/enrolls`,
  );
  return response.data.items.map(({ enrollId, course }) => ({
    enrollId,
    course: toCourse(course),
  }));
}

export async function addCustomCourse(
  timetableId: number,
  request: CreateCustomCourseRequest,
): Promise<TimetableCourse> {
  try {
    const response = await apiClient.post<EnrollDTO>(
      `timetables/${timetableId}/enrolls/custom`,
      toCourseRequest(request),
    );
    return { enrollId: response.data.enrollId, course: toCourse(response.data.course) };
  } catch (error) {
    throw toTimetableApiError(error, '수업을 추가하지 못했어요.');
  }
}

export async function deleteTimetableCourse(
  timetableId: number,
  enrollId: number,
): Promise<void> {
  await apiClient.delete(`timetables/${timetableId}/enrolls/${enrollId}`);
}
