import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { enqueueVisionJob } from '../lib/queue.js';
import { createPresignedDownloadUrl, createPresignedUploadUrl } from '../lib/s3.js';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_PAGE_SIZE = 50;

const uploadUrlSchema = z.object({
  contentType: z.string().refine((v) => ALLOWED_MIME.includes(v), {
    message: 'Unsupported image type',
  }),
});

const createItemSchema = z.object({
  imageKey: z.string().min(1),
});

const updateItemSchema = z.object({
  category: z
    .enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'swimwear', 'activewear', 'underwear'])
    .optional(),
  primaryColor: z.string().optional(),
  secondaryColors: z.array(z.string()).optional(),
  styleTags: z.array(z.string()).max(20).optional(),
  brand: z.string().max(100).optional(),
  season: z.array(z.enum(['spring', 'summer', 'autumn', 'winter', 'all'])).optional(),
  forSale: z.boolean().optional(),
  askingPrice: z.number().min(0).max(99999).nullable().optional(),
});

const listSchema = z.object({
  category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags', 'swimwear', 'activewear', 'underwear']).optional(),
  color: z.string().optional(),
  season: z.enum(['spring', 'summer', 'autumn', 'winter', 'all']).optional(),
  notWorn: z.coerce.boolean().optional(),
  forSale: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export async function dressingRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // Presigned upload URL
  app.post('/v1/dressing/upload-url', auth, async (request, reply) => {
    const body = uploadUrlSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const ext = body.data.contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const imageKey = `dressing/${(request.user as { id: string }).id}/${crypto.randomUUID()}.${ext}`;
    const uploadUrl = await createPresignedUploadUrl(imageKey, body.data.contentType);

    return reply.send({ uploadUrl, imageKey });
  });

  // Create item (after upload)
  app.post('/v1/dressing/items', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = createItemSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    if (!body.data.imageKey.startsWith(`dressing/${userId}/`)) {
      return reply.status(403).send({ message: 'Invalid image key' });
    }

    const item = await prisma.dressingItem.create({
      data: { userId, imageKey: body.data.imageKey, scanStatus: 'pending' },
    });

    await enqueueVisionJob({ dressingItemId: item.id, userId, imageKey: item.imageKey });

    await prisma.event.create({
      data: { userId, name: 'scan.started', payload: { itemId: item.id } },
    });

    return reply.status(201).send({ id: item.id, scanStatus: item.scanStatus });
  });

  // List items
  app.get('/v1/dressing/items', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const query = listSchema.safeParse(request.query);
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() });

    const { category, color, season, notWorn, forSale, page, pageSize } = query.data;
    const skip = (page - 1) * pageSize;

    const where = {
      userId,
      deletedAt: null,
      scanStatus: 'completed' as const,
      ...(category && { category }),
      ...(color && { primaryColor: { contains: color, mode: 'insensitive' as const } }),
      ...(season && { season: { has: season } }),
      ...(notWorn && { wornCount: 0 }),
      ...(forSale !== undefined && { forSale }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.dressingItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageKey: true,
          thumbnailKey: true,
          category: true,
          primaryColor: true,
          secondaryColors: true,
          styleTags: true,
          brand: true,
          season: true,
          wornCount: true,
          lastWornAt: true,
          forSale: true,
          askingPrice: true,
          createdAt: true,
        },
      }),
      prisma.dressingItem.count({ where }),
    ]);

    const itemsWithUrls = await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: await createPresignedDownloadUrl(item.imageKey),
        thumbnailUrl: item.thumbnailKey ? await createPresignedDownloadUrl(item.thumbnailKey) : null,
      })),
    );

    return reply.send({
      data: itemsWithUrls,
      total,
      page,
      pageSize,
      hasMore: skip + items.length < total,
    });
  });

  // Get single item
  app.get('/v1/dressing/items/:id', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const item = await prisma.dressingItem.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) return reply.status(404).send({ message: 'Item not found' });

    return reply.send({
      ...item,
      imageUrl: await createPresignedDownloadUrl(item.imageKey),
      thumbnailUrl: item.thumbnailKey ? await createPresignedDownloadUrl(item.thumbnailKey) : null,
    });
  });

  // Update item (user correction)
  app.patch('/v1/dressing/items/:id', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };
    const body = updateItemSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const existing = await prisma.dressingItem.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) return reply.status(404).send({ message: 'Item not found' });

    const { category, primaryColor, secondaryColors, styleTags, brand, season, forSale, askingPrice } = body.data;
    const item = await prisma.dressingItem.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColors !== undefined && { secondaryColors }),
        ...(styleTags !== undefined && { styleTags }),
        ...(brand !== undefined && { brand: brand ?? null }),
        ...(season !== undefined && { season }),
        ...(forSale !== undefined && { forSale }),
        ...(askingPrice !== undefined && { askingPrice: askingPrice ?? null }),
      },
    });

    const eventName = (forSale !== undefined)
      ? (forSale ? 'item.listed_for_sale' : 'item.removed_from_sale')
      : 'scan.user_correction';

    await prisma.event.create({
      data: {
        userId,
        name: eventName,
        payload: { itemId: id, before: existing, after: body.data },
      },
    });

    return reply.send(item);
  });

  // Soft delete
  app.delete('/v1/dressing/items/:id', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const existing = await prisma.dressingItem.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) return reply.status(404).send({ message: 'Item not found' });

    await prisma.dressingItem.update({ where: { id }, data: { deletedAt: new Date() } });
    return reply.status(204).send();
  });

  // Mark as worn
  app.post('/v1/dressing/items/:id/worn', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const existing = await prisma.dressingItem.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) return reply.status(404).send({ message: 'Item not found' });

    const item = await prisma.dressingItem.update({
      where: { id },
      data: { wornCount: { increment: 1 }, lastWornAt: new Date() },
      select: { id: true, wornCount: true, lastWornAt: true },
    });

    await prisma.event.create({
      data: { userId, name: 'item.worn', payload: { itemId: id, wornCount: item.wornCount } },
    });

    return reply.send(item);
  });

  // Scan status poll
  app.get('/v1/dressing/items/:id/scan-status', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const { id } = request.params as { id: string };

    const item = await prisma.dressingItem.findFirst({
      where: { id, userId },
      select: { id: true, scanStatus: true, scanError: true, category: true, primaryColor: true, styleTags: true },
    });
    if (!item) return reply.status(404).send({ message: 'Item not found' });

    return reply.send(item);
  });
}
