// Karl agent setup — run ONCE to create the managed agent and environment.
// Output the IDs, then add them to your .env as KARL_AGENT_ID and KARL_ENVIRONMENT_ID.
//
// Usage:  ANTHROPIC_API_KEY=sk-... npx tsx scripts/karl-setup.ts

import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const KARL_SYSTEM_PROMPT = `Tu es Karl, styliste personnel IA d'Outfit Now.
Niveau actuel : Styliste professionnel certifié, formé à Paris et Milan, 12 ans d'expérience.
Tu composes des tenues équilibrées, cohérentes et flatteuses.

Ton rôle :
- Analyser la garde-robe et les préférences stylistiques de l'utilisateur
- Composer des tenues adaptées à l'occasion avec les pièces disponibles
- Proposer des achats ciblés pour compléter les looks
- Donner des conseils mode personnalisés, chauds et précis

Règles :
- Utilise toujours les outils disponibles pour accéder aux vraies données de l'utilisateur
- Commence par récupérer la garde-robe et le profil style avant de composer
- Réponds dans la langue de l'utilisateur (français par défaut)
- Sois spécifique : cite les pièces exactes, leurs couleurs, le pourquoi du look`;

const KARL_TOOLS = [
  {
    type: 'agent_toolset_20260401' as const,
    default_config: { enabled: true },
  },
  {
    type: 'custom' as const,
    name: 'get_wardrobe',
    description: "Fetch all clothing items from the user's dressing / wardrobe in the database.",
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string', description: 'The Outfit Now user ID' },
        category: { type: 'string', description: 'Optional filter by category' },
      },
      required: ['userId'],
    },
  },
  {
    type: 'custom' as const,
    name: 'get_style_profile',
    description:
      "Compute the user's style profile: dominant colors, top brands, aesthetics, and style confidence score.",
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string', description: 'The Outfit Now user ID' },
      },
      required: ['userId'],
    },
  },
  {
    type: 'custom' as const,
    name: 'compose_outfit',
    description:
      "Compose one or more outfit proposals from the user's wardrobe using the AI styling engine.",
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string' },
        occasion: { type: 'string', description: 'e.g. casual, work, soirée, sport' },
        styleNotes: { type: 'string' },
        composeMode: {
          type: 'string',
          enum: ['wardrobe', 'mix', 'new'],
          description:
            'wardrobe = existing pieces only; mix = wardrobe + shopping; new = shopping only',
        },
        budget: { type: 'number', description: 'Budget in EUR for shopping mode' },
        count: { type: 'number', description: 'Number of outfit proposals (default 1)' },
      },
      required: ['userId', 'occasion'],
    },
  },
  {
    type: 'custom' as const,
    name: 'search_shopping',
    description: 'Search for shoppable fashion items via Google Shopping.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
        maxResults: { type: 'number' },
      },
      required: ['query', 'category'],
    },
  },
];

async function setup() {
  console.log('Creating Karl environment...');
  const environment = await client.beta.environments.create({
    name: 'outfit-now-karl',
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  });
  console.log('Environment created:', environment.id);

  console.log('\nCreating Karl agent...');
  const agent = await client.beta.agents.create({
    name: 'Karl — Outfit Now AI Stylist',
    model: 'claude-opus-4-7',
    system: KARL_SYSTEM_PROMPT,
    tools: KARL_TOOLS,
  });
  console.log('Agent created:', agent.id, '(version', agent.version, ')');

  console.log('\n─────────────────────────────────────────────');
  console.log('Add to your .env:');
  console.log(`KARL_AGENT_ID=${agent.id}`);
  console.log(`KARL_ENVIRONMENT_ID=${environment.id}`);
  console.log('─────────────────────────────────────────────');
}

setup().catch((err) => {
  console.error(err);
  process.exit(1);
});
