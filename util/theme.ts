/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import {
  DynamicColorIOS,
  Platform,
  PlatformColor,
  type ColorValue,
} from 'react-native';

export const Colors = {
  light: {
    text: '#17191D',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E7F4FB',
    textSecondary: '#686D76',
    textMuted: '#8A9099',
    icon: '#777D86',
    border: '#E3E5E8',
    borderStrong: '#CED2D8',
    input: '#F8F9FA',
    pressed: '#F0F2F4',
    accent: '#208AEF',
    accentSoft: '#E8F4FF',
    danger: '#D33B4C',
    dangerSoft: '#FFF0F2',
    overlay: 'rgba(15, 18, 22, 0.42)',
  },
  dark: {
    text: '#F4F5F7',
    background: '#0B0D10',
    surface: '#14171C',
    surfaceElevated: '#1A1E24',
    backgroundElement: '#1B1F25',
    backgroundSelected: '#20313C',
    textSecondary: '#A8ADB6',
    textMuted: '#7F8792',
    icon: '#9DA4AE',
    border: '#292E36',
    borderStrong: '#3A424D',
    input: '#181C22',
    pressed: '#20252C',
    accent: '#58B9FF',
    accentSoft: '#142B3C',
    danger: '#FF7180',
    dangerSoft: '#351C22',
    overlay: 'rgba(0, 0, 0, 0.62)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Static StyleSheet colors that follow app-level Appearance changes. */
const adaptiveColor = (
  key: ThemeColor,
  androidColor?: Parameters<typeof PlatformColor>[0],
): ColorValue => {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light: Colors.light[key], dark: Colors.dark[key] });
  }
  if (Platform.OS === 'android' && androidColor) {
    return PlatformColor(androidColor);
  }
  return Colors.light[key];
};

export const AdaptiveColors = {
  text: adaptiveColor('text', '?android:attr/textColorPrimary'),
  background: adaptiveColor('background', '?android:attr/colorBackground'),
  surface: adaptiveColor('surface', '?android:attr/colorBackgroundFloating'),
  surfaceElevated: adaptiveColor('surfaceElevated', '?android:attr/colorBackgroundFloating'),
  backgroundElement: adaptiveColor('backgroundElement', '?android:attr/colorControlHighlight'),
  backgroundSelected: adaptiveColor('backgroundSelected', '?android:attr/colorControlHighlight'),
  textSecondary: adaptiveColor('textSecondary', '?android:attr/textColorSecondary'),
  textMuted: adaptiveColor('textMuted', '?android:attr/textColorTertiary'),
  icon: adaptiveColor('icon', '?android:attr/textColorSecondary'),
  border: adaptiveColor('border', '?android:attr/textColorTertiary'),
  borderStrong: adaptiveColor('borderStrong', '?android:attr/textColorSecondary'),
  input: adaptiveColor('input', '?android:attr/colorBackgroundFloating'),
  pressed: adaptiveColor('pressed', '?android:attr/colorControlHighlight'),
  accent: adaptiveColor('accent', '?android:attr/colorAccent'),
  accentSoft: adaptiveColor('accentSoft', '?android:attr/colorControlHighlight'),
  danger: adaptiveColor('danger'),
  dangerSoft: adaptiveColor('dangerSoft'),
  overlay: adaptiveColor('overlay'),
} as const;

/**
 * eventTypeId(1~7) 배지 색상 — hangsha-web `src/util/constants/index.ts`의
 * CATEGORY_COLORS(rgba, 60% 알파)/CATEGORY_TEXT_COLORS 값을 그대로 이식.
 * 다크모드는 채도를 유지하되 투명도를 낮추고 텍스트 명도를 높여 어두운
 * 바탕에서도 카테고리 구분과 가독성이 함께 유지되도록 조정한다.
 */
export const EventTypeColors = {
  light: {
    1: { background: 'rgba(255, 140, 40, 0.6)', text: '#cc874c' },
    2: { background: 'rgba(186, 158, 49, 0.6)', text: '#ad9227' },
    3: { background: 'rgba(11, 206, 131, 0.6)', text: '#36a47a' },
    4: { background: 'rgba(0, 193, 232, 0.6)', text: '#3498c0' },
    5: { background: 'rgba(0, 136, 255, 0.6)', text: '#3d73c4' },
    6: { background: 'rgba(162, 90, 255, 0.6)', text: '#824acd' },
    7: { background: 'rgba(255, 45, 83, 0.6)', text: '#c84059' },
  },
  dark: {
    1: { background: 'rgba(255, 140, 40, 0.34)', text: '#FFB879' },
    2: { background: 'rgba(221, 187, 57, 0.34)', text: '#E5D17A' },
    3: { background: 'rgba(11, 206, 131, 0.30)', text: '#69DDB0' },
    4: { background: 'rgba(0, 193, 232, 0.30)', text: '#64D5ED' },
    5: { background: 'rgba(0, 136, 255, 0.30)', text: '#75B8FF' },
    6: { background: 'rgba(162, 90, 255, 0.30)', text: '#C39BFF' },
    7: { background: 'rgba(255, 45, 83, 0.30)', text: '#FF849A' },
  },
} as const;

export type EventTypeId = keyof typeof EventTypeColors.light;

export type EventColorScheme = keyof typeof EventTypeColors;

export const getEventTypeColors = (scheme: EventColorScheme, eventTypeId: number) =>
  EventTypeColors[scheme][eventTypeId as EventTypeId] ?? EventTypeColors[scheme][7];

/**
 * eventTypeId(1~7) 라벨 — hangsha-web `src/util/constants/index.ts`의
 * CATEGORY_LIST 그대로 이식.
 */
export const EventTypeLabels: Record<EventTypeId, string> = {
  1: '교육(특강/세미나)',
  2: '공모전/경진대회',
  3: '현장학습/인턴',
  4: '사회공헌(봉사)',
  5: '학습/진로상담',
  6: 'OpenLnL',
  7: '기타',
};

export const getEventTypeLabel = (eventTypeId: number) =>
  EventTypeLabels[eventTypeId as EventTypeId] ?? EventTypeLabels[7];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
