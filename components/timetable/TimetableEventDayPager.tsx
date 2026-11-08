import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Event } from '@/types/event';
import { AdaptiveColors, getEventTypeColors } from '@/util/theme';
import {
  type EventGridBlock,
  formatAmPmFromMinutes,
  GRID_HEIGHT,
  getBlocksOnPage,
  getDayPageCount,
} from '@/util/timetable/layout';

// 넘길 수 있음을 알리는 힌트 애니메이션 값. 안드로이드 시간표와 같은 값이어야 한다.
const HINT_OFFSET_RATIO = 0.24;
const HINT_DELAY_MS = 350;
const HINT_PAUSE_MS = 90;
const HINT_OUT_DURATION_MS = 360;
const HINT_RETURN_DURATION_MS = 320;
const HINT_EASING = Easing.bezier(0.4, 0, 0.2, 1);

// 첫 장 앞·끝 장 뒤로 열 너비만큼 당겼을 때 카드가 가로로 늘어나는 최대 비율.
const MAX_OVERSCROLL_STRETCH = 0.3;

const EXPANDED_EXTRA_WIDTH = 10;
const EXPANDED_MIN_HEIGHT = 86;
const EXPANDED_MIN_HEIGHT_WITH_LOCATION = 104;

type TimetableEventDayPagerProps = {
  blocks: EventGridBlock[];
  left: number;
  columnWidth: number;
  onSelectEvent?: (event: Event) => void;
};

/**
 * 한 요일 열의 시간 지정 행사를 장 단위로 좌우로 넘겨 보여준다.
 * 장이 2개 이상인 열만 넘길 수 있고, 그런 열은 처음 그려질 때 넘길 수 있다는 힌트를 한 번 보여준다.
 */
export function TimetableEventDayPager({
  blocks,
  left,
  columnWidth,
  onSelectEvent,
}: TimetableEventDayPagerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const pageCount = getDayPageCount(blocks);
  const canSwipe = pageCount > 1;
  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, pageIndex) => getBlocksOnPage(blocks, pageIndex)),
    [blocks, pageCount],
  );

  const [hintTranslateX] = useState(() => new Animated.Value(0));
  const [scrollX] = useState(() => new Animated.Value(0));
  const pageRowTransform = useMemo(() => {
    const maxScrollX = columnWidth * (pageCount - 1);
    const rowWidth = columnWidth * pageCount;
    // 튕김 효과로 첫 장 앞·끝 장 뒤로 넘어간 거리. 둘 중 하나만 0보다 크다.
    const overscrollStart = scrollX.interpolate({
      inputRange: [-columnWidth, 0],
      outputRange: [columnWidth, 0],
      extrapolate: 'clamp',
    });
    const overscrollEnd = scrollX.interpolate({
      inputRange: [maxScrollX, maxScrollX + columnWidth],
      outputRange: [0, columnWidth],
      extrapolate: 'clamp',
    });
    const stretchStart = overscrollStart.interpolate({
      inputRange: [0, columnWidth],
      outputRange: [0, MAX_OVERSCROLL_STRETCH],
    });
    const stretchEnd = overscrollEnd.interpolate({
      inputRange: [0, columnWidth],
      outputRange: [0, MAX_OVERSCROLL_STRETCH],
    });
    // 넘어간 거리만큼 되돌려 카드를 열 가장자리에 붙여 두고, 붙은 가장자리를 기준으로 가로로 늘인다.
    // 늘이기는 줄 가운데를 기준으로 일어나므로 줄 너비의 절반만큼 옮겨 기준을 첫 장 왼쪽·끝 장 오른쪽 끝으로 맞춘다.
    const pinToEdge = Animated.subtract(overscrollEnd, overscrollStart);
    const anchorToEdge = Animated.multiply(Animated.subtract(stretchStart, stretchEnd), rowWidth / 2);
    return [
      { translateX: Animated.add(hintTranslateX, Animated.add(pinToEdge, anchorToEdge)) },
      { scaleX: Animated.add(1, Animated.add(stretchStart, stretchEnd)) },
    ];
  }, [columnWidth, hintTranslateX, pageCount, scrollX]);
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );
  const hintAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const hasPlayedHintRef = useRef(false);
  const currentPageRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 행사 목록이 바뀌면 장 구성도 달라져 이전 위치가 없는 장을 가리킬 수 있으므로 첫 장부터 다시 보여준다.
  useEffect(() => {
    currentPageRef.current = 0;
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [blocks]);

  useEffect(() => {
    if (!canSwipe || hasPlayedHintRef.current) return;
    hasPlayedHintRef.current = true;

    const timer = setTimeout(() => {
      if (isDraggingRef.current || currentPageRef.current !== 0) return;

      const animation = Animated.sequence([
        Animated.timing(hintTranslateX, {
          toValue: -columnWidth * HINT_OFFSET_RATIO,
          duration: HINT_OUT_DURATION_MS,
          easing: HINT_EASING,
          useNativeDriver: true,
        }),
        Animated.delay(HINT_PAUSE_MS),
        Animated.timing(hintTranslateX, {
          toValue: 0,
          duration: HINT_RETURN_DURATION_MS,
          easing: HINT_EASING,
          useNativeDriver: true,
        }),
      ]);
      hintAnimationRef.current = animation;
      animation.start(() => {
        hintAnimationRef.current = null;
      });
    }, HINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [canSwipe, columnWidth, hintTranslateX]);

  useEffect(() => () => hintAnimationRef.current?.stop(), []);

  const handleScrollBeginDrag = () => {
    isDraggingRef.current = true;
    // 힌트 도중 사용자가 직접 밀기 시작하면 힌트를 멈추고 제자리로 돌려 실제 스크롤 위치와 어긋나지 않게 한다.
    if (hintAnimationRef.current) {
      hintAnimationRef.current.stop();
      hintAnimationRef.current = null;
      hintTranslateX.setValue(0);
    }
  };

  const pageAt = (offsetX: number) => Math.round(offsetX / columnWidth);

  // 관성 없이 손을 떼면 관성 종료 이벤트가 오지 않으므로 손을 뗀 순간에도 끌기 종료와 도착할 장을 기록한다.
  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    const { contentOffset, targetContentOffset } = event.nativeEvent;
    currentPageRef.current = pageAt((targetContentOffset ?? contentOffset).x);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentPageRef.current = pageAt(event.nativeEvent.contentOffset.x);
  };

  return (
    <View style={[styles.column, { left, width: columnWidth }]} pointerEvents="box-none">
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={canSwipe}
        // 첫 장·끝 장에서도 넘김 영역이 손동작을 가져가야 행사 칸 위에서 민 동작이 누르기로 처리되지 않는다.
        bounces
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}>
        <Animated.View
          style={[
            styles.pageRow,
            { width: columnWidth * pageCount, transform: pageRowTransform },
          ]}>
          {pages.map((pageBlocks, pageIndex) => (
            <View key={pageIndex} style={{ width: columnWidth, height: GRID_HEIGHT }}>
              {pageBlocks.map((block) => (
                <TimetableEventBlock
                  key={block.key}
                  block={block}
                  columnWidth={columnWidth}
                  // 뒤 장에 다시 그린 복사본은 화면 읽기에서 숨겨, 요일의 모든 행사가 한 번씩만 읽히게 한다.
                  hiddenFromAccessibility={block.pageIndex !== pageIndex}
                  onSelectEvent={onSelectEvent}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

function TimetableEventBlock({
  block,
  columnWidth,
  hiddenFromAccessibility,
  onSelectEvent,
}: {
  block: EventGridBlock;
  columnWidth: number;
  hiddenFromAccessibility: boolean;
  onSelectEvent?: (event: Event) => void;
}) {
  const colorScheme = useColorScheme();
  const [expanded, setExpanded] = useState(false);
  const longPressedRef = useRef(false);
  const location = block.event.location?.trim();
  const hasLocation = Boolean(location && location !== '-');
  const color = getEventTypeColors(colorScheme, block.event.eventTypeId).background;
  const laneWidth = columnWidth / block.laneCount;
  const baseLeft = laneWidth * block.laneIndex;
  // 요일 열 밖은 잘려 보이지 않으므로, 펼친 칸이 열 안에 머물도록 좌우 확장 폭을 열 경계에서 자른다.
  const expandedLeft = Math.max(0, baseLeft - EXPANDED_EXTRA_WIDTH / 2);
  const expandedWidth = Math.min(columnWidth, baseLeft + laneWidth + EXPANDED_EXTRA_WIDTH / 2) - expandedLeft;

  return (
    <Pressable
      accessibilityElementsHidden={hiddenFromAccessibility}
      importantForAccessibility={hiddenFromAccessibility ? 'no-hide-descendants' : 'auto'}
      accessibilityRole="button"
      accessibilityLabel={
        hasLocation ? `${block.event.title} 행사, 장소 ${location}` : `${block.event.title} 행사`
      }
      onHoverIn={() => setExpanded(true)}
      onHoverOut={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      delayLongPress={350}
      onPressIn={() => {
        longPressedRef.current = false;
      }}
      onLongPress={() => {
        longPressedRef.current = true;
        setExpanded(true);
      }}
      onPressOut={() => setExpanded(false)}
      onPress={() => {
        if (longPressedRef.current) {
          longPressedRef.current = false;
          return;
        }
        onSelectEvent?.(block.event);
      }}
      style={[
        styles.eventBlock,
        {
          left: expanded ? expandedLeft : baseLeft,
          top: block.top,
          width: expanded ? expandedWidth : laneWidth,
          height: expanded
            ? Math.max(block.height, hasLocation ? EXPANDED_MIN_HEIGHT_WITH_LOCATION : EXPANDED_MIN_HEIGHT)
            : block.height,
          backgroundColor: color,
          zIndex: expanded ? 30 : 2,
        },
        expanded && styles.eventBlockExpanded,
      ]}>
      <Text
        numberOfLines={expanded ? undefined : 2}
        style={[styles.eventTitle, expanded && styles.eventTitleExpanded]}>
        {block.event.title}
      </Text>
      <Text
        numberOfLines={expanded ? undefined : 2}
        style={[styles.eventTime, expanded && styles.eventTimeExpanded]}>
        {formatAmPmFromMinutes(block.startMin)} - {formatAmPmFromMinutes(block.endMin)}
      </Text>
      {hasLocation ? (
        <Text numberOfLines={expanded ? undefined : 1} style={styles.eventLocation}>
          {location}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { position: 'absolute', top: 0, height: GRID_HEIGHT, zIndex: 2 },
  pageRow: { flexDirection: 'row', height: GRID_HEIGHT },
  eventBlock: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  eventBlockExpanded: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  eventTitle: { color: AdaptiveColors.text, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  eventTitleExpanded: { fontSize: 12, lineHeight: 16 },
  eventTime: { marginTop: 2, color: AdaptiveColors.textSecondary, fontSize: 10, lineHeight: 13 },
  eventTimeExpanded: { fontSize: 11, lineHeight: 15 },
  eventLocation: { marginTop: 3, color: AdaptiveColors.textSecondary, fontSize: 10, lineHeight: 13 },
});
