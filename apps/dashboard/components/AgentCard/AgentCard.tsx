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
