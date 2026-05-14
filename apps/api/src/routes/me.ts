import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { createPresignedDownloadUrl, createPresignedUploadUrl } from '../lib/s3.js';
import { computeStyleProfile } from '../services/styleProfile.js';

const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  stylePreferences: z.array(z.string()).max(20).optional(),
  avatarUrl: z.string().optional(),
});

const onboardingSchema = z.object({
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']),
  stylePreferences: z.array(z.string()).min(1).max(20),
  bodyType: z.string().optional(),
  colorSeason: z.string().optional(),
});

export async function meRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  app.get('/v1/me', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        tier: true,
        gender: true,
        stylePreferences: true,
        bodyType: true,
        colorSeason: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: { select: { dressingItems: true } },
      },
    });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    let avatarUrl = user.avatarUrl;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = await createPresignedDownloadUrl(avatarUrl);
    }

    return reply.send({ ...user, avatarUrl });
  });

  app.patch('/v1/me', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const body = updateSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { firstName, lastName, gender, stylePreferences, avatarUrl } = body.data;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(gender !== undefined && { gender }),
        ...(stylePreferences !== undefined && { stylePreferences }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tier: true,
        gender: true,
        stylePreferences: true,
        onboardingCompleted: true,
        updatedAt: true,
      },
    });
    return reply.send(user);
  });

  app.get('/v1/me/avatar/upload-url', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const key = `avatars/${id}/profile.jpg`;
    const uploadUrl = await createPresignedUploadUrl(key, 'image/jpeg');
    return reply.send({ uploadUrl, key });
  });

  app.post('/v1/me/onboarding', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const body = onboardingSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { gender, stylePreferences, bodyType, colorSeason } = body.data;
    const user = await prisma.user.update({
      where: { id },
      data: {
        gender,
        stylePreferences,
        ...(bodyType !== undefined && { bodyType: bodyType ?? null }),
        ...(colorSeason !== undefined && { colorSeason: colorSeason ?? null }),
        onboardingCompleted: true,
      },
      select: { id: true, onboardingCompleted: true, gender: true, stylePreferences: true },
    });
    return reply.send(user);
  });

  // ── GET /v1/me/style-profile — Karl's memory of this user ────────────────
  app.get('/v1/me/style-profile', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const profile = await computeStyleProfile(id);
    return reply.send(profile);
  });

  // ── POST /v1/me/push-token — register Expo push token ────────────────────
  app.post('/v1/me/push-token', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    const body = z.object({ token: z.string().min(10) }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    await prisma.user.update({
      where: { id },
      data: { pushToken: body.data.token },
    });
    return reply.status(204).send();
  });

  // ── DELETE /v1/me/push-token — unregister (e.g. on logout) ───────────────
  app.delete('/v1/me/push-token', auth, async (request, reply) => {
    const { id } = request.user as { id: string };
    await prisma.user.update({ where: { id }, data: { pushToken: null } });
    return reply.status(204).send();
  });

  app.post('/v1/me/export', auth, async (request, reply) => {
    const { id } = request.user as { id: string };

    await prisma.user.update({
      where: { id },
      data: { exportRequestedAt: new Date() },
    });

    await prisma.event.create({
      data: { userId: id, name: 'user.export_requested', payload: {} },
    });

    return reply
      .status(202)
      .send({ message: 'Export requested. You will receive an email within 24h.' });
  });

  app.delete('/v1/me', auth, async (request, reply) => {
    const { id } = request.user as { id: string };

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), email: `deleted_${id}@deleted` },
    });

    await prisma.event.create({
      data: { userId: id, name: 'user.deleted', payload: {} },
    });

    return reply.status(204).send();
  });
}
