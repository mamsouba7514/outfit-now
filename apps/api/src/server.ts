import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';

import { env } from './lib/env.js';
import { redis } from './lib/redis.js';
import { affiliateRoutes } from './routes/affiliate.js';
import { authRoutes } from './routes/auth.js';
import { avatarRoutes } from './routes/avatar.js';
import { briefRoutes } from './routes/briefs.js';
import { dressingRoutes } from './routes/dressing.js';
import { meRoutes } from './routes/me.js';
import { socialRoutes } from './routes/social.js';
import { revenuecatRoutes } from './routes/revenuecat.js';
import { stripeRoutes } from './routes/stripe.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      ...(env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  const allowedOrigins = env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)
    : true;
  await app.register(cors, { origin: allowedOrigins });
  await app.register(sensible);

  await app.register(rateLimit, {
    redis,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => (req.user as { id?: string } | undefined)?.id ?? req.ip,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'Outfit Now API', version: '1.0.0', description: 'Outfit Now backend API' },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

  app.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(dressingRoutes);
  await app.register(briefRoutes);
  await app.register(stripeRoutes);
  await app.register(revenuecatRoutes);
  await app.register(affiliateRoutes);
  await app.register(socialRoutes);
  await app.register(avatarRoutes);

  return app;
}

async function start() {
  const app = await buildApp();

  process.on('uncaughtException', (err) => {
    app.log.error({ err }, 'uncaughtException');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    app.log.error({ reason }, 'unhandledRejection');
    process.exit(1);
  });

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void start();
