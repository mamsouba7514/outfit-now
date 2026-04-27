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
      await prisma.dashTask.update({
        where: { id: output.taskId },
        data: { status: 'IN_PROGRESS' },
      });
      return { message: 'Output rejected, task reopened' };
    },
  );
}
