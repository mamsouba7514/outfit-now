import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { createPresignedDownloadUrl } from '../lib/s3.js';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { enqueueCompositionJob } from '../lib/queue.js';

const createBriefSchema = z.object({
  occasion: z.enum([
    'casual', 'work', 'formal', 'sport', 'evening', 'weekend', 'travel',
    'date', 'party', 'beach', 'ceremony', 'gala', 'dinner', 'outdoor',
  ]),
  styleNotes: z.string().max(500).optional(),
  weatherNote: z.string().max(200).optional(),
  colorNote: z.string().max(200).optional(),
  excludeIds: z.array(z.string()).max(20).default([]),
  styleTags: z.array(z.string().max(50)).max(10).optional(),
  budget: z.number().min(0).max(10000).optional(),
  composeMode: z.enum(['new', 'dressing', 'mix']).default('mix'),
});

const outfitActionSchema = z.object({
  action: z.enum(['save', 'worn', 'discard']),
});

const listOutfitsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  saved: z.coerce.boolean().optional(),
});

export async function briefRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // POST /v1/briefs — creates a brief and enqueues composition
  app.post('/v1/briefs', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = createBriefSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    // Free tier: max 3 briefs/day (bypassed in development)
    if (user.tier === 'free' && env.NODE_ENV !== 'development') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await prisma.brief.count({
        where: { userId, createdAt: { gte: since } },
      });
      if (count >= 3) {
        return reply.status(429).send({ message: 'Daily limit reached. Upgrade to Premium for unlimited briefs.' });
      }
    }

    const brief = await prisma.brief.create({
      data: {
        userId,
        occasion: body.data.occasion,
        styleNotes: body.data.styleNotes ?? null,
        weatherNote: body.data.weatherNote ?? null,
        colorNote: body.data.colorNote ?? null,
        excludeIds: body.data.excludeIds,
        styleTags: body.data.styleTags ?? [],
        budget: body.data.budget ?? null,
        composeMode: body.data.composeMode,
        status: 'pending',
      },
    });

    await enqueueCompositionJob({ briefId: brief.id, userId });

    await prisma.event.create({
      data: { userId, name: 'brief.created', payload: { briefId: brief.id, occasion: brief.occasion } },
    });

    return reply.status(202).send({
      id: brief.id,
      status: brief.status,
      createdAt: brief.createdAt,
    });
  });

  // GET /v1/briefs/:id — poll status + get outfits when done
  app.get('/v1/briefs/:id', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const brief = await prisma.brief.findFirst({
      where: { id, userId },
      include: {
        outfits: {
          orderBy: { score: 'desc' },
          include: {
            items: {
              include: {
                dressingItem: {
                  select: {
                    id: true,
                    imageKey: true,
                    thumbnailKey: true,
                    category: true,
                    primaryColor: true,
                    styleTags: true,
                  },
                },
              },
            },
            affiliateSuggestion: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!brief) return reply.status(404).send({ message: 'Brief not found' });

    const outfitsWithUrls = await Promise.all(brief.outfits.map(async (outfit) => ({
      id: outfit.id,
      score: outfit.score,
      justification: outfit.justification,
      shoppingResults: outfit.shoppingResults ?? [],
      savedAt: outfit.savedAt,
      wornAt: outfit.wornAt,
      discardedAt: outfit.discardedAt,
      items: await Promise.all(outfit.items.map(async (oi) => ({
        id: oi.id,
        dressingItemId: oi.dressingItemId,
        role: oi.role,
        category: oi.dressingItem.category,
        primaryColor: oi.dressingItem.primaryColor,
        styleTags: oi.dressingItem.styleTags,
        imageKey: oi.dressingItem.imageKey,
        imageUrl: await createPresignedDownloadUrl(
          oi.dressingItem.thumbnailKey ?? oi.dressingItem.imageKey
        ),
      }))),
      affiliateSuggestion: outfit.affiliateSuggestion
        ? {
            productId: outfit.affiliateSuggestion.product.id,
            name: outfit.affiliateSuggestion.product.name,
            brand: outfit.affiliateSuggestion.product.brand,
            price: Number(outfit.affiliateSuggestion.product.price),
            imageUrl: outfit.affiliateSuggestion.product.imageUrl,
            affiliateUrl: outfit.affiliateSuggestion.product.affiliateUrl,
            justification: outfit.affiliateSuggestion.justification,
          }
        : null,
    })));

    return reply.send({
      id: brief.id,
      status: brief.status,
      occasion: brief.occasion,
      styleNotes: brief.styleNotes,
      createdAt: brief.createdAt,
      completedAt: brief.completedAt,
      durationMs: brief.durationMs,
      errorMessage: brief.errorMessage,
      outfits: outfitsWithUrls,
    });
  });

  // GET /v1/outfits — outfit history
  app.get('/v1/outfits', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const query = listOutfitsSchema.safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

    const { page, pageSize, saved } = query.data;
    const skip = (page - 1) * pageSize;

    const where = {
      brief: { userId },
      ...(saved === true && { savedAt: { not: null } }),
      ...(saved === false && { savedAt: null }),
    };

    const [outfits, total] = await prisma.$transaction([
      prisma.outfit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          brief: { select: { occasion: true, createdAt: true } },
          items: {
            include: {
              dressingItem: {
                select: { id: true, imageKey: true, category: true, primaryColor: true },
              },
            },
          },
        },
      }),
      prisma.outfit.count({ where }),
    ]);

    return reply.send({
      data: outfits,
      total,
      page,
      pageSize,
      hasMore: skip + outfits.length < total,
    });
  });

  // POST /v1/outfits/:id/action — save / worn / discard
  app.post('/v1/outfits/:id/action', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    const body = outfitActionSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const outfit = await prisma.outfit.findFirst({
      where: { id, brief: { userId } },
      include: { items: true },
    });
    if (!outfit) return reply.status(404).send({ message: 'Outfit not found' });

    const now = new Date();
    const data: Record<string, Date | null> = {};

    if (body.data.action === 'save') data.savedAt = now;
    if (body.data.action === 'discard') data.discardedAt = now;
    if (body.data.action === 'worn') {
      data.wornAt = now;
      // Increment wornCount for each piece in this outfit
      await prisma.$transaction(
        outfit.items.map((item) =>
          prisma.dressingItem.update({
            where: { id: item.dressingItemId },
            data: { wornCount: { increment: 1 }, lastWornAt: now },
          }),
        ),
      );
    }

    const updated = await prisma.outfit.update({ where: { id }, data });

    await prisma.event.create({
      data: {
        userId,
        name: `outfit.${body.data.action}`,
        payload: { outfitId: id, itemCount: outfit.items.length },
      },
    });

    return reply.send({ id: updated.id, ...data });
  });
}
