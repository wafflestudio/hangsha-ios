import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';

import { getEventTypes, getOrganizations } from '@/api/category';
import { useAuthStore } from '@/stores/authStore';
import type { InterestCategory } from '@/types/category';

export const onboardingKeys = {
  all: ['onboarding'] as const,
  metadata: () => [...onboardingKeys.all, 'metadata'] as const,
};

interface OnboardingContextValue {
  programTypes: InterestCategory[];
  organizations: InterestCategory[];
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
      const [eventTypes, organizations] = await Promise.all([
        getEventTypes(),
        getOrganizations(),
      ]);
      return {
        programTypes: eventTypes.map((category) => ({
          ...category,
          categoryType: 'EVENT_TYPE' as const,
        })),
        organizations: organizations.map((category) => ({
          ...category,
          categoryType: 'ORGANIZATION' as const,
        })),
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
