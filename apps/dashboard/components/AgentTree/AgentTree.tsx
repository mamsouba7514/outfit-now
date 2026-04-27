'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Agent, AgentStatus } from '@/lib/types';
import { connectDashWs } from '@/lib/ws';

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
        className="flex items-center gap-2 rounded hover:bg-white/5 transition-colors"
        style={{ padding: `6px 12px 6px ${12 + depth * 16}px` }}
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
