import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CalendarEvent, Event } from '@/types/event';
import type { TimetableCourse } from '@/types/timetable';
import { DAY_LABELS_KO } from '@/types/timetable';
import { AdaptiveColors, Colors, getEventTypeColors } from '@/util/theme';
import {
  flattenCourses,
  flattenEvents,
  flattenSpanningEvents,
  formatAmPmFromMinutes,
  formatHourLabel,
  GRID_END_HOUR,
  GRID_HEIGHT,
  GRID_START_HOUR,
  PIXELS_PER_MINUTE,
  VISIBLE_DAYS,
} from '@/util/timetable/layout';

const TIME_GUTTER_WIDTH = 32;
const PERIOD_SHEET_SNAP_POINTS = [54, '76%', '90%'];
const PERIOD_EVENT_HEIGHT = 29;
const PERIOD_EVENT_GAP = 0;
const PERIOD_EVENT_LANE_HEIGHT = PERIOD_EVENT_HEIGHT + PERIOD_EVENT_GAP;

const PERIOD_ARROW_CENTER_Y = 18;
const PERIOD_ARROW_LINE_HEIGHT = 3;
const PERIOD_ARROW_HEAD_WIDTH = 9;
const PERIOD_ARROW_HEAD_HALF_HEIGHT = 7;
const PERIOD_ARROW_JOIN_OVERLAP = 1;
const PERIOD_ARROW_LINE_INSET = PERIOD_ARROW_HEAD_WIDTH - PERIOD_ARROW_JOIN_OVERLAP;
const PERIOD_LABEL_BACKGROUND_COLORS = {
  light: 'rgba(255,255,255,0.80)',
  dark: 'rgba(11,13,16,0.88)',
} as const;

type TimetableGridProps = {
  courses: TimetableCourse[];
  events: CalendarEvent[];
  hideCourseDetails?: boolean;
  isLoading?: boolean;
  onDeleteCourse: (enrollId: number) => void;
  onSelectCourse: (item: TimetableCourse) => void;
  onSelectEvent?: (event: Event) => void;
};

export function TimetableGrid({
  courses,
  events,
  hideCourseDetails = false,
  isLoading = false,
  onDeleteCourse,
  onSelectCourse,
  onSelectEvent,
}: TimetableGridProps) {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const longPressedEventIdRef = useRef<number | null>(null);
  const columnWidth = (width - TIME_GUTTER_WIDTH) / VISIBLE_DAYS.length;
  const courseBlocks = useMemo(() => flattenCourses(courses), [courses]);
  const timedEvents = useMemo(
    () => events.filter((event) => !event.allDay && !event.resource.isPeriodEvent),
    [events],
  );
  const eventBlocks = useMemo(() => flattenEvents(timedEvents), [timedEvents]);
  const halfHourLines = (GRID_END_HOUR - GRID_START_HOUR) * 2;

  return (
    <View style={styles.container}>
      <View style={styles.dayHeaderRow}>
        <View style={{ width: TIME_GUTTER_WIDTH }} />
        {VISIBLE_DAYS.map((day) => (
          <View key={day} style={[styles.dayHeader, { width: columnWidth }]}>
            <Text style={styles.dayHeaderText}>{DAY_LABELS_KO[day]}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ height: GRID_HEIGHT }} bounces={false}>
        <View style={[styles.grid, { width, height: GRID_HEIGHT }]}>
          {Array.from({ length: halfHourLines + 1 }, (_, index) => (
            <View
              key={`line-${index}`}
              style={[styles.horizontalLine, { top: index * 30 * PIXELS_PER_MINUTE }]}
            />
          ))}

          {VISIBLE_DAYS.map((day, index) => (
            <View
              key={`column-${day}`}
              style={[styles.verticalLine, { left: TIME_GUTTER_WIDTH + (index + 1) * columnWidth }]}
            />
          ))}

          {Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, index) => {
            const hour = GRID_START_HOUR + index;
            return (
              <Text
                key={`hour-${hour}`}
                style={[styles.hourLabel, { top: index * 60 * PIXELS_PER_MINUTE + 7 }]}>
                {formatHourLabel(hour)}
              </Text>
            );
          })}

          {courseBlocks.map((block) => (
            <Pressable
              key={block.key}
              disabled={hideCourseDetails}
              accessibilityRole="button"
              accessibilityElementsHidden={hideCourseDetails}
              importantForAccessibility={hideCourseDetails ? 'no-hide-descendants' : 'auto'}
              accessibilityLabel={hideCourseDetails ? undefined : `${block.title} 수업 수정`}
              onPress={() => onSelectCourse(block.item)}
              style={[
                styles.courseBlock,
                {
                  left: TIME_GUTTER_WIDTH + block.dayIndex * columnWidth,
                  top: block.top,
                  width: columnWidth,
                  height: block.height,
                },
              ]}>
              {!hideCourseDetails ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${block.title} 수업 삭제`}
                    hitSlop={7}
                    style={styles.deleteCourseButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      Alert.alert('수업 삭제', `'${block.title}' 수업을 삭제할까요?`, [
                        { text: '취소', style: 'cancel' },
                        { text: '삭제', style: 'destructive', onPress: () => onDeleteCourse(block.enrollId) },
                      ]);
                    }}>
                    <SymbolView name="xmark.circle.fill" tintColor={AdaptiveColors.icon} size={13} />
                  </Pressable>
                  <Text numberOfLines={2} style={styles.courseTitle}>{block.title}</Text>
                  <Text numberOfLines={2} style={styles.courseTime}>
                    {formatAmPmFromMinutes(block.startMin)} - {formatAmPmFromMinutes(block.endMin)}
                  </Text>
                </>
              ) : null}
            </Pressable>
          ))}

          {eventBlocks.map((block) => {
            const expanded = block.event.id === expandedEventId;
            const location = block.event.location?.trim();
            const hasLocation = Boolean(location && location !== '-');
            const color = getEventTypeColors(colorScheme, block.event.eventTypeId).background;
            const baseLeft = TIME_GUTTER_WIDTH +
              block.dayIndex * columnWidth +
              columnWidth * (block.leftPct / 100);
            const baseWidth = columnWidth * (block.widthPct / 100);

            return (
              <Pressable
                key={block.key}
                accessibilityRole="button"
                accessibilityLabel={
                  hasLocation
                    ? `${block.event.title} 행사, 장소 ${location}`
                    : `${block.event.title} 행사`
                }
                onHoverIn={() => setExpandedEventId(block.event.id)}
                onHoverOut={() => setExpandedEventId(null)}
                onFocus={() => setExpandedEventId(block.event.id)}
                onBlur={() => setExpandedEventId(null)}
                delayLongPress={350}
                onPressIn={() => {
                  longPressedEventIdRef.current = null;
                }}
                onLongPress={() => {
                  longPressedEventIdRef.current = block.event.id;
                  setExpandedEventId(block.event.id);
                }}
                onPressOut={() => setExpandedEventId(null)}
                onPress={() => {
                  if (longPressedEventIdRef.current === block.event.id) {
                    longPressedEventIdRef.current = null;
                    return;
                  }
                  onSelectEvent?.(block.event);
                }}
                style={[
                  styles.eventBlock,
                  {
                    left: expanded ? baseLeft - 5 : baseLeft,
                    top: block.top,
                    width: expanded ? baseWidth + 10 : baseWidth,
                    height: expanded ? Math.max(block.height, hasLocation ? 104 : 86) : block.height,
                    backgroundColor: color,
                    opacity: expanded ? 1 : block.opacity,
                    zIndex: expanded ? 30 : block.zIndex,
                  },
                  expanded && styles.eventBlockExpanded,
                ]}>
                <Text numberOfLines={expanded ? undefined : 2} style={[styles.eventTitle, expanded && styles.eventTitleExpanded]}>
                  {block.event.title}
                </Text>
                <Text numberOfLines={expanded ? undefined : 2} style={[styles.eventTime, expanded && styles.eventTimeExpanded]}>
                  {formatAmPmFromMinutes(block.startMin)} - {formatAmPmFromMinutes(block.endMin)}
                </Text>
                {hasLocation ? (
                  <Text numberOfLines={expanded ? undefined : 1} style={styles.eventLocation}>
                    {location}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={AdaptiveColors.accent} />
            </View>
          )}
        </View>
      </ScrollView>

    </View>
  );
}

type SpanningBlocks = ReturnType<typeof flattenSpanningEvents>;

type TimetableEventTimelineSheetProps = {
  events: CalendarEvent[];
  weekStart: Date;
  onSelectEvent?: (event: Event) => void;
  onOpenChange?: (open: boolean) => void;
};

export function TimetableEventTimelineSheet({
  events,
  weekStart,
  onSelectEvent,
  onOpenChange,
}: TimetableEventTimelineSheetProps) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - TIME_GUTTER_WIDTH) / VISIBLE_DAYS.length;
  const allDayEvents = useMemo(
    () => events.filter((event) => event.allDay && !event.resource.isPeriodEvent),
    [events],
  );
  const periodEvents = useMemo(
    () => events.filter((event) => event.resource.isPeriodEvent),
    [events],
  );
  const allDayBlocks = useMemo(
    () => flattenSpanningEvents(allDayEvents, weekStart),
    [allDayEvents, weekStart],
  );
  const periodBlocks = useMemo(
    () => flattenSpanningEvents(periodEvents, weekStart, true),
    [periodEvents, weekStart],
  );

  if (periodBlocks.length === 0 && allDayBlocks.length === 0) return null;

  return (
    <PeriodEventTimeline
      blocks={periodBlocks}
      allDayBlocks={allDayBlocks}
      columnWidth={columnWidth}
      onSelectEvent={onSelectEvent}
      onOpenChange={onOpenChange}
    />
  );
}

function PeriodEventTimeline({
  blocks,
  allDayBlocks,
  columnWidth,
  onSelectEvent,
  onOpenChange,
}: {
  blocks: SpanningBlocks;
  allDayBlocks: SpanningBlocks;
  columnWidth: number;
  onSelectEvent?: (event: Event) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const colorScheme = useColorScheme();
  const periodLaneCount = blocks.reduce((count, block) => Math.max(count, block.lane + 1), 0);
  const allDayLaneCount = allDayBlocks.reduce(
    (count, block) => Math.max(count, block.lane + 1),
    0,
  );
  const periodSectionHeight =
    periodLaneCount > 0 ? 14 + periodLaneCount * PERIOD_EVENT_LANE_HEIGHT : 0;
  const hasBothSections = periodLaneCount > 0 && allDayLaneCount > 0;
  const allDaySectionHeight =
    allDayLaneCount > 0 ? 16 + allDayLaneCount * 26 : 0;
  const periodSectionTop = allDaySectionHeight + (hasBothSections ? 11 : 0);
  const contentHeight = Math.max(
    allDaySectionHeight,
    periodSectionTop + periodSectionHeight,
    14,
  );

  return (
    <BottomSheet
      index={0}
      snapPoints={PERIOD_SHEET_SNAP_POINTS}
      animateOnMount={false}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      enableOverDrag={false}
      handleComponent={PeriodTimelineHandle}
      containerStyle={styles.periodSheetContainer}
      style={styles.periodSheetShadow}
      backgroundStyle={styles.periodSheetBackground}
      onAnimate={(_fromIndex, toIndex) => onOpenChange?.(toIndex > 0)}
      onChange={(index) => onOpenChange?.(index > 0)}>
      <BottomSheetScrollView
        contentContainerStyle={[styles.periodSheetContent, { height: contentHeight }]}
        bounces={false}
        showsVerticalScrollIndicator={periodLaneCount + allDayLaneCount > 8}>
        {allDayBlocks.map((block) => (
          <Pressable
            key={`all-day-${block.key}`}
            accessibilityRole="button"
            accessibilityLabel={`${block.event.title} 종일 참여형 행사`}
            onPress={() => onSelectEvent?.(block.event)}
            style={[
              styles.sheetAllDayEvent,
              {
                left: TIME_GUTTER_WIDTH + block.startDayIndex * columnWidth + 2,
                top: 8 + block.lane * 26,
                width: block.spanDays * columnWidth - 4,
                backgroundColor: getEventTypeColors(colorScheme, block.event.eventTypeId).background,
              },
            ]}>
            <Text numberOfLines={1} style={styles.sheetAllDayEventText}>
              {block.event.title}
            </Text>
          </Pressable>
        ))}

        {hasBothSections ? (
          <View style={[styles.timelineSectionDivider, { top: allDaySectionHeight + 7 }]} />
        ) : null}

        {blocks.map((block) => {
          const colors = getEventTypeColors(colorScheme, block.event.eventTypeId);
          const arrowWidth = block.spanDays * columnWidth;
          const alignment =
            block.startDayIndex <= 1
              ? 'flex-start'
              : block.endDayIndex >= VISIBLE_DAYS.length - 2
                ? 'flex-end'
                : 'center';

          return (
            <Pressable
              key={block.key}
              accessibilityRole="button"
              accessibilityLabel={`${block.event.title} 모집형 행사`}
              onPress={() => onSelectEvent?.(block.event)}
              style={[
                styles.periodBar,
                {
                  left: TIME_GUTTER_WIDTH + block.startDayIndex * columnWidth,
                  top: periodSectionTop + 7 + block.lane * PERIOD_EVENT_LANE_HEIGHT,
                  width: arrowWidth,
                },
              ]}>
              <PeriodArrow
                color={colors.background}
                showLeftHead={!block.continuesBefore}
                showRightHead={!block.continuesAfter}
              />
              <View style={[styles.periodLabelRow, { alignItems: alignment }]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.periodLabel,
                    {
                      color: colorScheme === 'dark' ? Colors.dark.text : colors.text,
                      backgroundColor: PERIOD_LABEL_BACKGROUND_COLORS[colorScheme],
                    },
                  ]}>
                  {block.event.title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function PeriodTimelineHandle() {
  return (
    <View
      accessible
      accessibilityLabel="모집형 행사 타임라인. 위로 드래그하여 열기"
      style={styles.periodSheetHeader}>
      <Text style={styles.periodSheetTitle}>모집형 행사 타임라인</Text>
    </View>
  );
}

function PeriodArrow({
  color,
  showLeftHead,
  showRightHead,
}: {
  color: string;
  showLeftHead: boolean;
  showRightHead: boolean;
}) {
  return (
    <View pointerEvents="none" style={styles.periodArrow}>
      <View
        style={[
          styles.periodLine,
          {
            left: showLeftHead ? PERIOD_ARROW_LINE_INSET : 0,
            right: showRightHead ? PERIOD_ARROW_LINE_INSET : 0,
            backgroundColor: color,
          },
        ]}
      />
      {showLeftHead ? (
        <View style={[styles.periodArrowLeft, { borderRightColor: color }]} />
      ) : null}
      {showRightHead ? (
        <View style={[styles.periodArrowRight, { borderLeftColor: color }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', flex: 1, backgroundColor: AdaptiveColors.background },
  dayHeaderRow: {
    height: 36,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AdaptiveColors.border,
    backgroundColor: AdaptiveColors.surface,
    zIndex: 40,
  },
  dayHeader: { alignItems: 'center', justifyContent: 'center' },
  dayHeaderText: { color: AdaptiveColors.text, fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  grid: { position: 'relative', backgroundColor: AdaptiveColors.background },
  horizontalLine: {
    position: 'absolute',
    right: 0,
    left: TIME_GUTTER_WIDTH,
    height: StyleSheet.hairlineWidth,
    backgroundColor: AdaptiveColors.border,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: AdaptiveColors.border,
  },
  hourLabel: {
    position: 'absolute',
    left: 6,
    width: TIME_GUTTER_WIDTH - 8,
    color: AdaptiveColors.textMuted,
    fontSize: 12,
  },
  courseBlock: {
    position: 'absolute',
    paddingHorizontal: 5,
    paddingVertical: 6,
    overflow: 'hidden',
    backgroundColor: AdaptiveColors.backgroundSelected,
    zIndex: 1,
  },
  deleteCourseButton: { position: 'absolute', top: 4, right: 4, zIndex: 2 },
  courseTitle: { marginTop: 8, color: AdaptiveColors.text, fontSize: 11, fontWeight: '700', lineHeight: 14 },
  courseTime: { marginTop: 2, color: AdaptiveColors.textSecondary, fontSize: 10, lineHeight: 13 },
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
  periodSheetContainer: {
    zIndex: 40,
    elevation: 10,
  },
  periodSheetShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
  },
  periodSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.80)',
  },
  periodSheetHeader: {
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },
  periodSheetTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  periodSheetContent: { position: 'relative', backgroundColor: 'transparent' },
  timelineSectionDivider: {
    position: 'absolute',
    right: 0,
    left: TIME_GUTTER_WIDTH,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  sheetAllDayEvent: {
    position: 'absolute',
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  sheetAllDayEventText: { color: '#171717', fontSize: 10, fontWeight: '700', lineHeight: 13 },
  periodBar: { position: 'absolute', height: PERIOD_EVENT_HEIGHT },
  periodArrow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  periodLine: {
    position: 'absolute',
    top: PERIOD_ARROW_CENTER_Y - PERIOD_ARROW_LINE_HEIGHT / 2,
    height: PERIOD_ARROW_LINE_HEIGHT,
    borderRadius: PERIOD_ARROW_LINE_HEIGHT / 2,
  },
  periodArrowLeft: {
    position: 'absolute',
    top: PERIOD_ARROW_CENTER_Y - PERIOD_ARROW_HEAD_HALF_HEIGHT,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: PERIOD_ARROW_HEAD_HALF_HEIGHT,
    borderBottomWidth: PERIOD_ARROW_HEAD_HALF_HEIGHT,
    borderRightWidth: PERIOD_ARROW_HEAD_WIDTH,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  periodArrowRight: {
    position: 'absolute',
    top: PERIOD_ARROW_CENTER_Y - PERIOD_ARROW_HEAD_HALF_HEIGHT,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: PERIOD_ARROW_HEAD_HALF_HEIGHT,
    borderBottomWidth: PERIOD_ARROW_HEAD_HALF_HEIGHT,
    borderLeftWidth: PERIOD_ARROW_HEAD_WIDTH,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  periodLabelRow: {
    position: 'absolute',
    top: 0,
    right: 8,
    left: 8,
  },
  periodLabel: {
    maxWidth: '88%',
    paddingHorizontal: 5,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AdaptiveColors.backgroundSelected,
    zIndex: 50,
  },
});
