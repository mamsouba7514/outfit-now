'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import type { Output, Task } from '@/lib/types';

interface OutputFeedProps {
  tasks: Task[];
  onValidated?: (outputId: string) => void;
}

export function OutputFeed({ tasks, onValidated }: OutputFeedProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const pending = tasks.filter((t) => t.output && !t.output.validated && t.status === 'IN_REVIEW');

  async function handleValidate(output: Output) {
    setLoading(output.id);
    try {
      await api.validateOutput(output.id);
      onValidated?.(output.id);
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(output: Output) {
    setLoading(output.id);
    try {
      await api.rejectOutput(output.id);
      onValidated?.(output.id);
    } finally {
      setLoading(null);
    }
  }

  if (pending.length === 0) {
    return <p className="text-sm text-gray-600 py-4">Aucun output en attente de validation.</p>;
  }

  return (
    <div className="space-y-3">
      {pending.map((task) => {
        const output = task.output!;
        return (
          <div
            key={output.id}
            className="bg-brand-surface border border-brand-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-gray-500">{task.agent.name}</p>
              </div>
              <span className="text-xs text-brand-gold border border-brand-gold/30 rounded px-1.5 py-0.5 flex-shrink-0">
                En review
              </span>
            </div>
            <p className="text-sm text-gray-300 bg-black/20 rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {output.content}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleValidate(output)}
                disabled={loading === output.id}
                className="flex-1 text-sm bg-brand-violet hover:bg-brand-violet/80 text-white rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                Valider
              </button>
              <button
                onClick={() => handleReject(output)}
                disabled={loading === output.id}
                className="flex-1 text-sm border border-red-500/50 text-red-400 hover:bg-red-900/20 rounded-lg py-1.5 transition-colors disabled:opacity-50"
              >
                Rejeter
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
