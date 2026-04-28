'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: '⚡',
    title: 'Tenues en 30 sec',
    desc: 'Karl compose une tenue adaptée à ton occasion, météo et style en quelques secondes.',
  },
  {
    icon: '🛍',
    title: 'Shopping intelligent',
    desc: 'Karl identifie la pièce manquante et te propose le bon achat avec un score de match style chez Sézane, Zalando ou ASOS.',
  },
  {
    icon: '👁',
    title: 'Visualisation instantanée',
    desc: "Vois chaque tenue sur ton mannequin personnalisé avant de sortir ou d'acheter.",
  },
];

function KarlChat() {
  const messages = [
    {
      from: 'karl',
      text: "J'ai analysé ton dressing. Pour ce soir, blazer marine + jean straight + sneakers blanches. Match 94%.",
    },
    { from: 'user', text: 'Et pour compléter ma garde-robe ?' },
    {
      from: 'karl',
      text: "Il te manque une chemise oversize beige. J'ai trouvé exactement ça chez Sézane — 78% de match avec ton style.",
      shopping: true,
    },
  ];

  return (
    <div className="bg-[var(--color-dark)] rounded-3xl p-6 shadow-2xl max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-green)] flex items-center justify-center">
          <span className="text-white font-bold">K</span>
        </div>
        <div>
          <div className="text-white font-semibold text-sm">Karl</div>
          <div className="text-[var(--color-green)] text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] animate-pulse-dot inline-block" />
            Styliste IA · En ligne
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.3, duration: 0.4 }}
            className={`${
              msg.from === 'karl'
                ? 'bg-[#1a2235] text-gray-300 rounded-2xl rounded-tl-none'
                : 'bg-[var(--color-blue)] text-white rounded-2xl rounded-tr-none ml-auto max-w-[80%]'
            } p-3 text-xs leading-relaxed`}
          >
            {msg.text}
            {msg.shopping && (
              <div className="mt-2 bg-white/10 rounded-xl p-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
                  SZ
                </div>
                <div>
                  <div className="text-white text-[10px] font-semibold">
                    Chemise Pauline · Sézane
                  </div>
                  <div className="text-green-400 text-[10px]">Match 78% · 95€</div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function KarlSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="karl" ref={ref} className="py-24 bg-[var(--color-bg-soft)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Chat mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <KarlChat />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-widest mb-3">
              Ton styliste IA
            </div>
            <h2
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-4xl font-extrabold text-[var(--color-text)] mb-4"
            >
              Rencontre <span className="gradient-text">Karl</span>
            </h2>
            <p className="text-[var(--color-muted)] mb-8 leading-relaxed">
              Karl connaît ton dressing par cœur. Il compose tes tenues, identifie ce qui manque et
              te guide vers les bons achats — avec un score de compatibilité style.
            </p>

            <div className="space-y-5">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-blue-light)] flex items-center justify-center text-lg flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--color-text)] text-sm mb-1">
                      {f.title}
                    </div>
                    <div className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {f.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
