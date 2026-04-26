import { env } from '../lib/env.js';

interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean | string[]>;
}

interface UpsertResponse {
  upsertedCount: number;
}

// Minimal Pinecone REST client — avoids heavy SDK dependency
export class PineconeClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `https://${env.PINECONE_INDEX ?? 'outfit-now'}.svc.pinecone.io`;
    this.headers = {
      'Api-Key': env.PINECONE_API_KEY ?? '',
      'Content-Type': 'application/json',
    };
  }

  async upsert(vectors: PineconeVector[]): Promise<UpsertResponse> {
    if (!env.PINECONE_API_KEY) {
      console.warn('Pinecone not configured — skipping upsert');
      return { upsertedCount: 0 };
    }

    const res = await fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ vectors, namespace: 'dressing' }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinecone upsert failed: ${err}`);
    }

    return res.json() as Promise<UpsertResponse>;
  }

  async query(vector: number[], topK: number, filter?: Record<string, string>): Promise<{ id: string; score: number }[]> {
    if (!env.PINECONE_API_KEY) return [];

    const res = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ vector, topK, namespace: 'dressing', filter, includeMetadata: false }),
    });

    if (!res.ok) return [];

    const data = await res.json() as { matches: { id: string; score: number }[] };
    return data.matches;
  }

  async delete(ids: string[]): Promise<void> {
    if (!env.PINECONE_API_KEY) return;

    await fetch(`${this.baseUrl}/vectors/delete`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ids, namespace: 'dressing' }),
    });
  }
}

export const pinecone = new PineconeClient();
