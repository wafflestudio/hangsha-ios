import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DECORATIONS = [
  { glyph: '✦', top: '20%', left: '54%', size: 30 },
  { glyph: '★', top: '26%', left: '20%', size: 45 },
  { glyph: '✦', top: '29%', right: '12%', size: 24 },
  { glyph: '☆', top: '34%', right: '18%', size: 45 },
  { glyph: '☆', top: '40%', left: '22%', size: 33 },
  { glyph: '☆', top: '44%', left: '2%', size: 42 },
  { glyph: '☆', top: '45%', right: '5%', size: 76 },
  { glyph: '✦', top: '51%', left: '27%', size: 24 },
  { glyph: '★', top: '53%', left: '43%', size: 42 },
  { glyph: '✦', top: '62%', left: '13%', size: 27 },
  { glyph: '✦', top: '64%', right: '20%', size: 29 },
] as const;

export default function CompleteSignupScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#A3EAF6', '#D7F5FA', '#FFFFFF']}
      locations={[0, 0.42, 0.88]}
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.decorations} pointerEvents="none" accessibilityElementsHidden>
          {DECORATIONS.map(({ glyph, size, ...position }, index) => (
            <Text
              key={`${glyph}-${index}`}
              style={[styles.decoration, position, { fontSize: size, lineHeight: size + 4 }]}>
              {glyph}
            </Text>
          ))}
        </View>

        <View style={styles.container}>
          <Text style={styles.title}>환영합니다!</Text>
          <View style={styles.actions}>
            <NavigationButton label="마이페이지" onPress={() => router.replace('/mypage')} />
            <NavigationButton label="캘린더로 가기" onPress={() => router.replace('/calendar')} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function NavigationButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  decorations: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  decoration: { position: 'absolute', color: '#FFFFFF', textAlign: 'center' },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 282,
    paddingHorizontal: 28,
  },
  title: {
    color: '#000000',
    fontSize: 36,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.4,
    textAlign: 'center',
  },
  actions: { alignItems: 'center', marginTop: 48, gap: 8 },
  button: {
    minWidth: 150,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 19,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 4,
  },
  buttonText: {
    color: '#6E6E6E',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  pressed: { opacity: 0.76 },
});
