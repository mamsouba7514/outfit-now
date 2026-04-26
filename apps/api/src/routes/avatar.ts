import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { createPresignedDownloadUrl, createPresignedUploadUrl, s3, getPublicUrl } from '../lib/s3.js';

// ─── fal.ai — face-preserving generation (PuLID-Flux) ────────────────────────
//
// PuLID = "Pure Identity": génère une photo pleine corps en préservant
// le visage/identité de la personne depuis une photo de référence.
// Doc: https://fal.ai/models/fal-ai/pulid-flux

async function generateWithFacePreservation(
  selfieBuffer: Buffer,
  prompt: string,
): Promise<string> {
  const key = env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY not configured');

  // 1. Upload du selfie vers le stockage fal.ai (URL temporaire publique)
  const uploadRes = await fetch('https://fal.run/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Key ${key}`,
      'Content-Type': 'image/jpeg',
    },
    body: selfieBuffer as unknown as BodyInit,
  });
  if (!uploadRes.ok) throw new Error(`fal upload error: ${uploadRes.status}`);
  const { url: selfieUrl } = (await uploadRes.json()) as { url: string };

  // 2. Génération PuLID-Flux avec préservation d'identité
  const genRes = await fetch('https://fal.run/fal-ai/pulid-flux', {
    method: 'POST',
    headers: {
      Authorization: `Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference_images: [{ image_url: selfieUrl }],
      prompt,
      num_inference_steps: 20,
      guidance_scale: 7,
      id_scale: 1.0,           // force max identity preservation
      image_size: { width: 512, height: 768 },
      num_images: 1,
    }),
  });
  if (!genRes.ok) {
    const err = await genRes.text();
    throw new Error(`fal generation error: ${genRes.status} — ${err}`);
  }
  const result = (await genRes.json()) as { images: { url: string }[] };
  const imageUrl = result.images?.[0]?.url;
  if (!imageUrl) throw new Error('fal returned no image');
  return imageUrl;
}

// ─── Replicate helpers (fallback, text-only) ──────────────────────────────────

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
};

async function pollReplicate(predictionId: string, maxWaitMs = 120_000): Promise<string> {
  const token = env.REPLICATE_API_TOKEN;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pred = (await res.json()) as ReplicatePrediction;
    if (pred.status === 'succeeded' && pred.output?.[0]) return pred.output[0];
    if (pred.status === 'failed' || pred.status === 'canceled') throw new Error(`Generation ${pred.status}: ${pred.error}`);
  }
  throw new Error('Generation timeout');
}

// Build Flux prompt from avatar params
function buildAvatarPrompt(params: {
  bodyType: string; skinTone: string; hairColor: string; hairLength: string; heightCm: number; gender?: string | null;
}): string {
  const skinMap: Record<string, string> = {
    light: 'fair caucasian', 'medium-light': 'light warm', medium: 'golden medium', 'medium-dark': 'deep warm brown', dark: 'dark ebony',
  };
  const hairColorMap: Record<string, string> = {
    black: 'jet black', brown: 'chestnut brown', blonde: 'golden blonde', red: 'auburn red', grey: 'silver grey', white: 'platinum white', other: 'colored',
  };
  const hairLengthMap: Record<string, string> = {
    shaved: 'shaved head', short: 'short hair', medium: 'shoulder-length hair', long: 'long flowing hair',
  };
  const bodyMap: Record<string, string> = {
    slim: 'slim slender', athletic: 'athletic muscular', regular: 'average', curvy: 'curvy hourglass', plus: 'plus size full-figured',
  };

  const genderStr = params.gender === 'male' ? 'man' : params.gender === 'female' ? 'woman' : 'person';
  const heightStr = params.heightCm >= 180 ? 'tall' : params.heightCm <= 162 ? 'petite' : '';

  return [
    `professional fashion photography, full body portrait of a ${heightStr} ${bodyMap[params.bodyType] ?? 'average'} ${genderStr}`,
    `${skinMap[params.skinTone] ?? 'medium'} skin tone`,
    `${hairColorMap[params.hairColor] ?? 'brown'} ${hairLengthMap[params.hairLength] ?? 'medium'} hair`,
    'standing in a neutral relaxed pose, facing forward',
    'wearing simple white fitted clothing to show figure',
    'pure white studio background, soft diffused lighting',
    'sharp focus, photorealistic, 8k resolution, editorial fashion quality',
    'NOT cartoon, NOT illustration, NOT anime',
  ].join(', ');
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const avatarBodySchema = z.object({
  bodyType: z.enum(['slim', 'athletic', 'regular', 'curvy', 'plus']).optional(),
  skinTone: z.enum(['light', 'medium-light', 'medium', 'medium-dark', 'dark']).optional(),
  hairColor: z.enum(['black', 'brown', 'blonde', 'red', 'grey', 'white', 'other']).optional(),
  hairLength: z.enum(['short', 'medium', 'long', 'shaved']).optional(),
  heightCm: z.number().int().min(100).max(230).optional(),
  photoKey: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function avatarRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  // ── GET /v1/avatar — récupérer son avatar ─────────────────────────────────
  app.get('/v1/avatar', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    const avatar = await prisma.avatar.findUnique({ where: { userId } });
    if (!avatar) return reply.status(404).send({ message: 'Avatar not found' });

    const photoUrl = avatar.photoKey
      ? await createPresignedDownloadUrl(avatar.photoKey).catch(() => null)
      : null;
    const generatedUrl = avatar.generatedKey
      ? await createPresignedDownloadUrl(avatar.generatedKey).catch(() => null)
      : null;

    return reply.send({ ...avatar, photoUrl, generatedUrl });
  });

  // ── POST /v1/avatar — créer ou mettre à jour ──────────────────────────────
  app.post('/v1/avatar', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = avatarBodySchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { bodyType, skinTone, hairColor, hairLength, heightCm, photoKey } = body.data;
    // Build create/update payloads with only defined fields
    // (required by exactOptionalPropertyTypes — Prisma rejects undefined in strict mode)
    const createPayload: Parameters<typeof prisma.avatar.create>[0]['data'] = {
      userId,
      ...(bodyType   !== undefined && { bodyType }),
      ...(skinTone   !== undefined && { skinTone }),
      ...(hairColor  !== undefined && { hairColor }),
      ...(hairLength !== undefined && { hairLength }),
      ...(heightCm   !== undefined && { heightCm }),
      ...(photoKey   !== undefined && { photoKey }),
    };
    const updatePayload: Parameters<typeof prisma.avatar.update>[0]['data'] = {
      updatedAt: new Date(),
      ...(bodyType   !== undefined && { bodyType }),
      ...(skinTone   !== undefined && { skinTone }),
      ...(hairColor  !== undefined && { hairColor }),
      ...(hairLength !== undefined && { hairLength }),
      ...(heightCm   !== undefined && { heightCm }),
      ...(photoKey   !== undefined && { photoKey }),
    };

    const avatar = await prisma.avatar.upsert({
      where: { userId },
      create: createPayload,
      update: updatePayload,
    });

    const photoUrl = avatar.photoKey
      ? await createPresignedDownloadUrl(avatar.photoKey).catch(() => null)
      : null;

    return reply.status(201).send({ ...avatar, photoUrl });
  });

  // ── POST /v1/avatar/photo-url — presigned URL pour uploader une photo ─────
  app.post('/v1/avatar/photo-url', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = z.object({ contentType: z.string() }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const key = `avatars/${userId}/selfie-${Date.now()}.jpg`;
    const uploadUrl = await createPresignedUploadUrl(key, body.data.contentType);

    // Save key immediately
    await prisma.avatar.upsert({
      where: { userId },
      create: { userId, photoKey: key },
      update: { photoKey: key, updatedAt: new Date() },
    });

    return reply.send({ uploadUrl, key });
  });

  // ── POST /v1/avatar/generate — génération IA du mannequin ────────────────
  app.post('/v1/avatar/generate', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    const avatar = await prisma.avatar.findUnique({ where: { userId } });
    if (!avatar) return reply.status(404).send({ message: 'Avatar non configuré. Configure d\'abord ton mannequin.' });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { gender: true } });

    const prompt = buildAvatarPrompt({
      bodyType: avatar.bodyType,
      skinTone: avatar.skinTone,
      hairColor: avatar.hairColor,
      hairLength: avatar.hairLength,
      heightCm: avatar.heightCm ?? 170,
      gender: user?.gender ?? null,
    });

    // Lire le selfie depuis S3 (en mémoire) pour l'envoyer à fal.ai
    let selfieBuffer: Buffer | null = null;
    if (avatar.photoKey && env.FAL_KEY) {
      try {
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');
        const obj = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: avatar.photoKey }));
        if (obj.Body) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
          selfieBuffer = Buffer.concat(chunks);
        }
      } catch { /* selfie non dispo, on continue sans */ }
    }

    try {
      let imageUrl: string;
      let provider: string;

      if (env.FAL_KEY && selfieBuffer) {
        // ── fal.ai PuLID-Flux : préservation d'identité à partir du selfie ──
        imageUrl = await generateWithFacePreservation(selfieBuffer, prompt);
        provider = 'fal-pulid';

      } else if (env.FAL_KEY && !selfieBuffer) {
        // ── fal.ai Flux sans selfie ───────────────────────────────────────────
        const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
          method: 'POST',
          headers: { Authorization: `Key ${env.FAL_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, image_size: { width: 512, height: 768 }, num_images: 1 }),
        });
        if (!falRes.ok) throw new Error(`fal error: ${falRes.status}`);
        const falData = (await falRes.json()) as { images: { url: string }[] };
        imageUrl = falData.images[0].url;
        provider = 'fal-flux';

      } else if (env.REPLICATE_API_TOKEN) {
        // ── Replicate Flux Schnell (fallback) ────────────────────────────────
        const pred = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json', Prefer: 'wait=30' },
          body: JSON.stringify({ input: { prompt, aspect_ratio: '2:3', num_inference_steps: 4 } }),
        });
        const predData = (await pred.json()) as ReplicatePrediction;
        imageUrl = predData.output?.[0] ?? await pollReplicate(predData.id);
        provider = 'replicate';

      } else {
        // ── Pollinations.ai gratuit (sans selfie, sans clé) ──────────────────
        const encodedPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 999999);
        const polRes = await fetch(
          `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=768&model=flux&nologo=true&enhance=true&seed=${seed}`,
          { signal: AbortSignal.timeout(90_000) },
        );
        if (!polRes.ok) throw new Error(`Pollinations error: ${polRes.status}`);
        const contentType = polRes.headers.get('content-type') ?? 'image/jpeg';
        const imgBuf = Buffer.from(await polRes.arrayBuffer());
        const genKey = `avatars/${userId}/generated-${Date.now()}.jpg`;
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: genKey, Body: imgBuf, ContentType: contentType }));
        await prisma.avatar.update({ where: { userId }, data: { generatedKey: genKey, updatedAt: new Date() } });
        return reply.send({ generatedUrl: getPublicUrl(genKey), generatedKey: genKey, prompt, provider: 'pollinations' });
      }

      // Télécharger + stocker le résultat dans S3
      const imgRes = await fetch(imageUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const ext = imageUrl.includes('.webp') ? 'webp' : 'jpg';
      const generatedKey = `avatars/${userId}/generated-${Date.now()}.${ext}`;
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      await s3.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET, Key: generatedKey, Body: imgBuffer,
        ContentType: ext === 'webp' ? 'image/webp' : 'image/jpeg',
      }));
      await prisma.avatar.update({ where: { userId }, data: { generatedKey, updatedAt: new Date() } });
      const generatedUrl = getPublicUrl(generatedKey);
      return reply.send({ generatedUrl, generatedKey, prompt, provider });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Génération échouée';
      return reply.status(500).send({ message: msg });
    }
  });

  // ── POST /v1/avatar/analyze-photo — analyse IA du selfie ────────────────
  // Appelé après l'upload. Claude Haiku détecte morphologie, peau, cheveux
  // et pré-remplit automatiquement le formulaire avatar.
  app.post('/v1/avatar/analyze-photo', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };

    const avatar = await prisma.avatar.findUnique({ where: { userId } });
    if (!avatar?.photoKey) {
      return reply.status(400).send({ message: 'Upload un selfie avant de lancer l\'analyse.' });
    }

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const obj = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: avatar.photoKey }));
      if (!obj.Body) return reply.status(500).send({ message: 'Photo non accessible.' });

      const chunks: Uint8Array[] = [];
      for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      const { AvatarVisionProvider } = await import('../services/vision/AvatarVisionProvider.js');
      const provider = new AvatarVisionProvider();
      const analysis = await provider.analyzePhoto(buffer, 'image/jpeg');

      if (analysis.confidence >= 0.5) {
        await prisma.avatar.update({
          where: { userId },
          data: {
            bodyType: analysis.bodyType,
            skinTone: analysis.skinTone,
            hairColor: analysis.hairColor,
            hairLength: analysis.hairLength,
            updatedAt: new Date(),
          },
        });
      }

      return reply.send({ analysis, autoApplied: analysis.confidence >= 0.5 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analyse échouée';
      return reply.status(500).send({ message: msg });
    }
  });

  // ── POST /v1/avatar/tryon — essayage virtuel ──────────────────────────────
  //
  // 🔌 POINT D'INTÉGRATION : remplace le bloc "MOCK" par l'appel API réel
  //    quand tu as une clé Fashn.ai ou Replicate.
  //
  //    Fashn.ai example:
  //    const res = await fetch('https://api.fashn.ai/v1/run', {
  //      method: 'POST',
  //      headers: { Authorization: `Bearer ${env.FASHN_API_KEY}`, 'Content-Type': 'application/json' },
  //      body: JSON.stringify({ model_image: avatarPhotoUrl, garment_image: garmentUrl, category: 'tops' }),
  //    });
  //    const { id } = await res.json();
  //    // Poll status until completed, then return result_url
  //
  app.post('/v1/avatar/tryon', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = z.object({
      outfitId: z.string(),
      itemId: z.string().optional(), // pièce spécifique, ou toute la tenue
    }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const avatar = await prisma.avatar.findUnique({ where: { userId } });
    if (!avatar) return reply.status(404).send({ message: 'Avatar not configured' });

    // Vérifier le cache
    const cache = (avatar.tryonCache as Record<string, string> | null) ?? {};
    const cacheKey = `${body.data.outfitId}:${body.data.itemId ?? 'full'}`;
    if (cache[cacheKey]) {
      return reply.send({ resultUrl: cache[cacheKey], cached: true, status: 'completed' });
    }

    // ── Fashn.ai try-on ───────────────────────────────────────────────────
    const { TryOnService } = await import('../services/vision/TryOnService.js');
    const tryOnService = new TryOnService();

    if (!tryOnService.available) {
      return reply.send({
        status: 'unavailable',
        message: 'Essayage IA bientôt disponible. Configure FASHN_API_KEY dans .env pour activer.',
      });
    }

    const outfit = await prisma.outfit.findFirst({
      where: { id: body.data.outfitId, brief: { userId } },
      include: { items: { include: { dressingItem: true }, take: 1 } },
    });
    if (!outfit) return reply.status(404).send({ message: 'Outfit not found' });

    const targetItem = body.data.itemId
      ? outfit.items.find((oi) => oi.dressingItemId === body.data.itemId)?.dressingItem
      : outfit.items[0]?.dressingItem;

    if (!targetItem) return reply.status(404).send({ message: 'Item not found' });

    const modelImageUrl = avatar.generatedKey
      ? getPublicUrl(avatar.generatedKey)
      : avatar.photoKey ? getPublicUrl(avatar.photoKey) : null;
    const garmentImageUrl = targetItem.imageKey ? getPublicUrl(targetItem.imageKey) : null;

    if (!modelImageUrl || !garmentImageUrl) {
      return reply.status(400).send({ message: 'Photo avatar ou vêtement manquant.' });
    }

    const result = await tryOnService.runTryOn({
      modelImageUrl,
      garmentImageUrl,
      category: targetItem.category,
    });

    if (result.status === 'completed' && result.resultUrl) {
      await prisma.avatar.update({
        where: { userId },
        data: { tryonCache: { ...cache, [cacheKey]: result.resultUrl }, updatedAt: new Date() },
      });
    }

    return reply.send(result);
  });
}
