export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  firstName?: string;
  lastName?: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}
