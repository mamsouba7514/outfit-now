import { apiRequest } from './api';

export type StyleRank = 'NOVICE' | 'STYLE' | 'EXPERT' | 'MAITRE' | 'ICONE';
export type EnergyAction =
  | 'SCAN'
  | 'BRIEF'
  | 'WEAR_CONFIRMED'
  | 'COMMUNITY_VOTE'
  | 'CAPSULE_COMPLETE'
  | 'STREAK_BONUS'
  | 'AWARD_SUBMISSION';

export interface StylePassProfile {
  totalEnergy: number;
  rank: StyleRank;
  streakDays: number;
  nextRankThreshold: number | null;
  progressToNext: number;
  lastActivityAt: string | null;
}

export interface StyleAward {
  id: string;
  occasion: string;
  weekStart: string;
  weekEnd: string;
  status: 'OPEN' | 'VOTING' | 'CLOSED';
  submissionCount: number;
  userSubmission: AwardSubmission | null;
}

export interface AwardSubmission {
  id: string;
  imageKey?: string;
  caption?: string;
  voteCount: number;
  finalRank?: number;
  hasVoted?: boolean;
}

export interface StyleCard {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'ICONIQUE';
  discountPct: number;
  partner: string;
  promoCode: string;
  validUntil: string;
  revealedAt: string | null;
  usedAt: string | null;
  createdAt: string;
}

export function getStylePassProfile(): Promise<StylePassProfile> {
  return apiRequest('/v1/style-pass/me');
}

export function earnEnergy(
  action: EnergyAction,
  refId?: string,
): Promise<{
  pointsEarned: number;
  totalEnergy: number;
  rank: StyleRank;
  rankUp: boolean;
}> {
  return apiRequest('/v1/style-pass/earn', {
    method: 'POST',
    body: JSON.stringify({ action, refId }),
  });
}

export function getCurrentAward(): Promise<StyleAward> {
  return apiRequest('/v1/style-pass/awards/current');
}

export function getAwardSubmissions(awardId: string): Promise<AwardSubmission[]> {
  return apiRequest(`/v1/style-pass/awards/${awardId}/submissions`);
}

export function voteOnSubmission(
  awardId: string,
  submissionId: string,
): Promise<{ success: boolean }> {
  return apiRequest(`/v1/style-pass/awards/${awardId}/vote/${submissionId}`, { method: 'POST' });
}

export function submitToAward(
  awardId: string,
  payload: { outfitId?: string; caption?: string },
): Promise<AwardSubmission> {
  return apiRequest(`/v1/style-pass/awards/${awardId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getStyleCards(): Promise<StyleCard[]> {
  return apiRequest('/v1/style-pass/cards');
}

export function revealStyleCard(cardId: string): Promise<StyleCard> {
  return apiRequest(`/v1/style-pass/cards/${cardId}/reveal`, { method: 'POST' });
}
