import type { DressingItem } from '@prisma/client';
import type { ShoppingProduct } from '../shopping/SerpApiShoppingService.js';
import type { StyleProfile } from '../styleProfile.js';

export interface BriefContext {
  occasion: string;
  styleNotes?: string | null;
  weatherNote?: string | null;
  colorNote?: string | null;
  composeMode?: string;
  styleTags?: string[];
  budget?: number | null;
  gender?: string | null;
  styleProfile?: StyleProfile;   // Karl's memory — grows richer over time
}

export interface OutfitProposal {
  items: DressingItem[];
  justification: string;
  score: number;
  shoppingResults?: ShoppingProduct[];
}

export interface StylingProvider {
  compose(
    dressing: DressingItem[],
    brief: BriefContext,
    count: number,
  ): Promise<OutfitProposal[]>;
  readonly name: string;
}
