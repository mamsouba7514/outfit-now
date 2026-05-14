import type { Gender, Tier } from './common';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  tier: Tier;
  gender: Gender | null;
  stylePreferences: string[];
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  stylePreferences?: string[];
  avatarUrl?: string;
}

export interface OnboardingRequest {
  gender: Gender;
  stylePreferences: string[];
  bodyType?: string;
  colorSeason?: string;
}
