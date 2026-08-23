import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdaptiveColors } from '@/util/theme';

const NAV_ITEMS = [
  {
    id: 'calendar',
    label: '캘린더',
    href: '/calendar' as const,
    inactiveIcon: require('@/assets/images/bottom_calendar.svg'),
    activeIcon: require('@/assets/images/bottom_calendar_active.svg'),
    width: 30,
    height: 30,
  },
  {
    id: 'timetable',
    label: '시간표',
    href: '/timetable' as const,
    inactiveIcon: require('@/assets/images/bottom_timetable.svg'),
    activeIcon: require('@/assets/images/bottom_timetable_active.svg'),
    width: 30,
    height: 30,
  },
  {
    id: 'memos',
    label: '메모',
    href: '/memos' as const,
    inactiveIcon: require('@/assets/images/bottom_reviews.svg'),
    activeIcon: require('@/assets/images/bottom_reviews_active.svg'),
    width: 30,
    height: 30,
  },
  {
    id: 'profile',
    label: '프로필',
    href: '/mypage' as const,
    inactiveIcon: require('@/assets/images/bottom_profile.svg'),
    activeIcon: require('@/assets/images/bottom_profile_active.svg'),
    width: 30,
    height: 30,
  },
] as const;

export type BottomNavigationTab = (typeof NAV_ITEMS)[number]['id'];

type MobileBottomNavigationProps = {
  activeTab: BottomNavigationTab;
  onTabPress?: (tab: BottomNavigationTab) => void;
};

export function MobileBottomNavigation({
  activeTab,
  onTabPress,
}: MobileBottomNavigationProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.navigationBar} accessibilityRole="tablist">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          const isEnabled = item.href !== null || onTabPress !== undefined;

          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && isEnabled && styles.tabButtonPressed,
              ]}
              onPress={() => {
                if (onTabPress) {
                  onTabPress(item.id);
                  return;
                }

                if (item.href) {
                  router.replace(item.href);
                }
              }}
              disabled={!isEnabled}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive, disabled: !isEnabled }}>
              <Image
                source={isActive ? item.activeIcon : item.inactiveIcon}
                style={[
                  { width: item.width, height: item.height },
                  colorScheme === 'dark' && !isActive && { tintColor: AdaptiveColors.icon },
                ]}
                contentFit="contain"
              />
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: AdaptiveColors.surface,
  },
  navigationBar: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AdaptiveColors.surface,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonPressed: {
    opacity: 0.6,
  },
});
