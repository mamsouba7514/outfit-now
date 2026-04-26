import * as bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  generateRefreshToken,
  hashToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
} from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/signup', async (request, reply) => {
    const body = signupSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { email, password, firstName, lastName } = body.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    // Return 200 to prevent email enumeration — client can't distinguish "registered" from "not registered"
    if (existing) return reply.status(200).send({ message: 'Account created. Check your email to confirm.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName },
    });

    const tokens = await issueTokens(app, user.id, user.email, user.tier);
    return reply.status(201).send({ user: sanitizeUser(user), ...tokens });
  });

  app.post('/v1/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email, deletedAt: null } });
    if (!user || !user.passwordHash) return reply.status(401).send({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.status(401).send({ message: 'Invalid credentials' });

    const tokens = await issueTokens(app, user.id, user.email, user.tier);
    return reply.send({ user: sanitizeUser(user), ...tokens });
  });

  app.post('/v1/auth/refresh', async (request, reply) => {
    const body = refreshSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const tokenHash = hashToken(body.data.refreshToken);
    const userId = await validateRefreshToken(tokenHash);
    if (!userId) return reply.status(401).send({ message: 'Invalid or expired refresh token' });

    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) return reply.status(401).send({ message: 'User not found' });

    await revokeRefreshToken(tokenHash);
    const tokens = await issueTokens(app, user.id, user.email, user.tier);
    return reply.send(tokens);
  });

  app.post(
    '/v1/auth/logout',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const body = refreshSchema.safeParse(request.body);
      if (body.success) {
        const tokenHash = hashToken(body.data.refreshToken);
        await revokeRefreshToken(tokenHash);
      }
      return reply.status(204).send();
    },
  );

  app.delete(
    '/v1/auth/me',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
      await revokeAllUserTokens(userId);
      return reply.status(204).send();
    },
  );
}

async function issueTokens(
  app: FastifyInstance,
  userId: string,
  email: string,
  tier: string,
) {
  const accessToken = app.jwt.sign({ id: userId, email, tier }, { expiresIn: '15m' });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  await storeRefreshToken(userId, tokenHash);
  return { accessToken, refreshToken, expiresIn: 900 };
}

function sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; tier: string; onboardingCompleted: boolean }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    tier: user.tier,
    onboardingCompleted: user.onboardingCompleted,
  };
}
