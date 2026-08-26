import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { login as loginWithKakao } from "@react-native-kakao/user";
import NaverLogin from "@react-native-seoul/naver-login";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import type {
  SocialLoginProvider,
  SocialProviderTokenResult,
} from "@/types/socialAuth";
import { SocialLoginError } from "@/types/socialAuth";

export async function requestSocialAccessToken(
  provider: SocialLoginProvider,
): Promise<SocialProviderTokenResult> {
  if (Platform.OS === "web") {
    throw new SocialLoginError(
      "configuration_error",
      "소셜 로그인은 iOS 또는 Android 개발 빌드에서만 사용할 수 있습니다.",
    );
  }

  try {
    const result = await PROVIDER_LOGIN[provider]();
    if (provider !== "APPLE" && !result.accessToken?.trim()) {
      throw new SocialLoginError(
        "missing_provider_access_token",
        `${provider} 로그인 응답에 access token이 없습니다.`,
      );
    }
    return result;
  } catch (error) {
    if (error instanceof SocialLoginError) throw error;
    if (isCancellationError(error)) {
      throw new SocialLoginError("cancelled", "소셜 로그인이 취소되었습니다.");
    }
    throw new SocialLoginError("provider_error", getErrorMessage(error));
  }
}

const PROVIDER_LOGIN: Record<
  SocialLoginProvider,
  () => Promise<SocialProviderTokenResult>
> = {
  APPLE: requestAppleCredential,
  GOOGLE: async () => ({ provider: "GOOGLE", accessToken: await requestGoogleAccessToken() }),
  KAKAO: async () => ({ provider: "KAKAO", accessToken: await requestKakaoAccessToken() }),
  NAVER: async () => ({ provider: "NAVER", accessToken: await requestNaverAccessToken() }),
};

async function requestAppleCredential(): Promise<SocialProviderTokenResult> {
  if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) {
    throw new SocialLoginError(
      "configuration_error",
      "Apple 로그인은 지원되는 iPhone 또는 iPad에서 사용할 수 있습니다.",
    );
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken?.trim() || !credential.user.trim()) {
    throw new SocialLoginError(
      "invalid_credential",
      "Apple 인증 정보가 올바르지 않습니다. 다시 시도해주세요.",
    );
  }

  const formattedName = credential.fullName
    ? AppleAuthentication.formatFullName(credential.fullName).trim()
    : "";

  return {
    provider: "APPLE",
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    userIdentifier: credential.user,
    email: credential.email,
    name: formattedName || null,
  };
}

async function requestGoogleAccessToken() {
  const iosClientId = requireConfig(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  );

  GoogleSignin.configure({
    iosClientId,
    scopes: ["openid", "profile", "email"],
  });

  try {
    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") {
      throw new SocialLoginError("cancelled", "구글 로그인이 취소되었습니다.");
    }

    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken.trim()) {
      throw new SocialLoginError(
        "missing_provider_access_token",
        "구글 로그인 응답에 access token이 없습니다.",
      );
    }

    return accessToken;
  } catch (error) {
    if (error instanceof SocialLoginError) throw error;
    if (isCancellationError(error)) {
      throw new SocialLoginError("cancelled", "구글 로그인이 취소되었습니다.");
    }

    throw new SocialLoginError("provider_error", getErrorMessage(error));
  }
}

async function requestKakaoAccessToken() {
  const nativeAppKey = requireConfig(
    process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
    "EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY",
  );

  await initializeKakaoSDK(nativeAppKey);
  const token = await loginWithKakao();
  return token.accessToken;
}

async function requestNaverAccessToken() {
  const consumerKey = requireConfig(
    process.env.EXPO_PUBLIC_NAVER_CLIENT_ID,
    "EXPO_PUBLIC_NAVER_CLIENT_ID",
  );
  const consumerSecret = requireConfig(
    process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET,
    "EXPO_PUBLIC_NAVER_CLIENT_SECRET",
  );
  const serviceUrlSchemeIOS = requireConfig(
    process.env.EXPO_PUBLIC_NAVER_URL_SCHEME,
    "EXPO_PUBLIC_NAVER_URL_SCHEME",
  );

  NaverLogin.initialize({
    appName: "행샤",
    consumerKey,
    consumerSecret,
    serviceUrlSchemeIOS,
  });

  const result = await NaverLogin.login();
  if (!result.isSuccess || !result.successResponse) {
    if (result.failureResponse?.isCancel) {
      throw new SocialLoginError("cancelled", "네이버 로그인이 취소되었습니다.");
    }
    throw new SocialLoginError(
      "provider_error",
      result.failureResponse?.message || "네이버 로그인에 실패했습니다.",
    );
  }
  return result.successResponse.accessToken;
}

function requireConfig(value: string | undefined, name: string) {
  const configuredValue = value?.trim();
  if (!configuredValue) {
    throw new SocialLoginError(
      "configuration_error",
      `${name}이 설정되지 않았습니다.`,
    );
  }
  return configuredValue;
}

function isCancellationError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const code =
    typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return code.includes("cancel") || message.includes("cancel");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "소셜 로그인 공급자에게서 오류 응답을 받았습니다.";
}
