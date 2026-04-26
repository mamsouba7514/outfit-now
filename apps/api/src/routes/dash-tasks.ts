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

    const taskData: Parameters<typeof prisma.dashTask.create>[0]['data'] = {
      title: body.data.title,
      assignedAgentId: body.data.assignedAgentId,
    };
    if (body.data.description !== undefined) taskData.description = body.data.description;
    if (body.data.dueDate !== undefined) taskData.dueDate = new Date(body.data.dueDate);
    const task = await prisma.dashTask.create({
      data: taskData,
      include: { agent: true },
    });
    return { task };
  });

  app.patch<{ Params: { id: string } }>('/v1/dash/tasks/:id/status', auth, async (request, reply) => {
    const body = updateStatusSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const task = await prisma.dashTask.findUnique({ where: { id: request.params.id } });
    if (!task) return reply.status(404).send({ message: 'Task not found' });

    if (body.data.status === 'DONE') {
      const output = await prisma.dashOutput.findUnique({ where: { taskId: task.id } });
      if (output && !output.validated) {
        return reply.status(409).send({ message: 'Output must be validated before closing task' });
      }
    }

    const updated = await prisma.dashTask.update({
      where: { id: request.params.id },
      data: { status: body.data.status },
    });
    return { task: updated };
  });
}
