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
      email: `avatar-${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Avatar',
      lastName: 'Test',
    },
  });
  accessToken = res.json<{ accessToken: string }>().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe('GET /v1/avatar', () => {
  it('returns 404 when avatar does not exist yet', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/avatar' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /v1/avatar', () => {
  it('creates an avatar with valid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        bodyType: 'athletic',
        skinTone: 'medium',
        hairColor: 'black',
        hairLength: 'short',
        heightCm: 178,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{
      bodyType: string;
      skinTone: string;
      hairColor: string;
      hairLength: string;
      heightCm: number;
    }>();
    expect(body.bodyType).toBe('athletic');
    expect(body.skinTone).toBe('medium');
    expect(body.hairColor).toBe('black');
    expect(body.hairLength).toBe('short');
    expect(body.heightCm).toBe(178);
  });

  it('GET returns avatar after creation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ bodyType: string; heightCm: number }>();
    expect(body.bodyType).toBe('athletic');
    expect(body.heightCm).toBe(178);
  });

  it('updates avatar on second POST (upsert)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { bodyType: 'slim', heightCm: 170 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ bodyType: string; heightCm: number }>();
    expect(body.bodyType).toBe('slim');
    expect(body.heightCm).toBe(170);
  });

  it('rejects invalid bodyType', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { bodyType: 'invalid_type' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects heightCm out of range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { heightCm: 50 }, // below 100
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar',
      payload: { bodyType: 'regular' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /v1/avatar/tryon', () => {
  it('returns unavailable status (mock)', async () => {
    // Create a brief first to get an outfitId — we just use a fake ID
    // since the mock doesn't actually query the DB for the outfit
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar/tryon',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { outfitId: 'fake-outfit-id' },
    });
    // Avatar exists at this point (created above)
    expect(res.statusCode).toBe(200);
    const body = res.json<{ status: string; message?: string }>();
    expect(body.status).toBe('unavailable');
    expect(body.message).toContain('prochainement');
  });

  it('returns 404 when avatar not configured', async () => {
    // Use a brand new user with no avatar
    const signup = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email: `tryon-noavatar-${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'No',
        lastName: 'Avatar',
      },
    });
    const token = signup.json<{ accessToken: string }>().accessToken;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar/tryon',
      headers: { authorization: `Bearer ${token}` },
      payload: { outfitId: 'some-outfit' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/avatar/tryon',
      payload: { outfitId: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });
});
