'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const piliers = [
  {
    num: '01',
    title: 'Dressing IA',
    desc: 'SAM2 + CLIP pour numériser tes vêtements en 2 secondes. Ton dressing entier, organisé, consultable à tout moment.',
    bg: 'var(--color-blue-light)',
    accent: 'var(--color-blue)',
    icon: '👗',
  },
  {
    num: '02',
    title: 'Karl — Styliste & Shopping',
    desc: "Tenues contextuelles adaptées à ton style, l'occasion, la météo. Shopping intelligent Sézane / Zalando / ASOS avec score de match.",
    bg: 'var(--color-green-light)',
    accent: 'var(--color-green)',
    icon: '✨',
  },
  {
    num: '03',
    title: 'Mannequin IA',
    desc: 'PuLID-Flux : visualise chaque tenue sur un mannequin qui te ressemble. Ton visage préservé, ton corps représenté.',
    bg: 'var(--color-red-light)',
    accent: 'var(--color-red)',
    icon: '🪞',
  },
  {
    num: '04',
    title: 'Style Pass',
    desc: '5 rangs — de Novice à Icône. Débloque des Style Cards exclusives Bronze, Silver, Gold, Diamond avec avantages cumulatifs.',
    bg: '#EDE9FE',
    accent: '#7C3AED',
    icon: '🏆',
  },
];

export default function Features() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-widest mb-3">
            4 piliers
          </div>
          <h2
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-4xl font-extrabold text-[var(--color-text)]"
          >
            Tout ce qu&apos;Outfit Now fait pour toi
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {piliers.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl p-8 border border-transparent hover:border-[var(--color-border)] transition-all duration-300 cursor-default"
              style={{ backgroundColor: p.bg }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${p.accent}20` }}
                >
                  {p.icon}
                </div>
                <div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: p.accent }}
                  >
                    {p.num}
                  </div>
                  <h3
                    style={{ fontFamily: 'var(--font-heading)' }}
                    className="text-lg font-bold text-[var(--color-text)] mb-2"
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
