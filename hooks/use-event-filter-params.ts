import { useMemo } from 'react';

import type { EventFilterParams } from '@/api/event';
import { useFilterStore } from '@/stores/filterStore';

/** filterStore의 선택 상태를 events API가 받는 statusId/eventTypeId/orgId 배열로 변환한다. */
export function useEventFilterParams(): EventFilterParams {
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedOrg = useFilterStore((state) => state.selectedOrg);
  const selectedStatus = useFilterStore((state) => state.selectedStatus);

  return useMemo(
    () => ({
      eventTypeId: selectedCategory.length ? selectedCategory.map((c) => c.id) : undefined,
      orgId: selectedOrg.length ? selectedOrg.map((c) => c.id) : undefined,
      statusId: selectedStatus.length ? selectedStatus.map((c) => c.id) : undefined,
    }),
    [selectedCategory, selectedOrg, selectedStatus],
  );
}
