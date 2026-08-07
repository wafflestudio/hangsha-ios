import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL } from '@/api/config';
import { TokenService } from '@/api/tokenService';
import type { AuthTokens } from '@/types/auth';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type SessionExpiredHandler = () => void | Promise<void>;

const AUTH_WITHOUT_ACCESS_TOKEN = [
  'mobile/auth/login',
  'mobile/auth/register',
  'mobile/auth/refresh',
  'auth/login/social',
];
const AUTH_WITHOUT_REFRESH_RECOVERY = [...AUTH_WITHOUT_ACCESS_TOKEN, 'mobile/auth/session'];

let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

const refreshClient = axios.create({ baseURL: API_BASE_URL });

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  paramsSerializer: { indexes: null },
});

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  sessionExpiredHandler = handler;
}

function includesEndpoint(url: string | undefined, endpoints: string[]) {
  if (!url) return false;

  const normalizedUrl = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');

  return endpoints.some((endpoint) => {
    const normalizedEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    return (
      normalizedUrl === normalizedEndpoint ||
      normalizedUrl.endsWith(`/${normalizedEndpoint}`)
    );
  });
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const storedRefreshToken = await TokenService.getRefreshToken();
      if (!storedRefreshToken) throw new Error('A refresh token is not available.');

      const response = await refreshClient.post<AuthTokens>('mobile/auth/refresh', {
        refreshToken: storedRefreshToken,
      });
      await TokenService.setTokens(response.data);
      return response.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function expireSession() {
  await TokenService.clearTokens();
  await sessionExpiredHandler?.();
}

apiClient.interceptors.request.use(async (config) => {
  if (includesEndpoint(config.url, AUTH_WITHOUT_ACCESS_TOKEN)) {
    delete config.headers.Authorization;
    return config;
  }

  if (config.headers.has('Authorization')) {
    return config;
  }

  const token = await TokenService.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      includesEndpoint(originalRequest.url, AUTH_WITHOUT_REFRESH_RECOVERY)
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      await expireSession();
      throw refreshError;
    }
  },
);

export default apiClient;
