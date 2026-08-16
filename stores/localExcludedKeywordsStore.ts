import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * 비로그인 사용자의 제외 키워드. 서버(UserDataContext의 excludedKeywords)는
 * 로그인 유저 전용이라, 비로그인 상태에서는 기기 로컬(AsyncStorage)에 저장해
 * 두고 매 요청마다 events API의 excludedKeywords 파라미터로 실어 보낸다.
 * 로그인하면 서버 저장 값을 쓰므로 이 store는 참조하지 않는다.
 */
type LocalExcludedKeywordsState = {
  keywords: string[];
  addKeyword: (keyword: string) => void;
  removeKeyword: (keyword: string) => void;
};

export const useLocalExcludedKeywordsStore = create<LocalExcludedKeywordsState>()(
  persist(
    (set, get) => ({
      keywords: [],
      addKeyword: (keyword) => {
        const trimmed = keyword.trim();
        if (!trimmed || get().keywords.includes(trimmed)) return;
        set({ keywords: [...get().keywords, trimmed] });
      },
      removeKeyword: (keyword) => {
        set({ keywords: get().keywords.filter((item) => item !== keyword) });
      },
    }),
    {
      name: 'local-excluded-keywords',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
