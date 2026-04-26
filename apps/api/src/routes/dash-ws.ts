import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { prisma } from '../lib/prisma.js';

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

    void prisma.dashAgent
      .findMany({ select: { id: true, status: true } })
      .then((agents) => {
        socket.send(JSON.stringify({ type: 'init', agents }));
      });

    socket.on('close', () => {
      clients.delete(socket);
    });
  });
}
