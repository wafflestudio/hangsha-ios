import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    href: null,
    inactiveIcon: require('@/assets/images/timetable.svg'),
    activeIcon: require('@/assets/images/timetableActive.png'),
    width: 30,
    height: 30,
  },
  {
    id: 'reviews',
    label: '후기',
    href: null,
    inactiveIcon: require('@/assets/images/bottom_reviews.svg'),
    activeIcon: require('@/assets/images/bottom_reviews_active.svg'),
    width: 30,
    height: 30,
  },
  {
    id: 'profile',
    label: '프로필',
    href: null,
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
                style={{ width: item.width, height: item.height }}
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
    backgroundColor: '#F5F5F5',
  },
  navigationBar: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
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
