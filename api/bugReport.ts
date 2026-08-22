import apiClient from '@/api/client';

export interface CreateBugReportInput {
  title: string;
  content: string;
}

export async function createBugReport(input: CreateBugReportInput) {
  await apiClient.post('bug-reports', input);
}
