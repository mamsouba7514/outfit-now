'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AgentCard } from '@/components/AgentCard/AgentCard';
import { BriefPanel } from '@/components/BriefPanel/BriefPanel';
import { api } from '@/lib/api';
import type { Agent } from '@/lib/types';

const STATUS_LABELS = { IDLE: 'En attente', ACTIVE: 'Actif', BLOCKED: 'Bloqué' };
const STATUS_STYLES = { IDLE: 'text-gray-400', ACTIVE: 'text-green-400', BLOCKED: 'text-red-400' };

interface AgentWithTasks extends Agent {
  tasks?: { id: string; title: string; status: string }[];
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentWithTasks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .getAgent(params.id)
      .then(({ agent: a }) => setAgent(a as AgentWithTasks))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Chargement…
      </div>
    );
  if (!agent) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
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
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Envoyer un brief
            </h2>
            <BriefPanel agent={agent} />
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Tâches récentes
            </h2>
            {agent.tasks?.length ? (
              <div className="space-y-2">
                {agent.tasks.map((task) => (
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
