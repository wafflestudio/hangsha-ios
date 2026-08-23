import { FontAwesomeFreeSolid } from '@react-native-vector-icons/fontawesome-free-solid';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BugReportModal } from '@/components/bug-report/BugReportModal';
import { DetailMemo, type DetailMemoHandle } from '@/components/events/DetailMemo';
import { EventDate } from '@/components/events/EventDate';
import { useAuth } from '@/contexts/AuthProvider';
import { useEventDetailQuery } from '@/contexts/EventDataContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useScrollToFocusedInput } from '@/hooks/use-scroll-to-focused-input';
import { useTheme } from '@/hooks/use-theme';
import { getDDay } from '@/util/calendar/getDday';
import { AdaptiveColors, BottomTabInset, getEventTypeColors, getEventTypeLabel, Spacing } from '@/util/theme';

const MEMO_INPUT_KEYBOARD_OFFSET = 96;

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const eventId = Number(id);
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { isAuthenticated } = useAuth();
  const { toggleBookmark } = useUserData();
  const { data: event, isPending, isError } = useEventDetailQuery(eventId);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const memoRef = useRef<DetailMemoHandle>(null);
  const {
    scrollViewRef,
    handleInputFocus: handleMemoInputFocus,
    handleInputBlur: handleMemoInputBlur,
  } = useScrollToFocusedInput(MEMO_INPUT_KEYBOARD_OFFSET);

  if (isPending) return <View style={styles.centered}><ActivityIndicator color={theme.text} /></View>;
  if (isError || !event) return <View style={styles.centered}><Text style={{ color: theme.text }}>행사 정보를 불러오지 못했어요.</Text></View>;

  const categoryColors = getEventTypeColors(scheme, event.eventTypeId);
  const contentWidth = width - Spacing.three * 2;
  const toggle = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인이 필요해요', '찜 기능은 로그인 후 사용할 수 있습니다.');
      return;
    }
    if (isBookmarkPending) return;
    setIsBookmarkPending(true);
    try { await toggleBookmark(event); } catch { Alert.alert('찜 변경 실패', '찜 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.'); } finally { setIsBookmarkPending(false); }
  };
  const openApplyLink = async () => {
    if (!event.applyLink) return;
    try { await Linking.openURL(event.applyLink); } catch { Alert.alert('링크를 열 수 없어요', '지원 링크를 다시 확인해주세요.'); }
  };
  const closeDetail = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/calendar');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      onTouchStart={() => memoRef.current?.blur()}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="상세 보기 닫기"
              onPress={closeDetail}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <FontAwesomeFreeSolid name="angles-right" size={20} color="#ABABAB" />
            </Pressable>
            <View style={styles.thumbnailWrapper}>
              <Image source={event.imageUrl} style={styles.thumbnail} contentFit="cover" transition={150} />
            </View>
            <View style={styles.content}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={event.isBookmarked ? '찜 해제' : '찜하기'}
                onPress={toggle}
                disabled={isBookmarkPending}
                style={({ pressed }) => [styles.bookmarkButton, pressed && styles.pressed]}>
                <Image
                  source={
                    event.isBookmarked
                      ? require('@/assets/images/Bookmarked.svg')
                      : require('@/assets/images/notBookmarked.svg')
                  }
                  style={styles.bookmarkIcon}
                  contentFit="contain"
                />
              </Pressable>
              <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
              <EventDate
                applyStart={event.applyStart}
                applyEnd={event.applyEnd}
                eventStart={event.eventStart}
                eventEnd={event.eventEnd}
              />
              {event.location ? <View style={styles.location}><FontAwesomeFreeSolid name="location-dot" size={14} color="#777777" /><Text style={[styles.locationText, { color: theme.textSecondary }]}>{event.location}</Text></View> : null}
              <View style={styles.badgeRow}>
                {event.applyEnd ? <View style={[styles.badge, styles.ddayBadge]}><Text style={styles.ddayText}>{`지원 ${getDDay(event.applyEnd)}`}</Text></View> : null}
                <View style={[styles.badge, styles.categoryBadge, { backgroundColor: categoryColors.background }]}><Text style={styles.categoryText}>{getEventTypeLabel(event.eventTypeId)}</Text></View>
              </View>
              <Text style={[styles.organization, { color: theme.text }]}>{event.organization}</Text>
              {event.applyLink ? <Pressable accessibilityRole="link" onPress={openApplyLink} style={styles.applyLink}><Text style={styles.applyLinkText}>지원 링크로 이동하기</Text><FontAwesomeFreeSolid name="arrow-up-right-from-square" size={13} color="#999999" /></Pressable> : null}
              <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
              <RenderHtml
                contentWidth={contentWidth}
                source={{ html: event.detail || '' }}
                enableCSSInlineProcessing
                enableUserAgentStyles
                emSize={16}
                computeEmbeddedMaxWidth={(availableWidth, tagName) =>
                  tagName === 'img' ? Math.min(availableWidth, contentWidth) : availableWidth
                }
                renderersProps={{
                  img: { enableExperimentalPercentWidth: true },
                }}
                // 크롤링 HTML의 웹 폰트는 네이티브에 설치되어 있지 않을 수 있다.
                // fontFamily만 제외하면 fontSize/fontWeight 등 나머지 인라인 CSS는 유지된다.
                ignoredStyles={['fontFamily']}
                baseStyle={{ color: theme.text, fontSize: 16, lineHeight: 26 }}
                tagsStyles={{
                  p: { marginTop: 0, marginBottom: 14 },
                  a: { color: '#2876D8' },
                  strong: { fontWeight: '700' },
                  b: { fontWeight: '700' },
                }}
              />
              <View onTouchStart={(event) => event.stopPropagation()}>
                <DetailMemo
                  ref={memoRef}
                  eventId={eventId}
                  onInputFocus={handleMemoInputFocus}
                  onInputBlur={handleMemoInputBlur}
                />
              </View>
              <Pressable accessibilityRole="button" onPress={() => setIsBugReportOpen(true)} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}>
                <FontAwesomeFreeSolid name="triangle-exclamation" size={17} color="#777777" />
                <Text style={styles.reportText}>행사 정보 오류 제보하기</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <BugReportModal visible={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1, paddingBottom: BottomTabInset }, keyboardAvoidingView: { flex: 1 }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center' }, scrollContent: { paddingBottom: Spacing.six },
  closeButton: { alignSelf: 'flex-start', marginLeft: Spacing.three, marginTop: Spacing.three, padding: 4 },
  thumbnailWrapper: { marginHorizontal: Spacing.three, marginTop: Spacing.four }, thumbnail: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, backgroundColor: AdaptiveColors.backgroundElement },
  content: { paddingHorizontal: Spacing.three, paddingTop: 28 }, bookmarkButton: { alignSelf: 'flex-start', paddingBottom: 24 }, bookmarkIcon: { width: 19, height: 19 }, title: { marginBottom: 8, fontSize: 23, fontWeight: '800', lineHeight: 31, letterSpacing: -0.5 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 }, locationText: { fontSize: 14, lineHeight: 20 }, badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, badge: { borderRadius: 6 }, ddayBadge: { borderWidth: 1, borderColor: AdaptiveColors.border, backgroundColor: AdaptiveColors.surface, paddingHorizontal: 8, paddingVertical: 4 }, categoryBadge: { paddingHorizontal: 10, paddingVertical: 5 }, ddayText: { color: AdaptiveColors.text, fontSize: 13, fontWeight: '600' }, categoryText: { color: AdaptiveColors.text, fontSize: 13, fontWeight: '500' }, organization: { marginTop: 20, fontSize: 14, fontWeight: '600' },
  applyLink: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4 }, applyLinkText: { color: '#999999', fontSize: 13, fontWeight: '500' }, divider: { height: StyleSheet.hairlineWidth, marginTop: 24, marginBottom: 20, opacity: 0.7 },
  reportButton: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 8, marginTop: 36, paddingVertical: 10 }, reportText: { color: '#777777', fontSize: 16, fontWeight: '700' }, pressed: { opacity: 0.7 },
});
