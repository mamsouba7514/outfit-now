import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { searchProducts, isSearchAvailable } from '../services/shopping/SearchService.js';
import { SearchIntelligenceService } from '../services/shopping/SearchIntelligenceService.js';
import { buildKarlContext } from '../services/styleProfile.js';
import { getStyleProfile } from '../services/styleProfile.js';

const searchSchema = z.object({
  query:      z.string().min(1).max(300),
  category:   z.string().optional(),
  maxPrice:   z.number().min(0).max(10000).optional(),
  minPrice:   z.number().min(0).optional(),
  brands:     z.array(z.string()).max(5).optional(),
  maxResults: z.number().int().min(1).max(20).default(9),
  useAI:      z.boolean().default(true),
});

const similarSchema = z.object({
  dressingItemId: z.string(),
  maxResults:     z.number().int().min(1).max(12).default(6),
});

const HISTORY_KEY = (userId: string) => `search:history:${userId}`;
const HISTORY_TTL = 60 * 60 * 24 * 30; // 30 days

export async function searchRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // ── GET /v1/search/status — disponibilité des fournisseurs ────────────────
  app.get('/v1/search/status', auth, async (_request, reply) => {
    return reply.send({
      available: isSearchAvailable(),
      providers: {
        serpapi:  !!process.env.SERPAPI_KEY,
        serper:   !!process.env.SERPER_API_KEY,
      },
    });
  });

  // ── POST /v1/search/style — recherche mode intelligente ───────────────────
  app.post('/v1/search/style', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = searchSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { query, category, maxPrice, minPrice, brands, maxResults, useAI } = body.data;

    // Charger profil style pour personnaliser la recherche
    const [user, styleProfile] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { gender: true } }),
      getStyleProfile(userId).catch(() => null),
    ]);

    let finalQueries: Array<{ query: string; category: string }> = [{ query, category: category ?? 'general' }];
    let intent = query;

    // Optimisation IA si activée et clé Anthropic disponible
    if (useAI && process.env.ANTHROPIC_API_KEY) {
      try {
        const ai = new SearchIntelligenceService();
        const karlCtx = styleProfile ? buildKarlContext(styleProfile) : null;
        const optimized = await ai.optimizeQuery({
          userQuery:    query,
          gender:       user?.gender ?? null,
          styleProfile: karlCtx,
          budget:       maxPrice ?? null,
        });
        finalQueries = optimized.queries
          .sort((a, b) => a.priority - b.priority)
          .map((q) => ({ query: q.query, category: q.category }));
        intent = optimized.intent;
      } catch {
        // fallback à la requête brute
      }
    }

    // Exécuter les recherches (max 3 requêtes en parallèle)
    const results = await Promise.all(
      finalQueries.slice(0, 3).map((q) =>
        searchProducts(q.query, {
          category:  q.category !== 'general' ? q.category : category,
          maxPrice,
          minPrice,
          brands,
        }, Math.ceil(maxResults / finalQueries.length)),
      ),
    );

    // Dédupliquer par titre
    const seen = new Set<string>();
    const merged = results
      .flat()
      .filter((r) => {
        const key = r.title.toLowerCase().slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxResults);

    // Sauvegarder dans l'historique
    const histEntry = JSON.stringify({ query, intent, count: merged.length, at: Date.now() });
    await redis.lpush(HISTORY_KEY(userId), histEntry);
    await redis.ltrim(HISTORY_KEY(userId), 0, 19); // garder les 20 dernières
    await redis.expire(HISTORY_KEY(userId), HISTORY_TTL);

    return reply.send({
      results: merged,
      intent,
      total: merged.length,
      queries: finalQueries.map((q) => q.query),
      available: isSearchAvailable(),
    });
  });

  // ── POST /v1/search/similar — trouver des pièces similaires ──────────────
  app.post('/v1/search/similar', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = similarSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const item = await prisma.dressingItem.findFirst({
      where: { id: body.data.dressingItemId, userId },
    });
    if (!item) return reply.status(404).send({ message: 'Pièce non trouvée.' });

    const ai = new SearchIntelligenceService();
    const query = ai.buildSimilarQuery({
      category:     item.category,
      primaryColor: item.primaryColor,
      styleTags:    item.styleTags,
      brand:        item.brand,
    });

    const results = await searchProducts(
      query,
      { category: item.category },
      body.data.maxResults,
    );

    return reply.send({
      results,
      query,
      sourceItem: {
        id:           item.id,
        category:     item.category,
        primaryColor: item.primaryColor,
        brand:        item.brand,
      },
    });
  });

  // ── GET /v1/search/history — historique des recherches ───────────────────
  app.get('/v1/search/history', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    const raw = await redis.lrange(HISTORY_KEY(userId), 0, 19);
    const history = raw.map((entry) => {
      try { return JSON.parse(entry) as { query: string; intent: string; count: number; at: number }; }
      catch { return null; }
    }).filter(Boolean);

    return reply.send({ history });
  });

  // ── DELETE /v1/search/history — effacer l'historique ─────────────────────
  app.delete('/v1/search/history', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    await redis.del(HISTORY_KEY(userId));
    return reply.status(204).send();
  });
}
