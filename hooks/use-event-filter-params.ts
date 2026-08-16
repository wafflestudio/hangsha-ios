import { useMemo } from 'react';

import type { EventFilterParams } from '@/api/event';
import { useAuth } from '@/contexts/AuthProvider';
import { useFilterStore } from '@/stores/filterStore';
import { useLocalExcludedKeywordsStore } from '@/stores/localExcludedKeywordsStore';

/**
 * events API가 아직 excludedKeywords 파라미터를 받지 않는다(2026-08-16 기준
 * 400 Bad Request로 확인됨). 서버에 파라미터가 추가되면 이 플래그만 true로
 * 바꾸면 비로그인 제외 키워드 필터링이 그대로 활성화된다.
 */
const SERVER_SUPPORTS_EXCLUDED_KEYWORDS_PARAM = false;

/**
 * filterStore의 선택 상태를 events API가 받는
 * statusId/eventTypeId/orgId/excludedKeywords로 변환한다. 로그인 상태에서는
 * 서버가 유저 DB의 제외 키워드를 알아서 적용하므로 excludedKeywords를 비워
 * 보내고, 비로그인 상태에서는 로컬(AsyncStorage) 저장 키워드를 실어 보낸다.
 */
export function useEventFilterParams(): EventFilterParams {
  const { isAuthenticated } = useAuth();
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedOrg = useFilterStore((state) => state.selectedOrg);
  const selectedStatus = useFilterStore((state) => state.selectedStatus);
  const localKeywords = useLocalExcludedKeywordsStore((state) => state.keywords);

  return useMemo(
    () => ({
      eventTypeId: selectedCategory.length ? selectedCategory.map((c) => c.id) : undefined,
      orgId: selectedOrg.length ? selectedOrg.map((c) => c.id) : undefined,
      statusId: selectedStatus.length ? selectedStatus.map((c) => c.id) : undefined,
      excludedKeywords:
        SERVER_SUPPORTS_EXCLUDED_KEYWORDS_PARAM && !isAuthenticated && localKeywords.length
          ? localKeywords
          : undefined,
    }),
    [selectedCategory, selectedOrg, selectedStatus, isAuthenticated, localKeywords],
  );
}
