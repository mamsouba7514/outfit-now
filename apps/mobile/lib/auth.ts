import type { AuthTokens, LoginRequest, SignupRequest, UpdateProfileRequest, OnboardingRequest, UserProfile } from '@outfit-now/shared-types';

import { apiRequest, setTokens, clearTokens } from './api';

export async function signup(data: SignupRequest): Promise<UserProfile> {
  const res = await apiRequest<{ user: UserProfile } & AuthTokens>('/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function login(data: LoginRequest): Promise<UserProfile> {
  const res = await apiRequest<{ user: UserProfile } & AuthTokens>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await setTokens(res.accessToken, res.refreshToken);
  return res.user;
}

export async function logout(): Promise<void> {
  await apiRequest('/v1/auth/logout', { method: 'POST' }).catch(() => {});
  await clearTokens();
}

export async function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/v1/me');
}

export async function updateMe(data: UpdateProfileRequest): Promise<UserProfile> {
  return apiRequest<UserProfile>('/v1/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function completeOnboarding(data: OnboardingRequest): Promise<void> {
  await apiRequest('/v1/me/onboarding', { method: 'POST', body: JSON.stringify(data) });
}

export async function requestExport(): Promise<void> {
  await apiRequest('/v1/me/export', { method: 'POST' });
}

export async function deleteAccount(): Promise<void> {
  await apiRequest('/v1/me', { method: 'DELETE' });
  await clearTokens();
}
