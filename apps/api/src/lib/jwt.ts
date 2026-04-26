import crypto from 'node:crypto';

import { env } from './env.js';
import { redis } from './redis.js';

export const REFRESH_TOKEN_BYTES = 48;
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30d

export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(token).digest('hex');
}

export async function storeRefreshToken(userId: string, tokenHash: string): Promise<void> {
  await redis.setex(`refresh:${tokenHash}`, REFRESH_TTL_SECONDS, userId);
}

export async function validateRefreshToken(tokenHash: string): Promise<string | null> {
  return redis.get(`refresh:${tokenHash}`);
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await redis.del(`refresh:${tokenHash}`);
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  const pattern = `refresh:*`;
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return;

  const pipeline = redis.pipeline();
  for (const key of keys) {
    const val = await redis.get(key);
    if (val === userId) pipeline.del(key);
  }
  await pipeline.exec();
}
