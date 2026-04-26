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

export interface VisionResult {
  category: ClothingCategory;
  primaryColor: string;
  secondaryColors: string[];
  styleTags: string[];
  brand: string | null;
  material: string | null;
  season: Season[];
  embedding: number[];
  confidence: number;
}

export interface VisionProvider {
  analyze(imageBuffer: Buffer, mimeType: string): Promise<VisionResult>;
  readonly name: string;
}
