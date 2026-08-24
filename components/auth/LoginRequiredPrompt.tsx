import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdaptiveColors } from '@/util/theme';

type LoginRequiredPromptProps = {
  description: string;
  onLoginPress: () => void;
};

/** Login-gated screens share the same dialog treatment as the bug-report popup. */
export function LoginRequiredPrompt({ description, onLoginPress }: LoginRequiredPromptProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>로그인이 필요해요</Text>
          </View>
          <Text
            lineBreakStrategyIOS="hangul-word"
            textBreakStrategy="simple"
            style={styles.description}>
            {description}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="로그인 또는 회원가입"
            onPress={onLoginPress}
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
            <Text style={styles.loginButtonText}>로그인 · 회원가입</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AdaptiveColors.overlay },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    borderRadius: 24,
    backgroundColor: AdaptiveColors.surfaceElevated,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: { alignItems: 'center' },
  title: { color: AdaptiveColors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  description: {
    marginTop: 10,
    color: AdaptiveColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  loginButton: {
    alignSelf: 'center',
    minWidth: 148,
    minHeight: 48,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#4C4C4C',
    paddingHorizontal: 20,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
