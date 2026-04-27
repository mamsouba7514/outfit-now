import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AgentTree } from '@/components/AgentTree/AgentTree';

export const metadata: Metadata = {
  title: 'Outfit Now — Agent Dashboard',
  description: 'Pilotage des agents IA Outfit Now',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="flex h-screen overflow-hidden bg-brand-dark text-white">
        <aside className="w-64 flex-shrink-0 border-r border-brand-border bg-brand-surface flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-brand-border">
            <span className="text-sm font-semibold tracking-widest text-brand-violet uppercase">
              Outfit Now
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Agent Dashboard</p>
          </div>
          <div className="flex-1">
            <AgentTree />
          </div>
          <div className="p-3 border-t border-brand-border space-y-1">
            <Link
              href="/"
              className="block text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
            >
              Hub
            </Link>
            <Link
              href="/board"
              className="block text-sm text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
            >
              Board
            </Link>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
