import { apiRequest } from './api';

export interface AvatarData {
  id: string;
  userId: string;
  bodyType: 'slim' | 'athletic' | 'regular' | 'curvy' | 'plus';
  skinTone: 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'grey' | 'white' | 'other';
  hairLength: 'short' | 'medium' | 'long' | 'shaved';
  heightCm: number | null;
  photoKey: string | null;
  photoUrl: string | null;
  generatedKey: string | null;
  generatedUrl: string | null;
}

export interface AvatarUpdatePayload {
  bodyType?: AvatarData['bodyType'];
  skinTone?: AvatarData['skinTone'];
  hairColor?: AvatarData['hairColor'];
  hairLength?: AvatarData['hairLength'];
  heightCm?: number;
  photoKey?: string;
}

export async function getAvatar(): Promise<AvatarData | null> {
  try {
    return await apiRequest<AvatarData>('/v1/avatar');
  } catch {
    return null;
  }
}

export async function saveAvatar(payload: AvatarUpdatePayload): Promise<AvatarData> {
  return apiRequest<AvatarData>('/v1/avatar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAvatarPhotoUploadUrl(contentType: string): Promise<{ uploadUrl: string; key: string }> {
  return apiRequest('/v1/avatar/photo-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });
}

export async function generateAvatarImage(): Promise<{ generatedUrl: string; generatedKey: string; prompt?: string }> {
  return apiRequest('/v1/avatar/generate', { method: 'POST', body: JSON.stringify({}) });
}

export async function requestTryOn(outfitId: string, itemId?: string): Promise<{ status: string; resultUrl?: string; message?: string }> {
  return apiRequest('/v1/avatar/tryon', {
    method: 'POST',
    body: JSON.stringify({ outfitId, itemId }),
  });
}

export interface AvatarAnalysisResult {
  analysis: {
    bodyType: AvatarData['bodyType'];
    skinTone: AvatarData['skinTone'];
    hairColor: AvatarData['hairColor'];
    hairLength: AvatarData['hairLength'];
    confidence: number;
    notes?: string;
  };
  autoApplied: boolean;
}

export async function analyzeAvatarPhoto(): Promise<AvatarAnalysisResult> {
  return apiRequest('/v1/avatar/analyze-photo', { method: 'POST', body: JSON.stringify({}) });
}
