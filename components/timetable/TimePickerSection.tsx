import { useEffect, useRef } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const WHEEL_ITEM_HEIGHT = 36;
const VISIBLE_WHEEL_ITEMS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * VISIBLE_WHEEL_ITEMS;

type WheelOption<T extends string | number> = {
  value: T;
  label: string;
};

type WheelColumnProps<T extends string | number> = {
  options: WheelOption<T>[];
  value: T;
  onChange: (next: T) => void;
};

function WheelColumn<T extends string | number>({
  options,
  value,
  onChange,
}: WheelColumnProps<T>) {
  const listRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    listRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  const commit = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.max(
      0,
      Math.min(
        options.length - 1,
        Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT),
      ),
    );
    if (options[index].value !== value) onChange(options[index].value);
  };

  return (
    <View style={styles.wheelColumnWrap}>
      <ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.wheelPadding}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        onContentSizeChange={() =>
          listRef.current?.scrollTo({
            y: selectedIndex * WHEEL_ITEM_HEIGHT,
            animated: false,
          })
        }>
        {options.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          return (
            <Pressable
              key={String(item.value)}
              style={styles.wheelItem}
              onPress={() => {
                onChange(item.value);
                listRef.current?.scrollTo({
                  y: index * WHEEL_ITEM_HEIGHT,
                  animated: true,
                });
              }}>
              <Text
                style={[
                  styles.wheelItemText,
                  distance === 1 && styles.wheelItemNear,
                  distance >= 2 && styles.wheelItemFar,
                  distance === 0 && styles.wheelItemSelected,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type TimePickerSectionProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const MERIDIEM_OPTIONS: WheelOption<'AM' | 'PM'>[] = [
  { value: 'AM', label: '오전' },
  { value: 'PM', label: '오후' },
];
const HOUR_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));
const MINUTE_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, index) => ({
  value: index * 5,
  label: String(index * 5).padStart(2, '0'),
}));

export function TimePickerSection({ label, value, onChange }: TimePickerSectionProps) {
  const hour24 = Math.floor(value / 60);
  const minute = value % 60;
  const meridiem = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 || 12;

  const update = (
    nextMeridiem = meridiem,
    nextHour = hour12,
    nextMinute = minute,
  ) => {
    const nextHour24 =
      nextMeridiem === 'AM' ? nextHour % 12 : (nextHour % 12) + 12;
    onChange(nextHour24 * 60 + nextMinute);
  };

  return (
    <View style={styles.pickerSection}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Text style={styles.timeOutput}>
          {String(hour24).padStart(2, '0')}:{String(minute).padStart(2, '0')}
        </Text>
      </View>
      <View style={styles.wheel}>
        <View pointerEvents="none" style={styles.selectionBand} />
        <WheelColumn
          options={MERIDIEM_OPTIONS}
          value={meridiem}
          onChange={(next) => update(next)}
        />
        <WheelColumn
          options={HOUR_OPTIONS}
          value={hour12}
          onChange={(next) => update(meridiem, next)}
        />
        <WheelColumn
          options={MINUTE_OPTIONS}
          value={minute}
          onChange={(next) => update(meridiem, hour12, next)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerSection: { marginBottom: 3 },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pickerLabel: { color: '#7B818A', fontSize: 14, fontWeight: '600' },
  timeOutput: {
    color: '#1677FF',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  wheel: {
    height: WHEEL_HEIGHT,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 18,
  },
  selectionBand: {
    position: 'absolute',
    top: WHEEL_ITEM_HEIGHT * 2,
    right: 0,
    left: 0,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
  },
  wheelColumnWrap: { flex: 1, height: WHEEL_HEIGHT },
  wheelPadding: { paddingVertical: WHEEL_ITEM_HEIGHT * 2 },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    color: '#1F2329',
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  wheelItemSelected: { fontSize: 17, fontWeight: '700', opacity: 1 },
  wheelItemNear: { opacity: 0.45, transform: [{ scale: 0.92 }] },
  wheelItemFar: { opacity: 0.14, transform: [{ scale: 0.84 }] },
});
