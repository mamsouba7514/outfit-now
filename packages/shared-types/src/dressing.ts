export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'bags'
  | 'swimwear'
  | 'activewear'
  | 'underwear';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';

export interface DressingItem {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: ClothingCategory;
  primaryColor: string;
  secondaryColors: string[];
  styleTags: string[];
  brand: string | null;
  season: Season[];
  wornCount: number;
  lastWornAt: string | null;
  forSale: boolean;
  askingPrice: number | null;
  createdAt: string;
}

export interface CreateDressingItemRequest {
  imageKey: string;
}

export interface UpdateDressingItemRequest {
  category?: ClothingCategory;
  primaryColor?: string;
  secondaryColors?: string[];
  styleTags?: string[];
  brand?: string;
  season?: Season[];
  forSale?: boolean;
  askingPrice?: number | null;
}

export interface DressingFilters {
  category?: ClothingCategory;
  color?: string;
  season?: Season;
  notWornSince?: string;
  forSale?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  imageKey: string;
}
