export const SOCIAL_LOGIN_PROVIDERS = ['google', 'kakao', 'naver'] as const;

export type SocialLoginProvider = (typeof SOCIAL_LOGIN_PROVIDERS)[number];

export interface SocialAuthorizationResult {
  code: string;
  codeVerifier: string | null;
  provider: SocialLoginProvider;
}

export type SocialLoginRequest = SocialAuthorizationResult;

export interface SocialLoginResponse {
  accessToken: string;
  isNewUser: boolean;
}

export type SocialLoginErrorCode =
  | 'cancelled'
  | 'provider_error'
  | 'missing_authorization_code';

export class SocialLoginError extends Error {
  constructor(
    public readonly code: SocialLoginErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SocialLoginError';
  }
}
