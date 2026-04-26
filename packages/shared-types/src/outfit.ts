export type OutfitStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type Occasion =
  | 'casual'
  | 'work'
  | 'formal'
  | 'sport'
  | 'evening'
  | 'weekend'
  | 'travel'
  | 'date'
  | 'party'
  | 'beach'
  | 'ceremony'
  | 'gala'
  | 'dinner'
  | 'outdoor';

export type ComposeMode = 'new' | 'dressing' | 'mix';

export interface BriefRequest {
  occasion: Occasion;
  styleNotes?: string;
  weatherNote?: string;
  colorNote?: string;
  excludeIds?: string[];
  styleTags?: string[];
  budget?: number;
  composeMode?: ComposeMode;
}

export interface OutfitItem {
  id: string;
  dressingItemId: string;
  imageUrl?: string;
  imageKey?: string;
  category: string;
  primaryColor?: string;
  styleTags?: string[];
  role: string;
}

export interface ShoppingResult {
  title: string;
  price: string;
  priceRaw: number;
  store: string;
  link: string;
  imageUrl: string;
  category: string;
}

export interface Outfit {
  id: string;
  briefId: string;
  items: OutfitItem[];
  score: number;
  justification: string;
  shoppingResults?: ShoppingResult[];
  affiliateSuggestion: AffiliateSuggestion | null;
  savedAt: string | null;
  wornAt: string | null;
  discardedAt: string | null;
  createdAt: string;
}

export interface Brief {
  id: string;
  userId: string;
  status: OutfitStatus;
  occasion: string;
  styleNotes?: string | null;
  outfits: Outfit[];
  createdAt: string;
  completedAt: string | null;
  errorMessage?: string | null;
}

export interface AffiliateSuggestion {
  productId: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  justification: string;
}
