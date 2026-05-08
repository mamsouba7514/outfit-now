import { default as Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../../lib/env.js';

import type { VisionProvider, VisionResult, ClothingCategory, Season } from './VisionProvider.js';

const CATEGORY_MAP: Record<string, string> = {
  jean: 'bottoms',
  jeans: 'bottoms',
  pantalon: 'bottoms',
  short: 'bottoms',
  jupe: 'bottoms',
  legging: 'bottoms',
  leggings: 'bottoms',
  chemise: 'tops',
  tshirt: 'tops',
  't-shirt': 'tops',
  pull: 'tops',
  sweat: 'tops',
  débardeur: 'tops',
  top: 'tops',
  blouse: 'tops',
  polo: 'tops',
  robe: 'dresses',
  manteau: 'outerwear',
  veste: 'outerwear',
  blouson: 'outerwear',
  parka: 'outerwear',
  imperméable: 'outerwear',
  blazer: 'outerwear',
  gilet: 'outerwear',
  chaussure: 'shoes',
  chaussures: 'shoes',
  basket: 'shoes',
  baskets: 'shoes',
  botte: 'shoes',
  bottes: 'shoes',
  sandale: 'shoes',
  sandales: 'shoes',
  talon: 'shoes',
  sac: 'bags',
  sacoche: 'bags',
  cartable: 'bags',
  accessoire: 'accessories',
  ceinture: 'accessories',
  écharpe: 'accessories',
  chapeau: 'accessories',
  bonnet: 'accessories',
  lunettes: 'accessories',
  bijou: 'accessories',
  maillot: 'swimwear',
  sport: 'activewear',
  sportswear: 'activewear',
  sous: 'underwear',
  brassière: 'underwear',
};

const SEASON_MAP: Record<string, string> = {
  printemps: 'spring',
  été: 'summer',
  automne: 'autumn',
  hiver: 'winter',
  'toutes saisons': 'all',
  'toute saison': 'all',
  'toutes les saisons': 'all',
};

function normalizeEnums(raw: Record<string, unknown>): Record<string, unknown> {
  if (typeof raw.category === 'string') {
    const lower = raw.category.toLowerCase().trim();
    raw.category = CATEGORY_MAP[lower] ?? raw.category;
  }
  if (typeof raw.season === 'string') {
    raw.season = [raw.season];
  }
  if (Array.isArray(raw.season)) {
    raw.season = (raw.season as unknown[]).map((s) =>
      typeof s === 'string' ? (SEASON_MAP[s.toLowerCase().trim()] ?? s) : s,
    );
  }
  return raw;
}

const VALID_CATEGORIES = [
  'tops',
  'bottoms',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
  'bags',
  'swimwear',
  'activewear',
  'underwear',
] as const;
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all'] as const;

const analysisSchema = z.object({
  category: z.enum(VALID_CATEGORIES).catch('tops'),
  primaryColor: z.string().catch('unknown'),
  secondaryColors: z
    .union([z.array(z.string()), z.string().transform((s) => (s ? [s] : []))])
    .catch([])
    .transform((v) => v.slice(0, 5)),
  styleTags: z
    .union([
      z.array(z.string()),
      z.string().transform((s) =>
        s
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ])
    .catch(['casual'])
    .transform((v) => {
      const arr = v;
      return arr.length < 3
        ? [...arr, ...['casual', 'classique', 'basique'].slice(0, 3 - arr.length)]
        : arr.slice(0, 10);
    }),
  brand: z.union([z.string(), z.null()]).catch(null),
  material: z.union([z.string(), z.null()]).catch(null),
  season: z
    .union([z.array(z.enum(VALID_SEASONS)), z.string().transform((s) => [s])])
    .catch(['all'])
    .transform((v) => {
      const arr = v as string[];
      const valid = arr
        .map((s) => SEASON_MAP[s.toLowerCase().trim()] ?? s)
        .filter((s) => VALID_SEASONS.includes(s as (typeof VALID_SEASONS)[number]));
      return valid.length > 0 ? valid : ['all'];
    }),
  confidence: z.number().min(0).max(1).catch(0.8),
});

const SYSTEM_PROMPT = `Tu es un expert en mode et stylisme. Analyse les vêtements dans les images.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte supplémentaire.

Règles :
- category : ONLY one of these exact values: tops, bottoms, dresses, outerwear, shoes, accessories, bags, swimwear, activewear, underwear
- primaryColor : couleur dominante en français, précis (ex: "noir", "bleu marine", "écru", "camel", "bordeaux", "vert kaki")
- secondaryColors : autres couleurs visibles en français (max 5)
- styleTags : tags de style descriptifs en français (ex: ["casual", "oversize", "streetwear"]) — min 3, max 10
- brand : marque visible sur la pièce, null si non visible (ne pas inventer)
- material : matière principale détectée parmi : coton, lin, soie, laine, cachemire, denim, cuir, daim, synthétique, polyester, velours, dentelle, null si incertain
- season : ONLY values from: spring, summer, autumn, winter, all
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] as any,
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
    const raw = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    const parsed = normalizeEnums(JSON.parse(raw) as Record<string, unknown>);
    const result = analysisSchema.parse(parsed);

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as {
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
        input_tokens: number;
        output_tokens: number;
      };
      console.log(
        `[Vision] in:${u.input_tokens} cache_read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`,
      );
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
