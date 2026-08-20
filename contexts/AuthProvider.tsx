import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import * as authApi from '@/api/auth';
import { setSessionExpiredHandler } from '@/api/client';
import { requestGoogleAccessToken } from '@/api/socialAuth';
import { TokenService } from '@/api/tokenService';
import { useAuthStore } from '@/stores/authStore';
import type {
  LoginInput,
  ProfileImage,
  SendSignupEmailCodeInput,
  SignupInput,
  User,
  VerifySignupEmailCodeInput,
} from '@/types/auth';
import type { SocialLoginProvider } from '@/types/socialAuth';

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

const userQueryOptions = {
  queryKey: authKeys.user(),
  queryFn: authApi.getUser,
  staleTime: 5 * 60_000,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initializationPromise = useRef<Promise<User | null> | null>(null);

  useEffect(() => {
    let isMounted = true;

    setSessionExpiredHandler(() => {
      queryClient.removeQueries({ queryKey: authKeys.all });
      useAuthStore.getState().reset();
    });

    if (!initializationPromise.current) {
      initializationPromise.current = (async () => {
        const [storedAccessToken, storedRefreshToken] = await Promise.all([
          TokenService.getAccessToken(),
          TokenService.getRefreshToken(),
        ]);

        if (!storedAccessToken && !storedRefreshToken) return null;
        if (storedRefreshToken) await authApi.refresh();
        return authApi.getUser();
      })().catch(async () => {
        await TokenService.clearTokens();
        return null;
      });
    }

    void initializationPromise.current.then((user) => {
      if (!isMounted) return;

      if (user) {
        queryClient.setQueryData(authKeys.user(), user);
        useAuthStore.getState().setAuthenticated(true);
      } else {
        queryClient.removeQueries({ queryKey: authKeys.all });
        useAuthStore.getState().reset();
      }

      useAuthStore.getState().finishInitialization();
    });

    return () => {
      isMounted = false;
      setSessionExpiredHandler(null);
    };
  }, [queryClient]);

  return children;
}

async function getUserAfterAuthentication() {
  try {
    return await authApi.getUser();
  } catch (error) {
    await TokenService.clearTokens();
    throw error;
  }
}

async function completeSocialAuthentication(accessToken: string) {
  try {
    await authApi.establishSession(accessToken);
    return authApi.getUser();
  } catch (error) {
    await TokenService.clearTokens();
    throw error;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const resetAuth = useAuthStore((state) => state.reset);

  const userQuery = useQuery({
    ...userQueryOptions,
    enabled: isInitialized && isAuthenticated,
  });

  function commitAuthenticatedUser(user: User) {
    queryClient.setQueryData(authKeys.user(), user);
    setAuthenticated(true);
  }

  async function clearLocalSession() {
    await TokenService.clearTokens();
    queryClient.removeQueries({ queryKey: authKeys.all });
    resetAuth();
  }

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      await authApi.login(input);
      return getUserAfterAuthentication();
    },
    onSuccess: commitAuthenticatedUser,
    onError: clearLocalSession,
  });

  const signupMutation = useMutation({
    mutationFn: async (input: SignupInput) => {
      await authApi.signup(input);
      return getUserAfterAuthentication();
    },
    onSuccess: commitAuthenticatedUser,
    onError: clearLocalSession,
  });

  const sendSignupEmailCodeMutation = useMutation({
    mutationFn: (input: SendSignupEmailCodeInput) => authApi.sendSignupEmailCode(input),
  });

  const verifySignupEmailCodeMutation = useMutation({
    mutationFn: (input: VerifySignupEmailCodeInput) => authApi.verifySignupEmailCode(input),
  });

  const completeSocialLoginMutation = useMutation({
    mutationFn: completeSocialAuthentication,
    onSuccess: commitAuthenticatedUser,
    onError: clearLocalSession,
  });

  const socialLoginMutation = useMutation({
    mutationFn: async (provider: SocialLoginProvider) => {
      const providerToken = await requestGoogleAccessToken(provider);
      const { accessToken } = await authApi.loginWithSocial(providerToken);
      return completeSocialAuthentication(accessToken);
    },
    onSuccess: commitAuthenticatedUser,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.warn('The server logout request failed; the local session was cleared.', error);
      }
    },
    onSuccess: clearLocalSession,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: clearLocalSession,
  });

  const updateUsernameMutation = useMutation({
    mutationFn: authApi.updateUsername,
    onSuccess: commitAuthenticatedUser,
  });

  const clearProfileImageMutation = useMutation({
    mutationFn: authApi.clearProfileImage,
    onSuccess: commitAuthenticatedUser,
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: authApi.uploadProfileImage,
    onSuccess: commitAuthenticatedUser,
  });

  return {
    user: isAuthenticated ? (userQuery.data ?? null) : null,
    isAuthenticated,
    isLoading: !isInitialized || (isAuthenticated && userQuery.isPending),
    userQuery,
    loginMutation,
    signupMutation,
    sendSignupEmailCodeMutation,
    verifySignupEmailCodeMutation,
    socialLoginMutation,
    completeSocialLoginMutation,
    logoutMutation,
    deleteAccountMutation,
    updateUsernameMutation,
    clearProfileImageMutation,
    uploadProfileImageMutation,

    login: (email: string, password: string) => loginMutation.mutateAsync({ email, password }),
    signup: (email: string, password: string, signupToken: string) =>
      signupMutation.mutateAsync({ email, password, signupToken }),
    sendSignupEmailCode: (email: string) =>
      sendSignupEmailCodeMutation.mutateAsync({ email }),
    verifySignupEmailCode: (email: string, code: string) =>
      verifySignupEmailCodeMutation.mutateAsync({ email, code }),
    loginWithSocial: (provider: SocialLoginProvider) => socialLoginMutation.mutateAsync(provider),
    completeSocialLogin: (accessToken: string) =>
      completeSocialLoginMutation.mutateAsync(accessToken),
    logout: () => logoutMutation.mutateAsync(),
    deleteAccount: () => deleteAccountMutation.mutateAsync(),
    updateUsername: (username: string) => updateUsernameMutation.mutateAsync(username),
    clearProfileImg: () => clearProfileImageMutation.mutateAsync(),
    setProfileImg: (image: ProfileImage) => uploadProfileImageMutation.mutateAsync(image),
  };
}
