import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCategoryGroupsQuery } from '@/contexts/EventDataContext';
import { useUserData } from '@/contexts/UserDataContext';
import { type FilterTab, useFilterStore } from '@/stores/filterStore';
import type { Category } from '@/types/category';
import { normalizeEventTypeId } from '@/util/calendar/transformEvent';
import { getEventTypeColors } from '@/util/theme';

const STATUS_GROUP_ID = 1;
const ORG_GROUP_ID = 2;
const CATEGORY_GROUP_ID = 3;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'category', label: '행사 종류' },
  { key: 'org', label: '주최 기관' },
  { key: 'status', label: '모집 현황' },
  { key: 'exclude', label: '제외' },
];

const SNAP_POINTS = ['75%'];

export const FilterSheet = forwardRef<BottomSheetModal>(function FilterSheet(_props, ref) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const sheetRef = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => sheetRef.current as BottomSheetModal);

  const { data: categoryGroups } = useCategoryGroupsQuery();
  const {
    excludedKeywords,
    addExcludedKeyword,
    deleteExcludedKeyword,
    excludedKeywordLoading,
  } = useUserData();

  const activeTab = useFilterStore((state) => state.activeTab);
  const selectedCategory = useFilterStore((state) => state.selectedCategory);
  const selectedOrg = useFilterStore((state) => state.selectedOrg);
  const selectedStatus = useFilterStore((state) => state.selectedStatus);
  const setActiveTab = useFilterStore((state) => state.setActiveTab);
  const toggle = useFilterStore((state) => state.toggle);
  const toggleAll = useFilterStore((state) => state.toggleAll);
  const resetAll = useFilterStore((state) => state.resetAll);
  const applyDefaultStatus = useFilterStore((state) => state.applyDefaultStatus);

  const statusList = useMemo(
    () => categoryGroups?.find((g) => g.group.id === STATUS_GROUP_ID)?.categories ?? [],
    [categoryGroups],
  );
  const orgList = useMemo(
    () => categoryGroups?.find((g) => g.group.id === ORG_GROUP_ID)?.categories ?? [],
    [categoryGroups],
  );
  const categoryList = useMemo(
    () => categoryGroups?.find((g) => g.group.id === CATEGORY_GROUP_ID)?.categories ?? [],
    [categoryGroups],
  );

  // 기본 필터: 모집중(status id 2) — hangsha-web FilterContext의 isApplying과 동일
  useEffect(() => {
    const applyingStatus = statusList.find((c) => c.id === 2);
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
          <ExcludeKeywordPanel
            keywords={excludedKeywords}
            isLoading={excludedKeywordLoading}
            onAdd={addExcludedKeyword}
            onRemove={deleteExcludedKeyword}
          />
        ) : (
          <View style={styles.optionList}>
            <Pressable
              style={styles.optionRow}
              onPress={() => toggleAll(activeTab, activeList)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAllSelected }}>
              <View style={[styles.checkbox, isAllSelected && styles.checkboxChecked]} />
              <ThemedText type="small" style={styles.optionText}>
                {allLabel}
              </ThemedText>
            </Pressable>

            {activeList.map((option) => {
              const isChecked = activeSelection.some((s) => s.id === option.id);
              const rowBackground =
                activeTab === 'category'
                  ? getEventTypeColors(scheme, normalizeEventTypeId(option.id)).background
                  : undefined;

              return (
                <Pressable
                  key={option.id}
                  style={[styles.optionRow, rowBackground && { backgroundColor: rowBackground }]}
                  onPress={() => toggle(activeTab, option)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}>
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]} />
                  <ThemedText type="small" style={styles.optionText}>
                    {option.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.resetButton} onPress={resetAll} accessibilityRole="button">
          <ThemedText type="small" themeColor="textSecondary">
            초기화
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.applyButton}
          onPress={() => sheetRef.current?.dismiss()}
          accessibilityRole="button">
          <ThemedText type="smallBold">적용</ThemedText>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

type ExcludeKeywordPanelProps = {
  keywords: { id: number; keyword: string }[];
  isLoading: boolean;
  onAdd: (keyword: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
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
        <View key={tag.id} style={styles.excludeItem}>
          <Pressable
            onPress={() => onRemove(tag.id)}
            accessibilityRole="button"
            accessibilityLabel={`${tag.keyword} 제거`}>
            <ThemedText type="small" themeColor="textSecondary">
              ×
            </ThemedText>
          </Pressable>
          <ThemedText type="small">{tag.keyword}</ThemedText>
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
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
    paddingVertical: 6,
  },
  excludeInput: {
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
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resetButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e4e4',
    backgroundColor: '#dddddd',
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    backgroundColor: '#ffffff',
  },
});
