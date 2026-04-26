import { env } from '../../lib/env.js';

export interface ShoppingProduct {
  title: string;
  price: string;
  priceRaw: number;
  store: string;
  link: string;
  imageUrl: string;
  category: string;
}

interface SerpApiResult {
  shopping_results?: Array<{
    title: string;
    price?: string;
    extracted_price?: number;
    source?: string;
    link?: string;
    product_link?: string;
    thumbnail?: string;
  }>;
}

export async function searchShoppingProducts(
  query: string,
  category: string,
  maxResults = 3,
): Promise<ShoppingProduct[]> {
  const key = env.SERPAPI_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: key,
    hl: 'fr',
    gl: 'fr',
    num: '10',
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as SerpApiResult;

    return (data.shopping_results ?? [])
      .filter((r) => r.price && r.thumbnail)
      .slice(0, maxResults)
      .map((r) => ({
        title: r.title,
        price: r.price ?? '',
        priceRaw: r.extracted_price ?? 0,
        store: r.source ?? '',
        link: r.product_link ?? r.link ?? '',
        imageUrl: r.thumbnail ?? '',
        category,
      }));
  } catch {
    return [];
  }
}
