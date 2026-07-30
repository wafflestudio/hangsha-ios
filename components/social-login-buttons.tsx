import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthProvider';
import type { SocialLoginProvider } from '@/types/socialAuth';
import { SocialLoginError } from '@/types/socialAuth';
import { Spacing } from '@/util/theme';

const PROVIDERS: readonly {
  provider: SocialLoginProvider;
  label: string;
  backgroundColor: string;
  color: string;
}[] = [
  {
    provider: 'google',
    label: '구글 계정으로 계속하기',
    backgroundColor: '#FFFFFF',
    color: '#1F1F1F',
  },
  {
    provider: 'kakao',
    label: '카카오톡 계정으로 계속하기',
    backgroundColor: '#FEE500',
    color: '#191919',
  },
  {
    provider: 'naver',
    label: '네이버 계정으로 계속하기',
    backgroundColor: '#03C75A',
    color: '#FFFFFF',
  },
];

export function SocialLoginButtons() {
  const { user, isAuthenticated, isLoading, socialLoginMutation, loginWithSocial } = useAuth();

  if (isLoading) {
    return <ActivityIndicator accessibilityLabel="로그인 상태 확인 중" size="small" />;
  }

  if (isAuthenticated) {
    return (
      <View style={styles.statusContainer}>
        <ThemedText type="smallBold">{user?.username ?? '사용자'}님으로 로그인됨</ThemedText>
      </View>
    );
  }

  const errorMessage = getErrorMessage(socialLoginMutation.error);

  return (
    <View style={styles.container}>
      {PROVIDERS.map(({ provider, label, backgroundColor, color }) => {
        const isCurrentProvider =
          socialLoginMutation.isPending && socialLoginMutation.variables === provider;

        return (
          <Pressable
            accessibilityRole="button"
            disabled={socialLoginMutation.isPending}
            key={provider}
            onPress={() => {
              void loginWithSocial(provider).catch(() => undefined);
            }}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor },
              (pressed || (socialLoginMutation.isPending && !isCurrentProvider)) && styles.dimmed,
            ]}>
            {isCurrentProvider && <ActivityIndicator color={color} size="small" />}
            <ThemedText style={[styles.buttonLabel, { color }]}>{label}</ThemedText>
          </Pressable>
        );
      })}

      {errorMessage && (
        <ThemedText accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </ThemedText>
      )}
    </View>
  );
}

function getErrorMessage(error: Error | null) {
  if (!error) return null;
  if (error instanceof SocialLoginError && error.code === 'cancelled') return null;
  if (error instanceof SocialLoginError && error.code === 'configuration_error') {
    return '소셜 로그인 설정을 확인해 주세요.';
  }
  return '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  button: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buttonLabel: {
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.6,
  },
  error: {
    color: '#D92D20',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    padding: Spacing.three,
  },
});
