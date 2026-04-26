import { apiRequest } from './api';

export interface StyleProfile {
  dressingSize: number;
  savedOutfitsCount: number;
  wornOutfitsCount: number;
  postsCount: number;
  dominantColors: string[];
  topStyleTags: string[];
  topBrands: string[];
  favoriteCategories: string[];
  confirmedAesthetics: string[];
  styleConfidence: number;       // 0–1
  styleConfidenceLabel: string;
}

export async function getStyleProfile(): Promise<StyleProfile | null> {
  try {
    return await apiRequest<StyleProfile>('/v1/me/style-profile');
  } catch {
    return null;
  }
}
