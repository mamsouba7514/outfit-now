'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

function OrbBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute animate-orb"
        style={{
          top: '10%',
          left: '15%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute animate-orb"
        style={{
          top: '30%',
          right: '10%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)',
          animationDelay: '3s',
        }}
      />
      <div
        className="absolute animate-orb"
        style={{
          bottom: '10%',
          left: '40%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)',
          animationDelay: '5s',
        }}
      />
    </div>
  );
}

function FloatingCards() {
  return (
    <div className="relative h-[420px] md:h-[500px]">
      {/* Karl Chat card */}
      <motion.div
        className="absolute top-0 right-0 w-64 bg-[var(--color-dark)] rounded-2xl p-4 shadow-xl animate-float"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-green)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <div>
            <div className="text-white text-xs font-semibold">Karl</div>
            <div className="text-green-400 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot inline-block" />
              En ligne
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div
            className="bg-[#1a2235] rounded-xl rounded-tl-none p-2.5 text-xs text-gray-300"
            style={{ animation: 'chatAppear 0.8s ease forwards' }}
          >
            Bonjour ! Pour demain matin, je te suggère ton blazer navy avec le jean straight.
          </div>
          <div
            className="bg-[var(--color-blue)] rounded-xl rounded-tr-none p-2.5 text-xs text-white ml-auto w-fit max-w-[80%]"
            style={{ animation: 'chatAppear 0.8s 0.7s ease both' }}
          >
            Super, et avec quelles chaussures ?
          </div>
        </div>
      </motion.div>

      {/* Style Score card */}
      <motion.div
        className="absolute top-[100px] left-0 bg-white rounded-2xl p-4 shadow-lg border border-[var(--color-border)] animate-float-slow"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="text-xs font-semibold text-[var(--color-muted)] mb-1">Style Score</div>
        <div
          className="text-3xl font-bold gradient-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          87
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-1">+12 cette semaine</div>
        <div className="mt-2 h-1.5 bg-[var(--color-bg-soft)] rounded-full overflow-hidden w-32">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-blue)] to-[var(--color-green)]"
            style={{ width: '87%' }}
          />
        </div>
      </motion.div>

      {/* Mon Dressing card */}
      <motion.div
        className="absolute bottom-0 left-[20px] bg-white rounded-2xl p-4 shadow-lg border border-[var(--color-border)] animate-float"
        style={{ animationDelay: '2s' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">Mon Dressing</div>
        <div className="grid grid-cols-3 gap-1">
          {['#DBEAFE', '#D1FAE5', '#FFE4E6', '#EDE9FE', '#FEF3C7', '#FCE7F3'].map((color, i) => (
            <div key={i} className="w-8 h-8 rounded-lg" style={{ backgroundColor: color }} />
          ))}
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-2">24 pièces scannées</div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-[var(--color-bg)]"
    >
      <OrbBackground />

      <div className="relative max-w-6xl mx-auto px-6 py-16 w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-[var(--color-green-light)] text-[var(--color-green)] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-green)] animate-pulse-dot" />
            En test actif · Bêta fermée
          </div>

          {/* H1 */}
          <h1
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-5xl md:text-6xl font-extrabold leading-[1.1] mb-4"
          >
            <span className="gradient-text-animated">Porte mieux.</span>
            <br />
            <span className="text-[var(--color-text)]">Achète mieux.</span>
          </h1>

          <p className="text-lg text-[var(--color-muted)] mb-8 max-w-md leading-relaxed">
            <strong className="text-[var(--color-text)]">Karl</strong>, ton styliste IA personnel,
            compose tes tenues, identifie les pièces manquantes et te guide vers les bons achats
            chez Sézane, Zalando ou ASOS.
          </p>

          {/* Email form */}
          <form onSubmit={(e) => void handleSubmit(e)} id="waitlist">
            {status === 'success' ? (
              <div className="flex items-center gap-3 bg-[var(--color-green-light)] text-[var(--color-green)] font-semibold px-5 py-4 rounded-xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Tu es sur la liste — à très vite !
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                  className="flex-1 px-5 py-3.5 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-[var(--color-green)] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap text-sm"
                >
                  {status === 'loading' ? '...' : 'Rejoindre la liste →'}
                </button>
              </div>
            )}
            {status === 'error' && (
              <p className="mt-2 text-xs text-[var(--color-red)]">
                Une erreur est survenue. Réessaie.
              </p>
            )}
          </form>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-4 mt-5">
            {['Gratuit', 'iOS & Android', '9,99€/mois bientôt'].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]"
              >
                <svg
                  className="w-3.5 h-3.5 text-[var(--color-green)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — floating cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="hidden md:block"
        >
          <FloatingCards />
        </motion.div>
      </div>
    </section>
  );
}
