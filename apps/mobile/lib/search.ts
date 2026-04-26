import { apiRequest } from './api';

export interface SearchProduct {
  title:    string;
  price:    string;
  priceRaw: number;
  store:    string;
  link:     string;
  imageUrl: string;
  category: string;
  brand:    string | null;
  rating:   number | null;
  query:    string;
}

export interface SearchFilters {
  category?:  string;
  maxPrice?:  number;
  minPrice?:  number;
  brands?:    string[];
  maxResults?: number;
  useAI?:     boolean;
}

export interface SearchResponse {
  results:   SearchProduct[];
  intent:    string;
  total:     number;
  queries:   string[];
  available: boolean;
}

export interface SearchHistoryEntry {
  query:  string;
  intent: string;
  count:  number;
  at:     number;
}

export async function searchStyle(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/v1/search/style', {
    method: 'POST',
    body: JSON.stringify({ query, ...filters }),
  });
}

export async function searchSimilar(dressingItemId: string, maxResults = 6): Promise<{
  results: SearchProduct[];
  query: string;
  sourceItem: { id: string; category: string; primaryColor: string; brand: string | null };
}> {
  return apiRequest('/v1/search/similar', {
    method: 'POST',
    body: JSON.stringify({ dressingItemId, maxResults }),
  });
}

export async function getSearchHistory(): Promise<SearchHistoryEntry[]> {
  const res = await apiRequest<{ history: SearchHistoryEntry[] }>('/v1/search/history');
  return res.history;
}

export async function clearSearchHistory(): Promise<void> {
  await apiRequest('/v1/search/history', { method: 'DELETE' });
}

export async function getSearchStatus(): Promise<{ available: boolean; providers: { serpapi: boolean; serper: boolean } }> {
  return apiRequest('/v1/search/status');
}
