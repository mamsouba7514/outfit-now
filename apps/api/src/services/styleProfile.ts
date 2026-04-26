// ─── Style Profile — Karl's memory of the user ───────────────────────────────
//
// The more the user adds pieces, posts photos and saves outfits,
// the richer this profile becomes — and the more personalized Karl's
// recommendations are.

import type { DressingItem } from '@prisma/client';

import { prisma } from '../lib/prisma.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StyleProfile {
  // Data richness
  dressingSize: number;
  savedOutfitsCount: number;
  wornOutfitsCount: number;
  postsCount: number;

  // Learned preferences
  dominantColors: string[];          // top-5 most frequent colors
  topStyleTags: string[];            // top-8 most frequent tags
  topBrands: string[];               // top-5 brands
  favoriteCategories: string[];      // top-3 categories by piece count
  confirmedAesthetics: string[];     // aestheticNames from saved/worn outfits

  // Confidence score [0–1]
  // 0 = Karl just met you; 1 = Karl knows everything about your style
  styleConfidence: number;
  styleConfidenceLabel: string;
}

// ─── Confidence thresholds ───────────────────────────────────────────────────
//
// Signals and weights:
//   Dressing size   (max at 40 pieces)  — 45%
//   Saved outfits   (max at 15)         — 30%
//   Posts           (max at 8)          — 25%
//
// Each signal is clamped to [0, 1] then weighted.

function computeConfidence(dressingSize: number, savedCount: number, postsCount: number): number {
  const dressingScore = Math.min(dressingSize / 40, 1);
  const outfitScore   = Math.min(savedCount  / 15, 1);
  const postScore     = Math.min(postsCount  /  8, 1);
  return dressingScore * 0.45 + outfitScore * 0.30 + postScore * 0.25;
}

function confidenceLabel(score: number): string {
  if (score < 0.15) return "Karl fait votre connaissance";
  if (score < 0.35) return "Karl commence à saisir votre style";
  if (score < 0.55) return "Karl maîtrise vos préférences";
  if (score < 0.75) return "Karl connaît bien votre identité stylistique";
  if (score < 0.90) return "Karl vous connaît par cœur";
  return "Karl vous connaît mieux que vous-même";
}

// ─── Top-N from a frequency map ──────────────────────────────────────────────

function topN(map: Map<string, number>, n: number): string[] {
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([k]) => k)
    .filter(Boolean);
}

// ─── Compute ──────────────────────────────────────────────────────────────────

export async function computeStyleProfile(userId: string): Promise<StyleProfile> {
  const [dressingItems, savedOutfits, wornOutfits, posts] = await Promise.all([
    prisma.dressingItem.findMany({
      where: { userId, scanStatus: 'completed', deletedAt: null },
      select: { primaryColor: true, styleTags: true, brand: true, category: true },
    }),

    prisma.outfit.findMany({
      where: { brief: { userId }, savedAt: { not: null } },
      select: { justification: true },
    }),

    prisma.outfit.findMany({
      where: { brief: { userId }, wornAt: { not: null } },
      select: { id: true },
    }),

    prisma.post.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  // ── Frequency maps ────────────────────────────────────────────────────────

  const colorMap    = new Map<string, number>();
  const tagMap      = new Map<string, number>();
  const brandMap    = new Map<string, number>();
  const categoryMap = new Map<string, number>();

  for (const item of dressingItems as Pick<DressingItem, 'primaryColor' | 'styleTags' | 'brand' | 'category'>[]) {
    if (item.primaryColor) {
      colorMap.set(item.primaryColor, (colorMap.get(item.primaryColor) ?? 0) + 1);
    }
    for (const tag of item.styleTags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
    if (item.brand) {
      brandMap.set(item.brand, (brandMap.get(item.brand) ?? 0) + 1);
    }
    if (item.category) {
      categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
    }
  }

  // ── Confirmed aesthetics from saved outfits ───────────────────────────────
  // justification format: "AestheticName — colorStory\n..."
  const confirmedAesthetics: string[] = savedOutfits
    .map((o) => o.justification?.split(' — ')[0]?.trim())
    .filter((a): a is string => typeof a === 'string' && a.length > 2 && a.length < 60)
    .slice(0, 6);

  // ── Confidence ────────────────────────────────────────────────────────────

  const dressingSize       = dressingItems.length;
  const savedOutfitsCount  = savedOutfits.length;
  const wornOutfitsCount   = wornOutfits.length;
  const postsCount         = posts.length;

  const styleConfidence = computeConfidence(dressingSize, savedOutfitsCount, postsCount);

  return {
    dressingSize,
    savedOutfitsCount,
    wornOutfitsCount,
    postsCount,
    dominantColors:       topN(colorMap,    5),
    topStyleTags:         topN(tagMap,      8),
    topBrands:            topN(brandMap,    5),
    favoriteCategories:   topN(categoryMap, 3),
    confirmedAesthetics,
    styleConfidence,
    styleConfidenceLabel: confidenceLabel(styleConfidence),
  };
}

// ─── Natural language context for Karl ───────────────────────────────────────
//
// Converts the profile into a paragraph Karl can use as context.
// Returns null when Karl knows almost nothing (no point hallucinating preferences).

export function buildKarlContext(profile: StyleProfile): string | null {
  if (profile.styleConfidence < 0.10) return null;

  const lines: string[] = [
    '═══ PROFIL STYLE MÉMORISÉ PAR KARL ═══',
  ];

  if (profile.dominantColors.length) {
    lines.push(`Palette dominante : ${profile.dominantColors.join(', ')}`);
  }
  if (profile.topStyleTags.length) {
    lines.push(`Registre stylistique : ${profile.topStyleTags.join(', ')}`);
  }
  if (profile.topBrands.length) {
    lines.push(`Marques connues dans le dressing : ${profile.topBrands.join(', ')}`);
  }
  if (profile.favoriteCategories.length) {
    lines.push(`Catégories dominantes : ${profile.favoriteCategories.join(', ')}`);
  }
  if (profile.confirmedAesthetics.length) {
    lines.push(`Looks validés & portés : ${profile.confirmedAesthetics.join(' · ')}`);
  }
  if (profile.postsCount > 0) {
    lines.push(`Photos postées avec style : ${profile.postsCount} — Karl les a analysées.`);
  }

  lines.push(
    `Niveau de connaissance Karl : ${Math.round(profile.styleConfidence * 100)}% — ${profile.styleConfidenceLabel}`,
    '═════════════════════════════════════',
  );

  return lines.join('\n');
}
