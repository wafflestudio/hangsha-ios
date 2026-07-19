import apiClient from '@/api/client';
import { TokenService } from '@/api/tokenService';
import type {
  AuthTokens,
  LoginInput,
  ProfileImage,
  SignupInput,
  User,
} from '@/types/auth';
import type { SocialLoginRequest, SocialLoginResponse } from '@/types/socialAuth';

export async function getUser() {
  const response = await apiClient.get<User>('users/me');
  return response.data;
}

export async function login(input: LoginInput) {
  const response = await apiClient.post<AuthTokens>('mobile/auth/login', input);
  await TokenService.setTokens(response.data);
  return response.data;
}

export async function signup(input: SignupInput) {
  const response = await apiClient.post<AuthTokens>('mobile/auth/register', input);
  await TokenService.setTokens(response.data);
  return response.data;
}

export async function loginWithSocial(input: SocialLoginRequest) {
  const response = await apiClient.post<SocialLoginResponse>('auth/login/social', {
    provider: input.provider.toUpperCase(),
    code: input.code,
    codeVerifier: input.codeVerifier,
  });
  return response.data;
}

export async function refresh() {
  const refreshToken = await TokenService.getRefreshToken();
  if (!refreshToken) return null;

  const response = await apiClient.post<AuthTokens>('mobile/auth/refresh', { refreshToken });
  await TokenService.setTokens(response.data);
  return response.data;
}

export async function establishSession() {
  const response = await apiClient.post<AuthTokens>('mobile/auth/session');
  await TokenService.setTokens(response.data);
  return response.data;
}

export async function logout() {
  const refreshToken = await TokenService.getRefreshToken();

  try {
    if (refreshToken) {
      await apiClient.post('mobile/auth/logout', { refreshToken });
    }
  } finally {
    await TokenService.clearTokens();
  }
}

export async function deleteAccount() {
  await apiClient.delete('users/me');
  await TokenService.clearTokens();
}

export async function updateUsername(username: string) {
  await apiClient.patch('users/me', { username });
  return getUser();
}

export async function clearProfileImage() {
  await apiClient.patch('users/me', { profileImageUrl: null });
  return getUser();
}

export async function uploadProfileImage(image: ProfileImage) {
  const formData = new FormData();
  formData.append('file', image as unknown as Blob);

  await apiClient.post('users/me/profile-image', formData);
  return getUser();
}

export async function updateUser(username: string, image: ProfileImage | null) {
  await apiClient.patch('users/me', { username });
  if (image) {
    const formData = new FormData();
    formData.append('file', image as unknown as Blob);
    await apiClient.post('users/me/profile-image', formData);
  }
  return getUser();
}

export async function healthCheck() {
  const response = await apiClient.get('health');
  return response.data;
}
