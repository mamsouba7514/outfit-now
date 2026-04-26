# Agent Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 dashboard in `apps/dashboard` to pilot 17 AI/human agents (1 Manager, 4 Seniors, 12 Sub-agents) for Outfit Now — brief agents, track tasks on a kanban, validate outputs.

**Architecture:** The dashboard (`apps/dashboard`) calls a new `/v1/agents` API layer in the existing Fastify app (`apps/api`). New Prisma models (`DashAgent`, `DashTask`, `DashOutput`, `AgentBrief`) are added without touching existing schema. Claude agents use `claude-sonnet-4-6` with tool use; human agents are UI-only representations. WebSocket pushes real-time status updates to the dashboard.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, @dnd-kit/core (drag & drop), @anthropic-ai/sdk, Fastify WebSocket plugin, Prisma, Vitest, TypeScript strict.

---

## File Map

### apps/api (new files)

- `prisma/schema.prisma` — add DashAgent, DashTask, DashOutput, AgentBrief models + enums
- `prisma/seeds/agents.ts` — seed 17 agents
- `src/routes/dash-agents.ts` — GET /v1/dash/agents, GET /v1/dash/agents/:id, POST /v1/dash/agents/:id/brief
- `src/routes/dash-tasks.ts` — GET /v1/dash/tasks, PATCH /v1/dash/tasks/:id/status, POST /v1/dash/tasks
- `src/routes/dash-outputs.ts` — POST /v1/dash/outputs/:id/validate
- `src/routes/dash-ws.ts` — WS /v1/dash/ws (real-time agent status)
- `src/lib/claude-agent.ts` — Claude API runner with retry + prompt caching
- `src/server.ts` — register new routes (modify)
- `src/__tests__/dash-agents.test.ts` — route tests
- `src/__tests__/dash-tasks.test.ts` — route tests

### apps/dashboard (new app)

- `package.json`
- `next.config.ts`
- `tailwind.config.ts`
- `app/layout.tsx` — root layout (dark theme, Inter font, sidebar)
- `app/page.tsx` — Hub page (metrics + output feed)
- `app/agents/[id]/page.tsx` — Agent detail page
- `app/board/page.tsx` — Kanban page
- `components/AgentTree/AgentTree.tsx` — sidebar hierarchy
- `components/AgentCard/AgentCard.tsx` — status card
- `components/KanbanBoard/KanbanBoard.tsx` — drag & drop board
- `components/KanbanBoard/KanbanCard.tsx` — task card
- `components/BriefPanel/BriefPanel.tsx` — brief form
- `components/OutputFeed/OutputFeed.tsx` — output list with validate/reject
- `lib/api.ts` — fetch helpers pointing to Fastify API
- `lib/ws.ts` — WebSocket client with exponential backoff reconnect
- `lib/types.ts` — shared TS types mirroring Prisma models

---

## Task 1: Prisma Schema — Add Dashboard Models

**Files:**

- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Append new enums and models to schema**

Open `apps/api/prisma/schema.prisma` and append at the end of the file:

```prisma
enum DashAgentType   { CLAUDE HUMAN }
enum DashAgentStatus { IDLE ACTIVE BLOCKED }
enum DashTaskStatus  { BACKLOG IN_PROGRESS IN_REVIEW DONE }
enum DashOutputType  { TEXT IMAGE URL }

model DashAgent {
  id        String          @id @default(cuid())
  name      String
  role      String
  type      DashAgentType
  parentId  String?
  parent    DashAgent?      @relation("DashAgentHierarchy", fields: [parentId], references: [id])
  children  DashAgent[]     @relation("DashAgentHierarchy")
  status    DashAgentStatus @default(IDLE)
  tasks     DashTask[]
  briefs    AgentBrief[]
  outputs   DashOutput[]
  createdAt DateTime        @default(now())
}

model DashTask {
  id              String          @id @default(cuid())
  title           String
  description     String?
  status          DashTaskStatus  @default(BACKLOG)
  assignedAgentId String
  agent           DashAgent       @relation(fields: [assignedAgentId], references: [id])
  output          DashOutput?
  dueDate         DateTime?
  createdAt       DateTime        @default(now())
}

model DashOutput {
  id        String         @id @default(cuid())
  taskId    String         @unique
  task      DashTask       @relation(fields: [taskId], references: [id])
  agentId   String
  agent     DashAgent      @relation(fields: [agentId], references: [id])
  content   String
  type      DashOutputType
  validated Boolean        @default(false)
  createdAt DateTime       @default(now())
}

model AgentBrief {
  id      String    @id @default(cuid())
  agentId String
  agent   DashAgent @relation(fields: [agentId], references: [id])
  content String
  sentAt  DateTime  @default(now())
  sentBy  String
}
```

- [ ] **Step 2: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name add-dashboard-agents
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify generated client has new types**

```bash
grep -l "DashAgent" node_modules/.prisma/client/index.d.ts
```

Expected: file path printed (no error).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): add dashboard agent models to prisma schema"
```

---

## Task 2: Seed — 17 Agents

**Files:**

- Create: `apps/api/prisma/seeds/agents.ts`

- [ ] **Step 1: Create the seed file**

```typescript
// apps/api/prisma/seeds/agents.ts
import { DashAgentType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAgents() {
  // Manager
  const manager = await prisma.dashAgent.upsert({
    where: { id: 'agent-manager' },
    update: {},
    create: {
      id: 'agent-manager',
      name: 'Manager',
      role: 'Project Manager',
      type: DashAgentType.CLAUDE,
    },
  });

  // Seniors
  const designer = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-designer' },
    update: {},
    create: {
      id: 'agent-senior-designer',
      name: 'Senior Designer',
      role: 'Design Lead',
      type: DashAgentType.HUMAN,
      parentId: manager.id,
    },
  });

  const influencer = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-influencer' },
    update: {},
    create: {
      id: 'agent-senior-influencer',
      name: 'Senior Influencer',
      role: 'Ambassador Lead',
      type: DashAgentType.CLAUDE,
      parentId: manager.id,
    },
  });

  const juridique = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-juridique' },
    update: {},
    create: {
      id: 'agent-senior-juridique',
      name: 'Senior Juridique',
      role: 'Legal Lead',
      type: DashAgentType.HUMAN,
      parentId: manager.id,
    },
  });

  const cfo = await prisma.dashAgent.upsert({
    where: { id: 'agent-senior-cfo' },
    update: {},
    create: {
      id: 'agent-senior-cfo',
      name: 'Directeur Financier',
      role: 'CFO',
      type: DashAgentType.HUMAN,
      parentId: manager.id,
    },
  });

  // Designer sub-agents
  const subAgents = [
    {
      id: 'agent-uiux',
      name: 'UI/UX Designer',
      role: 'Interface Design',
      type: DashAgentType.HUMAN,
      parentId: designer.id,
    },
    {
      id: 'agent-brand',
      name: 'Brand Designer',
      role: 'Brand Identity',
      type: DashAgentType.CLAUDE,
      parentId: designer.id,
    },
    // Influencer sub-agents
    {
      id: 'agent-content',
      name: 'Content Creator',
      role: 'Content Production',
      type: DashAgentType.CLAUDE,
      parentId: influencer.id,
    },
    {
      id: 'agent-community',
      name: 'Community Manager',
      role: 'Community Engagement',
      type: DashAgentType.HUMAN,
      parentId: influencer.id,
    },
    // Legal sub-agents
    {
      id: 'agent-contracts',
      name: 'Contract Specialist',
      role: 'Contract Review',
      type: DashAgentType.HUMAN,
      parentId: juridique.id,
    },
    {
      id: 'agent-compliance',
      name: 'Compliance Officer',
      role: 'Regulatory Compliance',
      type: DashAgentType.HUMAN,
      parentId: juridique.id,
    },
    {
      id: 'agent-ip',
      name: 'IP Specialist',
      role: 'Intellectual Property',
      type: DashAgentType.CLAUDE,
      parentId: juridique.id,
    },
    {
      id: 'agent-rgpd',
      name: 'RGPD / Data Protection',
      role: 'Data Privacy',
      type: DashAgentType.HUMAN,
      parentId: juridique.id,
    },
    // CFO sub-agents
    {
      id: 'agent-budget',
      name: 'Budget Analyst',
      role: 'Budget Planning',
      type: DashAgentType.HUMAN,
      parentId: cfo.id,
    },
    {
      id: 'agent-reporting',
      name: 'Financial Reporting',
      role: 'Financial Reports',
      type: DashAgentType.CLAUDE,
      parentId: cfo.id,
    },
    {
      id: 'agent-cashflow',
      name: 'Cash Flow',
      role: 'Cash Flow Analysis',
      type: DashAgentType.HUMAN,
      parentId: cfo.id,
    },
    {
      id: 'agent-investment',
      name: 'Investment Analyst',
      role: 'Investment Strategy',
      type: DashAgentType.CLAUDE,
      parentId: cfo.id,
    },
  ];

  for (const agent of subAgents) {
    await prisma.dashAgent.upsert({
      where: { id: agent.id },
      update: {},
      create: agent,
    });
  }

  console.log('✓ 17 agents seeded');
}
```

- [ ] **Step 2: Add call to main seed file**

Open `apps/api/prisma/seed.ts` and add at the top:

```typescript
import { seedAgents } from './seeds/agents.js';
```

And at the end of the `main()` function (before `prisma.$disconnect()`):

```typescript
await seedAgents();
```

- [ ] **Step 3: Run seed**

```bash
cd apps/api && npm run db:seed
```

Expected: `✓ 17 agents seeded` in output.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/seeds/agents.ts apps/api/prisma/seed.ts
git commit -m "feat(api): seed 17 dashboard agents"
```

---

## Task 3: Claude Agent Runner

**Files:**

- Create: `apps/api/src/lib/claude-agent.ts`

- [ ] **Step 1: Write the Claude runner**

```typescript
// apps/api/src/lib/claude-agent.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an AI agent working for Outfit Now, an AI styling company.
Execute the given task and return a structured output.
Always respond in the same language as the brief (French or English).`;

export interface AgentRunResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export async function runClaudeAgent(
  agentName: string,
  agentRole: string,
  brief: string,
  retries = 3,
): Promise<AgentRunResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Agent: ${agentName} (${agentRole})\n\nTask brief:\n${brief}`,
          },
        ],
      });

      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      return {
        content: text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error('Claude agent failed after retries');
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/lib/claude-agent.ts
git commit -m "feat(api): add Claude agent runner with prompt caching and retry"
```

---

## Task 4: API Routes — Agents

**Files:**

- Create: `apps/api/src/routes/dash-agents.ts`
- Create: `apps/api/src/__tests__/dash-agents.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/api/src/__tests__/dash-agents.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  // Use test auth token (sign directly via app.jwt)
  token = app.jwt.sign({ id: 'test-user' });
});

afterAll(async () => {
  await app.close();
});

describe('GET /v1/dash/agents', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/dash/agents' });
    expect(res.statusCode).toBe(401);
  });

  it('returns agent list with hierarchy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/dash/agents',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ agents: unknown[] }>();
    expect(Array.isArray(body.agents)).toBe(true);
  });
});

describe('GET /v1/dash/agents/:id', () => {
  it('returns 404 for unknown agent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/dash/agents/nonexistent',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /v1/dash/agents/:id/brief', () => {
  it('returns 400 for empty content', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/dash/agents/agent-manager/brief',
      headers: { authorization: `Bearer ${token}` },
      payload: { content: '' },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && npm test -- dash-agents
```

Expected: FAIL (routes don't exist yet).

- [ ] **Step 3: Create the route file**

```typescript
// apps/api/src/routes/dash-agents.ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { runClaudeAgent } from '../lib/claude-agent.js';
import { DashAgentStatus, DashAgentType } from '@prisma/client';

const briefSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function dashAgentRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  app.get('/v1/dash/agents', auth, async () => {
    const agents = await prisma.dashAgent.findMany({
      include: { children: true },
      orderBy: { createdAt: 'asc' },
    });
    return { agents };
  });

  app.get<{ Params: { id: string } }>('/v1/dash/agents/:id', auth, async (request, reply) => {
    const agent = await prisma.dashAgent.findUnique({
      where: { id: request.params.id },
      include: {
        children: true,
        tasks: { orderBy: { createdAt: 'desc' }, take: 20 },
        briefs: { orderBy: { sentAt: 'desc' }, take: 10 },
        outputs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!agent) return reply.status(404).send({ message: 'Agent not found' });
    return { agent };
  });

  app.post<{ Params: { id: string } }>(
    '/v1/dash/agents/:id/brief',
    auth,
    async (request, reply) => {
      const { id: userId } = request.user as { id: string };
      const body = briefSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

      const agent = await prisma.dashAgent.findUnique({ where: { id: request.params.id } });
      if (!agent) return reply.status(404).send({ message: 'Agent not found' });

      const brief = await prisma.agentBrief.create({
        data: { agentId: agent.id, content: body.data.content, sentBy: userId },
      });

      // If Claude agent, run it and store output
      if (agent.type === DashAgentType.CLAUDE) {
        // Fire and forget — update status, run, save output
        void (async () => {
          await prisma.dashAgent.update({
            where: { id: agent.id },
            data: { status: DashAgentStatus.ACTIVE },
          });
          try {
            // Find or create a task for this brief
            const task = await prisma.dashTask.create({
              data: {
                title: body.data.content.slice(0, 80),
                assignedAgentId: agent.id,
                status: 'IN_PROGRESS',
              },
            });
            const result = await runClaudeAgent(agent.name, agent.role, body.data.content);
            await prisma.dashOutput.create({
              data: {
                taskId: task.id,
                agentId: agent.id,
                content: result.content,
                type: 'TEXT',
              },
            });
            await prisma.dashTask.update({ where: { id: task.id }, data: { status: 'IN_REVIEW' } });
            await prisma.dashAgent.update({
              where: { id: agent.id },
              data: { status: DashAgentStatus.IDLE },
            });
          } catch {
            await prisma.dashAgent.update({
              where: { id: agent.id },
              data: { status: DashAgentStatus.BLOCKED },
            });
          }
        })();
      }

      return { brief };
    },
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/api && npm test -- dash-agents
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/dash-agents.ts apps/api/src/__tests__/dash-agents.test.ts
git commit -m "feat(api): add /v1/dash/agents routes with brief endpoint"
```

---

## Task 5: API Routes — Tasks & Outputs

**Files:**

- Create: `apps/api/src/routes/dash-tasks.ts`
- Create: `apps/api/src/routes/dash-outputs.ts`
- Create: `apps/api/src/__tests__/dash-tasks.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/api/src/__tests__/dash-tasks.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../server.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  token = app.jwt.sign({ id: 'test-user' });
});

afterAll(async () => {
  await app.close();
});

describe('GET /v1/dash/tasks', () => {
  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/dash/tasks' });
    expect(res.statusCode).toBe(401);
  });

  it('returns tasks array', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/dash/tasks',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ tasks: unknown[] }>().tasks).toBeDefined();
  });
});

describe('PATCH /v1/dash/tasks/:id/status', () => {
  it('returns 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/dash/tasks/fake-id/status',
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'INVALID' },
    });
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && npm test -- dash-tasks
```

Expected: FAIL.

- [ ] **Step 3: Create tasks route**

```typescript
// apps/api/src/routes/dash-tasks.ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  assignedAgentId: z.string(),
  dueDate: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

const listTasksSchema = z.object({
  agentId: z.string().optional(),
  status: z.enum(['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
});

export async function dashTaskRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  app.get('/v1/dash/tasks', auth, async (request) => {
    const query = listTasksSchema.parse(request.query);
    const tasks = await prisma.dashTask.findMany({
      where: {
        ...(query.agentId ? { assignedAgentId: query.agentId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: { agent: true, output: true },
      orderBy: { createdAt: 'desc' },
    });
    return { tasks };
  });

  app.post('/v1/dash/tasks', auth, async (request, reply) => {
    const body = createTaskSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const agent = await prisma.dashAgent.findUnique({ where: { id: body.data.assignedAgentId } });
    if (!agent) return reply.status(404).send({ message: 'Agent not found' });

    const task = await prisma.dashTask.create({
      data: {
        title: body.data.title,
        description: body.data.description,
        assignedAgentId: body.data.assignedAgentId,
        dueDate: body.data.dueDate ? new Date(body.data.dueDate) : undefined,
      },
      include: { agent: true },
    });
    return { task };
  });

  app.patch<{ Params: { id: string } }>(
    '/v1/dash/tasks/:id/status',
    auth,
    async (request, reply) => {
      const body = updateStatusSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

      const task = await prisma.dashTask.findUnique({ where: { id: request.params.id } });
      if (!task) return reply.status(404).send({ message: 'Task not found' });

      // Output must be validated before marking DONE
      if (body.data.status === 'DONE') {
        const output = await prisma.dashOutput.findUnique({ where: { taskId: task.id } });
        if (output && !output.validated) {
          return reply
            .status(409)
            .send({ message: 'Output must be validated before closing task' });
        }
      }

      const updated = await prisma.dashTask.update({
        where: { id: request.params.id },
        data: { status: body.data.status },
      });
      return { task: updated };
    },
  );
}
```

- [ ] **Step 4: Create outputs route**

```typescript
// apps/api/src/routes/dash-outputs.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function dashOutputRoutes(app: FastifyInstance) {
  const auth = { onRequest: [app.authenticate] };

  app.post<{ Params: { id: string } }>(
    '/v1/dash/outputs/:id/validate',
    auth,
    async (request, reply) => {
      const output = await prisma.dashOutput.findUnique({ where: { id: request.params.id } });
      if (!output) return reply.status(404).send({ message: 'Output not found' });

      const updated = await prisma.dashOutput.update({
        where: { id: request.params.id },
        data: { validated: true },
      });
      return { output: updated };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/v1/dash/outputs/:id/reject',
    auth,
    async (request, reply) => {
      const output = await prisma.dashOutput.findUnique({ where: { id: request.params.id } });
      if (!output) return reply.status(404).send({ message: 'Output not found' });
      // Reset task to IN_PROGRESS
      await prisma.dashTask.update({
        where: { id: output.taskId },
        data: { status: 'IN_PROGRESS' },
      });
      return { message: 'Output rejected, task reopened' };
    },
  );
}
```

- [ ] **Step 5: Run tests**

```bash
cd apps/api && npm test -- dash-tasks
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/dash-tasks.ts apps/api/src/routes/dash-outputs.ts apps/api/src/__tests__/dash-tasks.test.ts
git commit -m "feat(api): add /v1/dash/tasks and /v1/dash/outputs routes"
```

---

## Task 6: WebSocket for Real-Time Status

**Files:**

- Create: `apps/api/src/routes/dash-ws.ts`
- Modify: `apps/api/package.json` — add `@fastify/websocket`

- [ ] **Step 1: Install WebSocket plugin**

```bash
cd apps/api && npm install @fastify/websocket
```

- [ ] **Step 2: Create WebSocket route**

```typescript
// apps/api/src/routes/dash-ws.ts
import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { prisma } from '../lib/prisma.js';

// In-memory set of active connections
const clients = new Set<import('ws').WebSocket>();

export function broadcastAgentStatus(agentId: string, status: string) {
  const message = JSON.stringify({ type: 'agent_status', agentId, status });
  for (const client of clients) {
    if (client.readyState === 1) client.send(message);
  }
}

export async function dashWsRoutes(app: FastifyInstance) {
  await app.register(websocket);

  app.get('/v1/dash/ws', { websocket: true }, (socket) => {
    clients.add(socket);

    // Send current agent statuses on connect
    void prisma.dashAgent.findMany({ select: { id: true, status: true } }).then((agents) => {
      socket.send(JSON.stringify({ type: 'init', agents }));
    });

    socket.on('close', () => {
      clients.delete(socket);
    });
  });
}
```

- [ ] **Step 3: Use broadcast in agent routes**

In `apps/api/src/routes/dash-agents.ts`, import and call `broadcastAgentStatus` after each status update:

```typescript
import { broadcastAgentStatus } from './dash-ws.js';
```

Add after each `prisma.dashAgent.update({ data: { status: ... } })`:

```typescript
broadcastAgentStatus(agent.id, newStatus);
```

Replace the three status updates in the fire-and-forget block:

```typescript
await prisma.dashAgent.update({
  where: { id: agent.id },
  data: { status: DashAgentStatus.ACTIVE },
});
broadcastAgentStatus(agent.id, 'ACTIVE');
// ... on success:
await prisma.dashAgent.update({ where: { id: agent.id }, data: { status: DashAgentStatus.IDLE } });
broadcastAgentStatus(agent.id, 'IDLE');
// ... on error:
await prisma.dashAgent.update({
  where: { id: agent.id },
  data: { status: DashAgentStatus.BLOCKED },
});
broadcastAgentStatus(agent.id, 'BLOCKED');
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/dash-ws.ts apps/api/src/routes/dash-agents.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat(api): add WebSocket broadcast for real-time agent status"
```

---

## Task 7: Register New Routes in server.ts

**Files:**

- Modify: `apps/api/src/server.ts`

- [ ] **Step 1: Add imports**

In `apps/api/src/server.ts`, add these imports after the existing route imports:

```typescript
import { dashAgentRoutes } from './routes/dash-agents.js';
import { dashTaskRoutes } from './routes/dash-tasks.js';
import { dashOutputRoutes } from './routes/dash-outputs.js';
import { dashWsRoutes } from './routes/dash-ws.js';
```

- [ ] **Step 2: Register routes**

Add after `await app.register(avatarRoutes);`:

```typescript
await app.register(dashAgentRoutes);
await app.register(dashTaskRoutes);
await app.register(dashOutputRoutes);
await app.register(dashWsRoutes);
```

- [ ] **Step 3: Verify app builds**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
cd apps/api && npm test
```

Expected: all tests pass (no regressions).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/server.ts
git commit -m "feat(api): register dashboard routes"
```

---

## Task 8: Bootstrap apps/dashboard

**Files:**

- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/next.config.ts`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/tailwind.config.ts`
- Create: `apps/dashboard/postcss.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@outfit-now/dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "*"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```typescript
// apps/dashboard/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000',
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
// apps/dashboard/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: '#7C3AED',
          gold: '#D97706',
          dark: '#0F0F0F',
          surface: '#1A1A1A',
          border: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 6: Install dependencies**

```bash
cd apps/dashboard && npm install
```

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): bootstrap Next.js 14 app with Tailwind"
```

---

## Task 9: Shared Types & API Client

**Files:**

- Create: `apps/dashboard/lib/types.ts`
- Create: `apps/dashboard/lib/api.ts`
- Create: `apps/dashboard/lib/ws.ts`

- [ ] **Step 1: Create types**

```typescript
// apps/dashboard/lib/types.ts
export type AgentType = 'CLAUDE' | 'HUMAN';
export type AgentStatus = 'IDLE' | 'ACTIVE' | 'BLOCKED';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type OutputType = 'TEXT' | 'IMAGE' | 'URL';

export interface Agent {
  id: string;
  name: string;
  role: string;
  type: AgentType;
  status: AgentStatus;
  parentId: string | null;
  children: Agent[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedAgentId: string;
  agent: Agent;
  output: Output | null;
  dueDate: string | null;
  createdAt: string;
}

export interface Output {
  id: string;
  taskId: string;
  agentId: string;
  content: string;
  type: OutputType;
  validated: boolean;
  createdAt: string;
}

export interface Brief {
  id: string;
  agentId: string;
  content: string;
  sentAt: string;
  sentBy: string;
}
```

- [ ] **Step 2: Create API client**

```typescript
// apps/dashboard/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// In a real app, the token would come from a cookie/session.
// For now we read it from localStorage (client-side only).
function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashboard_token') ?? '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getAgents: () => request<{ agents: import('./types').Agent[] }>('/v1/dash/agents'),
  getAgent: (id: string) => request<{ agent: import('./types').Agent }>(`/v1/dash/agents/${id}`),
  sendBrief: (agentId: string, content: string) =>
    request<{ brief: import('./types').Brief }>(`/v1/dash/agents/${agentId}/brief`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  getTasks: (params?: { agentId?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ tasks: import('./types').Task[] }>(`/v1/dash/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (data: {
    title: string;
    description?: string;
    assignedAgentId: string;
    dueDate?: string;
  }) =>
    request<{ task: import('./types').Task }>('/v1/dash/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (taskId: string, status: import('./types').TaskStatus) =>
    request<{ task: import('./types').Task }>(`/v1/dash/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  validateOutput: (outputId: string) =>
    request<{ output: import('./types').Output }>(`/v1/dash/outputs/${outputId}/validate`, {
      method: 'POST',
    }),
  rejectOutput: (outputId: string) =>
    request<{ message: string }>(`/v1/dash/outputs/${outputId}/reject`, { method: 'POST' }),
};
```

- [ ] **Step 3: Create WebSocket client**

```typescript
// apps/dashboard/lib/ws.ts
type StatusHandler = (agentId: string, status: string) => void;

export function connectDashWs(onStatus: StatusHandler): () => void {
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3000';
  let ws: WebSocket | null = null;
  let retryDelay = 1000;
  let stopped = false;

  function connect() {
    ws = new WebSocket(`${WS_URL}/v1/dash/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as
        | { type: 'agent_status'; agentId: string; status: string }
        | { type: 'init'; agents: { id: string; status: string }[] };

      if (data.type === 'agent_status') {
        onStatus(data.agentId, data.status);
      } else if (data.type === 'init') {
        for (const agent of data.agents) onStatus(agent.id, agent.status);
      }
    };

    ws.onclose = () => {
      if (stopped) return;
      setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, 30_000);
        connect();
      }, retryDelay);
    };

    ws.onopen = () => {
      retryDelay = 1000;
    };
  }

  connect();
  return () => {
    stopped = true;
    ws?.close();
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/lib/
git commit -m "feat(dashboard): add shared types, API client, and WebSocket client"
```

---

## Task 10: Root Layout & Global Styles

**Files:**

- Create: `apps/dashboard/app/globals.css`
- Create: `apps/dashboard/app/layout.tsx`

- [ ] **Step 1: Create globals.css**

```css
/* apps/dashboard/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  color-scheme: dark;
}

body {
  background-color: #0f0f0f;
  color: #f5f5f5;
  font-family: 'Inter', system-ui, sans-serif;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #1a1a1a;
}
::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 3px;
}
```

- [ ] **Step 2: Create root layout**

```tsx
// apps/dashboard/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { AgentTree } from '@/components/AgentTree/AgentTree';

export const metadata: Metadata = {
  title: 'Outfit Now — Agent Dashboard',
  description: 'Pilotage des agents IA Outfit Now',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="flex h-screen overflow-hidden bg-brand-dark text-white">
        <aside className="w-64 flex-shrink-0 border-r border-brand-border bg-brand-surface overflow-y-auto">
          <div className="p-4 border-b border-brand-border">
            <span className="text-sm font-semibold tracking-widest text-brand-violet uppercase">
              Outfit Now
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Agent Dashboard</p>
          </div>
          <AgentTree />
        </aside>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/app/globals.css apps/dashboard/app/layout.tsx
git commit -m "feat(dashboard): root layout with sidebar shell"
```

---

## Task 11: AgentTree Sidebar Component

**Files:**

- Create: `apps/dashboard/components/AgentTree/AgentTree.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/dashboard/components/AgentTree/AgentTree.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { connectDashWs } from '@/lib/ws';
import type { Agent, AgentStatus } from '@/lib/types';

const STATUS_COLORS: Record<AgentStatus, string> = {
  IDLE: 'bg-gray-500',
  ACTIVE: 'bg-green-500 animate-pulse',
  BLOCKED: 'bg-red-500',
};

function AgentNode({ agent, depth = 0 }: { agent: Agent; depth?: number }) {
  return (
    <div>
      <Link
        href={`/agents/${agent.id}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors group"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[agent.status]}`} />
        <span
          className={`text-sm truncate ${depth === 0 ? 'font-semibold text-brand-violet' : depth === 1 ? 'font-medium text-gray-200' : 'text-gray-400'}`}
        >
          {agent.name}
        </span>
      </Link>
      {agent.children?.map((child) => (
        <AgentNode key={child.id} agent={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function AgentTree() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    api
      .getAgents()
      .then(({ agents }) => setAgents(agents))
      .catch(console.error);
  }, []);

  useEffect(() => {
    return connectDashWs((agentId, status) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: status as AgentStatus } : a)),
      );
    });
  }, []);

  const roots = agents.filter((a) => a.parentId === null);

  return (
    <nav className="py-3 space-y-0.5">
      <p className="px-3 pb-2 text-xs uppercase tracking-wider text-gray-600">Agents</p>
      {roots.map((agent) => (
        <AgentNode key={agent.id} agent={agent} />
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/components/AgentTree/
git commit -m "feat(dashboard): AgentTree sidebar with live status indicators"
```

---

## Task 12: AgentCard Component

**Files:**

- Create: `apps/dashboard/components/AgentCard/AgentCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/dashboard/components/AgentCard/AgentCard.tsx
import Link from 'next/link';
import type { Agent } from '@/lib/types';

const STATUS_LABELS = { IDLE: 'En attente', ACTIVE: 'Actif', BLOCKED: 'Bloqué' };
const TYPE_LABELS = { CLAUDE: 'IA', HUMAN: 'Humain' };

const STATUS_STYLES = {
  IDLE: 'text-gray-400 bg-gray-800',
  ACTIVE: 'text-green-400 bg-green-900/30',
  BLOCKED: 'text-red-400 bg-red-900/30',
};

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className={`block bg-brand-surface border border-brand-border rounded-xl hover:border-brand-violet/50 transition-colors ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {agent.name}
          </p>
          <p className="text-xs text-gray-500 truncate">{agent.role}</p>
        </div>
        <span
          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[agent.status]}`}
        >
          {STATUS_LABELS[agent.status]}
        </span>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-brand-violet border border-brand-violet/30 rounded px-1.5 py-0.5">
            {TYPE_LABELS[agent.type]}
          </span>
          {agent.children?.length > 0 && (
            <span className="text-xs text-gray-600">{agent.children.length} sous-agents</span>
          )}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/components/AgentCard/
git commit -m "feat(dashboard): AgentCard component"
```

---

## Task 13: OutputFeed Component

**Files:**

- Create: `apps/dashboard/components/OutputFeed/OutputFeed.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/dashboard/components/OutputFeed/OutputFeed.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Output, Task } from '@/lib/types';

interface OutputFeedProps {
  tasks: Task[];
  onValidated?: (outputId: string) => void;
}

export function OutputFeed({ tasks, onValidated }: OutputFeedProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const pending = tasks.filter((t) => t.output && !t.output.validated && t.status === 'IN_REVIEW');

  async function handleValidate(output: Output) {
    setLoading(output.id);
    try {
      await api.validateOutput(output.id);
      onValidated?.(output.id);
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(output: Output) {
    setLoading(output.id);
    try {
      await api.rejectOutput(output.id);
      onValidated?.(output.id);
    } finally {
      setLoading(null);
    }
  }

  if (pending.length === 0) {
    return <p className="text-sm text-gray-600 py-4">Aucun output en attente de validation.</p>;
  }

  return (
    <div className="space-y-3">
      {pending.map((task) => {
        const output = task.output!;
        return (
          <div
            key={output.id}
            className="bg-brand-surface border border-brand-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-gray-500">{task.agent.name}</p>
              </div>
              <span className="text-xs text-brand-gold border border-brand-gold/30 rounded px-1.5 py-0.5">
                En review
              </span>
            </div>
            <p className="text-sm text-gray-300 bg-black/20 rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {output.content}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleValidate(output)}
                disabled={loading === output.id}
                className="flex-1 text-sm bg-brand-violet hover:bg-brand-violet/80 text-white rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                Valider
              </button>
              <button
                onClick={() => handleReject(output)}
                disabled={loading === output.id}
                className="flex-1 text-sm border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/components/OutputFeed/
git commit -m "feat(dashboard): OutputFeed component with validate/reject"
```

---

## Task 14: BriefPanel Component

**Files:**

- Create: `apps/dashboard/components/BriefPanel/BriefPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/dashboard/components/BriefPanel/BriefPanel.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Agent } from '@/lib/types';

interface BriefPanelProps {
  agent: Agent;
  onBriefSent?: () => void;
}

export function BriefPanel({ agent, onBriefSent }: BriefPanelProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.sendBrief(agent.id, content.trim());
      setContent('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      onBriefSent?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Brief pour <span className="text-brand-violet">{agent.name}</span>
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Donne une instruction à ${agent.name}...`}
        rows={5}
        className="w-full bg-black/30 border border-brand-border rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-violet resize-none"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="w-full bg-brand-violet hover:bg-brand-violet/80 text-white text-sm font-medium rounded-lg py-2 transition-colors disabled:opacity-50"
      >
        {loading ? 'Envoi…' : sent ? '✓ Brief envoyé' : 'Envoyer le brief'}
      </button>
      {agent.type === 'CLAUDE' && (
        <p className="text-xs text-gray-600">Cet agent IA traitera le brief automatiquement.</p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/components/BriefPanel/
git commit -m "feat(dashboard): BriefPanel component"
```

---

## Task 15: Hub Page (/)

**Files:**

- Create: `apps/dashboard/app/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/dashboard/app/page.tsx
import { api } from '@/lib/api';
import { AgentCard } from '@/components/AgentCard/AgentCard';
import { OutputFeed } from '@/components/OutputFeed/OutputFeed';

export const dynamic = 'force-dynamic';

export default async function HubPage() {
  const [{ agents }, { tasks }] = await Promise.all([api.getAgents(), api.getTasks()]);

  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReview = tasks.filter((t) => t.status === 'IN_REVIEW').length;
  const activeAgents = agents.filter((a) => a.status === 'ACTIVE').length;

  const seniors = agents.filter((a) => a.parentId !== null && a.children?.length > 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble du projet Outfit Now</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Agents actifs', value: activeAgents },
          { label: 'Tâches en cours', value: inProgress },
          { label: 'En attente de validation', value: inReview },
        ].map((m) => (
          <div key={m.label} className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <p className="text-3xl font-bold text-brand-violet">{m.value}</p>
            <p className="text-sm text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Agents seniors */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Seniors</h2>
          <div className="grid grid-cols-2 gap-3">
            {seniors.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Output feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Outputs à valider
          </h2>
          <OutputFeed tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/app/page.tsx
git commit -m "feat(dashboard): Hub page with metrics, agent cards, and output feed"
```

---

## Task 16: Agent Detail Page

**Files:**

- Create: `apps/dashboard/app/agents/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/dashboard/app/agents/[id]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { AgentCard } from '@/components/AgentCard/AgentCard';
import { BriefPanel } from '@/components/BriefPanel/BriefPanel';

export const dynamic = 'force-dynamic';

const STATUS_LABELS = { IDLE: 'En attente', ACTIVE: 'Actif', BLOCKED: 'Bloqué' };
const STATUS_STYLES = {
  IDLE: 'text-gray-400',
  ACTIVE: 'text-green-400',
  BLOCKED: 'text-red-400',
};

export default async function AgentPage({ params }: { params: { id: string } }) {
  const data = await api.getAgent(params.id).catch(() => null);
  if (!data) notFound();

  const { agent } = data;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{agent.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs border border-brand-violet/30 text-brand-violet rounded px-2 py-1">
            {agent.type === 'CLAUDE' ? 'Agent IA' : 'Humain'}
          </span>
          <span className={`text-sm font-medium ${STATUS_STYLES[agent.status]}`}>
            ● {STATUS_LABELS[agent.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Brief panel */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Envoyer un brief
            </h2>
            <BriefPanel agent={agent} />
          </div>

          {/* Task history */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Tâches récentes
            </h2>
            {(agent as unknown as { tasks?: { id: string; title: string; status: string }[] }).tasks
              ?.length ? (
              <div className="space-y-2">
                {(
                  agent as unknown as { tasks: { id: string; title: string; status: string }[] }
                ).tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2 border-b border-brand-border last:border-0"
                  >
                    <p className="text-sm text-gray-300 truncate">{task.title}</p>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{task.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Aucune tâche pour le moment.</p>
            )}
          </div>
        </div>

        {/* Sub-agents */}
        {agent.children?.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Sous-agents
            </h2>
            {agent.children.map((child) => (
              <AgentCard key={child.id} agent={child} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/app/agents/
git commit -m "feat(dashboard): Agent detail page with brief panel and task history"
```

---

## Task 17: KanbanBoard Component

**Files:**

- Create: `apps/dashboard/components/KanbanBoard/KanbanCard.tsx`
- Create: `apps/dashboard/components/KanbanBoard/KanbanBoard.tsx`

- [ ] **Step 1: Create KanbanCard**

```tsx
// apps/dashboard/components/KanbanBoard/KanbanCard.tsx
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '@/lib/types';

const AGENT_COLORS: Record<string, string> = {
  'agent-senior-designer': 'border-l-purple-500',
  'agent-senior-influencer': 'border-l-pink-500',
  'agent-senior-juridique': 'border-l-blue-500',
  'agent-senior-cfo': 'border-l-brand-gold',
};

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const colorClass = AGENT_COLORS[task.assignedAgentId] ?? 'border-l-gray-600';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-brand-dark border border-brand-border border-l-4 ${colorClass} rounded-lg p-3 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-medium text-gray-200 line-clamp-2">{task.title}</p>
      <p className="text-xs text-gray-600 mt-1">{task.agent.name}</p>
      {task.output && !task.output.validated && (
        <span className="mt-2 inline-block text-xs bg-brand-gold/20 text-brand-gold rounded px-1.5 py-0.5">
          Output prêt
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create KanbanBoard**

```tsx
// apps/dashboard/components/KanbanBoard/KanbanBoard.tsx
'use client';

import { useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { api } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'BACKLOG', label: 'Backlog' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'IN_REVIEW', label: 'En review' },
  { id: 'DONE', label: 'Validé' },
];

function Column({ id, label, tasks }: { id: TaskStatus; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[220px] rounded-xl p-3 ${isOver ? 'bg-white/5' : 'bg-brand-surface'} border border-brand-border`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
        <span className="text-xs bg-brand-border rounded-full w-5 h-5 flex items-center justify-center text-gray-400">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  initialTasks: Task[];
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch {
      // Revert on error
      setTasks(initialTasks);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/KanbanBoard/
git commit -m "feat(dashboard): KanbanBoard with drag & drop via @dnd-kit"
```

---

## Task 18: Board Page (/board)

**Files:**

- Create: `apps/dashboard/app/board/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/dashboard/app/board/page.tsx
import { api } from '@/lib/api';
import { KanbanBoard } from '@/components/KanbanBoard/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const { tasks } = await api.getTasks();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Board</h1>
        <p className="text-sm text-gray-500 mt-1">Toutes les tâches des agents</p>
      </div>
      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
```

- [ ] **Step 2: Add board link to layout**

In `apps/dashboard/app/layout.tsx`, add navigation links after the `<AgentTree />`:

```tsx
import Link from 'next/link';
// Inside the <aside>, after <AgentTree />, add:
<div className="p-4 border-t border-brand-border space-y-1">
  <Link
    href="/"
    className="block text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/5"
  >
    Hub
  </Link>
  <Link
    href="/board"
    className="block text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/5"
  >
    Board
  </Link>
</div>;
```

- [ ] **Step 3: Typecheck the dashboard**

```bash
cd apps/dashboard && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/app/board/ apps/dashboard/app/layout.tsx
git commit -m "feat(dashboard): Board page with kanban and nav links"
```

---

## Task 19: Add .gitignore & Final Wiring

**Files:**

- Modify: `apps/dashboard/.gitignore` (create)
- Modify: `.gitignore` (root)

- [ ] **Step 1: Create dashboard .gitignore**

```
.next/
node_modules/
.env*.local
```

- [ ] **Step 2: Add dashboard to root .gitignore if needed**

Ensure `.superpowers/` is in root `.gitignore`:

```bash
grep -q '.superpowers' .gitignore || echo '.superpowers/' >> .gitignore
```

- [ ] **Step 3: Verify full monorepo typecheck**

```bash
cd /Users/bamamadou/outfit-now && npm run typecheck
```

Expected: no errors across all workspaces.

- [ ] **Step 4: Run API tests one final time**

```bash
cd apps/api && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Final commit**

```bash
git add apps/dashboard/.gitignore .gitignore
git commit -m "chore: add gitignore for dashboard, finalize monorepo wiring"
```

---

## Running the Full Stack

```bash
# Terminal 1 — Infrastructure
docker compose -f infra/docker-compose.yml up -d

# Terminal 2 — API
cd apps/api && npm run dev

# Terminal 3 — Dashboard
cd apps/dashboard && npm run dev
```

Dashboard available at: http://localhost:3001  
API docs at: http://localhost:3000/docs
