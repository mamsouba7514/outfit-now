import { Worker } from 'bullmq';

import { prisma } from '../lib/prisma.js';
import { COMPOSITION_QUEUE, type CompositionJobData } from '../lib/queue.js';
import { sendPushNotification } from '../lib/pushNotifications.js';
import { redis } from '../lib/redis.js';
import { ClaudeStylingProvider } from '../services/composition/ClaudeStylingProvider.js';
import { computeStyleProfile } from '../services/styleProfile.js';

const stylingProvider = new ClaudeStylingProvider();

const worker = new Worker<CompositionJobData>(
  COMPOSITION_QUEUE,
  async (job) => {
    const { briefId, userId } = job.data;
    const startedAt = Date.now();

    await prisma.brief.update({
      where: { id: briefId },
      data: { status: 'generating' },
    });

    try {
      const [brief, user, styleProfile] = await Promise.all([
        prisma.brief.findUnique({ where: { id: briefId } }),
        prisma.user.findUnique({ where: { id: userId }, select: { gender: true } }),
        computeStyleProfile(userId),   // Karl's memory of this user
      ]);
      if (!brief) throw new Error(`Brief ${briefId} not found`);

      // Fetch available dressing items (completed scans, not deleted)
      const dressing = await prisma.dressingItem.findMany({
        where: {
          userId,
          scanStatus: 'completed',
          deletedAt: null,
          id: { notIn: brief.excludeIds },
        },
        orderBy: { createdAt: 'desc' },
        take: 200, // context window cap
      });

      if (dressing.length < 3) {
        await prisma.brief.update({
          where: { id: briefId },
          data: {
            status: 'failed',
            errorMessage: 'Not enough items in wardrobe (minimum 3 required)',
          },
        });
        return;
      }

      const proposals = await stylingProvider.compose(
        dressing,
        {
          occasion: brief.occasion,
          styleNotes: brief.styleNotes,
          weatherNote: brief.weatherNote,
          colorNote: brief.colorNote,
          composeMode: brief.composeMode,
          styleTags: brief.styleTags,
          budget: brief.budget,
          gender: user?.gender ?? null,
          styleProfile,               // Karl's memory of this user's style
        },
        3,
      );

      if (proposals.length === 0) {
        await prisma.brief.update({
          where: { id: briefId },
          data: { status: 'failed', errorMessage: 'Could not generate valid outfits' },
        });
        return;
      }

      const durationMs = Date.now() - startedAt;

      // Rough cost estimate: Sonnet ~$0.015 per brief
      const costCents = 2;

      await prisma.$transaction(async (tx) => {
        for (const proposal of proposals) {
          const outfit = await tx.outfit.create({
            data: {
              briefId,
              score: proposal.score,
              justification: proposal.justification,
              shoppingResults: proposal.shoppingResults
                ? JSON.parse(JSON.stringify(proposal.shoppingResults))
                : undefined,
            },
          });

          await tx.outfitItem.createMany({
            data: proposal.items.map((item, idx) => ({
              outfitId: outfit.id,
              dressingItemId: item.id,
              role: idx === 0 ? 'main' : 'complement',
            })),
          });
        }

        await tx.brief.update({
          where: { id: briefId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            durationMs,
            totalCostCents: costCents,
          },
        });
      });

      await prisma.event.create({
        data: {
          userId,
          name: 'brief.completed',
          payload: {
            briefId,
            outfitCount: proposals.length,
            durationMs,
            costCents,
            provider: stylingProvider.name,
            avgScore: proposals.reduce((s, p) => s + p.score, 0) / proposals.length,
          },
        },
      });

      // ── Push notification ──────────────────────────────────────────────────
      const pushUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true, firstName: true },
      });
      if (pushUser?.pushToken) {
        const count = proposals.length;
        await sendPushNotification(pushUser.pushToken, {
          title: count === 1 ? '1 tenue prête ✦' : `${count} tenues prêtes ✦`,
          body: `Ton styliste IA a composé ${count === 1 ? 'une nouvelle tenue' : `${count} nouvelles tenues`} pour toi.`,
          data: { briefId, screen: 'outfits' },
          sound: 'default',
        });
      }

      if (durationMs > 12000) {
        console.warn(`[composition] p95 breach: ${durationMs}ms for brief ${briefId}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.brief.update({
        where: { id: briefId },
        data: { status: 'failed', errorMessage: message },
      });

      await prisma.event.create({
        data: { userId, name: 'brief.failed', payload: { briefId, error: message } },
      });

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  },
);

worker.on('completed', (job) => {
  console.warn(`[composition] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[composition] Job ${job?.id} failed:`, err.message);
});

console.warn('[composition] Worker started');

export { worker };
