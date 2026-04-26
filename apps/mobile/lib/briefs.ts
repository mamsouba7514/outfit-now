import type { Brief, BriefRequest, Outfit } from '@outfit-now/shared-types';

import { apiRequest } from './api';

export async function createBrief(data: BriefRequest): Promise<{ id: string; status: string }> {
  return apiRequest('/v1/briefs', { method: 'POST', body: JSON.stringify(data) });
}

export async function getBrief(id: string): Promise<Brief> {
  return apiRequest<Brief>(`/v1/briefs/${id}`);
}

export async function getOutfits(params?: {
  page?: number;
  pageSize?: number;
  saved?: boolean;
}): Promise<{ data: Outfit[]; total: number; hasMore: boolean }> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  if (params?.saved !== undefined) q.set('saved', String(params.saved));
  const qs = q.toString();
  return apiRequest(`/v1/outfits${qs ? `?${qs}` : ''}`);
}

export async function outfitAction(
  outfitId: string,
  action: 'save' | 'worn' | 'discard',
): Promise<void> {
  await apiRequest(`/v1/outfits/${outfitId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}
