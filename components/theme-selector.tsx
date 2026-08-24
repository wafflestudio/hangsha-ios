import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  type ThemePreference,
  useThemePreference,
} from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '자동' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export function ThemeSelector() {
  const theme = useTheme();
  const preference = useThemePreference((state) => state.preference);
  const setPreference = useThemePreference((state) => state.setPreference);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>화면 모드</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>자동은 기기 설정을 따라가요.</Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={[styles.control, { backgroundColor: theme.backgroundElement }]}>
        {OPTIONS.map((option) => {
          const selected = preference === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} 모드`}
              accessibilityState={{ selected }}
              hitSlop={4}
              onPress={() => setPreference(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.optionText,
                  { color: selected ? theme.text : theme.textSecondary },
                  selected && styles.optionTextSelected,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  description: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  control: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 3,
  },
  option: {
    minWidth: 52,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: 9,
    paddingHorizontal: 9,
  },
  optionText: { fontSize: 12, fontWeight: '600' },
  optionTextSelected: { fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
