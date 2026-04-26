import { default as Anthropic } from '@anthropic-ai/sdk';
import type { DressingItem } from '@prisma/client';
import { z } from 'zod';

import { env } from '../../lib/env.js';
import { searchShoppingProducts, type ShoppingProduct } from '../shopping/SerpApiShoppingService.js';
import { buildKarlContext } from '../styleProfile.js';

import type { BriefContext, OutfitProposal, StylingProvider } from './StylingProvider.js';
import { scoreOutfit, validateColorCoherence, validateRecentUsage } from './rules.js';
import { detectTier, extractJson } from './stylingUtils.js';
export { detectTier, extractJson };

type Tier = ReturnType<typeof detectTier>;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const outfitSchema = z.object({
  outfits: z.array(z.object({
    itemIds: z.array(z.string()).min(3).max(7),
    aestheticName: z.string().max(60),
    colorStory: z.string().max(120),
    justification: z.string().min(20).max(800),
    aiScore: z.number().min(0).max(100),
    shoppingQueries: z.array(z.object({
      query: z.string(),
      category: z.string(),
    })).optional(),
  })).min(1).max(3),
});

const shoppingOutfitSchema = z.object({
  outfits: z.array(z.object({
    aestheticName: z.string().max(60),
    colorStory: z.string().max(120),
    justification: z.string().min(20).max(800),
    aiScore: z.number().min(0).max(100),
    shoppingQueries: z.array(z.object({
      query: z.string(),
      category: z.string(),
    })).min(3).max(7),
  })).min(1).max(3),
});

// ─── Karl — System Prompts ────────────────────────────────────────────────────
//
// Karl est notre styliste IA, nommé en hommage à Karl Lagerfeld.
// Comme lui : encyclopédique, exigeant, direct, sans concession,
// mais profondément attentionné envers son client.
// "Fashion is not something that exists in dresses only. Fashion is in the sky,
//  in the street. Fashion has to do with ideas, the way we live, what is happening."
//                                                         — Karl Lagerfeld

const KARL_IDENTITY = `Tu t'appelles Karl. Tu es le styliste IA personnel de cet utilisateur, en hommage à Karl Lagerfeld — son encyclopédisme, son exigence absolue, son sens de l'élégance intemporelle et sa capacité à connaître son client mieux que quiconque.

Comme Lagerfeld : tu observes, tu mémorises, tu t'améliores. Plus l'utilisateur ajoute des pièces à son dressing, poste des photos de ses tenues et sauvegarde des looks, plus ta connaissance de son style devient précise et unique.

Tu es direct, opinioné, sans concession — mais toujours au service de l'élégance de ton client.`;

const BASE_FASHION_KNOWLEDGE = `
MAÎTRISE STYLISTIQUE REQUISE :
• Théorie des couleurs : harmonie complémentaire, analogique, monochromatique, triadique, split-complementaire. Toujours nommer la palette avec précision (ex. : « camel, blanc cassé, cognac — palette analogique chaude »).
• Proportions & silhouette : règle des tiers (1/3 – 2/3), balance oversized/fitted, règle du volume (une pièce large = une pièce ajustée), longueurs qui élancent ou structurent.
• Codes vestimentaires : casual, smart casual, business casual, business formal, cocktail, black tie — maîtrise de chaque registre et de ses nuances.
• Textures & matières : contraste intentionnel (mat vs brillant, structuré vs fluide, rugueux vs lisse), éviter l'accumulation de matières concurrentes.
• Mixité des motifs : harmonie de scale (grand motif + uni, ou motifs de tailles différentes), point d'ancrage neutre.
• Fil directeur : chaque tenue doit avoir un élément unificateur — couleur répétée, famille stylistique, époque, mood.
• Accessoires : ils finissent une tenue, ne jamais les ignorer dans la recommandation shopping.
• Saisonnalité : cohérence matières/couleurs avec la saison.
`;

const JSON_FORMAT_DRESSING = `
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans commentaire.

Format attendu :
{
  "outfits": [
    {
      "itemIds": ["id1", "id2", "id3"],
      "aestheticName": "Nom évocateur de la tenue en 3-5 mots",
      "colorStory": "Description précise de la palette chromatique et de son harmonie",
      "justification": "Analyse stylistique Karl : pourquoi ces pièces fonctionnent, règle de proportion appliquée, registre de l'occasion adressé, effet silhouette. (200-600 caractères)",
      "aiScore": 85,
      "shoppingQueries": [
        { "query": "ceinture cuir marron camel femme", "category": "accessories" }
      ]
    }
  ]
}

RÈGLES ABSOLUES :
- 3 à 6 pièces par tenue, IDs exacts depuis la liste fournie
- Zéro doublon d'ID dans une même tenue
- Variation maximale entre les tenues proposées
- aiScore de 0 à 100 : évalue honnêtement la cohérence de la tenue
- Si le profil style est présent, Karl l'utilise pour personnaliser CHAQUE choix`;

const SYSTEM_STANDARD = `${KARL_IDENTITY}

Niveau actuel : Styliste professionnel certifié, formé à Paris et Milan, 12 ans d'expérience. Tu composes des tenues équilibrées, cohérentes et flatteuses.
${BASE_FASHION_KNOWLEDGE}${JSON_FORMAT_DRESSING}`;

const SYSTEM_PREMIUM = `${KARL_IDENTITY}

Niveau actuel : Directeur artistique mode, ancien assistant de grands couturiers. Chaque tenue a une identité forte, une narrative, une intention.
${BASE_FASHION_KNOWLEDGE}
APPROCHE PREMIUM :
• Identifie les "pièces héros" (statement piece) et construis la tenue autour d'elles
• Joue avec la tension entre codes (tailoring masculin + détail féminin, luxe + casual)
• Nomme chaque tenue avec son univers mode (ex. "Quiet Luxury Weekend", "Left Bank Parisienne")
• La justification est une mini-analyse de mode : règles appliquées, contraste intentionnel, références
• Si le profil style est riche : Karl l'exploite pour affiner chaque choix et proposer des tenues qui correspondent à son style établi${JSON_FORMAT_DRESSING}`;

const SYSTEM_LUXE = `${KARL_IDENTITY}

Niveau actuel : Grand styliste international. Tu as collaboré avec Chanel, Loewe, The Row, Bottega Veneta, Dries Van Noten. Ta vision est sans égal.
${BASE_FASHION_KNOWLEDGE}
APPROCHE LUXE — SANS COMPROMIS :
• Chaque tenue est une œuvre : elle a une saison, un mood, une histoire, une personne précise à qui elle s'adresse
• Tu travailles la lumière des matières (comment une pièce réagit à la lumière, quelle texture dialogue avec quelle autre)
• Tu convies des références : "l'esprit Phoebe Philo chez Celine", "le volume Margiela déstructuré", "la rigueur The Row"
• Tu subvertis les codes avec intention : un smoking avec des sneakers pointus, un manteau oversize sur une robe slip
• La justification est une vraie critique de mode : narrative, références nommées, tension créée, instruction de port précise
• Si le profil style est présent et riche : Karl s'y réfère explicitement ("Connaissant votre penchant pour le minimaliste noir...")${JSON_FORMAT_DRESSING}`;

const SHOPPING_SYSTEM_LUXE = `${KARL_IDENTITY}

Mode : Personal shopper d'exception, formé chez Colette Paris, Net-a-Porter, 10 Corso Como. Tu construis des looks complets à acheter.
${BASE_FASHION_KNOWLEDGE}
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown.

Format attendu :
{
  "outfits": [
    {
      "aestheticName": "Nom du look — 4-6 mots",
      "colorStory": "Palette précise avec harmonie nommée",
      "justification": "Vision Karl du look : qui le porte, dans quel contexte, quel effet. Architecture des pièces. Références. Instructions de port. (300-600 caractères)",
      "aiScore": 94,
      "shoppingQueries": [
        { "query": "blazer oversize laine gris perle femme A.P.C.", "category": "outerwear" },
        { "query": "pantalon taille haute straight crop crème Toteme", "category": "bottoms" },
        { "query": "chemise popeline blanc broderie AMI Paris", "category": "tops" },
        { "query": "loafers cuir noir chunky plateforme femme", "category": "shoes" },
        { "query": "sac hobo cuir souple caramel Isabel Marant", "category": "bags" }
      ]
    }
  ]
}

Règles : tenues portables mais éditorialement fortes, marques accessibles au luxe (Sandro, Maje, A.P.C., Jacquemus, Isabel Marant, AMI, Toteme, Officine Générale, COS, Arket), requêtes shopping ultra-précises.
Si le profil style est présent : Karl l'utilise pour orienter les recherches shopping vers les codes stylistiques de l'utilisateur.`;

// ─── Provider ─────────────────────────────────────────────────────────────────

export class ClaudeStylingProvider implements StylingProvider {
  readonly name = 'claude-sonnet-4-6-luxe';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async compose(
    dressing: DressingItem[],
    brief: BriefContext,
    count: number,
  ): Promise<OutfitProposal[]> {
    const mode = brief.composeMode ?? 'mix';
    if (mode === 'new') return this.composeFromShopping(brief, count);
    return this.composeFromDressing(dressing, brief, count, mode === 'mix');
  }

  // ── Dressing-based composition ─────────────────────────────────────────────

  private async composeFromDressing(
    dressing: DressingItem[],
    brief: BriefContext,
    count: number,
    withShopping: boolean,
  ): Promise<OutfitProposal[]> {
    const tier = detectTier(brief.styleNotes);
    const systemPrompt = tier === 'luxe' ? SYSTEM_LUXE : tier === 'premium' ? SYSTEM_PREMIUM : SYSTEM_STANDARD;
    const maxTokens = tier === 'luxe' ? 4096 : tier === 'premium' ? 2560 : 1800;

    const dressingDesc = this.buildDressingDesc(dressing);
    const briefDesc = this.buildBriefDesc(brief, tier);
    const shoppingInstruction = withShopping
      ? `\nAjoute ${tier === 'luxe' ? '2 à 3' : '1 à 2'} shoppingQueries par tenue — pièces complémentaires précises pour élever le look.`
      : '';

    const karlContext = brief.styleProfile ? buildKarlContext(brief.styleProfile) : null;
    const userContent = [
      karlContext,
      briefDesc,
      `\nDressing disponible (${dressing.length} pièces) :\n${dressingDesc}`,
      `\nPropose exactement ${count} tenue(s) distinctes, chacune avec une identité propre.${shoppingInstruction}`,
    ].filter(Boolean).join('\n');

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    });

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as { cache_read_input_tokens?: number; cache_creation_input_tokens?: number; input_tokens: number; output_tokens: number };
      console.log(`[Karl] in:${u.input_tokens} cache_read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`);
    }

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '{}';
    const parsed = outfitSchema.parse(JSON.parse(extractJson(text)));

    const itemMap = new Map(dressing.map((item) => [item.id, item]));
    const outfits: OutfitProposal[] = [];
    const usedItemsPerOutfit: DressingItem[][] = [];

    for (const proposal of parsed.outfits) {
      const items = proposal.itemIds
        .map((id) => itemMap.get(id))
        .filter((item): item is DressingItem => item !== undefined);

      if (items.length < 3) continue;

      const rulesPass = validateRecentUsage(items) && validateColorCoherence(items);
      if (!rulesPass && outfits.length > 0) continue;

      // Blend AI score with rule-based score
      const rulesScore = scoreOutfit(items, usedItemsPerOutfit);
      const aiNormalized = proposal.aiScore / 100;
      const blendedScore = rulesScore * 0.4 + aiNormalized * 0.6;

      usedItemsPerOutfit.push(items);

      // Enrich justification with aesthetic name and color story
      const richJustification = `${proposal.aestheticName} — ${proposal.colorStory}\n${proposal.justification}`;

      let shoppingResults: ShoppingProduct[] | undefined;
      if (withShopping && proposal.shoppingQueries?.length) {
        const results = await Promise.all(
          proposal.shoppingQueries.map((q) =>
            searchShoppingProducts(q.query, q.category, tier === 'luxe' ? 3 : 2),
          ),
        );
        shoppingResults = results.flat().slice(0, tier === 'luxe' ? 9 : 6);
      }

      outfits.push({
        items,
        justification: richJustification,
        score: Math.min(1, blendedScore),
        shoppingResults: shoppingResults ?? [],
      });
    }

    return outfits;
  }

  // ── Shopping-based composition ─────────────────────────────────────────────

  private async composeFromShopping(
    brief: BriefContext,
    count: number,
  ): Promise<OutfitProposal[]> {
    const tier = detectTier(brief.styleNotes);
    const maxTokens = tier === 'luxe' ? 4096 : tier === 'premium' ? 2560 : 1800;
    const briefDesc = this.buildBriefDesc(brief, tier);

    const karlContext = brief.styleProfile ? buildKarlContext(brief.styleProfile) : null;
    const shoppingUserContent = [
      karlContext,
      briefDesc,
      `\nPropose ${count} tenue(s) complètes à acheter. Chaque tenue doit avoir une identité forte et des pièces qui se répondent.`,
    ].filter(Boolean).join('\n');

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: [{ type: 'text', text: SHOPPING_SYSTEM_LUXE, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: shoppingUserContent,
      }],
    });

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as { cache_read_input_tokens?: number; cache_creation_input_tokens?: number; input_tokens: number; output_tokens: number };
      console.log(`[Karl/shopping] in:${u.input_tokens} cache_read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`);
    }

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '{}';
    const parsed = shoppingOutfitSchema.parse(JSON.parse(extractJson(text)));
    const outfits: OutfitProposal[] = [];

    for (const proposal of parsed.outfits) {
      const results = await Promise.all(
        proposal.shoppingQueries.map((q) =>
          searchShoppingProducts(q.query, q.category, tier === 'luxe' ? 3 : 2),
        ),
      );
      const shoppingResults = results.flat().slice(0, tier === 'luxe' ? 12 : 8);
      const richJustification = `${proposal.aestheticName} — ${proposal.colorStory}\n${proposal.justification}`;

      outfits.push({
        items: [],
        justification: richJustification,
        score: proposal.aiScore / 100,
        shoppingResults,
      });
    }

    return outfits;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildDressingDesc(dressing: DressingItem[]): string {
    return dressing
      .map((item) => {
        const parts = [
          `ID:${item.id}`,
          item.category,
          item.primaryColor,
          item.brand ? `marque:${item.brand}` : null,
          item.styleTags.length ? `style:[${item.styleTags.join(', ')}]` : null,
          item.season?.length ? `saison:[${item.season.join('/')}]` : null,
          item.wornCount > 0 ? `porté:${item.wornCount}x` : 'jamais porté',
        ].filter(Boolean);
        return parts.join(' | ');
      })
      .join('\n');
  }

  private buildBriefDesc(brief: BriefContext, tier: Tier): string {
    const genderLabel: Record<string, string> = {
      male: 'Homme',
      female: 'Femme',
      non_binary: 'Non-binaire',
      prefer_not_to_say: 'Non précisé',
    };

    const tierLabel = tier === 'luxe'
      ? '🖤 GÉNÉRATION LUXE — vision haut de gamme, curation sans compromis'
      : tier === 'premium'
        ? '✦ GÉNÉRATION PREMIUM — curation approfondie, analyse poussée'
        : null;

    return [
      tierLabel,
      brief.gender && `Genre : ${genderLabel[brief.gender] ?? brief.gender}`,
      `Occasion : ${brief.occasion}`,
      brief.weatherNote && `Météo : ${brief.weatherNote}`,
      brief.colorNote && `Contrainte couleur : ${brief.colorNote}`,
      brief.styleTags?.length && `Univers style demandé : ${brief.styleTags.join(', ')}`,
      brief.budget && `Budget max : ${brief.budget} €`,
      brief.styleNotes && !brief.styleNotes.toLowerCase().includes('génération') && `Notes : ${brief.styleNotes}`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
