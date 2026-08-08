import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

import type {
  SocialLoginProvider,
  SocialProviderTokenResult,
} from "@/types/socialAuth";
import { SocialLoginError } from "@/types/socialAuth";

export async function requestGoogleAccessToken(
  provider: SocialLoginProvider,
): Promise<SocialProviderTokenResult> {
  if (Platform.OS === "web") {
    throw new SocialLoginError(
      "configuration_error",
      "구글 로그인은 iOS 또는 Android 개발 빌드에서만 사용할 수 있습니다.",
    );
  }

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

    return { provider, accessToken };
  } catch (error) {
    if (error instanceof SocialLoginError) throw error;
    if (isCancellationError(error)) {
      throw new SocialLoginError("cancelled", "구글 로그인이 취소되었습니다.");
    }

    throw new SocialLoginError("provider_error", getErrorMessage(error));
  }
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
  return "구글 로그인 공급자에게서 오류 응답을 받았습니다.";
}
