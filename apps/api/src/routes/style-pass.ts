import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';

// Rank thresholds (from Vision document §5.1)
const RANK_THRESHOLDS = {
  NOVICE: 0,
  STYLE: 1000,
  EXPERT: 5000,
  MAITRE: 20000,
  ICONE: 50000,
} as const;

type StyleRank = keyof typeof RANK_THRESHOLDS;

const ENERGY_POINTS = {
  SCAN: 10,
  BRIEF: 20,
  WEAR_CONFIRMED: 15,
  COMMUNITY_VOTE: 5,
  CAPSULE_COMPLETE: 100,
  STREAK_BONUS: 10,
  AWARD_SUBMISSION: 25,
} as const;

const DAILY_LIMITS: Record<string, number> = {
  SCAN: 10,
  BRIEF: 10,
  WEAR_CONFIRMED: 5,
  COMMUNITY_VOTE: 5,
  CAPSULE_COMPLETE: 1,
  STREAK_BONUS: 1,
  AWARD_SUBMISSION: 1,
};

function computeRank(energy: number): StyleRank {
  if (energy >= RANK_THRESHOLDS.ICONE) return 'ICONE';
  if (energy >= RANK_THRESHOLDS.MAITRE) return 'MAITRE';
  if (energy >= RANK_THRESHOLDS.EXPERT) return 'EXPERT';
  if (energy >= RANK_THRESHOLDS.STYLE) return 'STYLE';
  return 'NOVICE';
}

function nextRankThreshold(rank: StyleRank): number | null {
  const order: StyleRank[] = ['NOVICE', 'STYLE', 'EXPERT', 'MAITRE', 'ICONE'];
  const idx = order.indexOf(rank);
  if (idx === order.length - 1) return null;
  return RANK_THRESHOLDS[order[idx + 1]];
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getOrCreateProfile(userId: string) {
  return prisma.stylePassProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

type EnergyAction = keyof typeof ENERGY_POINTS;

export async function awardEnergy(
  userId: string,
  action: EnergyAction,
  refId?: string,
): Promise<void> {
  try {
    const profile = await getOrCreateProfile(userId);
    const since = todayStart();
    const todayCount = await prisma.energyTransaction.count({
      where: { profileId: profile.id, action, createdAt: { gte: since } },
    });
    if (todayCount >= DAILY_LIMITS[action]) return;

    let points: number = ENERGY_POINTS[action];
    if (action === 'SCAN' && todayCount >= 5) points = 3;

    const [, updated] = await prisma.$transaction([
      prisma.energyTransaction.create({
        data: { profileId: profile.id, action, points, refId: refId ?? null },
      }),
      prisma.stylePassProfile.update({
        where: { id: profile.id },
        data: { totalEnergy: { increment: points }, lastActivityAt: new Date() },
      }),
    ]);

    const newRank = computeRank(updated.totalEnergy);
    if (newRank !== profile.rank) {
      await prisma.stylePassProfile.update({ where: { id: profile.id }, data: { rank: newRank } });
    }
  } catch {
    // non-blocking — never fail the main flow for points
  }
}

const earnSchema = z.object({
  action: z.enum([
    'SCAN',
    'BRIEF',
    'WEAR_CONFIRMED',
    'COMMUNITY_VOTE',
    'CAPSULE_COMPLETE',
    'STREAK_BONUS',
    'AWARD_SUBMISSION',
  ]),
  refId: z.string().optional(),
});

const submitAwardSchema = z.object({
  outfitId: z.string().optional(),
  imageKey: z.string().optional(),
  caption: z.string().max(300).optional(),
});

export async function stylePassRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // GET /v1/style-pass/me
  app.get('/v1/style-pass/me', auth, async (request) => {
    const { id: userId } = request.user as { id: string };
    const profile = await getOrCreateProfile(userId);
    const rank = computeRank(profile.totalEnergy);
    const next = nextRankThreshold(rank);

    return {
      totalEnergy: profile.totalEnergy,
      rank,
      streakDays: profile.streakDays,
      nextRankThreshold: next,
      progressToNext: next ? Math.round((profile.totalEnergy / next) * 100) : 100,
      lastActivityAt: profile.lastActivityAt,
    };
  });

  // POST /v1/style-pass/earn
  app.post('/v1/style-pass/earn', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = earnSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { action, refId } = body.data;
    const profile = await getOrCreateProfile(userId);

    const since = todayStart();
    const todayCount = await prisma.energyTransaction.count({
      where: { profileId: profile.id, action, createdAt: { gte: since } },
    });

    if (todayCount >= DAILY_LIMITS[action]) {
      return reply.status(429).send({ message: `Daily limit reached for ${action}` });
    }

    // Decreasing returns on SCAN after 5/day
    let points: number = ENERGY_POINTS[action];
    if (action === 'SCAN' && todayCount >= 5) points = 3;

    const [, updated] = await prisma.$transaction([
      prisma.energyTransaction.create({
        data: { profileId: profile.id, action, points, refId: refId ?? null },
      }),
      prisma.stylePassProfile.update({
        where: { id: profile.id },
        data: { totalEnergy: { increment: points }, lastActivityAt: new Date() },
      }),
    ]);

    const newRank = computeRank(updated.totalEnergy);
    const rankUp = newRank !== profile.rank;
    if (rankUp) {
      await prisma.stylePassProfile.update({
        where: { id: profile.id },
        data: { rank: newRank },
      });
    }

    return { pointsEarned: points, totalEnergy: updated.totalEnergy, rank: newRank, rankUp };
  });

  // GET /v1/style-pass/awards/current
  app.get('/v1/style-pass/awards/current', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const now = new Date();

    const award = await prisma.styleAward.findFirst({
      where: { weekStart: { lte: now }, weekEnd: { gte: now } },
      include: { _count: { select: { submissions: true } } },
      orderBy: { weekStart: 'desc' },
    });

    if (!award) return reply.status(404).send({ message: 'No active award this week' });

    const profile = await getOrCreateProfile(userId);
    const submission = await prisma.awardSubmission.findUnique({
      where: { awardId_profileId: { awardId: award.id, profileId: profile.id } },
    });

    return {
      id: award.id,
      occasion: award.occasion,
      weekStart: award.weekStart,
      weekEnd: award.weekEnd,
      status: award.status,
      submissionCount: award._count.submissions,
      userSubmission: submission ?? null,
    };
  });

  // GET /v1/style-pass/awards/:id/submissions
  app.get('/v1/style-pass/awards/:id/submissions', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id: awardId } = request.params as { id: string };

    const award = await prisma.styleAward.findUnique({ where: { id: awardId } });
    if (!award) return reply.status(404).send({ message: 'Award not found' });
    if (award.status === 'OPEN') return reply.status(403).send({ message: 'Voting not open yet' });

    const profile = await getOrCreateProfile(userId);
    const submissions = await prisma.awardSubmission.findMany({
      where: { awardId },
      orderBy: { voteCount: 'desc' },
      take: 50,
      select: {
        id: true,
        imageKey: true,
        caption: true,
        voteCount: true,
        finalRank: true,
        profile: { select: { userId: true, rank: true } },
        votes: { where: { profileId: profile.id }, select: { id: true } },
      },
    });

    return submissions.map((s) => ({ ...s, hasVoted: s.votes.length > 0, votes: undefined }));
  });

  // POST /v1/style-pass/awards/:id/submit
  app.post('/v1/style-pass/awards/:id/submit', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id: awardId } = request.params as { id: string };
    const body = submitAwardSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const award = await prisma.styleAward.findUnique({ where: { id: awardId } });
    if (!award) return reply.status(404).send({ message: 'Award not found' });
    if (award.status !== 'OPEN') return reply.status(403).send({ message: 'Submissions closed' });

    const profile = await getOrCreateProfile(userId);
    if (profile.totalEnergy < RANK_THRESHOLDS.STYLE) {
      return reply
        .status(403)
        .send({ message: 'Atteins le rang STYLÉ·E (1 000 pts) pour participer aux Style Awards' });
    }

    try {
      const submission = await prisma.awardSubmission.create({
        data: {
          awardId,
          profileId: profile.id,
          outfitId: body.data.outfitId ?? null,
          imageKey: body.data.imageKey ?? null,
          caption: body.data.caption ?? null,
        },
      });
      await prisma.$transaction([
        prisma.energyTransaction.create({
          data: {
            profileId: profile.id,
            action: 'AWARD_SUBMISSION',
            points: ENERGY_POINTS.AWARD_SUBMISSION,
            refId: submission.id,
          },
        }),
        prisma.stylePassProfile.update({
          where: { id: profile.id },
          data: { totalEnergy: { increment: ENERGY_POINTS.AWARD_SUBMISSION } },
        }),
      ]);
      return reply.status(201).send(submission);
    } catch {
      return reply.status(409).send({ message: 'Already submitted to this award' });
    }
  });

  // POST /v1/style-pass/awards/:id/vote/:submissionId
  app.post('/v1/style-pass/awards/:id/vote/:submissionId', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id: awardId, submissionId } = request.params as { id: string; submissionId: string };

    const award = await prisma.styleAward.findUnique({ where: { id: awardId } });
    if (!award) return reply.status(404).send({ message: 'Award not found' });
    if (award.status !== 'VOTING') return reply.status(403).send({ message: 'Voting not open' });

    const profile = await getOrCreateProfile(userId);
    const since = todayStart();
    const todayVotes = await prisma.awardVote.count({
      where: { profileId: profile.id, createdAt: { gte: since } },
    });

    const voteLimits: Record<StyleRank, number> = {
      NOVICE: 5,
      STYLE: 6,
      EXPERT: 8,
      MAITRE: 8,
      ICONE: 10,
    };
    const rank = computeRank(profile.totalEnergy);
    if (todayVotes >= voteLimits[rank]) {
      return reply.status(429).send({ message: 'Daily vote limit reached' });
    }

    const weight = rank === 'ICONE' ? 2 : 1;

    try {
      await prisma.$transaction([
        prisma.awardVote.create({ data: { submissionId, profileId: profile.id, weight } }),
        prisma.awardSubmission.update({
          where: { id: submissionId },
          data: { voteCount: { increment: weight } },
        }),
      ]);

      const todayEarned = await prisma.energyTransaction.count({
        where: { profileId: profile.id, action: 'COMMUNITY_VOTE', createdAt: { gte: since } },
      });
      if (todayEarned < DAILY_LIMITS['COMMUNITY_VOTE']) {
        await prisma.$transaction([
          prisma.energyTransaction.create({
            data: {
              profileId: profile.id,
              action: 'COMMUNITY_VOTE',
              points: ENERGY_POINTS.COMMUNITY_VOTE,
              refId: submissionId,
            },
          }),
          prisma.stylePassProfile.update({
            where: { id: profile.id },
            data: { totalEnergy: { increment: ENERGY_POINTS.COMMUNITY_VOTE } },
          }),
        ]);
      }
      return { success: true };
    } catch {
      return reply.status(409).send({ message: 'Already voted on this submission' });
    }
  });

  // GET /v1/style-pass/cards
  app.get('/v1/style-pass/cards', auth, async (request) => {
    const { id: userId } = request.user as { id: string };
    const profile = await getOrCreateProfile(userId);
    return prisma.styleCard.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  });

  // POST /v1/style-pass/cards/:id/reveal
  app.post('/v1/style-pass/cards/:id/reveal', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id: cardId } = request.params as { id: string };

    const profile = await getOrCreateProfile(userId);
    const card = await prisma.styleCard.findFirst({
      where: { id: cardId, profileId: profile.id },
    });

    if (!card) return reply.status(404).send({ message: 'Card not found' });
    if (card.revealedAt) return reply.status(409).send({ message: 'Card already revealed' });
    if (new Date() > card.validUntil) return reply.status(410).send({ message: 'Card expired' });

    return prisma.styleCard.update({
      where: { id: cardId },
      data: { revealedAt: new Date() },
    });
  });
}
