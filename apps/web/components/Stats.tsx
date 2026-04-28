'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        timerRef.current = setTimeout(() => tick(performance.now()), 16);
      }
    };
    tick(performance.now());
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { count, start };
}

function StatItem({
  value,
  label,
  prefix = '',
  suffix = '',
  isString = false,
  delay = 0,
}: {
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
  isString?: boolean;
  delay?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-50px' });
  const { count, start } = useCountUp(typeof value === 'number' ? value : 0, 1400);
  const startedRef = useRef(false);

  useEffect(() => {
    if (inView && !isString && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [inView, isString, start]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="text-center"
    >
      <div
        style={{ fontFamily: 'var(--font-heading)' }}
        className="text-4xl md:text-5xl font-extrabold text-white mb-2"
      >
        {prefix}
        {isString ? value : count}
        {suffix}
      </div>
      <div className="text-sm text-blue-300 font-medium">{label}</div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="bg-[var(--color-dark)] py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value={10} suffix="+" label="Testeurs actifs" delay={0} />
          <StatItem value="D30" label="Rétention à 30 jours" isString delay={0.1} />
          <StatItem value="9,99€/mois" label="Bientôt" isString delay={0.2} />
          <StatItem value={4} label="Modules IA" delay={0.3} />
        </div>
      </div>
    </section>
  );
}
