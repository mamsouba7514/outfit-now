import { AgentCard } from '@/components/AgentCard/AgentCard';
import { OutputFeed } from '@/components/OutputFeed/OutputFeed';
import { api } from '@/lib/api';

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
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble du projet Outfit Now</p>
      </div>

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
        <div className="col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Seniors</h2>
          <div className="grid grid-cols-2 gap-3">
            {seniors.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
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
