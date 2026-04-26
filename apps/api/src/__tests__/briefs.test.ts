import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../server.js';

let app: FastifyInstance;
let accessToken: string;

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://outfit:outfit@localhost:5432/outfit_now_test';
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-secret-32-characters-minimum!!';
  process.env.S3_ENDPOINT = 'http://localhost:9000';
  process.env.S3_BUCKET = 'outfit-now-test';
  process.env.S3_ACCESS_KEY = 'minioadmin';
  process.env.S3_SECRET_KEY = 'minioadmin';

  app = await buildApp();
  await app.ready();

  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/signup',
    payload: {
      email: `briefs-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Brief',
      lastName: 'Test',
    },
  });
  accessToken = res.json<{ accessToken: string }>().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe('POST /v1/briefs', () => {
  it('creates a brief and returns 202', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/briefs',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { occasion: 'casual' },
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ id: string; status: string }>();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('pending');
  });

  it('rejects invalid occasion', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/briefs',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { occasion: 'invalid_occasion' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/briefs',
      payload: { occasion: 'casual' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /v1/briefs/:id', () => {
  it('returns the brief with status', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/briefs',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { occasion: 'work', styleNotes: 'chic décontracté' },
    });
    const { id } = create.json<{ id: string }>();

    const res = await app.inject({
      method: 'GET',
      url: `/v1/briefs/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; occasion: string; outfits: unknown[] }>();
    expect(body.id).toBe(id);
    expect(body.occasion).toBe('work');
    expect(Array.isArray(body.outfits)).toBe(true);
  });

  it('returns 404 for unknown brief', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/briefs/unknown-id',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /v1/outfits', () => {
  it('returns outfit history', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/outfits',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ data: unknown[]; total: number }>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
  });
});
