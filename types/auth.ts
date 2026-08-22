export interface User {
  id?: number | string;
  username: string;
  email: string;
  profileImageUrl: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput extends LoginInput {
  signupToken: string;
}

export interface SendSignupEmailCodeInput {
  email: string;
}

export interface SendSignupEmailCodeResponse {
  expiresAt: string;
}

export interface VerifySignupEmailCodeInput extends SendSignupEmailCodeInput {
  code: string;
}

export interface VerifySignupEmailCodeResponse {
  signupToken: string;
  expiresAt: string;
}

export interface ProfileImage {
  uri: string;
  name: string;
  type: string;
}
