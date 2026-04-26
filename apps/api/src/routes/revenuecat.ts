// ─── RevenueCat Webhook ───────────────────────────────────────────────────────
//
// RevenueCat sends events here when subscriptions change.
// We use this as the source of truth to update user.tier in the DB.
//
// Setup in RevenueCat dashboard:
//   Project → Integrations → Webhooks → Add URL
//   URL: https://your-api.com/v1/revenuecat/webhook
//   Authorization header: Bearer <REVENUECAT_WEBHOOK_SECRET>
//
// Docs: https://www.revenuecat.com/docs/webhooks

import type { FastifyInstance } from 'fastify';

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

// ─── RevenueCat event types that affect entitlement ───────────────────────────

const ACTIVATING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'TRANSFER',
]);

// ─── Payload types ────────────────────────────────────────────────────────────

interface RCEvent {
  type: string;
  app_user_id: string;          // = our userId (set via Purchases.logIn)
  aliases?: string[];
  original_app_user_id?: string;
  entitlements?: Record<string, { expires_date: string | null; purchase_date: string }>;
  expiration_at_ms?: number | null;
  product_id?: string;
  store?: string;
  period_type?: string;
  purchased_at_ms?: number;
  price?: number;
}

interface RCWebhookPayload {
  event: RCEvent;
  api_version?: string;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function revenuecatRoutes(app: FastifyInstance) {
  app.post('/v1/revenuecat/webhook', async (request, reply) => {
    // ── Auth ────────────────────────────────────────────────────────────────
    const secret = env.REVENUECAT_WEBHOOK_SECRET;
    if (secret) {
      const authHeader = request.headers['authorization'];
      const provided = typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '')
        : '';

      if (provided !== secret) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }
    }

    const payload = request.body as RCWebhookPayload;
    const event   = payload?.event;
    if (!event?.type || !event?.app_user_id) {
      return reply.status(400).send({ message: 'Invalid payload' });
    }

    await handleRCEvent(event);

    return reply.status(200).send({ received: true });
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleRCEvent(event: RCEvent): Promise<void> {
  // The app_user_id is our DB userId — set via Purchases.logIn(userId)
  const userId = event.app_user_id;

  // Ignore anonymous users (RC generates "$RCAnonymousID:xxx" before logIn)
  if (userId.startsWith('$')) {
    console.warn(`[RevenueCat] Skipping anonymous user: ${userId}`);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tier: true },
  });
  if (!user) {
    console.warn(`[RevenueCat] User not found: ${userId} (event: ${event.type})`);
    return;
  }

  let newTier: 'premium' | 'free' | null = null;

  if (ACTIVATING_EVENTS.has(event.type)) {
    newTier = 'premium';
  } else if (event.type === 'EXPIRATION' || event.type === 'BILLING_ISSUE') {
    // True end of access — downgrade
    newTier = 'free';
  }
  // CANCELLATION: user cancelled but still has access until period end
  // We wait for EXPIRATION to actually downgrade
  else if (event.type === 'CANCELLATION') {
    // Log but don't change tier yet
    console.warn(`[RevenueCat] Cancellation for ${userId} — awaiting EXPIRATION`);
  }

  if (newTier !== null && user.tier !== newTier) {
    await prisma.user.update({
      where: { id: userId },
      data: { tier: newTier },
    });

    await prisma.event.create({
      data: {
        userId,
        name: newTier === 'premium' ? 'subscription.activated' : 'subscription.expired',
        payload: {
          rcEventType: event.type,
          productId: event.product_id ?? null,
          store: event.store ?? null,
          expirationMs: event.expiration_at_ms ?? null,
        },
      },
    });

    console.warn(`[RevenueCat] ${userId} → ${newTier} (${event.type})`);
  }
}
