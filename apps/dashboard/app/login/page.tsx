'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@outfitnow.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Email ou mot de passe incorrect');
        return;
      }
      const data = (await res.json()) as { accessToken: string };
      localStorage.setItem('dashboard_token', data.accessToken);
      router.push('/');
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 w-full max-w-sm">
        <div className="mb-6">
          <span className="text-xs font-semibold tracking-widest text-brand-violet uppercase">
            Outfit Now
          </span>
          <h1 className="text-xl font-bold mt-1">Agent Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Connecte-toi pour accéder au dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/30 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-violet"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-violet"
              required
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-violet hover:bg-brand-violet/80 text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
