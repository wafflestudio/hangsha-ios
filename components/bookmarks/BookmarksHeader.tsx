import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BookmarksHeaderProps = {
  variant: 'widget' | 'page';
  onAction: () => void;
};

export function BookmarksHeader({ variant, onAction }: BookmarksHeaderProps) {
  const isPage = variant === 'page';

  return (
    <View style={[styles.container, isPage ? styles.pageContainer : styles.widgetContainer]}>
      {isPage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 화면"
          hitSlop={12}
          onPress={onAction}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
      )}

      <View style={[styles.titleRow, isPage && styles.pageTitleRow]}>
        <Text style={[styles.title, isPage && styles.pageTitle]}>내 찜 목록</Text>
        <Image
          source={require('@/assets/images/Bookmarked.svg')}
          style={styles.icon}
          contentFit="contain"
        />
      </View>

      {!isPage && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="내 찜 목록 전체 보기"
          hitSlop={12}
          onPress={onAction}
          style={({ pressed }) => [styles.forwardButton, pressed && styles.pressed]}>
          <Text style={styles.forwardChevron}>›</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  widgetContainer: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  pageContainer: {
    width: '80%',
    height: 62,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitleRow: { justifyContent: 'center', gap: 14 },
  title: { color: '#111111', fontSize: 20, lineHeight: 25, fontWeight: '700' },
  pageTitle: { fontSize: 17, lineHeight: 23 },
  icon: { width: 20, height: 20 },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    width: 36,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  forwardButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backChevron: { color: '#ABABAB', fontSize: 39, lineHeight: 39, fontWeight: '300' },
  forwardChevron: { color: '#ABABAB', fontSize: 36, lineHeight: 36, fontWeight: '300' },
  pressed: { opacity: 0.55 },
});
