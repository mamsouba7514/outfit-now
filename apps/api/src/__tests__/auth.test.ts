import type { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { buildApp } from '../server.js';

let app: FastifyInstance;

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
});

afterAll(async () => {
  await app.close();
});

describe('POST /v1/auth/signup', () => {
  const email = `test-${Date.now()}@example.com`;

  it('creates a new user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ user: { email: string }; accessToken: string; refreshToken: string }>();
    expect(body.user.email).toBe(email);
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it('rejects duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('rejects invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email: 'not-an-email', password: 'Password123!', firstName: 'T', lastName: 'U' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /v1/auth/login', () => {
  const email = `login-${Date.now()}@example.com`;

  beforeEach(async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: { email, password: 'Password123!', firstName: 'Test', lastName: 'User' },
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: 'Password123!' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string }>();
    expect(body.accessToken).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: 'WrongPassword!' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /v1/auth/refresh', () => {
  it('issues new tokens with valid refresh token', async () => {
    const signup = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email: `refresh-${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'R',
        lastName: 'T',
      },
    });
    const { refreshToken } = signup.json<{ refreshToken: string }>();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ accessToken: string; refreshToken: string }>();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).not.toBe(refreshToken);
  });
});

describe('GET /v1/me', () => {
  it('returns profile when authenticated', async () => {
    const signup = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        email: `me-${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Me',
        lastName: 'Test',
      },
    });
    const { accessToken } = signup.json<{ accessToken: string }>();

    const res = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ email: string }>();
    expect(body.email).toContain('me-');
  });

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/me' });
    expect(res.statusCode).toBe(401);
  });
});
