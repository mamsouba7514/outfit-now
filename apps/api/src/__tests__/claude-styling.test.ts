import { describe, it, expect } from 'vitest';

import { detectTier, extractJson } from '../services/composition/stylingUtils.js';

// ─── detectTier ───────────────────────────────────────────────────────────────

describe('detectTier', () => {
  it('returns standard when styleNotes is null', () => {
    expect(detectTier(null)).toBe('standard');
  });

  it('returns standard when styleNotes is undefined', () => {
    expect(detectTier(undefined)).toBe('standard');
  });

  it('returns standard for generic style notes', () => {
    expect(detectTier('tenue casual pour le week-end')).toBe('standard');
  });

  it('returns premium when notes contain "premium"', () => {
    expect(detectTier('Génération premium — curation approfondie.')).toBe('premium');
  });

  it('returns premium when notes contain "approfondie"', () => {
    expect(detectTier('curation approfondie de mon dressing')).toBe('premium');
  });

  it('returns luxe when notes contain "luxe"', () => {
    expect(detectTier('Génération luxe — expérience stylist haut de gamme, aucun compromis.')).toBe('luxe');
  });

  it('returns luxe when notes contain "haut de gamme"', () => {
    expect(detectTier('je veux quelque chose haut de gamme')).toBe('luxe');
  });

  it('is case-insensitive', () => {
    expect(detectTier('LUXE TOTAL')).toBe('luxe');
    expect(detectTier('PREMIUM only')).toBe('premium');
  });

  it('luxe takes priority over premium when both present', () => {
    expect(detectTier('luxe et premium')).toBe('luxe');
  });
});

// ─── extractJson ──────────────────────────────────────────────────────────────

describe('extractJson', () => {
  it('passes through plain JSON unchanged', () => {
    const json = '{"outfits":[]}';
    expect(extractJson(json)).toBe(json);
  });

  it('strips ```json fences', () => {
    const input = '```json\n{"outfits":[]}\n```';
    expect(extractJson(input)).toBe('{"outfits":[]}');
  });

  it('strips plain ``` fences', () => {
    const input = '```\n{"outfits":[]}\n```';
    expect(extractJson(input)).toBe('{"outfits":[]}');
  });

  it('extracts JSON from surrounding text', () => {
    const input = 'Voici la réponse:\n{"outfits":[]}\nMerci.';
    expect(extractJson(input)).toBe('{"outfits":[]}');
  });

  it('handles array JSON', () => {
    const input = '```json\n[1,2,3]\n```';
    expect(extractJson(input)).toBe('[1,2,3]');
  });

  it('handles whitespace around fences', () => {
    const input = '  ```json\n  { "a": 1 }\n  ```  ';
    const result = extractJson(input);
    expect(JSON.parse(result)).toEqual({ a: 1 });
  });

  it('returns trimmed input when no JSON brackets found', () => {
    const input = '  plain text  ';
    expect(extractJson(input)).toBe('plain text');
  });

  it('parses valid JSON after extraction', () => {
    const input = '```json\n{"outfits":[{"itemIds":["a","b","c"],"aestheticName":"Cool","colorStory":"noir","justification":"test justification qui fait plus de 20 chars","aiScore":85}]}\n```';
    const extracted = extractJson(input);
    const parsed = JSON.parse(extracted);
    expect(parsed.outfits[0].aiScore).toBe(85);
  });
});
