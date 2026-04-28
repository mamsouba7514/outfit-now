'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ranks = [
  { name: 'Novice', color: '#94A3B8', bg: '#F1F5F9' },
  { name: 'Stylé', color: 'var(--color-blue)', bg: 'var(--color-blue-light)' },
  { name: 'Expert', color: 'var(--color-green)', bg: 'var(--color-green-light)' },
  { name: 'Trendsetter', color: '#D97706', bg: '#FEF3C7' },
  { name: 'Icône', color: 'var(--color-red)', bg: 'var(--color-red-light)' },
];

const cards = [
  {
    tier: 'Bronze',
    threshold: 'Dès 0 pts',
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#D97706',
    benefits: ['Karl illimité', 'Dressing complet', 'Accès communauté'],
    isDiamond: false,
  },
  {
    tier: 'Silver',
    threshold: 'Dès 1 000 pts',
    color: '#475569',
    bg: '#F1F5F9',
    border: '#94A3B8',
    benefits: ['Tout Bronze inclus', '-5% partenaires', 'Ventes privées', 'Style Awards'],
    isDiamond: false,
  },
  {
    tier: 'Gold',
    threshold: 'Dès 5 000 pts',
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#F59E0B',
    benefits: ['Tout Silver inclus', '-10% partenaires', 'Avant-premières', 'Premium offert'],
    isDiamond: false,
  },
  {
    tier: 'Diamond',
    threshold: 'Dès 20 000 pts',
    color: '#1E3A8A',
    bg: 'linear-gradient(135deg, #DBEAFE, #EDE9FE, #DBEAFE)',
    border: 'var(--color-blue)',
    benefits: ['Tout Gold inclus', '-15% partenaires', 'Styliste dédié', 'Revenus + events privés'],
    isDiamond: true,
  },
];

export default function StylePass() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-widest mb-3">
            Style Pass
          </div>
          <h2
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-4xl font-extrabold text-[var(--color-text)] mb-4"
          >
            Monte en rang. Débloque le meilleur.
          </h2>
          <p className="text-[var(--color-muted)] max-w-xl mx-auto text-sm">
            5 niveaux de progression. Plus tu t&apos;impliques, plus tu débloques d&apos;avantages
            exclusifs.
          </p>
        </motion.div>

        {/* Ranks bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center gap-3 mb-14 flex-wrap"
        >
          {ranks.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ backgroundColor: r.bg, color: r.color }}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${r.name === 'Icône' ? 'animate-pulse-dot' : ''}`}
                style={{ backgroundColor: r.color }}
              />
              {r.name}
            </div>
          ))}
        </motion.div>

        {/* Style Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-6 border-2 overflow-hidden ${card.isDiamond ? 'shimmer-card' : ''}`}
              style={{
                background: card.bg,
                borderColor: card.border,
              }}
            >
              {card.isDiamond && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 bg-[var(--color-blue)] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              )}

              <div
                className="text-lg font-extrabold mb-1"
                style={{ fontFamily: 'var(--font-heading)', color: card.color }}
              >
                {card.tier}
              </div>
              <div className="text-xs font-medium mb-4" style={{ color: card.color, opacity: 0.7 }}>
                {card.threshold}
              </div>

              <ul className="space-y-2">
                {card.benefits.map((b, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-xs"
                    style={{ color: card.color }}
                  >
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={j === 0 && card.tier !== 'Bronze' ? 'font-semibold' : ''}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
