import type { FastifyInstance } from 'fastify';

import { prisma } from '../lib/prisma.js';

export async function affiliateRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // Redirect with attribution tracking
  app.get('/v1/affiliate/redirect/:suggestionId', auth, async (request, reply) => {
    const { suggestionId } = request.params as { suggestionId: string };
    const { id: userId } = request.user as { id: string };

    const suggestion = await prisma.affiliateProductSuggestion.findUnique({
      where: { id: suggestionId },
      include: { product: true },
    });

    if (!suggestion || !suggestion.product.isActive) {
      return reply.status(404).send({ message: 'Product not found' });
    }

    // Increment click count + log event asynchronously
    void Promise.all([
      prisma.affiliateProductSuggestion.update({
        where: { id: suggestionId },
        data: { clickCount: { increment: 1 } },
      }),
      prisma.event.create({
        data: {
          userId,
          name: 'affiliate.click',
          payload: {
            suggestionId,
            productId: suggestion.productId,
            outfitId: suggestion.outfitId,
            network: suggestion.product.network,
            price: suggestion.product.price,
          },
        },
      }),
    ]);

    return reply.redirect(suggestion.product.affiliateUrl);
  });

  // List active affiliate products (admin feed ingestion preview)
  app.get('/v1/affiliate/products', auth, async (request, reply) => {
    const { page = '1', pageSize = '20', category } = request.query as {
      page?: string;
      pageSize?: string;
      category?: string;
    };

    const take = Math.min(Number(pageSize), 100);
    const skip = (Number(page) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.affiliateProduct.findMany({
        where: {
          isActive: true,
          ...(category && { category }),
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          price: true,
          currency: true,
          imageUrl: true,
          network: true,
          createdAt: true,
        },
      }),
      prisma.affiliateProduct.count({
        where: { isActive: true, ...(category && { category }) },
      }),
    ]);

    return reply.send({
      data,
      total,
      page: Number(page),
      hasMore: skip + data.length < total,
    });
  });
}
