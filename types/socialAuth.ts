export const SOCIAL_LOGIN_PROVIDERS = ["GOOGLE"] as const;

export type SocialLoginProvider = (typeof SOCIAL_LOGIN_PROVIDERS)[number];

export interface SocialProviderTokenResult {
  accessToken: string;
  provider: SocialLoginProvider;
}

export type SocialLoginRequest = SocialProviderTokenResult;

export interface SocialLoginPayload {
  provider: SocialLoginProvider;
  code: null;
  accessToken: string;
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
  | "missing_provider_access_token";

export class SocialLoginError extends Error {
  constructor(
    public readonly code: SocialLoginErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SocialLoginError";
  }
}
