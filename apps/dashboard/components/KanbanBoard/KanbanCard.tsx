'use client';

import { useDraggable } from '@dnd-kit/core';

import type { Task } from '@/lib/types';

const AGENT_COLORS: Record<string, string> = {
  'agent-senior-designer': 'border-l-purple-500',
  'agent-senior-influencer': 'border-l-pink-500',
  'agent-senior-juridique': 'border-l-blue-500',
  'agent-senior-cfo': 'border-l-yellow-500',
};

export function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const colorClass = AGENT_COLORS[task.assignedAgentId] ?? 'border-l-gray-600';

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-brand-dark border border-brand-border border-l-4 ${colorClass} rounded-lg p-3 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-medium text-gray-200 line-clamp-2">{task.title}</p>
      <p className="text-xs text-gray-600 mt-1">{task.agent.name}</p>
      {task.output && !task.output.validated && (
        <span className="mt-2 inline-block text-xs bg-yellow-900/30 text-yellow-400 rounded px-1.5 py-0.5">
          Output prêt
        </span>
      )}
    </div>
  );
}
