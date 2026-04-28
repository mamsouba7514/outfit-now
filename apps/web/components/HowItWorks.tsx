'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    num: '01',
    title: 'Scanne ton dressing',
    desc: 'Photo rapide de chaque pièce — notre IA SAM2 + CLIP identifie et indexe tout en 2 secondes.',
    color: 'var(--color-blue)',
    bg: 'var(--color-blue-light)',
  },
  {
    num: '02',
    title: 'Reçois ta tenue de Karl',
    desc: "Karl compose la tenue parfaite selon ton style, l'occasion et la météo du jour.",
    color: 'var(--color-green)',
    bg: 'var(--color-green-light)',
  },
  {
    num: '03',
    title: 'Visualise sur toi',
    desc: "Vois la tenue portée sur ton mannequin personnalisé avant de sortir ou d'acheter.",
    color: 'var(--color-red)',
    bg: 'var(--color-red-light)',
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how" ref={ref} className="py-24 bg-[var(--color-bg-soft)]">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-widest mb-3">
            Comment ça marche
          </div>
          <h2
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-4xl font-extrabold text-[var(--color-text)]"
          >
            3 étapes pour changer ta façon de t&apos;habiller
          </h2>
        </motion.div>

        <div className="relative">
          {/* Gradient progress line — desktop only */}
          <div
            className="hidden md:block absolute top-12 left-[calc(16.6%-1px)] right-[calc(16.6%-1px)] h-0.5"
            style={{
              background:
                'linear-gradient(90deg, var(--color-blue), var(--color-green), var(--color-red))',
            }}
          />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.55 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-sm relative z-10"
                  style={{ backgroundColor: step.bg }}
                >
                  <div
                    className="text-2xl font-extrabold"
                    style={{ fontFamily: 'var(--font-heading)', color: step.color }}
                  >
                    {step.num}
                  </div>
                </div>
                <h3
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-lg font-bold text-[var(--color-text)] mb-2"
                >
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
