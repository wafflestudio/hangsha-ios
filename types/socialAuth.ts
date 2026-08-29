export const SOCIAL_LOGIN_PROVIDERS = ["APPLE", "GOOGLE", "KAKAO", "NAVER"] as const;

export type SocialLoginProvider = (typeof SOCIAL_LOGIN_PROVIDERS)[number];

export interface SocialProviderTokenResult {
  provider: SocialLoginProvider;
  accessToken?: string;
  identityToken?: string;
  authorizationCode?: string | null;
  userIdentifier?: string;
  email?: string | null;
  name?: string | null;
}

export type SocialLoginRequest = SocialProviderTokenResult;

export interface SocialLoginPayload {
  provider: SocialLoginProvider;
  code: string | null;
  accessToken: string | null;
  identityToken: string | null;
  userIdentifier: string | null;
  email: string | null;
  name: string | null;
  codeVerifier: null;
  client_type: "MOB";
}

export interface SocialLoginResponse {
  accessToken: string;
  isNewUser: boolean;
}

export type SocialLoginErrorCode =
  | "cancelled"
  | "configuration_error"
  | "provider_error"
  | "missing_provider_access_token"
  | "invalid_credential";

export class SocialLoginError extends Error {
  constructor(
    public readonly code: SocialLoginErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SocialLoginError";
  }
}
