import type { DressingItem } from '@prisma/client';

export interface ComposedOutfit {
  items: DressingItem[];
  score: number;
  justification: string;
}

// §6.2 Rule 1: No more than 80% of items unworn for 60+ days
export function validateRecentUsage(items: DressingItem[]): boolean {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const notWornRecently = items.filter(
    (item) => !item.lastWornAt || new Date(item.lastWornAt) < sixtyDaysAgo,
  );
  return notWornRecently.length / items.length <= 0.8;
}

// §6.2 Rule 2: No piece appears more than once across 3 outfits from same brief
export function validateNoDuplicatesAcrossOutfits(outfits: ComposedOutfit[]): boolean {
  if (outfits.length < 2) return true;
  for (let i = 0; i < outfits.length; i++) {
    for (let j = i + 1; j < outfits.length; j++) {
      const idsA = new Set(outfits[i].items.map((it) => it.id));
      const overlap = outfits[j].items.filter((it) => idsA.has(it.id));
      if (overlap.length >= 2) return false;
    }
  }
  return true;
}

// §6.2 Rule 4: No more than 3 dominant colors in an outfit
export function validateColorCoherence(items: DressingItem[]): boolean {
  const dominantColors = new Set(
    items.map((item) => item.primaryColor?.toLowerCase()).filter(Boolean),
  );
  return dominantColors.size <= 3;
}

// Score an outfit based on product rules compliance + diversity
export function scoreOutfit(outfit: DressingItem[], allOutfits: DressingItem[][]): number {
  let score = 1.0;

  if (!validateRecentUsage(outfit)) score -= 0.3;
  if (!validateColorCoherence(outfit)) score -= 0.2;

  // Diversity bonus: prefer pieces not used in other outfits
  const otherIds = new Set(allOutfits.flat().map((it) => it.id));
  const unique = outfit.filter((it) => !otherIds.has(it.id));
  score += (unique.length / outfit.length) * 0.1;

  return Math.max(0, Math.min(1, score));
}
