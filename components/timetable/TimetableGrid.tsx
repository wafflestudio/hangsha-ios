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

import type { CalendarEvent, Event } from '@/types/event';
import type { TimetableCourse } from '@/types/timetable';
import { DAY_LABELS_KO } from '@/types/timetable';
import { getEventTypeColors } from '@/util/theme';
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

type TimetableGridProps = {
  courses: TimetableCourse[];
  events: CalendarEvent[];
  weekStart: Date;
  isLoading?: boolean;
  onDeleteCourse: (enrollId: number) => void;
  onSelectCourse: (item: TimetableCourse) => void;
  onSelectEvent?: (event: Event) => void;
};

export function TimetableGrid({
  courses,
  events,
  weekStart,
  isLoading = false,
  onDeleteCourse,
  onSelectCourse,
  onSelectEvent,
}: TimetableGridProps) {
  const { width } = useWindowDimensions();
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [periodTimelineExpanded, setPeriodTimelineExpanded] = useState(true);
  const longPressedEventIdRef = useRef<number | null>(null);
  const columnWidth = (width - TIME_GUTTER_WIDTH) / VISIBLE_DAYS.length;
  const courseBlocks = useMemo(() => flattenCourses(courses), [courses]);
  const timedEvents = useMemo(
    () => events.filter((event) => !event.allDay && !event.resource.isPeriodEvent),
    [events],
  );
  const allDayEvents = useMemo(
    () => events.filter((event) => event.allDay && !event.resource.isPeriodEvent),
    [events],
  );
  const periodEvents = useMemo(
    () => events.filter((event) => event.resource.isPeriodEvent),
    [events],
  );
  const eventBlocks = useMemo(() => flattenEvents(timedEvents), [timedEvents]);
  const allDayBlocks = useMemo(
    () => flattenSpanningEvents(allDayEvents, weekStart),
    [allDayEvents, weekStart],
  );
  const periodBlocks = useMemo(
    () => flattenSpanningEvents(periodEvents, weekStart, true),
    [periodEvents, weekStart],
  );
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

      {allDayBlocks.length > 0 ? (
        <AllDayEventBar
          blocks={allDayBlocks}
          columnWidth={columnWidth}
          onSelectEvent={onSelectEvent}
        />
      ) : null}

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
              accessibilityRole="button"
              accessibilityLabel={`${block.title} 수업 수정`}
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
                <SymbolView name="xmark.circle.fill" tintColor="#7C7C7C" size={13} />
              </Pressable>
              <Text numberOfLines={2} style={styles.courseTitle}>{block.title}</Text>
              <Text numberOfLines={2} style={styles.courseTime}>
                {formatAmPmFromMinutes(block.startMin)} - {formatAmPmFromMinutes(block.endMin)}
              </Text>
            </Pressable>
          ))}

          {eventBlocks.map((block) => {
            const expanded = block.event.id === expandedEventId;
            const location = block.event.location?.trim();
            const hasLocation = Boolean(location && location !== '-');
            const color = getEventTypeColors('light', block.event.eventTypeId).background;
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
              <ActivityIndicator color="#20C4DD" />
            </View>
          )}
        </View>
      </ScrollView>

      {periodBlocks.length > 0 ? (
        <PeriodEventTimeline
          blocks={periodBlocks}
          columnWidth={columnWidth}
          expanded={periodTimelineExpanded}
          onToggle={() => setPeriodTimelineExpanded((current) => !current)}
          onSelectEvent={onSelectEvent}
        />
      ) : null}
    </View>
  );
}

type SpanningBlocks = ReturnType<typeof flattenSpanningEvents>;

function AllDayEventBar({
  blocks,
  columnWidth,
  onSelectEvent,
}: {
  blocks: SpanningBlocks;
  columnWidth: number;
  onSelectEvent?: (event: Event) => void;
}) {
  const laneCount = blocks.reduce((count, block) => Math.max(count, block.lane + 1), 0);
  const height = 8 + laneCount * 26;

  return (
    <View style={[styles.allDayArea, { height }]}>
      {VISIBLE_DAYS.map((day, index) => (
        <View
          key={`all-day-column-${day}`}
          style={[styles.allDayVerticalLine, { left: TIME_GUTTER_WIDTH + (index + 1) * columnWidth }]}
        />
      ))}
      {blocks.map((block) => (
        <Pressable
          key={block.key}
          accessibilityRole="button"
          accessibilityLabel={`${block.event.title} 종일 행사`}
          onPress={() => onSelectEvent?.(block.event)}
          style={[
            styles.allDayEvent,
            {
              left: TIME_GUTTER_WIDTH + block.startDayIndex * columnWidth + 2,
              top: 4 + block.lane * 26,
              width: block.spanDays * columnWidth - 4,
              backgroundColor: getEventTypeColors('light', block.event.eventTypeId).background,
            },
          ]}>
          <Text numberOfLines={1} style={styles.allDayEventText}>{block.event.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PeriodEventTimeline({
  blocks,
  columnWidth,
  expanded,
  onToggle,
  onSelectEvent,
}: {
  blocks: SpanningBlocks;
  columnWidth: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectEvent?: (event: Event) => void;
}) {
  const laneCount = blocks.reduce((count, block) => Math.max(count, block.lane + 1), 0);
  const contentHeight = 14 + laneCount * 42;

  return (
    <View style={styles.periodTimeline}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`기간제 행사 타임라인 ${expanded ? '접기' : '열기'}`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.periodTimelineHeader, pressed && styles.periodPressed]}
        onPress={onToggle}>
        <Text style={styles.periodTimelineTitle}>기간제 행사 타임라인</Text>
        <SymbolView
          name={expanded ? 'chevron.down' : 'chevron.up'}
          tintColor="#6B7280"
          size={15}
          weight="semibold"
        />
      </Pressable>

      {expanded ? (
        <ScrollView
          style={styles.periodTimelineScroll}
          contentContainerStyle={{ height: contentHeight }}
          bounces={false}
          showsVerticalScrollIndicator={laneCount > 3}>
          {blocks.map((block) => {
            const colors = getEventTypeColors('light', block.event.eventTypeId);
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
                    top: 7 + block.lane * 42,
                    width: arrowWidth,
                  },
                ]}>
                <View style={[styles.periodLine, { backgroundColor: colors.background }]} />
                {!block.continuesBefore ? (
                  <View style={[styles.periodArrowLeft, { borderRightColor: colors.background }]} />
                ) : null}
                {!block.continuesAfter ? (
                  <View style={[styles.periodArrowRight, { borderLeftColor: colors.background }]} />
                ) : null}
                <View style={[styles.periodLabelRow, { alignItems: alignment }]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.periodLabel, { color: colors.text }]}>
                    {block.event.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', flex: 1, backgroundColor: '#FFFFFF' },
  dayHeaderRow: {
    height: 36,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    zIndex: 40,
  },
  dayHeader: { alignItems: 'center', justifyContent: 'center' },
  dayHeaderText: { color: '#111111', fontSize: 13, fontWeight: '600' },
  allDayArea: {
    position: 'relative',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  allDayVerticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E8E8',
  },
  allDayEvent: {
    position: 'absolute',
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 5,
    overflow: 'hidden',
  },
  allDayEventText: { color: '#171717', fontSize: 10, fontWeight: '700', lineHeight: 13 },
  scroll: { flex: 1 },
  grid: { position: 'relative', backgroundColor: '#FFFFFF' },
  horizontalLine: {
    position: 'absolute',
    right: 0,
    left: TIME_GUTTER_WIDTH,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E8E8',
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E8E8E8',
  },
  hourLabel: {
    position: 'absolute',
    left: 6,
    width: TIME_GUTTER_WIDTH - 8,
    color: '#888888',
    fontSize: 12,
  },
  courseBlock: {
    position: 'absolute',
    paddingHorizontal: 5,
    paddingVertical: 6,
    overflow: 'hidden',
    backgroundColor: '#D7D7D7',
    zIndex: 1,
  },
  deleteCourseButton: { position: 'absolute', top: 4, right: 4, zIndex: 2 },
  courseTitle: { marginTop: 8, color: '#171717', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  courseTime: { marginTop: 2, color: '#282828', fontSize: 10, lineHeight: 13 },
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
  eventTitle: { color: '#151515', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  eventTitleExpanded: { fontSize: 12, lineHeight: 16 },
  eventTime: { marginTop: 2, color: '#252525', fontSize: 10, lineHeight: 13 },
  eventTimeExpanded: { fontSize: 11, lineHeight: 15 },
  eventLocation: { marginTop: 3, color: '#333333', fontSize: 10, lineHeight: 13 },
  periodTimeline: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    maxHeight: 210,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  periodTimelineHeader: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D7D7D7',
  },
  periodTimelineTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  periodPressed: { opacity: 0.7 },
  periodTimelineScroll: { maxHeight: 156, backgroundColor: 'rgba(255,255,255,0.82)' },
  periodBar: { position: 'absolute', height: 36 },
  periodLine: {
    position: 'absolute',
    top: 24,
    right: 3,
    left: 3,
    height: 3,
    borderRadius: 2,
  },
  periodArrowLeft: {
    position: 'absolute',
    top: 19,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  periodArrowRight: {
    position: 'absolute',
    top: 19,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
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
    backgroundColor: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    zIndex: 50,
  },
});
