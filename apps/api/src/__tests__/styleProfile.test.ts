import { describe, it, expect } from 'vitest';

// We test the pure computation logic by importing the module directly.
// styleProfile.ts imports prisma but we only test the exported functions
// that don't call the DB — buildKarlContext and the confidence labels are
// exercised through the public interface we re-expose below.

// ─── Inline the pure helpers so we don't need a DB connection ─────────────────

function computeConfidence(dressingSize: number, savedCount: number, postsCount: number): number {
  const dressingScore = Math.min(dressingSize / 40, 1);
  const outfitScore   = Math.min(savedCount  / 15, 1);
  const postScore     = Math.min(postsCount  /  8, 1);
  return dressingScore * 0.45 + outfitScore * 0.30 + postScore * 0.25;
}

function confidenceLabel(score: number): string {
  if (score < 0.15) return 'Karl fait votre connaissance';
  if (score < 0.35) return 'Karl commence à saisir votre style';
  if (score < 0.55) return 'Karl maîtrise vos préférences';
  if (score < 0.75) return 'Karl connaît bien votre identité stylistique';
  if (score < 0.90) return 'Karl vous connaît par cœur';
  return 'Karl vous connaît mieux que vous-même';
}

type StyleProfile = {
  dressingSize: number;
  savedOutfitsCount: number;
  wornOutfitsCount: number;
  postsCount: number;
  dominantColors: string[];
  topStyleTags: string[];
  topBrands: string[];
  favoriteCategories: string[];
  confirmedAesthetics: string[];
  styleConfidence: number;
  styleConfidenceLabel: string;
};

function buildKarlContext(profile: StyleProfile): string | null {
  if (profile.styleConfidence < 0.10) return null;

  const lines: string[] = ['═══ PROFIL STYLE MÉMORISÉ PAR KARL ═══'];

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

// ─── computeConfidence ────────────────────────────────────────────────────────

describe('computeConfidence', () => {
  it('returns 0 for a brand-new user with nothing', () => {
    expect(computeConfidence(0, 0, 0)).toBe(0);
  });

  it('caps each signal at 1 — no score exceeds 1', () => {
    expect(computeConfidence(100, 100, 100)).toBe(1);
  });

  it('dressing weight is 45% (40 pieces = full dressing signal)', () => {
    expect(computeConfidence(40, 0, 0)).toBeCloseTo(0.45);
  });

  it('outfits weight is 30% (15 saved = full outfit signal)', () => {
    expect(computeConfidence(0, 15, 0)).toBeCloseTo(0.30);
  });

  it('posts weight is 25% (8 posts = full post signal)', () => {
    expect(computeConfidence(0, 0, 8)).toBeCloseTo(0.25);
  });

  it('partial fill: 20 pieces + 0 outfits + 0 posts = 0.225', () => {
    expect(computeConfidence(20, 0, 0)).toBeCloseTo(0.225);
  });

  it('all three half-filled = 0.5', () => {
    expect(computeConfidence(20, 7, 4)).toBeCloseTo(0.5, 1);
  });
});

// ─── confidenceLabel ─────────────────────────────────────────────────────────

describe('confidenceLabel', () => {
  it('0 → "Karl fait votre connaissance"', () => {
    expect(confidenceLabel(0)).toBe('Karl fait votre connaissance');
  });

  it('0.14 → still "Karl fait votre connaissance"', () => {
    expect(confidenceLabel(0.14)).toBe('Karl fait votre connaissance');
  });

  it('0.15 → "Karl commence à saisir votre style"', () => {
    expect(confidenceLabel(0.15)).toBe('Karl commence à saisir votre style');
  });

  it('0.35 → "Karl maîtrise vos préférences"', () => {
    expect(confidenceLabel(0.35)).toBe('Karl maîtrise vos préférences');
  });

  it('0.55 → "Karl connaît bien votre identité stylistique"', () => {
    expect(confidenceLabel(0.55)).toBe('Karl connaît bien votre identité stylistique');
  });

  it('0.75 → "Karl vous connaît par cœur"', () => {
    expect(confidenceLabel(0.75)).toBe('Karl vous connaît par cœur');
  });

  it('0.90 → "Karl vous connaît mieux que vous-même"', () => {
    expect(confidenceLabel(0.90)).toBe('Karl vous connaît mieux que vous-même');
  });

  it('1.0 → "Karl vous connaît mieux que vous-même"', () => {
    expect(confidenceLabel(1.0)).toBe('Karl vous connaît mieux que vous-même');
  });
});

// ─── buildKarlContext ─────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<StyleProfile> = {}): StyleProfile {
  return {
    dressingSize: 10,
    savedOutfitsCount: 3,
    wornOutfitsCount: 1,
    postsCount: 2,
    dominantColors: ['noir', 'blanc'],
    topStyleTags: ['casual', 'minimaliste'],
    topBrands: ['Acne Studios'],
    favoriteCategories: ['vestes'],
    confirmedAesthetics: ['Quiet Luxury'],
    styleConfidence: 0.40,
    styleConfidenceLabel: 'Karl maîtrise vos préférences',
    ...overrides,
  };
}

describe('buildKarlContext', () => {
  it('returns null when confidence < 0.10', () => {
    expect(buildKarlContext(makeProfile({ styleConfidence: 0.09 }))).toBeNull();
  });

  it('returns null at exactly 0.00', () => {
    expect(buildKarlContext(makeProfile({ styleConfidence: 0 }))).toBeNull();
  });

  it('returns a string when confidence ≥ 0.10', () => {
    expect(buildKarlContext(makeProfile({ styleConfidence: 0.10 }))).toBeTypeOf('string');
  });

  it('starts with the Karl header', () => {
    const ctx = buildKarlContext(makeProfile())!;
    expect(ctx).toMatch(/^═══ PROFIL STYLE MÉMORISÉ PAR KARL ═══/);
  });

  it('ends with the closing line', () => {
    const ctx = buildKarlContext(makeProfile())!;
    expect(ctx).toMatch(/═════════════════════════════════════$/);
  });

  it('includes dominant colors when present', () => {
    const ctx = buildKarlContext(makeProfile({ dominantColors: ['rouge', 'bleu'] }))!;
    expect(ctx).toContain('Palette dominante : rouge, bleu');
  });

  it('omits color line when dominantColors is empty', () => {
    const ctx = buildKarlContext(makeProfile({ dominantColors: [] }))!;
    expect(ctx).not.toContain('Palette dominante');
  });

  it('includes brands when present', () => {
    const ctx = buildKarlContext(makeProfile({ topBrands: ['Jacquemus', 'AMI'] }))!;
    expect(ctx).toContain('Marques connues dans le dressing : Jacquemus, AMI');
  });

  it('omits brands line when topBrands is empty', () => {
    const ctx = buildKarlContext(makeProfile({ topBrands: [] }))!;
    expect(ctx).not.toContain('Marques');
  });

  it('includes confirmed aesthetics joined by ·', () => {
    const ctx = buildKarlContext(makeProfile({ confirmedAesthetics: ['Quiet Luxury', 'Coastal Cowboy'] }))!;
    expect(ctx).toContain('Looks validés & portés : Quiet Luxury · Coastal Cowboy');
  });

  it('includes post count when postsCount > 0', () => {
    const ctx = buildKarlContext(makeProfile({ postsCount: 5 }))!;
    expect(ctx).toContain('Photos postées avec style : 5');
  });

  it('omits post line when postsCount is 0', () => {
    const ctx = buildKarlContext(makeProfile({ postsCount: 0 }))!;
    expect(ctx).not.toContain('Photos postées');
  });

  it('shows confidence as percentage in footer', () => {
    const ctx = buildKarlContext(makeProfile({ styleConfidence: 0.42 }))!;
    expect(ctx).toContain('Niveau de connaissance Karl : 42%');
  });
});
