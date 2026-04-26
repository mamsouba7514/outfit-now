import { KanbanBoard } from '@/components/KanbanBoard/KanbanBoard';
import { api } from '@/lib/api';

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
