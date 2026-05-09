// ─── Fashn.ai Try-On Service ──────────────────────────────────────────────────
//
// Essayage virtuel IA : photo de la personne + photo du vêtement
// → génère la personne portant le vêtement.
// Doc: https://fashn.ai/docs
// Pour activer : ajouter FASHN_API_KEY dans apps/api/.env

export type TryOnCategory = 'tops' | 'bottoms' | 'one-piece';

export interface TryOnResult {
  status: 'completed' | 'processing' | 'failed' | 'unavailable';
  resultUrl?: string;
  jobId?: string;
  message?: string;
}

const CATEGORY_MAP: Record<string, TryOnCategory> = {
  tops: 'tops',
  activewear: 'tops',
  outerwear: 'tops',
  bottoms: 'bottoms',
  dresses: 'one-piece',
  swimwear: 'one-piece',
  underwear: 'one-piece',
};

export class TryOnService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.fashn.ai/v1';

  constructor() {
    this.apiKey = process.env.FASHN_API_KEY;
  }

  get available(): boolean {
    return !!this.apiKey;
  }

  private async toBase64DataUri(url: string): Promise<string> {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
  }

  async runTryOn(params: {
    modelImageUrl: string;
    garmentImageUrl: string;
    category: string;
  }): Promise<TryOnResult> {
    if (!this.apiKey) {
      return {
        status: 'unavailable',
        message: 'Essayage IA bientôt disponible. Configure FASHN_API_KEY.',
      };
    }

    const category = CATEGORY_MAP[params.category] ?? 'tops';

    const [modelImage, garmentImage] = await Promise.all([
      this.toBase64DataUri(params.modelImageUrl),
      this.toBase64DataUri(params.garmentImageUrl),
    ]);

    const runRes = await fetch(`${this.baseUrl}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: modelImage,
          garment_image: garmentImage,
          category,
          mode: 'balanced',
          garment_photo_type: 'auto',
        },
      }),
    });

    if (!runRes.ok) {
      const err = await runRes.text();
      throw new Error(`Fashn.ai error: ${runRes.status} — ${err}`);
    }

    const { id: jobId } = (await runRes.json()) as { id: string };

    // Polling jusqu'à completion (max 60s)
    const start = Date.now();
    while (Date.now() - start < 60_000) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(`${this.baseUrl}/status/${jobId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      const statusData = (await statusRes.json()) as {
        status: string;
        output?: string[];
        error?: unknown;
      };

      if (statusData.status === 'completed' && statusData.output?.[0]) {
        return { status: 'completed', resultUrl: statusData.output[0], jobId };
      }
      if (statusData.status === 'failed') {
        const errMsg =
          typeof statusData.error === 'string'
            ? statusData.error
            : (JSON.stringify(statusData.error) ?? 'Try-on failed');
        throw new Error(errMsg);
      }
    }
    return {
      status: 'processing',
      jobId,
      message: 'Génération en cours, réessaie dans quelques secondes.',
    };
  }
}
