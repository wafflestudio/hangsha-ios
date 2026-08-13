import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addCustomCourse,
  createTimetable,
  deleteTimetable,
  deleteTimetableCourse,
  getTimetableCourses,
  getTimetables,
  patchTimetableName,
} from '@/api/timetable';
import type {
  CreateCustomCourseRequest,
  CreateTimetableRequest,
  PatchTimetableRequest,
  Semester,
} from '@/types/timetable';

export const timetableKeys = {
  all: ['timetables'] as const,
  list: (year: number, semester: Semester) => [...timetableKeys.all, year, semester] as const,
  courses: (timetableId: number) => [...timetableKeys.all, timetableId, 'courses'] as const,
};

export function useTimetablesQuery(year: number, semester: Semester) {
  return useQuery({
    queryKey: timetableKeys.list(year, semester),
    queryFn: () => getTimetables(year, semester),
  });
}

export function useTimetableCoursesQuery(timetableId: number | null) {
  return useQuery({
    queryKey: timetableKeys.courses(timetableId ?? -1),
    queryFn: () => getTimetableCourses(timetableId as number),
    enabled: timetableId !== null,
  });
}

export function useCreateTimetableMutation(year: number, semester: Semester) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTimetableRequest) => createTimetable(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timetableKeys.list(year, semester) }),
  });
}

export function useRenameTimetableMutation(year: number, semester: Semester) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ timetableId, request }: { timetableId: number; request: PatchTimetableRequest }) =>
      patchTimetableName(timetableId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: timetableKeys.list(year, semester) }),
  });
}

export function useDeleteTimetableMutation(year: number, semester: Semester) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (timetableId: number) => deleteTimetable(timetableId),
    onSuccess: (_data, timetableId) => {
      queryClient.removeQueries({ queryKey: timetableKeys.courses(timetableId) });
      return queryClient.invalidateQueries({ queryKey: timetableKeys.list(year, semester) });
    },
  });
}

export function useAddCustomCourseMutation(timetableId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCustomCourseRequest) =>
      addCustomCourse(timetableId as number, request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: timetableKeys.courses(timetableId ?? -1) }),
  });
}

export function useDeleteTimetableCourseMutation(timetableId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollId: number) => deleteTimetableCourse(timetableId as number, enrollId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: timetableKeys.courses(timetableId ?? -1) }),
  });
}
