import { default as Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

import { env } from '../../lib/env.js';

const avatarAnalysisSchema = z.object({
  bodyType: z.enum(['slim', 'athletic', 'regular', 'curvy', 'plus']),
  skinTone: z.enum(['light', 'medium-light', 'medium', 'medium-dark', 'dark']),
  hairColor: z.enum(['black', 'brown', 'blonde', 'red', 'grey', 'white', 'other']),
  hairLength: z.enum(['shaved', 'short', 'medium', 'long']),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

export type AvatarAnalysis = z.infer<typeof avatarAnalysisSchema>;

const SYSTEM_PROMPT = `Tu es un expert en morphologie et stylisme. Analyse les photos de personnes pour détecter leurs caractéristiques physiques.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown.

Règles :
- bodyType : silhouette générale (slim=svelte/fine, athletic=épaules larges/musclé, regular=proportions équilibrées, curvy=formes généreuses hanches/poitrine, plus=forte corpulence)
- skinTone : teinte de peau (light=très claire, medium-light=claire dorée, medium=dorée/méditerranéenne, medium-dark=ambrée/foncée, dark=ébène/très foncée)
- hairColor : couleur cheveux (black=noirs, brown=bruns/châtains, blonde=blonds, red=roux/auburn, grey=gris, white=blancs, other=colorés)
- hairLength : longueur cheveux (shaved=rasé/très court, short=court, medium=mi-long/épaules, long=long)
- confidence : niveau de confiance 0-1 (réduit si photo peu claire, floue, visage non visible)
- notes : observations utiles (optionnel)

Si la photo ne montre pas clairement une personne, retourne confidence: 0.1 avec des valeurs par défaut (regular, medium, brown, medium).`;

export class AvatarVisionProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async analyzePhoto(imageBuffer: Buffer, mimeType: string): Promise<AvatarAnalysis> {
    const validMime = this.toValidMime(mimeType);

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: validMime, data: imageBuffer.toString('base64') },
          },
          { type: 'text', text: 'Analyse cette personne et retourne le JSON demandé.' },
        ],
      }],
    });

    if (process.env.NODE_ENV !== 'production') {
      const u = message.usage as { cache_read_input_tokens?: number; input_tokens: number; output_tokens: number };
      console.log(`[AvatarVision] in:${u.input_tokens} cache_read:${u.cache_read_input_tokens ?? 0} out:${u.output_tokens}`);
    }

    const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '{}';
    return avatarAnalysisSchema.parse(JSON.parse(text));
  }

  private toValidMime(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    if (mimeType === 'image/jpg') return 'image/jpeg';
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
      return mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    }
    return 'image/jpeg';
  }
}
