/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * eventTypeId(1~7) 배지 색상 — hangsha-web `src/util/constants/index.ts`의
 * CATEGORY_COLORS(rgba, 60% 알파)/CATEGORY_TEXT_COLORS 값을 그대로 이식.
 * 다크모드는 원본에 없어 동일한 배경/텍스트 조합을 그대로 사용(추후 디자인
 * 확정 시 교체).
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
    1: { background: 'rgba(255, 140, 40, 0.6)', text: '#cc874c' },
    2: { background: 'rgba(186, 158, 49, 0.6)', text: '#ad9227' },
    3: { background: 'rgba(11, 206, 131, 0.6)', text: '#36a47a' },
    4: { background: 'rgba(0, 193, 232, 0.6)', text: '#3498c0' },
    5: { background: 'rgba(0, 136, 255, 0.6)', text: '#3d73c4' },
    6: { background: 'rgba(162, 90, 255, 0.6)', text: '#824acd' },
    7: { background: 'rgba(255, 45, 83, 0.6)', text: '#c84059' },
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
