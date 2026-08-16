import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterSheet } from '@/components/calendar/FilterSheet';
import { MobileBottomNavigation } from '@/components/mobile-bottom-navigation';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useEventSearchQuery } from '@/contexts/EventDataContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useEventFilterParams } from '@/hooks/use-event-filter-params';
import {
  SEARCH_PAGE_SIZES,
  type SearchPageSize,
  useSearchUiStore,
} from '@/stores/searchUiStore';
import type { Event } from '@/types/event';

type SearchScreenProps = {
  initialQuery?: string;
};

export function SearchScreen({ initialQuery }: SearchScreenProps) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const { toggleBookmark } = useUserData();
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const {
    inputValue,
    submittedQuery,
    page,
    pageSize,
    isPageSizeMenuOpen,
    hydrateQuery,
    setInputValue,
    submitSearch,
    clearSearch,
    setPage,
    setPageSize,
    setPageSizeMenuOpen,
  } = useSearchUiStore();
  const filterParams = useEventFilterParams();
  const searchQuery = useEventSearchQuery(submittedQuery, filterParams);
  const result = searchQuery.data;
  const totalPages = result ? Math.ceil(result.total / pageSize) : 0;
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pageItems = useMemo(
    () => result?.items.slice((safePage - 1) * pageSize, safePage * pageSize) ?? [],
    [pageSize, result?.items, safePage],
  );

  useEffect(() => {
    if (initialQuery) hydrateQuery(initialQuery);
  }, [hydrateQuery, initialQuery]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage, setPage]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profileImageUrl]);

  const runSearch = () => {
    if (!inputValue.trim()) return;
    submitSearch();
    Keyboard.dismiss();
  };

  const clear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleToggleBookmark = async (event: Event) => {
    if (!user) {
      Alert.alert('로그인이 필요해요', '행사를 찜하려면 로그인해주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.replace('/') },
      ]);
      return;
    }

    try {
      await toggleBookmark(event);
    } catch {
      Alert.alert('찜 변경 실패', '찜 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const hasResults = Boolean(result && result.total > 0);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.toolbar}>
          <View style={styles.headerRow}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {submittedQuery ? `'${submittedQuery}' 검색 결과` : '검색'}
            </Text>

            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="검색 필터"
                onPress={() => filterSheetRef.current?.present()}
                style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
                <Image
                  source={require('@/assets/images/filter.svg')}
                  style={styles.filterIcon}
                  contentFit="contain"
                />
              </Pressable>

              {user ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="내 프로필"
                  onPress={() => router.push('/mypage')}
                  style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
                  <Image
                    source={
                      user.profileImageUrl && !profileImageFailed
                        ? { uri: user.profileImageUrl }
                        : require('@/assets/images/defaultProfile.png')
                    }
                    style={styles.profileImage}
                    contentFit="cover"
                    onError={() => setProfileImageFailed(true)}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                autoFocus
                value={inputValue}
                maxLength={50}
                returnKeyType="search"
                placeholder="검색어를 입력해주세요"
                placeholderTextColor="#A3A3A3"
                style={styles.input}
                onChangeText={setInputValue}
                onSubmitEditing={runSearch}
              />
              {inputValue ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="검색어 지우기"
                  hitSlop={8}
                  onPress={clear}
                  style={styles.clearButton}>
                  <SymbolView name="xmark" tintColor="#828282" size={15} weight="semibold" />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="검색"
              hitSlop={8}
              onPress={runSearch}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              <SymbolView name="magnifyingglass" tintColor="#828282" size={27} />
            </Pressable>
          </View>
        </View>

        {hasResults ? (
          <View style={styles.resultControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`표시 개수 ${pageSize}개`}
              accessibilityState={{ expanded: isPageSizeMenuOpen }}
              onPress={() => setPageSizeMenuOpen(true)}
              style={({ pressed }) => [styles.pageSizeButton, pressed && styles.pressed]}>
              <Text style={styles.pageSizeLabel}>표시 개수:</Text>
              <View style={styles.pageSizeValue}>
                <Text style={styles.pageSizeValueText}>{pageSize}개</Text>
                <SymbolView name="chevron.up.chevron.down" tintColor="#555555" size={10} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {!submittedQuery ? (
          <EmptyState message="검색어를 입력해보세요!" />
        ) : searchQuery.isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#828282" />
          </View>
        ) : searchQuery.isError ? (
          <EmptyState message="오류가 발생했습니다. 잠시 후 다시 시도해주세요." />
        ) : !hasResults ? (
          <EmptyState message="검색 결과가 없습니다." />
        ) : (
          <View style={styles.results}>
            <Text style={styles.resultCount}>총 {result?.total ?? 0}개 결과</Text>
            <FlatList
              ref={listRef}
              data={pageItems}
              keyExtractor={(item) => String(item.event.id)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <SearchResultCard
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: '/event/[id]',
                      params: { id: String(item.event.id) },
                    })
                  }
                  onToggleBookmark={handleToggleBookmark}
                />
              )}
              ListFooterComponent={
                totalPages > 1 ? (
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    onChange={changePage}
                  />
                ) : null
              }
            />
          </View>
        )}
      </SafeAreaView>

      <MobileBottomNavigation activeTab="calendar" />

      <PageSizeMenu
        visible={isPageSizeMenuOpen}
        selected={pageSize}
        onClose={() => setPageSizeMenuOpen(false)}
        onSelect={setPageSize}
      />

      <FilterSheet ref={filterSheetRef} />
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function PageSizeMenu({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: SearchPageSize;
  onClose: () => void;
  onSelect: (value: SearchPageSize) => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable accessibilityLabel="표시 개수 메뉴 닫기" style={styles.menuBackdrop} onPress={onClose} />
      <View style={styles.pageSizeMenu}>
        {SEARCH_PAGE_SIZES.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: option === selected }}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [styles.pageSizeOption, pressed && styles.optionPressed]}>
            <View style={styles.checkSlot}>
              {option === selected ? (
                <SymbolView name="checkmark" tintColor="#222222" size={14} weight="bold" />
              ) : null}
            </View>
            <Text style={styles.pageSizeOptionText}>{option}개</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const groupStart = Math.floor((page - 1) / 5) * 5 + 1;
  const groupEnd = Math.min(totalPages, groupStart + 4);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, index) => groupStart + index);

  return (
    <View style={styles.pagination}>
      <Pressable
        disabled={groupStart === 1}
        onPress={() => onChange(groupStart - 1)}
        style={groupStart === 1 && styles.paginationDisabled}>
        <SymbolView name="chevron.left" tintColor="#666666" size={14} />
      </Pressable>
      {pages.map((pageNumber) => (
        <Pressable
          key={pageNumber}
          accessibilityRole="button"
          accessibilityState={{ selected: pageNumber === page }}
          onPress={() => onChange(pageNumber)}
          style={[styles.pageButton, pageNumber === page && styles.pageButtonSelected]}>
          <Text style={[styles.pageText, pageNumber === page && styles.pageTextSelected]}>
            {pageNumber}
          </Text>
        </Pressable>
      ))}
      <Pressable
        disabled={groupEnd === totalPages}
        onPress={() => onChange(groupEnd + 1)}
        style={groupEnd === totalPages && styles.paginationDisabled}>
        <SymbolView name="chevron.right" tintColor="#666666" size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  toolbar: { paddingHorizontal: 20, paddingTop: 24 },
  headerRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  headerTitle: {
    minWidth: 0,
    flex: 1,
    color: '#111111',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  filterIcon: { width: 21, height: 21 },
  profileButton: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
  },
  profileImage: { width: '100%', height: '100%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  inputWrapper: {
    minWidth: 0,
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
  },
  input: {
    minWidth: 0,
    flex: 1,
    height: '100%',
    paddingLeft: 14,
    paddingRight: 6,
    color: '#111111',
    fontSize: 16,
  },
  clearButton: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchButton: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  resultControls: {
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pageSizeButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageSizeLabel: { color: '#666666', fontSize: 14, fontWeight: '600' },
  pageSizeValue: {
    minWidth: 67,
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  pageSizeValueText: { color: '#333333', fontSize: 14 },
  results: { flex: 1, paddingHorizontal: 20 },
  resultCount: { marginBottom: 2, color: '#9CA3AF', fontSize: 13 },
  listContent: { paddingBottom: 30 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#A3A3A3', fontSize: 16, lineHeight: 23, fontWeight: '500', textAlign: 'center' },
  menuBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent' },
  pageSizeMenu: {
    position: 'absolute',
    top: 158,
    right: 19,
    width: 112,
    overflow: 'hidden',
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D4D4D4',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 8,
  },
  pageSizeOption: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  checkSlot: { width: 23, alignItems: 'center' },
  pageSizeOptionText: { color: '#222222', fontSize: 15 },
  optionPressed: { backgroundColor: '#F0F0F0' },
  pagination: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },
  pageButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  pageButtonSelected: { backgroundColor: '#EEEEEE' },
  pageText: { color: '#777777', fontSize: 13 },
  pageTextSelected: { color: '#111111', fontWeight: '700' },
  paginationDisabled: { opacity: 0.25 },
  pressed: { opacity: 0.58 },
});
