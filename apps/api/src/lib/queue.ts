import { Queue, type Job } from 'bullmq';

import { redis } from './redis.js';

export const VISION_QUEUE = 'vision';
export const COMPOSITION_QUEUE = 'composition';

export const visionQueue = new Queue(VISION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export const compositionQueue = new Queue(COMPOSITION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export interface VisionJobData {
  dressingItemId: string;
  userId: string;
  imageKey: string;
}

export interface CompositionJobData {
  briefId: string;
  userId: string;
}

export function enqueueVisionJob(data: VisionJobData): Promise<Job> {
  return visionQueue.add('process-image', data, { jobId: `vision-${data.dressingItemId}` });
}

export function enqueueCompositionJob(data: CompositionJobData): Promise<Job> {
  return compositionQueue.add('compose-outfit', data, { jobId: `compose-${data.briefId}` });
}
