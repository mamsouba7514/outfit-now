// ─── SearchService — moteur de recherche mode multi-provider ─────────────────
//
// Providers par ordre de priorité :
//   1. SerpAPI          — Google Shopping (SERPAPI_KEY)
//   2. Serper.dev       — Google Shopping alternatif (SERPER_API_KEY)
//   3. Résultats vides  — gracieux si aucune clé

import { redis } from '../../lib/redis.js';

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
  maxPrice?:  number;
  minPrice?:  number;
  brands?:    string[];
  stores?:    string[];
  category?:  string;
  locale?:    string; // 'fr', 'en', etc.
}

const CACHE_TTL = 60 * 60 * 24; // 24h

function cacheKey(query: string, filters: SearchFilters): string {
  return `search:v1:${query}:${JSON.stringify(filters)}`;
}

// ── SerpAPI ──────────────────────────────────────────────────────────────────

async function searchViaSerpApi(
  query: string,
  filters: SearchFilters,
  maxResults: number,
  apiKey: string,
): Promise<SearchProduct[]> {
  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: apiKey,
    hl: filters.locale ?? 'fr',
    gl: filters.locale ?? 'fr',
    num: String(Math.min(maxResults * 3, 30)),
  });

  if (filters.maxPrice) params.set('price_max', String(filters.maxPrice));
  if (filters.minPrice) params.set('price_min', String(filters.minPrice));

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    shopping_results?: Array<{
      title: string;
      price?: string;
      extracted_price?: number;
      source?: string;
      link?: string;
      product_link?: string;
      thumbnail?: string;
      rating?: number;
      brand?: string;
    }>;
  };

  return (data.shopping_results ?? [])
    .filter((r) => r.price && r.thumbnail)
    .slice(0, maxResults)
    .map((r) => ({
      title:    r.title,
      price:    r.price ?? '',
      priceRaw: r.extracted_price ?? 0,
      store:    r.source ?? '',
      link:     r.product_link ?? r.link ?? '',
      imageUrl: r.thumbnail ?? '',
      category: filters.category ?? 'general',
      brand:    r.brand ?? null,
      rating:   r.rating ?? null,
      query,
    }));
}

// ── Serper.dev ────────────────────────────────────────────────────────────────

async function searchViaSerper(
  query: string,
  filters: SearchFilters,
  maxResults: number,
  apiKey: string,
): Promise<SearchProduct[]> {
  const body: Record<string, unknown> = {
    q: query,
    gl: filters.locale ?? 'fr',
    hl: filters.locale ?? 'fr',
    num: Math.min(maxResults * 2, 20),
    tbs: filters.maxPrice
      ? `p_ord:rv,price:1,ppr_min:${filters.minPrice ?? 0},ppr_max:${filters.maxPrice}`
      : undefined,
  };

  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    shopping?: Array<{
      title: string;
      price?: string;
      source?: string;
      link?: string;
      imageUrl?: string;
      rating?: number;
      reviews?: number;
    }>;
  };

  return (data.shopping ?? [])
    .filter((r) => r.price && r.imageUrl)
    .slice(0, maxResults)
    .map((r) => {
      const priceRaw = parseFloat((r.price ?? '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      return {
        title:    r.title,
        price:    r.price ?? '',
        priceRaw,
        store:    r.source ?? '',
        link:     r.link ?? '',
        imageUrl: r.imageUrl ?? '',
        category: filters.category ?? 'general',
        brand:    null,
        rating:   r.rating ?? null,
        query,
      };
    });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchProducts(
  query: string,
  filters: SearchFilters = {},
  maxResults = 6,
): Promise<SearchProduct[]> {
  const key = cacheKey(query, filters);

  // Cache hit
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as SearchProduct[];

  const serpApiKey  = process.env.SERPAPI_KEY;
  const serperKey   = process.env.SERPER_API_KEY;

  let results: SearchProduct[] = [];

  try {
    if (serpApiKey) {
      results = await searchViaSerpApi(query, filters, maxResults, serpApiKey);
    } else if (serperKey) {
      results = await searchViaSerper(query, filters, maxResults, serperKey);
    }
  } catch {
    results = [];
  }

  // Apply client-side filters
  if (filters.brands?.length) {
    const b = filters.brands.map((x) => x.toLowerCase());
    results = results.filter((r) =>
      b.some((br) => r.title.toLowerCase().includes(br) || r.store.toLowerCase().includes(br)),
    );
  }
  if (filters.stores?.length) {
    const s = filters.stores.map((x) => x.toLowerCase());
    results = results.filter((r) => s.some((st) => r.store.toLowerCase().includes(st)));
  }
  if (filters.minPrice) {
    results = results.filter((r) => r.priceRaw >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    results = results.filter((r) => r.priceRaw > 0 && r.priceRaw <= filters.maxPrice!);
  }

  // Cache results
  if (results.length > 0) {
    await redis.setex(key, CACHE_TTL, JSON.stringify(results));
  }

  return results;
}

export function isSearchAvailable(): boolean {
  return !!(process.env.SERPAPI_KEY || process.env.SERPER_API_KEY);
}
