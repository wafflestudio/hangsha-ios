import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AuthTokens } from "@/types/auth";

const ACCESS_TOKEN_KEY = "hangsha.accessToken";
const REFRESH_TOKEN_KEY = "hangsha.refreshToken";
const APPLE_USER_IDENTIFIER_KEY = "hangsha.appleUserIdentifier";
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let appleUserIdentifier: string | null = null;
let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

// SecureStore -> memory
async function hydrate() {
  if (isHydrated) return;

  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      // SecureStore has no web implementation (cautionary guard just in case)
      if (Platform.OS !== "web") {
        [accessToken, refreshToken, appleUserIdentifier] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY, SECURE_STORE_OPTIONS),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS),
          SecureStore.getItemAsync(APPLE_USER_IDENTIFIER_KEY, SECURE_STORE_OPTIONS),
        ]);
      }
      isHydrated = true;
    })().finally(() => {
      hydrationPromise = null;
    });
  }

  await hydrationPromise;
}

// save token to SecureStore
async function persist(key: string, value: string) {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
}

// delete token from SecureStore
async function remove(key: string) {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
}

export const TokenService = {
  async getAccessToken() {
    await hydrate(); // first : read from SecureStore
    return accessToken; // after : read from memory (hydration complete)
  },

  async getRefreshToken() {
    await hydrate(); // same as above
    return refreshToken;
  },

  async getAppleUserIdentifier() {
    await hydrate();
    return appleUserIdentifier;
  },

  async setAppleUserIdentifier(userIdentifier: string) {
    const normalizedIdentifier = userIdentifier.trim();
    if (!normalizedIdentifier) {
      throw new Error("The Apple user identifier is empty.");
    }
    await persist(APPLE_USER_IDENTIFIER_KEY, normalizedIdentifier);
    appleUserIdentifier = normalizedIdentifier;
  },

  // save access / refresh tokens after login or token refresh
  async setTokens(tokens: AuthTokens) {
    const nextAccessToken = tokens.accessToken.trim();
    const nextRefreshToken = tokens.refreshToken.trim();

    if (!nextAccessToken || !nextRefreshToken) {
      throw new Error("The server returned an empty authentication token.");
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
      await Promise.allSettled([
        remove(ACCESS_TOKEN_KEY),
        remove(REFRESH_TOKEN_KEY),
      ]);
      throw error;
    }

    accessToken = nextAccessToken;
    refreshToken = nextRefreshToken;
    isHydrated = true;
  },

  async clearTokens() {
    accessToken = null;
    refreshToken = null;
    appleUserIdentifier = null;
    isHydrated = true;

    await Promise.allSettled([
      remove(ACCESS_TOKEN_KEY),
      remove(REFRESH_TOKEN_KEY),
      remove(APPLE_USER_IDENTIFIER_KEY),
    ]);
  },
};
