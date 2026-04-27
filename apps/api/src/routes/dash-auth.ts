import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { env } from '../lib/env.js';

const loginSchema = z.object({
  secret: z.string().min(1),
});

export async function dashAuthRoutes(app: FastifyInstance) {
  // POST /v1/dash/auth/login — dashboard-only auth, completely separate from user auth
  app.post('/v1/dash/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ message: 'Invalid request' });

    if (body.data.secret !== env.DASHBOARD_SECRET) {
      return reply.status(401).send({ message: 'Invalid dashboard secret' });
    }

    const token = app.jwt.sign({ role: 'admin', sub: 'dashboard' }, { expiresIn: '12h' });

    return { accessToken: token };
  });
}
