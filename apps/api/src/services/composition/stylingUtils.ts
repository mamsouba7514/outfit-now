// ─── Pure utility functions — no external dependencies ───────────────────────
// Exported for unit testing without requiring env setup.

export type Tier = 'standard' | 'premium' | 'luxe';

export function detectTier(styleNotes?: string | null): Tier {
  if (!styleNotes) return 'standard';
  const n = styleNotes.toLowerCase();
  if (n.includes('luxe') || n.includes('haut de gamme')) return 'luxe';
  if (n.includes('premium') || n.includes('approfondie')) return 'premium';
  return 'standard';
}

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  // ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) return fenced[1].trim();
  // Find first { or [ and last } or ]
  const start = trimmed.search(/[\[{]/);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (start !== -1 && end !== -1) return trimmed.slice(start, end + 1);
  return trimmed;
}
