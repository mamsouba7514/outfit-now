import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Worker } from 'bullmq';

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { VISION_QUEUE, type VisionJobData } from '../lib/queue.js';
import { redis } from '../lib/redis.js';
import { s3 } from '../lib/s3.js';
import { pinecone } from '../services/pinecone.js';
import { ClaudeVisionProvider } from '../services/vision/ClaudeVisionProvider.js';

const visionProvider = new ClaudeVisionProvider();

async function fetchImageBuffer(imageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: imageKey });
  const response = await s3.send(command);

  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const mimeType = response.ContentType ?? 'image/jpeg';
  return { buffer, mimeType };
}

const worker = new Worker<VisionJobData>(
  VISION_QUEUE,
  async (job) => {
    const { dressingItemId, userId, imageKey } = job.data;
    const startedAt = Date.now();

    await prisma.dressingItem.update({
      where: { id: dressingItemId },
      data: { scanStatus: 'processing' },
    });

    try {
      const { buffer, mimeType } = await fetchImageBuffer(imageKey);
      const result = await visionProvider.analyze(buffer, mimeType);

      await prisma.dressingItem.update({
        where: { id: dressingItemId },
        data: {
          scanStatus: 'completed',
          category: result.category,
          primaryColor: result.primaryColor,
          secondaryColors: result.secondaryColors,
          styleTags: result.styleTags,
          brand: result.brand,
          season: result.season,
          vectorId: dressingItemId,
          scanDurationMs: Date.now() - startedAt,
          // Rough cost estimate: Haiku ~$0.00025/image
          scanCostCents: 3,
        },
      });

      if (result.embedding.some((v) => v !== 0)) {
        await pinecone.upsert([{
          id: dressingItemId,
          values: result.embedding,
          metadata: {
            userId,
            category: result.category,
            primaryColor: result.primaryColor,
            styleTags: result.styleTags,
            season: result.season,
          },
        }]);
      }

      const durationMs = Date.now() - startedAt;
      await prisma.event.create({
        data: {
          userId,
          name: 'scan.completed',
          payload: {
            itemId: dressingItemId,
            durationMs,
            costCents: 3,
            provider: visionProvider.name,
            confidence: result.confidence,
          },
        },
      });

      if (durationMs > 7000) {
        console.warn(`[vision] p95 breach: ${durationMs}ms for item ${dressingItemId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.dressingItem.update({
        where: { id: dressingItemId },
        data: { scanStatus: 'failed', scanError: message },
      });

      await prisma.event.create({
        data: { userId, name: 'scan.failed', payload: { itemId: dressingItemId, error: message } },
      });

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

worker.on('completed', (job) => {
  console.warn(`[vision] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[vision] Job ${job?.id} failed:`, err.message);
});

console.warn('[vision] Worker started');

export { worker };
