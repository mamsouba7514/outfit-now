'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';

export default function CtaFinal() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
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
    <section ref={ref} className="relative py-24 overflow-hidden bg-[var(--color-dark)]">
      {/* Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute animate-orb"
          style={{
            top: '20%',
            left: '10%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute animate-orb"
          style={{
            bottom: '20%',
            right: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(225,29,72,0.12) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-widest mb-4">
            Accès anticipé
          </div>
          <h2
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            Prêt à rencontrer Karl ?
          </h2>
          <p className="text-blue-300 mb-10 text-sm">
            Rejoins la liste d&apos;attente — offre de lancement réservée aux premiers inscrits.
          </p>

          {status === 'success' ? (
            <div className="inline-flex items-center gap-3 bg-[var(--color-green)]/20 border border-[var(--color-green)]/30 text-[var(--color-green)] font-semibold px-8 py-4 rounded-xl">
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
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="flex-1 max-w-xs px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-red)] text-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-[var(--color-red)] text-white font-bold px-7 py-4 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer text-sm"
              >
                {status === 'loading' ? '...' : 'Rejoindre →'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-2 text-xs text-[var(--color-red)]">
              Une erreur est survenue. Réessaie.
            </p>
          )}

          <div className="flex justify-center gap-6 mt-6">
            {['Gratuit', 'iOS & Android', 'Premium 9,99€/mois'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-white/40">
                <svg
                  className="w-3 h-3 text-[var(--color-green)]"
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
      </div>
    </section>
  );
}
