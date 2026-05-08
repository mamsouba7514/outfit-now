import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from './env.js';
import { redis } from './redis.js';

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

export async function createPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

const URL_TTL = 3000; // cache 50 min, URL valid 60 min

export async function createPresignedDownloadUrl(key: string): Promise<string> {
  const cacheKey = `presign:${key}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return cached;

  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  void redis.set(cacheKey, url, 'EX', URL_TTL).catch(() => null);
  return url;
}

export function getPublicUrl(key: string): string {
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
}
