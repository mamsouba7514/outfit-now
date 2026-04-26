'use client';

import { DndContext, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useState } from 'react';

import { KanbanCard } from './KanbanCard';

import { api } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'BACKLOG', label: 'Backlog' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'IN_REVIEW', label: 'En review' },
  { id: 'DONE', label: 'Validé' },
];

function Column({ id, label, tasks }: { id: TaskStatus; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[220px] rounded-xl p-3 border border-brand-border ${isOver ? 'bg-white/5' : 'bg-brand-surface'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
        <span className="text-xs bg-brand-border rounded-full w-5 h-5 flex items-center justify-center text-gray-400">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch {
      setTasks(initialTasks);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
