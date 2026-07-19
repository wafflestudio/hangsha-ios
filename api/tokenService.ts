import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthTokens } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'hangsha.accessToken';
const REFRESH_TOKEN_KEY = 'hangsha.refreshToken';
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrate() {
  if (isHydrated) return;

  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      // SecureStore has no web implementation. Keep web credentials in memory only.
      if (Platform.OS !== 'web') {
        [accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY, SECURE_STORE_OPTIONS),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS),
        ]);
      }
      isHydrated = true;
    })().finally(() => {
      hydrationPromise = null;
    });
  }

  await hydrationPromise;
}

async function persist(key: string, value: string) {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
}

async function remove(key: string) {
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
}

export const TokenService = {
  async getAccessToken() {
    await hydrate();
    return accessToken;
  },

  async getRefreshToken() {
    await hydrate();
    return refreshToken;
  },

  async setTokens(tokens: AuthTokens) {
    const nextAccessToken = tokens.accessToken.trim();
    const nextRefreshToken = tokens.refreshToken.trim();

    if (!nextAccessToken || !nextRefreshToken) {
      throw new Error('The server returned an empty authentication token.');
    }

    try {
      await Promise.all([
        persist(ACCESS_TOKEN_KEY, nextAccessToken),
        persist(REFRESH_TOKEN_KEY, nextRefreshToken),
      ]);
    } catch (error) {
      accessToken = null;
      refreshToken = null;
      isHydrated = true;
      await Promise.allSettled([remove(ACCESS_TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
      throw error;
    }

    accessToken = nextAccessToken;
    refreshToken = nextRefreshToken;
    isHydrated = true;
  },

  async setAccessToken(token: string) {
    const nextAccessToken = token.trim();
    if (!nextAccessToken) throw new Error('The access token is empty.');

    await Promise.all([
      persist(ACCESS_TOKEN_KEY, nextAccessToken),
      remove(REFRESH_TOKEN_KEY),
    ]);
    accessToken = nextAccessToken;
    refreshToken = null;
    isHydrated = true;
  },

  async clearTokens() {
    accessToken = null;
    refreshToken = null;
    isHydrated = true;

    await Promise.allSettled([remove(ACCESS_TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
  },
};
