'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { KanbanBoard } from '@/components/KanbanBoard/KanbanBoard';
import { api } from '@/lib/api';
import type { Task } from '@/lib/types';

export default function BoardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dashboard_token');
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .getTasks()
      .then(({ tasks: t }) => setTasks(t))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Chargement…
      </div>
    );

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
