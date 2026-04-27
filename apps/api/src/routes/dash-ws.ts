import websocket, { type SocketStream } from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';

import { prisma } from '../lib/prisma.js';

const clients = new Set<WebSocket>();

export function broadcastAgentStatus(agentId: string, status: string) {
  const message = JSON.stringify({ type: 'agent_status', agentId, status });
  for (const client of clients) {
    if (client.readyState === 1) client.send(message);
  }
}

export async function dashWsRoutes(app: FastifyInstance) {
  await app.register(websocket);

  app.get(
    '/v1/dash/ws',
    { websocket: true, onRequest: [app.authenticateDashboard] },
    (conn: SocketStream) => {
      const socket = conn.socket;
      clients.add(socket);

      prisma.dashAgent
        .findMany({ select: { id: true, status: true } })
        .then((agents) => {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: 'init', agents }));
          }
        })
        .catch(() => {
          // DB not available — skip init payload
        });

      socket.on('close', () => {
        clients.delete(socket);
      });

      socket.on('error', () => {
        clients.delete(socket);
      });
    },
  );
}
