import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/util/theme';

type FilterButtonProps = {
  accessibilityLabel?: string;
  onPress: () => void;
};

export function FilterButton({
  accessibilityLabel = '필터',
  onPress,
}: FilterButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
      hitSlop={Spacing.two}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Image
        source={require('@/assets/images/filter.svg')}
        style={styles.icon}
        contentFit="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: { width: 19, height: 19 },
  pressed: { opacity: 0.55 },
});
