import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSnuttTimetablePickerUrl,
  SNUTT_ORIGIN,
} from '@/api/snutt';
import {
  addCustomCourse,
  createTimetable,
  deleteTimetable,
  deleteTimetableCourse,
  getTimetableCourses,
  getTimetables,
  patchTimetableName,
  patchCustomCourse,
} from '@/api/timetable';
import type {
  CreateCustomCourseRequest,
  CreateTimetableRequest,
  PatchTimetableRequest,
  PatchCustomCourseRequest,
  Semester,
  Timetable,
} from '@/types/timetable';
import {
  type SnuttFullTimetable,
  toSnuttImportData,
} from '@/util/timetable/snuttTimetable';

export type SnuttImportResult = {
  importedTimetable: Timetable;
  importedCourseCount: number;
  excludedCourseCount: number;
};

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

export function usePatchCustomCourseMutation(timetableId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enrollId,
      request,
    }: {
      enrollId: number;
      request: PatchCustomCourseRequest;
    }) => patchCustomCourse(timetableId as number, enrollId, request),
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

export function useSnuttTimetablePickerConfig() {
  return {
    pickerUrl: createSnuttTimetablePickerUrl(),
    snuttOrigin: SNUTT_ORIGIN,
  } as const;
}

export function useImportSnuttTimetableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snuttTimetable: SnuttFullTimetable): Promise<SnuttImportResult> => {
      const { timetable, courses, excludedCourseCount } = toSnuttImportData(snuttTimetable);
      const importedTimetable = await createTimetable(timetable);

      try {
        for (const course of courses) {
          await addCustomCourse(importedTimetable.id, course);
        }
      } catch (error) {
        try {
          await deleteTimetable(importedTimetable.id);
        } catch {
          // Preserve the original import error, which is more useful to the caller.
        }
        throw error;
      }

      return {
        importedTimetable,
        importedCourseCount: courses.length,
        excludedCourseCount,
      };
    },
    onSuccess: ({ importedTimetable }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: timetableKeys.list(importedTimetable.year, importedTimetable.semester),
        }),
        queryClient.invalidateQueries({
          queryKey: timetableKeys.courses(importedTimetable.id),
        }),
      ]),
    onError: (_error, snuttTimetable) => {
      const { timetable } = toSnuttImportData(snuttTimetable);
      return queryClient.invalidateQueries({
        queryKey: timetableKeys.list(timetable.year, timetable.semester),
      });
    },
  });
}
