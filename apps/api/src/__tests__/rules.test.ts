import type { DressingItem } from '@prisma/client';
import { describe, it, expect } from 'vitest';

import {
  validateRecentUsage,
  validateColorCoherence,
  validateNoDuplicatesAcrossOutfits,
} from '../services/composition/rules.js';

function makeItem(overrides: Partial<DressingItem> = {}): DressingItem {
  return {
    id: Math.random().toString(36).slice(2),
    userId: 'u1',
    imageKey: 'key',
    thumbnailKey: null,
    category: 'tops',
    primaryColor: 'noir',
    secondaryColors: [],
    styleTags: [],
    brand: null,
    season: [],
    scanStatus: 'completed',
    scanError: null,
    scanDurationMs: null,
    scanCostCents: null,
    vectorId: null,
    wornCount: 0,
    lastWornAt: null,
    forSale: false,
    askingPrice: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('validateRecentUsage (§6.2 rule 1)', () => {
  it('passes when ≤ 80% items not worn in 60+ days', () => {
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);  // 90 days ago
    const items = [
      makeItem({ lastWornAt: recentDate }),
      makeItem({ lastWornAt: recentDate }),
      makeItem({ lastWornAt: oldDate }), // 1 out of 3 old = 33%
    ];
    expect(validateRecentUsage(items)).toBe(true);
  });

  it('fails when > 80% items not worn in 60+ days', () => {
    const oldDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    // 5/5 = 100% not worn recently → fail
    const items = [
      makeItem({ lastWornAt: null }),
      makeItem({ lastWornAt: null }),
      makeItem({ lastWornAt: null }),
      makeItem({ lastWornAt: oldDate }),
      makeItem({ lastWornAt: oldDate }),
    ];
    expect(validateRecentUsage(items)).toBe(false);
  });
});

describe('validateColorCoherence (§6.2 rule 4)', () => {
  it('passes with ≤ 3 dominant colors', () => {
    const items = [
      makeItem({ primaryColor: 'noir' }),
      makeItem({ primaryColor: 'blanc' }),
      makeItem({ primaryColor: 'noir' }),
      makeItem({ primaryColor: 'beige' }),
    ];
    expect(validateColorCoherence(items)).toBe(true);
  });

  it('fails with > 3 dominant colors', () => {
    const items = [
      makeItem({ primaryColor: 'noir' }),
      makeItem({ primaryColor: 'blanc' }),
      makeItem({ primaryColor: 'bleu' }),
      makeItem({ primaryColor: 'rouge' }),
    ];
    expect(validateColorCoherence(items)).toBe(false);
  });
});

describe('validateNoDuplicatesAcrossOutfits (§6.2 rule 2)', () => {
  it('passes when outfits share at most 1 piece', () => {
    const shared = makeItem();
    const outfits = [
      { items: [shared, makeItem(), makeItem()], score: 0.9, justification: '' },
      { items: [makeItem(), makeItem(), makeItem()], score: 0.8, justification: '' },
    ];
    expect(validateNoDuplicatesAcrossOutfits(outfits)).toBe(true);
  });

  it('fails when outfits share 2+ pieces', () => {
    const a = makeItem();
    const b = makeItem();
    const outfits = [
      { items: [a, b, makeItem()], score: 0.9, justification: '' },
      { items: [a, b, makeItem()], score: 0.8, justification: '' },
    ];
    expect(validateNoDuplicatesAcrossOutfits(outfits)).toBe(false);
  });
});
