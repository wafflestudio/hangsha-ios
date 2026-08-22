import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthProvider';
import {
  useEventStatusesQuery,
  useEventTypesQuery,
  useOrganizationsQuery,
} from '@/contexts/EventDataContext';
import { useUserData } from '@/contexts/UserDataContext';
import { type FilterTab, useFilterStore } from '@/stores/filterStore';
import { useLocalExcludedKeywordsStore } from '@/stores/localExcludedKeywordsStore';
import type { Category } from '@/types/category';
import type { EventTypeId } from '@/util/theme';

/**
 * 필터시트 전용 카테고리 색상 — hangsha-web CATEGORY_BUTTON_COLORS(15% 알파)
 * 그대로 이식. EventTypeColors(캘린더/상세/칩용 60% 알파 팔레트)와는 알파값만
 * 다르고 베이스 RGB는 동일.
 */
const FILTER_CATEGORY_COLORS: Record<EventTypeId, string> = {
  1: 'rgba(255, 140, 40, 0.15)',
  2: 'rgba(255, 204, 0, 0.15)',
  3: 'rgba(11, 206, 131, 0.15)',
  4: 'rgba(0, 193, 232, 0.15)',
  5: 'rgba(0, 136, 255, 0.15)',
  6: 'rgba(162, 90, 255, 0.15)',
  7: 'rgba(255, 45, 83, 0.15)',
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'category', label: '행사 종류' },
  { key: 'org', label: '주최 기관' },
  { key: 'status', label: '모집 현황' },
  { key: 'exclude', label: '제외' },
];

const SNAP_POINTS = ['75%'];

type FilterSheetProps = {
  /** 시트 하단 "적용" 버튼에 표시할 라벨. 예: "32개의 행사 보기" */
  applyLabel?: string;
};

export const FilterSheet = forwardRef<BottomSheetModal, FilterSheetProps>(function FilterSheet(
  { applyLabel = '적용' },
  ref,
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);
  const { isAuthenticated } = useAuth();

  const { data: statusList = [] } = useEventStatusesQuery();
  const { data: orgList = [] } = useOrganizationsQuery();
  const { data: categoryList = [] } = useEventTypesQuery();
  const {
    excludedKeywords: serverExcludedKeywords,
    addExcludedKeyword,
    deleteExcludedKeyword,
    excludedKeywordLoading,
  } = useUserData();
  const localKeywords = useLocalExcludedKeywordsStore((state) => state.keywords);
  const addLocalKeyword = useLocalExcludedKeywordsStore((state) => state.addKeyword);
  const removeLocalKeyword = useLocalExcludedKeywordsStore((state) => state.removeKeyword);

  const activeTab = useFilterStore((state) => state.activeTab);
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedOrg = useFilterStore((state) => state.selectedOrg);
  const selectedStatus = useFilterStore((state) => state.selectedStatus);
  const setActiveTab = useFilterStore((state) => state.setActiveTab);
  const toggle = useFilterStore((state) => state.toggle);
  const toggleAll = useFilterStore((state) => state.toggleAll);
  const resetAll = useFilterStore((state) => state.resetAll);
  const applyDefaultStatus = useFilterStore((state) => state.applyDefaultStatus);

  // 새 상태 ID는 독립 테이블의 ID이므로 이름으로 기본 상태를 찾는다.
  useEffect(() => {
    const applyingStatus = statusList.find((category) => category.name === '모집중');
    if (applyingStatus) {
      applyDefaultStatus(applyingStatus);
    }
  }, [statusList, applyDefaultStatus]);

  const listForTab: Record<FilterTab, Category[]> = {
    category: categoryList,
    org: orgList,
    status: statusList,
    exclude: [],
  };
  const selectionForTab: Record<FilterTab, Category[]> = {
    category: selectedCategory,
    org: selectedOrg,
    status: selectedStatus,
    exclude: [],
  };

  const activeList = listForTab[activeTab];
  const activeSelection = selectionForTab[activeTab];
  const allLabel =
    activeTab === 'category'
      ? '행사 전체'
      : activeTab === 'org'
        ? '주최 기관 전체'
        : '모집 현황 전체';
  const isAllSelected = activeList.length > 0 && activeSelection.length === activeList.length;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
      handleIndicatorStyle={styles.handleIndicator}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}>
            <ThemedText
              type={activeTab === tab.key ? 'smallBold' : 'small'}
              themeColor={activeTab === tab.key ? 'text' : 'textSecondary'}>
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.tabDivider} />

      <BottomSheetScrollView contentContainerStyle={styles.body}>
        {activeTab === 'exclude' ? (
          isAuthenticated ? (
            <ExcludeKeywordPanel
              keywords={serverExcludedKeywords.map((tag) => ({ key: String(tag.id), label: tag.keyword }))}
              isLoading={excludedKeywordLoading}
              onAdd={addExcludedKeyword}
              onRemove={(key) => deleteExcludedKeyword(Number(key))}
            />
          ) : (
            <ExcludeKeywordPanel
              keywords={localKeywords.map((keyword) => ({ key: keyword, label: keyword }))}
              isLoading={false}
              onAdd={async (keyword) => addLocalKeyword(keyword)}
              onRemove={async (key) => removeLocalKeyword(key)}
            />
          )
        ) : (
          <View style={styles.optionList}>
            <Pressable
              style={styles.optionRow}
              onPress={() => toggleAll(activeTab, activeList)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAllSelected }}>
              <Checkbox checked={isAllSelected} />
              <ThemedText type="small" style={styles.optionText}>
                {allLabel}
              </ThemedText>
            </Pressable>

            {activeList.map((option) => {
              const isChecked = activeSelection.some((s) => s.id === option.id);
              const rowBackground =
                activeTab === 'category'
                  ? FILTER_CATEGORY_COLORS[option.id as EventTypeId]
                  : undefined;

              return (
                <Pressable
                  key={option.id}
                  style={[styles.optionRow, rowBackground && { backgroundColor: rowBackground }]}
                  onPress={() => toggle(activeTab, option)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}>
                  <Checkbox checked={isChecked} />
                  <ThemedText
                    type="small"
                    style={[styles.optionText, rowBackground && styles.optionTextOnColor]}>
                    {option.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.resetButton}
          onPress={resetAll}
          accessibilityRole="button"
          accessibilityLabel="필터 초기화">
          <SymbolView name="arrow.clockwise" tintColor="#3a3a3a" size={16} />
          <ThemedText type="small" themeColor="textSecondary">
            초기화
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.applyButton}
          onPress={() => sheetRef.current?.dismiss()}
          accessibilityRole="button">
          <ThemedText type="smallBold">{applyLabel}</ThemedText>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <SymbolView name="checkmark" tintColor="#ffffff" size={12} weight="bold" />}
    </View>
  );
}

type ExcludeKeywordTag = {
  /** 서버 저장 시 id, 로컬 저장 시 keyword 문자열 자체 */
  key: string;
  label: string;
};

type ExcludeKeywordPanelProps = {
  keywords: ExcludeKeywordTag[];
  isLoading: boolean;
  onAdd: (keyword: string) => Promise<void>;
  onRemove: (key: string) => Promise<void>;
};

function ExcludeKeywordPanel({ keywords, isLoading, onAdd, onRemove }: ExcludeKeywordPanelProps) {
  const commitKeyword = (value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    clear();
  };

  return (
    <View style={styles.excludePanel}>
      <ThemedText type="small" themeColor="textSecondary">
        해당 단어를 포함하는 행사는 표시되지 않습니다.
      </ThemedText>

      <ExcludeKeywordInput isLoading={isLoading} onCommit={commitKeyword} />

      {keywords.map((tag) => (
        <View key={tag.key} style={styles.excludeItem}>
          <Pressable
            onPress={() => onRemove(tag.key)}
            accessibilityRole="button"
            accessibilityLabel={`${tag.label} 제거`}>
            <SymbolView name="xmark" tintColor="#8a8a8a" size={16} />
          </Pressable>
          <ThemedText type="small">{tag.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

type ExcludeKeywordInputProps = {
  isLoading: boolean;
  onCommit: (value: string, clear: () => void) => void;
};

function ExcludeKeywordInput({ isLoading, onCommit }: ExcludeKeywordInputProps) {
  const [value, setValue] = useState('');

  return (
    <View style={styles.excludeInputRow}>
      <Pressable
        onPress={() => onCommit(value, () => setValue(''))}
        accessibilityRole="button"
        accessibilityLabel="키워드 추가"
        disabled={isLoading}>
        <SymbolView name="plus" tintColor="#9a9a9a" size={16} />
      </Pressable>
      <BottomSheetTextInput
        style={styles.excludeInput}
        placeholder="제외 키워드 입력"
        placeholderTextColor="#b5b5b5"
        editable={!isLoading}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={() => onCommit(value, () => setValue(''))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: '#d9d9d9',
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth,
    width: '80%',
    alignSelf: 'center',
    backgroundColor: '#cacaca',
    marginBottom: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  optionText: {
    flex: 1,
  },
  optionTextOnColor: {
    color: '#1f2937',
  },
  checkbox: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#c4c4c4',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  excludePanel: {
    gap: 14,
  },
  excludeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
    paddingVertical: 6,
  },
  excludeInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    color: '#222222',
  },
  excludeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resetButton: {
    width: 110,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
    backgroundColor: '#dddddd',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  applyButton: {
    width: 240,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
