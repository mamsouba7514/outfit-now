// ─── SearchIntelligenceService — requêtes optimisées par Claude ──────────────
//
// Prend une requête en langage naturel + profil style utilisateur
// et génère des requêtes de recherche optimisées pour les moteurs shopping.

import { default as Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../../lib/env.js';

const queriesSchema = z.object({
  queries: z.array(z.object({
    query:    z.string().max(120),
    category: z.string(),
    priority: z.number().min(1).max(3),
  })).min(1).max(5),
  intent:  z.string().max(200),
});

export type OptimizedQueries = z.infer<typeof queriesSchema>;

const SYSTEM = `Tu es expert en e-commerce mode et luxe. Tu connais parfaitement les maisons de couture et les marques de luxe (Amiri, Gucci, Dior, Louis Vuitton, Prada, Balenciaga, Saint Laurent, Bottega Veneta, Valentino, Loewe, Jacquemus, Celine, Hermès, Chanel, Off-White, Rick Owens, Maison Margiela).

Transforme une demande utilisateur en requêtes de recherche shopping optimisées.
Réponds UNIQUEMENT avec un JSON valide, sans markdown.

Format :
{
  "queries": [
    { "query": "requête précise pour moteur shopping", "category": "tops|bottoms|outerwear|shoes|accessories|bags|dresses", "priority": 1 }
  ],
  "intent": "résumé de l'intention d'achat en 1 phrase"
}

Règles :
- Si la marque est mentionnée : inclure le NOM OFFICIEL EXACT de la marque (ex: "Amiri" pas "amiri", "Christian Dior" pas "Dior" pour certains produits)
- Pour les marques luxe : ajouter la catégorie précise du produit signature (ex: "Amiri MX1 jeans", "Gucci Horsebit loafer", "Dior Saddle bag")
- Requêtes précises : marque + produit + couleur/matière si pertinent
- Adapter au style de l'utilisateur si fourni
- priority 1 = plus pertinent, 3 = alternatif
- Langues : utiliser la terminologie officielle anglaise pour les articles de luxe (noms de collection, modèles)
- Max 5 requêtes, min 1`;

export class SearchIntelligenceService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async optimizeQuery(params: {
    userQuery:      string;
    gender?:        string | null;
    styleProfile?:  string | null;
    budget?:        number | null;
    occasion?:      string | null;
  }): Promise<OptimizedQueries> {
    const userContent = [
      `Demande utilisateur : "${params.userQuery}"`,
      params.gender        && `Genre : ${params.gender}`,
      params.occasion      && `Occasion : ${params.occasion}`,
      params.budget        && `Budget max : ${params.budget} €`,
      params.styleProfile  && `Profil style : ${params.styleProfile}`,
    ].filter(Boolean).join('\n');

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    });

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as { input_tokens: number; output_tokens: number };
      console.log(`[SearchAI] in:${u.input_tokens} out:${u.output_tokens}`);
    }

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '{}';
    return queriesSchema.parse(JSON.parse(text));
  }

  // Génère une requête "trouver similaire" depuis les métadonnées d'une pièce
  buildSimilarQuery(item: {
    category: string;
    primaryColor: string;
    styleTags: string[];
    brand: string | null;
  }): string {
    const parts = [item.primaryColor, item.category];
    if (item.styleTags.length > 0) parts.push(item.styleTags.slice(0, 2).join(' '));
    if (item.brand) parts.push(`style ${item.brand}`);
    return parts.join(' ');
  }
}
