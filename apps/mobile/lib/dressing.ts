import type { DressingItem, DressingFilters, PaginatedResponse, PresignedUploadResponse, UpdateDressingItemRequest } from '@outfit-now/shared-types';

import { apiRequest } from './api';

export async function getUploadUrl(contentType: string): Promise<PresignedUploadResponse> {
  return apiRequest<PresignedUploadResponse>('/v1/dressing/upload-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });
}

export async function uploadToS3(uploadUrl: string, file: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed');
}

export async function createDressingItem(imageKey: string): Promise<{ id: string; scanStatus: string }> {
  return apiRequest('/v1/dressing/items', {
    method: 'POST',
    body: JSON.stringify({ imageKey }),
  });
}

export async function getDressingItems(filters?: DressingFilters): Promise<PaginatedResponse<DressingItem>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.color) params.set('color', filters.color);
  if (filters?.season) params.set('season', filters.season);
  if (filters?.forSale !== undefined) params.set('forSale', String(filters.forSale));
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));

  const query = params.toString();
  return apiRequest<PaginatedResponse<DressingItem>>(`/v1/dressing/items${query ? `?${query}` : ''}`);
}

export async function getDressingItem(id: string): Promise<DressingItem> {
  return apiRequest<DressingItem>(`/v1/dressing/items/${id}`);
}

export async function updateDressingItem(id: string, data: UpdateDressingItemRequest): Promise<DressingItem> {
  return apiRequest<DressingItem>(`/v1/dressing/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDressingItem(id: string): Promise<void> {
  return apiRequest(`/v1/dressing/items/${id}`, { method: 'DELETE' });
}

export async function markAsWorn(id: string): Promise<{ wornCount: number }> {
  return apiRequest(`/v1/dressing/items/${id}/worn`, { method: 'POST' });
}

export async function getScanStatus(id: string): Promise<{ scanStatus: string; category?: string }> {
  return apiRequest(`/v1/dressing/items/${id}/scan-status`);
}
