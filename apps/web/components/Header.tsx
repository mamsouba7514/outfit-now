'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-green)] flex items-center justify-center">
            <span
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-white font-bold text-sm"
            >
              ON
            </span>
          </div>
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="font-bold text-lg text-[var(--color-text)]"
          >
            Outfit Now
          </span>
        </button>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Karl', id: 'karl' },
            { label: 'Fonctionnalités', id: 'features' },
            { label: 'Comment ça marche', id: 'how' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <button
          onClick={() => scrollTo('waitlist')}
          className="bg-[var(--color-blue)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[var(--color-blue-dark)] transition-colors cursor-pointer"
        >
          Accès anticipé →
        </button>
      </div>
    </motion.header>
  );
}
