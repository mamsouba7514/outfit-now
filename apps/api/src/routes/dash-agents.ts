import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { runClaudeAgent } from '../lib/claude-agent.js';
import { DashAgentStatus, DashAgentType } from '@prisma/client';
import { broadcastAgentStatus } from './dash-ws.js';

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

  app.post<{ Params: { id: string } }>('/v1/dash/agents/:id/brief', auth, async (request, reply) => {
    const { id: userId } = request.user as { id: string };
    const body = briefSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const agent = await prisma.dashAgent.findUnique({ where: { id: request.params.id } });
    if (!agent) return reply.status(404).send({ message: 'Agent not found' });

    const brief = await prisma.agentBrief.create({
      data: { agentId: agent.id, content: body.data.content, sentBy: userId },
    });

    if (agent.type === DashAgentType.CLAUDE) {
      void (async () => {
        await prisma.dashAgent.update({ where: { id: agent.id }, data: { status: DashAgentStatus.ACTIVE } });
        broadcastAgentStatus(agent.id, 'ACTIVE');
        try {
          const task = await prisma.dashTask.create({
            data: { title: body.data.content.slice(0, 80), assignedAgentId: agent.id, status: 'IN_PROGRESS' },
          });
          const result = await runClaudeAgent(agent.name, agent.role, body.data.content);
          await prisma.dashOutput.create({
            data: { taskId: task.id, agentId: agent.id, content: result.content, type: 'TEXT' },
          });
          await prisma.dashTask.update({ where: { id: task.id }, data: { status: 'IN_REVIEW' } });
          await prisma.dashAgent.update({ where: { id: agent.id }, data: { status: DashAgentStatus.IDLE } });
          broadcastAgentStatus(agent.id, 'IDLE');
        } catch {
          await prisma.dashAgent.update({ where: { id: agent.id }, data: { status: DashAgentStatus.BLOCKED } });
          broadcastAgentStatus(agent.id, 'BLOCKED');
        }
      })();
    }

    return { brief };
  });
}
