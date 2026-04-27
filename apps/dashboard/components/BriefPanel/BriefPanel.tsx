'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import type { Agent } from '@/lib/types';

interface BriefPanelProps {
  agent: Agent;
  onBriefSent?: () => void;
}

export function BriefPanel({ agent, onBriefSent }: BriefPanelProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.sendBrief(agent.id, content.trim());
      setContent('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      onBriefSent?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Brief pour <span className="text-brand-violet">{agent.name}</span>
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Donne une instruction à ${agent.name}...`}
        rows={5}
        className="w-full bg-black/30 border border-brand-border rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-violet resize-none"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="w-full bg-brand-violet hover:bg-brand-violet/80 text-white text-sm font-medium rounded-lg py-2 transition-colors disabled:opacity-50"
      >
        {loading ? 'Envoi…' : sent ? '✓ Brief envoyé' : 'Envoyer le brief'}
      </button>
      {agent.type === 'CLAUDE' && (
        <p className="text-xs text-gray-600">Cet agent IA traitera le brief automatiquement.</p>
      )}
    </form>
  );
}
