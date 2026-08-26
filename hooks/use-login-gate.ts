import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import {
  type AuthIntentAction,
  useAuthIntentStore,
} from '@/stores/authIntentStore';

export function useLoginGate(explicitReturnTo?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const begin = useAuthIntentStore((state) => state.begin);

  const openLogin = useCallback(
    (pendingAction?: AuthIntentAction) => {
      begin(explicitReturnTo ?? pathname, pendingAction);
      router.push('/login');
    },
    [begin, explicitReturnTo, pathname, router],
  );

  const requestLogin = useCallback(
    (description: string, pendingAction?: AuthIntentAction) => {
      Alert.alert('로그인이 필요해요', description, [
        { text: '취소', style: 'cancel' },
        { text: '로그인 · 회원가입', onPress: () => openLogin(pendingAction) },
      ]);
    },
    [openLogin],
  );

  return { openLogin, requestLogin };
}

export function useAuthNavigation() {
  const router = useRouter();

  const finishAuthentication = useCallback(
    (isNewUser: boolean) => {
      if (isNewUser) {
        router.replace('/onboarding/profile');
        return;
      }

      const returnTo = useAuthIntentStore.getState().consumeReturnTo();
      router.replace((returnTo ?? '/calendar') as Href);
    },
    [router],
  );

  const continueAsGuest = useCallback(() => {
    useAuthIntentStore.getState().clear();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/calendar');
    }
  }, [router]);

  return { finishAuthentication, continueAsGuest };
}
