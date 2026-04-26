import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

const PREMIUM_PRICE_ID = process.env['STRIPE_PREMIUM_PRICE_ID'] ?? 'price_placeholder';

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
}

export async function stripeRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // Create or retrieve Stripe customer + checkout session
  app.post('/v1/stripe/checkout', auth, async (request, reply) => {
    const { id: userId, email } = request.user as { id: string; email: string };
    const stripe = getStripe();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env['APP_DEEP_LINK'] ?? 'outfitnow://'}premium/success`,
      cancel_url: `${process.env['APP_DEEP_LINK'] ?? 'outfitnow://'}premium/cancel`,
      metadata: { userId },
    });

    return reply.send({ url: session.url, sessionId: session.id });
  });

  // Customer portal (manage/cancel subscription)
  app.post('/v1/stripe/portal', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const stripe = getStripe();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      return reply.status(400).send({ message: 'No active subscription' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env['APP_DEEP_LINK'] ?? 'outfitnow://'}profile`,
    });

    return reply.send({ url: session.url });
  });

  // Get current subscription status
  app.get('/v1/stripe/subscription', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    const sub = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      isActive: sub !== null,
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    });
  });

  // Stripe webhook — must be raw body
  app.post(
    '/v1/stripe/webhook',
    { config: { rawBody: true } },
    async (request, reply) => {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
        return reply.status(400).send({ message: 'Stripe not configured' });
      }

      const stripe = getStripe();
      const sig = request.headers['stripe-signature'];
      if (!sig || typeof sig !== 'string') {
        return reply.status(400).send({ message: 'Missing stripe-signature' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          (request as unknown as { rawBody: Buffer }).rawBody,
          sig,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch {
        return reply.status(400).send({ message: 'Webhook signature invalid' });
      }

      await handleWebhookEvent(event);
      return reply.status(200).send({ received: true });
    },
  );
}

async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;

      const isActive = ['active', 'trialing'].includes(sub.status);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? '',
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            ...(sub.canceled_at && { canceledAt: new Date(sub.canceled_at * 1000) }),
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { tier: isActive ? 'premium' : 'free' },
        }),
      ]);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (!user) return;

      await prisma.$transaction([
        prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'canceled', canceledAt: new Date() },
        }),
        prisma.user.update({ where: { id: user.id }, data: { tier: 'free' } }),
      ]);
      break;
    }

    default:
      break;
  }
}
