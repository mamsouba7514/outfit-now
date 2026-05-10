// Karl — Managed Agent session handler
// Agent + environment are created once via `scripts/karl-setup.ts`.
// This module handles per-request sessions only.

import Anthropic from '@anthropic-ai/sdk';
import type {
  BetaManagedAgentsAgentToolset20260401Params,
  BetaManagedAgentsCustomToolParams,
} from '@anthropic-ai/sdk/resources/beta/agents/agents.js';
import type { DressingItem } from '@prisma/client';

import { ClaudeStylingProvider } from '../services/composition/ClaudeStylingProvider.js';
import type { BriefContext } from '../services/composition/StylingProvider.js';
import { searchShoppingProducts } from '../services/shopping/SerpApiShoppingService.js';
import { computeStyleProfile } from '../services/styleProfile.js';

import { env } from './env.js';
import { prisma } from './prisma.js';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export type KarlStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; name: string; input: unknown }
  | { type: 'idle' }
  | { type: 'terminated' };

export interface KarlSessionResult {
  response: string;
  sessionId: string;
}

// ─── Tool definitions (declared on the agent) ─────────────────────────────────

export const KARL_TOOLS: Array<
  BetaManagedAgentsAgentToolset20260401Params | BetaManagedAgentsCustomToolParams
> = [
  { type: 'agent_toolset_20260401', default_config: { enabled: true } },
  {
    type: 'custom',
    name: 'get_wardrobe',
    description: "Fetch all clothing items from the user's dressing / wardrobe in the database.",
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string', description: 'The Outfit Now user ID' },
        category: {
          type: 'string',
          description: 'Optional filter by category (e.g. tops, bottoms, shoes)',
        },
      },
      required: ['userId'],
    },
  },
  {
    type: 'custom',
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
    type: 'custom',
    name: 'compose_outfit',
    description:
      "Compose one or more outfit proposals from the user's wardrobe using the AI styling engine.",
    input_schema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'string' },
        occasion: { type: 'string', description: 'e.g. casual, work, soirée, sport' },
        styleNotes: { type: 'string', description: 'Free-text style direction' },
        weatherNote: { type: 'string', description: 'e.g. 15°C, nuageux' },
        colorNote: { type: 'string', description: 'Color preferences or constraints' },
        composeMode: {
          type: 'string',
          enum: ['wardrobe', 'mix', 'new'],
          description:
            'wardrobe = only existing pieces; mix = wardrobe + shopping; new = shopping only',
        },
        budget: { type: 'number', description: 'Budget in EUR for shopping mode' },
        count: { type: 'number', description: 'Number of outfit proposals (default 1)' },
      },
      required: ['userId', 'occasion'],
    },
  },
  {
    type: 'custom',
    name: 'search_shopping',
    description: 'Search for shoppable fashion items via Google Shopping.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query, e.g. "chemise blanche slim fit"' },
        category: { type: 'string', description: 'Item category' },
        maxResults: { type: 'number', description: 'Max results (default 3)' },
      },
      required: ['query', 'category'],
    },
  },
];

// ─── Karl system prompt ────────────────────────────────────────────────────────

export const KARL_SYSTEM_PROMPT = `Tu es Karl, styliste personnel IA d'Outfit Now.
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

// ─── Session runner ────────────────────────────────────────────────────────────

export async function runKarlSession(
  userId: string,
  message: string,
  onEvent?: (event: KarlStreamEvent) => void,
): Promise<KarlSessionResult> {
  const agentId = env.KARL_AGENT_ID;
  const environmentId = env.KARL_ENVIRONMENT_ID;

  if (!agentId || !environmentId) {
    throw new Error(
      'KARL_AGENT_ID and KARL_ENVIRONMENT_ID must be set. Run scripts/karl-setup.ts first.',
    );
  }

  const session = await client.beta.sessions.create({
    agent: { type: 'agent', id: agentId },
    environment_id: environmentId,
    title: `Karl — user ${userId}`,
  });

  // Stream-first: open stream before sending to avoid missing early events
  const [response] = await Promise.all([
    runLoop(session.id, onEvent),
    client.beta.sessions.events.send(session.id, {
      events: [
        {
          type: 'user.message',
          content: [{ type: 'text', text: message }],
        },
      ],
    }),
  ]);

  return { response, sessionId: session.id };
}

// ─── Streaming loop ────────────────────────────────────────────────────────────

async function runLoop(
  sessionId: string,
  onEvent?: (event: KarlStreamEvent) => void,
): Promise<string> {
  let fullResponse = '';
  let running = true;

  while (running) {
    const stream = await client.beta.sessions.events.stream(sessionId);
    const pendingToolCalls: Anthropic.Beta.Sessions.BetaManagedAgentsAgentCustomToolUseEvent[] = [];

    for await (const event of stream) {
      if (event.type === 'agent.message') {
        for (const block of event.content) {
          if (block.type === 'text') {
            fullResponse += block.text;
            onEvent?.({ type: 'text', text: block.text });
          }
        }
      } else if (event.type === 'agent.custom_tool_use') {
        pendingToolCalls.push(event);
        onEvent?.({ type: 'tool_call', name: event.name, input: event.input });
      } else if (event.type === 'session.status_idle') {
        onEvent?.({ type: 'idle' });
        break;
      } else if (event.type === 'session.status_terminated') {
        onEvent?.({ type: 'terminated' });
        return fullResponse;
      }
    }

    if (pendingToolCalls.length === 0) {
      running = false;
      break;
    }

    const results = await Promise.all(
      pendingToolCalls.map(async (call) => ({
        type: 'user.custom_tool_result' as const,
        custom_tool_use_id: call.id,
        content: [{ type: 'text' as const, text: await dispatch(call.name, call.input) }],
      })),
    );

    await client.beta.sessions.events.send(sessionId, { events: results });
  }

  return fullResponse;
}

// ─── Tool dispatch ─────────────────────────────────────────────────────────────

async function dispatch(name: string, rawInput: unknown): Promise<string> {
  const input = rawInput as Record<string, unknown>;

  try {
    switch (name) {
      case 'get_wardrobe': {
        const where: Record<string, unknown> = { userId: input.userId };
        if (input.category) where.category = input.category;
        const items = await prisma.dressingItem.findMany({ where, take: 200 });
        return JSON.stringify(items);
      }

      case 'get_style_profile': {
        const profile = await computeStyleProfile(input.userId as string);
        return JSON.stringify(profile);
      }

      case 'compose_outfit': {
        const userId = input.userId as string;
        const dressing: DressingItem[] = await prisma.dressingItem.findMany({
          where: { userId },
          take: 200,
        });
        const profile = await computeStyleProfile(userId);
        const brief: BriefContext = {
          occasion: (input.occasion as string) ?? '',
          styleNotes: (input.styleNotes as string) ?? '',
          weatherNote: (input.weatherNote as string) ?? '',
          colorNote: (input.colorNote as string) ?? '',
          composeMode: (input.composeMode as BriefContext['composeMode']) ?? 'wardrobe',
          budget: (input.budget as number) ?? undefined,
          styleTags: [],
          gender: 'unisex',
          styleProfile: profile,
        };
        const provider = new ClaudeStylingProvider();
        const proposals = await provider.compose(dressing, brief, (input.count as number) ?? 1);
        return JSON.stringify(proposals);
      }

      case 'search_shopping': {
        const results = await searchShoppingProducts(
          input.query as string,
          input.category as string,
          (input.maxResults as number) ?? 3,
        );
        return JSON.stringify(results);
      }

      default:
        return `Tool "${name}" not implemented.`;
    }
  } catch (err) {
    return `Error in ${name}: ${err instanceof Error ? err.message : String(err)}`;
  }
}
