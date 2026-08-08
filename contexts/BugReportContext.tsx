import { useMutation } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';

import * as bugReportApi from '@/api/bugReport';
import type { CreateBugReportInput } from '@/api/bugReport';

interface BugReportContextValue {
  isSubmitting: boolean;
  submitBugReport: (input: CreateBugReportInput) => Promise<void>;
}

const BugReportContext = createContext<BugReportContextValue | null>(null);

export function BugReportProvider({ children }: { children: ReactNode }) {
  const createBugReportMutation = useMutation({
    mutationFn: bugReportApi.createBugReport,
  });

  return (
    <BugReportContext.Provider
      value={{
        isSubmitting: createBugReportMutation.isPending,
        submitBugReport: async (input) => {
          await createBugReportMutation.mutateAsync(input);
        },
      }}>
      {children}
    </BugReportContext.Provider>
  );
}

export function useBugReport() {
  const context = useContext(BugReportContext);
  if (!context) throw new Error('useBugReport must be used within BugReportProvider.');
  return context;
}
