'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const topIcones = [
  { rank: 1, name: 'Léa M.', score: '12 840 pts', badge: '🔥' },
  { rank: 2, name: 'Nadia K.', score: '9 320 pts', badge: '⭐' },
  { rank: 3, name: 'Hugo B.', score: '7 150 pts', badge: '✨' },
];

const communityFeatures = [
  {
    icon: '📸',
    title: 'Poste & inspire',
    desc: 'Partage tes tenues composées par Karl. Inspire la communauté.',
    color: 'var(--color-blue)',
    bg: 'var(--color-blue-light)',
  },
  {
    icon: '👥',
    title: 'Suis les icônes',
    desc: 'Découvre le style des meilleurs et rejoins leur rang.',
    color: 'var(--color-green)',
    bg: 'var(--color-green-light)',
  },
  {
    icon: '🏆',
    title: 'Monte en rang',
    desc: 'Likes, commentaires, partages — chaque interaction compte.',
    color: 'var(--color-red)',
    bg: 'var(--color-red-light)',
  },
];

function FeedPost() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] p-5 max-w-xs">
      {/* Post header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-red)] flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-[var(--color-text)]">Léa M.</div>
          <div className="text-xs text-[var(--color-muted)]">Icône · Rang #1</div>
        </div>
        <div className="ml-auto text-xs bg-[var(--color-red-light)] text-[var(--color-red)] font-semibold px-2.5 py-1 rounded-full">
          Icône
        </div>
      </div>

      {/* Outfit preview */}
      <div className="h-40 rounded-xl bg-gradient-to-br from-[var(--color-blue-light)] to-[var(--color-green-light)] mb-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-1">👗</div>
          <div className="text-xs text-[var(--color-muted)] font-medium">
            Tenue Karl · Match 96%
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-xs text-[var(--color-muted)] mb-3 leading-relaxed">
        Karl m&apos;a composé cette tenue en 20 secondes. Blazer Sézane + jean COS. J&apos;adore 🖤
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-red)] transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          248
        </button>
        <button className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-blue)] transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          34
        </button>
        <button className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-green)] transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          12
        </button>
      </div>
    </div>
  );
}

export default function Community() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-24 bg-[var(--color-bg-soft)]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-[var(--color-red)] uppercase tracking-widest mb-3">
            Communauté
          </div>
          <h2
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-4xl font-extrabold text-[var(--color-text)] mb-4"
          >
            Deviens une <span style={{ color: 'var(--color-red)' }}>Icône</span> de la mode
          </h2>
          <p className="text-[var(--color-muted)] max-w-xl mx-auto text-sm">
            Karl compose → tu portes → tu postes → la communauté like → tu deviens Icône.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left — feed + leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <FeedPost />

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] p-5">
              <div className="text-sm font-semibold text-[var(--color-text)] mb-4">
                Top Icônes de la semaine
              </div>
              <div className="space-y-3">
                {topIcones.map((icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background:
                          i === 0
                            ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                            : i === 1
                              ? '#E2E8F0'
                              : '#FED7AA',
                        color: i === 0 ? 'white' : 'var(--color-text)',
                      }}
                    >
                      {icon.rank}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[var(--color-text)]">
                        {icon.badge} {icon.name}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">{icon.score}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6 pt-4"
          >
            {communityFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                className="flex items-start gap-5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: f.bg }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3
                    style={{ fontFamily: 'var(--font-heading)' }}
                    className="font-bold text-[var(--color-text)] mb-1"
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* Parcours */}
            <div className="bg-gradient-to-r from-[var(--color-blue-light)] to-[var(--color-red-light)] rounded-2xl p-5 mt-4">
              <div className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-widest mb-3">
                Ton parcours
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Karl compose', color: 'var(--color-blue)' },
                  { label: 'Tu portes', color: 'var(--color-green)' },
                  { label: 'Tu postes', color: '#7C3AED' },
                  { label: 'La communauté like', color: '#D97706' },
                  { label: 'Tu deviens Icône', color: 'var(--color-red)' },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm"
                      style={{ color: step.color }}
                    >
                      {step.label}
                    </span>
                    {i < arr.length - 1 && (
                      <svg
                        className="w-3 h-3 text-[var(--color-muted)]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
