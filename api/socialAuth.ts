import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import type { SocialAuthorizationResult, SocialLoginProvider } from '@/types/socialAuth';
import { SocialLoginError } from '@/types/socialAuth';

const SOCIAL_CALLBACK_PATH = 'auth/callback';

const PROVIDER_CONFIG: Record<
  SocialLoginProvider,
  {
    authorizationEndpoint: string;
    clientId: string;
    scopes: string[];
    usePKCE: boolean;
  }
> = {
  google: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId:
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
      '338676411668-3rho235eeat1en7c1cusmbflqp5eodm9.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    usePKCE: true,
  },
  kakao: {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    clientId:
      process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim() ||
      '8a40875057f11d81ea813a53d42d560e',
    scopes: ['profile_nickname', 'account_email'],
    usePKCE: false,
  },
  naver: {
    authorizationEndpoint: 'https://nid.naver.com/oauth2.0/authorize',
    clientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID?.trim() || 'joaHM0X9FbPe_liUVCpS',
    scopes: ['name', 'email'],
    usePKCE: false,
  },
};

WebBrowser.maybeCompleteAuthSession();

export function getSocialRedirectUrl() {
  return (
    process.env.EXPO_PUBLIC_SOCIAL_REDIRECT_URL?.trim() ||
    AuthSession.makeRedirectUri({
      scheme: 'hangsha',
      path: SOCIAL_CALLBACK_PATH,
    })
  );
}

export async function requestSocialAuthorization(
  provider: SocialLoginProvider,
): Promise<SocialAuthorizationResult> {
  const config = PROVIDER_CONFIG[provider];
  const request = new AuthSession.AuthRequest({
    clientId: config.clientId,
    redirectUri: getSocialRedirectUrl(),
    responseType: AuthSession.ResponseType.Code,
    scopes: config.scopes,
    usePKCE: config.usePKCE,
    prompt: provider === 'google' ? AuthSession.Prompt.SelectAccount : undefined,
  });

  const result = await request.promptAsync(
    { authorizationEndpoint: config.authorizationEndpoint },
    {
      preferEphemeralSession: false,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    },
  );

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new SocialLoginError('cancelled', '소셜 로그인이 취소되었습니다.');
  }

  if (result.type !== 'success') {
    throw new SocialLoginError(
      'provider_error',
      result.type === 'error'
        ? result.error?.description || result.params.error_description || result.params.error
        : '소셜 로그인 공급자에게서 오류 응답을 받았습니다.',
    );
  }

  const code = result.params.code?.trim();
  if (!code) {
    throw new SocialLoginError(
      'missing_authorization_code',
      '로그인 응답에 authorization code가 없습니다.',
    );
  }

  return {
    provider,
    code,
    codeVerifier: request.codeVerifier ?? null,
  };
}
