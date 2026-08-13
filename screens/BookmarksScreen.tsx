import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarksHeader } from '@/components/bookmarks/BookmarksHeader';
import { GalleryEventCard } from '@/components/events/GalleryEventCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useBookmarksInfinite, useUserData } from '@/contexts/UserDataContext';
import type { Event } from '@/types/event';

const TWO_COLUMN_BREAKPOINT = 455;
const TWO_COLUMN_CARD_WIDTH = 180;
const TWO_COLUMN_GAP = 30;

export default function BookmarksScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toggleBookmark } = useUserData();
  const {
    data: bookmarksData,
    isPending: bookmarksLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refreshBookmarks,
  } = useBookmarksInfinite();
  const bookmarkedEvents = useMemo(
    () => bookmarksData?.pages.flatMap((page) => page.items) ?? [],
    [bookmarksData],
  );

  const numColumns = windowWidth > TWO_COLUMN_BREAKPOINT ? 2 : 1;
  const cardWidth = useMemo(
    () =>
      numColumns === 2
        ? TWO_COLUMN_CARD_WIDTH
        : Math.min(340, Math.max(240, windowWidth * 0.72)),
    [numColumns, windowWidth],
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/mypage');
  };

  const refresh = () => refreshBookmarks();

  const loadNextPage = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };

  const removeBookmark = async (event: Event) => {
    try {
      await toggleBookmark(event);
    } catch {
      Alert.alert('찜 해제 실패', '찜 목록을 변경하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  if (isAuthLoading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
          <ActivityIndicator color="#828282" />
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <BookmarksHeader variant="page" onAction={goBack} />
          <View style={styles.centered}>
            <Text style={styles.guestTitle}>로그인이 필요해요</Text>
            <Text style={styles.guestDescription}>찜한 행사를 확인하려면 로그인해주세요.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
              <Text style={styles.loginButtonText}>로그인 · 회원가입</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <BookmarksHeader variant="page" onAction={goBack} />

        {bookmarksLoading && bookmarkedEvents.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#828282" />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={bookmarkedEvents}
            numColumns={numColumns}
            style={[styles.list, numColumns === 1 && styles.singleColumnList]}
            keyExtractor={(event) => String(event.id)}
            renderItem={({ item }) => (
              <GalleryEventCard
                event={item}
                width={cardWidth}
                isBookmarked
                onToggleBookmark={removeBookmark}
              />
            )}
            columnWrapperStyle={numColumns === 2 ? styles.columnWrapper : undefined}
            contentContainerStyle={[
              styles.listContent,
              numColumns === 1 && styles.singleColumnContent,
              bookmarkedEvents.length === 0 && styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isFetchingNextPage}
                onRefresh={refresh}
                tintColor="#828282"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  아직 찜된 행사가 없습니다.{`\n`}관심있는 행사를 찜해보세요!
                </Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.nextPageLoading} color="#828282" />
              ) : null
            }
            onEndReached={loadNextPage}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list: { width: '80%', flex: 1, alignSelf: 'center' },
  singleColumnList: { width: '90%' },
  listContent: {
    paddingTop: 15,
    paddingBottom: 60,
    rowGap: 25,
  },
  singleColumnContent: { alignItems: 'center' },
  columnWrapper: { gap: TWO_COLUMN_GAP },
  emptyListContent: { flexGrow: 1, paddingTop: 0 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888888', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  nextPageLoading: { marginVertical: 20 },
  guestTitle: { color: '#222222', fontSize: 21, fontWeight: '800' },
  guestDescription: { color: '#777777', fontSize: 14 },
  loginButton: {
    height: 48,
    marginTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#208AEF',
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
