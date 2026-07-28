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
  username: string;
}

export interface ProfileImage {
  uri: string;
  name: string;
  type: string;
}
