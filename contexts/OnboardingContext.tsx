import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';

import { getCategoryGroups, getOrganizations } from '@/api/user';
import { useAuthStore } from '@/stores/authStore';
import type { Category } from '@/types/category';

export const onboardingKeys = {
  all: ['onboarding'] as const,
  metadata: () => [...onboardingKeys.all, 'metadata'] as const,
};

interface OnboardingContextValue {
  programTypes: Category[];
  organizations: Category[];
  isLoadingMeta: boolean;
  metadataError: Error | null;
  refreshMetadata: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const metadataQuery = useQuery({
    queryKey: onboardingKeys.metadata(),
    queryFn: async () => {
      const [groups, organizations] = await Promise.all([
        getCategoryGroups(),
        getOrganizations(),
      ]);
      return {
        programTypes: groups.find(({ group }) => group.id === 3)?.categories ?? [],
        organizations,
      };
    },
    enabled: isAuthenticated,
  });

  return (
    <OnboardingContext.Provider
      value={{
        programTypes: metadataQuery.data?.programTypes ?? [],
        organizations: metadataQuery.data?.organizations ?? [],
        isLoadingMeta: metadataQuery.isPending,
        metadataError: metadataQuery.error,
        refreshMetadata: async () => {
          await metadataQuery.refetch();
        },
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider.');
  return context;
}
