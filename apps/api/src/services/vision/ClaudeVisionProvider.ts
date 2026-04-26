import { default as Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../../lib/env.js';

import type { VisionProvider, VisionResult, ClothingCategory, Season } from './VisionProvider.js';

const analysisSchema = z.object({
  category: z.enum([
    'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
    'accessories', 'bags', 'swimwear', 'activewear', 'underwear',
  ]),
  primaryColor: z.string(),
  secondaryColors: z.array(z.string()).max(5),
  styleTags: z.array(z.string()).min(3).max(10),
  brand: z.string().nullable(),
  material: z.string().nullable(),
  season: z.array(z.enum(['spring', 'summer', 'autumn', 'winter', 'all'])).min(1),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `Tu es un expert en mode et stylisme. Analyse les vêtements dans les images.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.

Règles :
- category : catégorie principale de la pièce
- primaryColor : couleur dominante en français, précis (ex: "noir", "bleu marine", "écru", "camel", "bordeaux", "vert kaki")
- secondaryColors : autres couleurs visibles en français (max 5)
- styleTags : tags de style descriptifs en français (ex: ["casual", "oversize", "streetwear"]) — min 3, max 10
- brand : marque visible sur la pièce, null si non visible (ne pas inventer)
- material : matière principale détectée parmi : coton, lin, soie, laine, cachemire, denim, cuir, daim, synthétique, polyester, velours, dentelle, null si incertain
- season : saisons adaptées à cette pièce
- confidence : niveau de confiance 0-1`;

export class ClaudeVisionProvider implements VisionProvider {
  readonly name = 'claude-haiku';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async analyze(imageBuffer: Buffer, mimeType: string): Promise<VisionResult> {
    const validMime = this.toValidMime(mimeType);

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: validMime,
                data: imageBuffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Analyse cette pièce vestimentaire et retourne le JSON demandé.',
            },
          ],
        },
      ],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.trim()) as unknown;
    const result = analysisSchema.parse(parsed);

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as { cache_read_input_tokens?: number; cache_creation_input_tokens?: number; input_tokens: number; output_tokens: number };
      console.log(`[Vision] in:${u.input_tokens} cache_read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`);
    }

    return {
      category: result.category as ClothingCategory,
      primaryColor: result.primaryColor,
      secondaryColors: result.secondaryColors,
      styleTags: result.styleTags,
      brand: result.brand,
      material: result.material,
      season: result.season as Season[],
      // Placeholder embedding until CLIP is wired — 512-dim zero vector
      embedding: new Array(512).fill(0) as number[],
      confidence: result.confidence,
    };
  }

  private toValidMime(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    if (mimeType === 'image/jpg') return 'image/jpeg';
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
      return mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    }
    return 'image/jpeg';
  }
}
