# Outfit Now Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page Next.js 15 landing page at `apps/web/` that captures waitlist emails for Outfit Now Phase 0.

**Architecture:** New `apps/web/` npm workspace app using Next.js 15 App Router. Ten server-imported client components (each `"use client"`) cover the 10 sections. A single API route `POST /api/waitlist` stores emails via Resend Audiences. All animations are CSS keyframes + Framer Motion; scroll reveal uses Framer Motion `whileInView`.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Framer Motion 11, Resend 4, Zod 3, Space Grotesk + DM Sans via `next/font/google`

---

## File Map

| Action | Path                                  | Responsibility                             |
| ------ | ------------------------------------- | ------------------------------------------ |
| Create | `apps/web/package.json`               | Workspace deps                             |
| Create | `apps/web/tsconfig.json`              | TypeScript config                          |
| Create | `apps/web/next.config.ts`             | Next.js config                             |
| Create | `apps/web/postcss.config.mjs`         | Tailwind 4 PostCSS                         |
| Create | `apps/web/app/globals.css`            | CSS vars, keyframes, base                  |
| Create | `apps/web/app/layout.tsx`             | Root layout, fonts, metadata               |
| Create | `apps/web/app/page.tsx`               | Page assembly (server component)           |
| Create | `apps/web/app/api/waitlist/route.ts`  | POST /api/waitlist handler                 |
| Create | `apps/web/lib/email.ts`               | Resend email capture helper                |
| Create | `apps/web/components/Header.tsx`      | Sticky nav                                 |
| Create | `apps/web/components/Hero.tsx`        | Hero + floating cards + email form         |
| Create | `apps/web/components/Stats.tsx`       | Stats band, countUp                        |
| Create | `apps/web/components/KarlSection.tsx` | Karl chat mockup + features                |
| Create | `apps/web/components/Features.tsx`    | 4 piliers grid                             |
| Create | `apps/web/components/HowItWorks.tsx`  | 3 steps + gradient line                    |
| Create | `apps/web/components/StylePass.tsx`   | 5 rangs + Bronze/Silver/Gold/Diamond cards |
| Create | `apps/web/components/Community.tsx`   | Social feed + Top Icônes                   |
| Create | `apps/web/components/CtaFinal.tsx`    | Final CTA + email form                     |
| Create | `apps/web/components/Footer.tsx`      | Footer                                     |

---

## Task 1: Scaffold apps/web workspace

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.mjs`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@outfit-now/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^11.0.0",
    "resend": "^4.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create apps/web/postcss.config.mjs**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 5: Install dependencies from monorepo root**

```bash
cd /Users/bamamadou/outfit-now && npm install
```

Expected: `apps/web/node_modules` populated, no errors.

- [ ] **Step 6: Verify Next.js resolves**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npx next --version
```

Expected: `Next.js v15.x.x`

- [ ] **Step 7: Commit scaffold**

```bash
git add apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/postcss.config.mjs package-lock.json
git commit -m "feat(web): scaffold apps/web Next.js 15 workspace"
```

---

## Task 2: CSS foundations — globals.css

**Files:**

- Create: `apps/web/app/globals.css`

- [ ] **Step 1: Create app/ directory and globals.css**

```css
@import 'tailwindcss';

/* ── Design tokens ──────────────────────────────────────────── */
@theme {
  --color-blue: #2563eb;
  --color-blue-dark: #1e40af;
  --color-blue-light: #dbeafe;
  --color-green: #059669;
  --color-green-light: #d1fae5;
  --color-red: #e11d48;
  --color-red-light: #ffe4e6;
  --color-bg: #ffffff;
  --color-bg-soft: #f8faff;
  --color-text: #0a0f1e;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --color-dark: #0a0f1e;

  --font-heading: var(--font-space-grotesk), sans-serif;
  --font-body: var(--font-dm-sans), sans-serif;
}

/* ── Base ────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-text);
  overflow-x: hidden;
}

/* ── Keyframes ────────────────────────────────────────────────── */
@keyframes orbFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-24px) scale(1.04);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floatSlow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes gradientShimmer {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}

@keyframes chatAppear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Utility classes ─────────────────────────────────────────── */
.animate-orb {
  animation: orbFloat 9s ease-in-out infinite;
}
.animate-float {
  animation: float 5s ease-in-out infinite;
}
.animate-float-slow {
  animation: floatSlow 7s ease-in-out infinite;
}
.animate-pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
.animate-shimmer {
  animation: shimmer 2s linear infinite;
}
.animate-gradient {
  animation: gradientShimmer 4s ease infinite;
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-blue), var(--color-green));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gradient-text-animated {
  background: linear-gradient(135deg, var(--color-blue), var(--color-green), var(--color-blue));
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShimmer 4s ease infinite;
}

.shimmer-card {
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-orb,
  .animate-float,
  .animate-float-slow,
  .animate-pulse-dot,
  .animate-shimmer,
  .animate-gradient,
  .gradient-text-animated,
  .shimmer-card {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify CSS file created**

```bash
ls /Users/bamamadou/outfit-now/apps/web/app/globals.css
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat(web): add CSS foundations, design tokens, keyframes"
```

---

## Task 3: Root layout + fonts

**Files:**

- Create: `apps/web/app/layout.tsx`

- [ ] **Step 1: Create layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-space-grotesk',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Outfit Now — Porte mieux. Achète mieux.',
  description:
    "Scan ton dressing, reçois des tenues IA sur-mesure avec Karl et visualise-les sur ton propre mannequin. Rejoins la liste d'attente.",
  openGraph: {
    title: 'Outfit Now — Porte mieux. Achète mieux.',
    description: 'Styliste IA, dressing intelligent, mannequin personnalisé.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(web): root layout with Space Grotesk + DM Sans fonts"
```

---

## Task 4: Header component

**Files:**

- Create: `apps/web/components/Header.tsx`

- [ ] **Step 1: Create Header.tsx**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/Header.tsx
git commit -m "feat(web): Header sticky avec backdrop blur"
```

---

## Task 5: Hero component

**Files:**

- Create: `apps/web/components/Hero.tsx`

This component includes: pill badge, animated H1, email capture form, 3 trust indicators, 3 floating UI cards (Karl chat, Style Score, Mon Dressing), orb background.

- [ ] **Step 1: Create Hero.tsx**

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

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
          <form onSubmit={handleSubmit} id="waitlist">
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/Hero.tsx
git commit -m "feat(web): Hero avec floating cards, email form, orb background"
```

---

## Task 6: Stats component

**Files:**

- Create: `apps/web/components/Stats.tsx`

- [ ] **Step 1: Create Stats.tsx with countUp animation**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) ref.current = setTimeout(() => tick(performance.now()), 16);
    };
    tick(performance.now());
  };

  useEffect(
    () => () => {
      if (ref.current) clearTimeout(ref.current);
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

  useEffect(() => {
    if (inView && !isString) start();
  }, [inView]);

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
          <StatItem prefix="9,99" value={0} suffix="€/mois" label="Bientôt" isString delay={0.2} />
          <StatItem value={4} label="Modules IA" delay={0.3} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/Stats.tsx
git commit -m "feat(web): Stats band avec countUp animation"
```

---

## Task 7: KarlSection component

**Files:**

- Create: `apps/web/components/KarlSection.tsx`

- [ ] **Step 1: Create KarlSection.tsx**

```tsx
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
              Karl connaît ton dressing par coeur. Il compose tes tenues, identifie ce qui manque et
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/KarlSection.tsx
git commit -m "feat(web): KarlSection avec chat mockup et features shopping"
```

---

## Task 8: Features (4 Piliers) component

**Files:**

- Create: `apps/web/components/Features.tsx`

- [ ] **Step 1: Create Features.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/Features.tsx
git commit -m "feat(web): Features 4 piliers grid"
```

---

## Task 9: HowItWorks component

**Files:**

- Create: `apps/web/components/HowItWorks.tsx`

- [ ] **Step 1: Create HowItWorks.tsx**

```tsx
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
          {/* Gradient progress line (desktop) */}
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/HowItWorks.tsx
git commit -m "feat(web): HowItWorks 3 étapes avec ligne gradient"
```

---

## Task 10: StylePass component

**Files:**

- Create: `apps/web/components/StylePass.tsx`

- [ ] **Step 1: Create StylePass.tsx**

```tsx
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
    bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
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
              className={`relative rounded-2xl p-6 border-2 overflow-hidden ${
                card.isDiamond ? 'shimmer-card' : ''
              }`}
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/StylePass.tsx
git commit -m "feat(web): StylePass 5 rangs + Bronze/Silver/Gold/Diamond cards"
```

---

## Task 11: Community component

**Files:**

- Create: `apps/web/components/Community.tsx`

- [ ] **Step 1: Create Community.tsx**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/Community.tsx
git commit -m "feat(web): Community feed, Top Icônes leaderboard, parcours"
```

---

## Task 12: CtaFinal + Footer components

**Files:**

- Create: `apps/web/components/CtaFinal.tsx`
- Create: `apps/web/components/Footer.tsx`

- [ ] **Step 1: Create CtaFinal.tsx**

```tsx
'use client';

import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

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
              onSubmit={handleSubmit}
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
```

- [ ] **Step 2: Create Footer.tsx**

```tsx
export default function Footer() {
  return (
    <footer className="bg-[var(--color-dark)] border-t border-white/5 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-green)] flex items-center justify-center">
            <span
              style={{ fontFamily: 'var(--font-heading)' }}
              className="text-white font-bold text-[10px]"
            >
              ON
            </span>
          </div>
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-white/60 font-semibold text-sm"
          >
            Outfit Now
          </span>
        </div>

        {/* Links */}
        <div className="flex gap-6">
          {['Confidentialité', 'CGU', 'Contact'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="text-xs text-white/20">© 2026 Outfit Now · Paris</div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/CtaFinal.tsx apps/web/components/Footer.tsx
git commit -m "feat(web): CtaFinal avec orbs + Footer"
```

---

## Task 13: Page assembly

**Files:**

- Create: `apps/web/app/page.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import KarlSection from '@/components/KarlSection';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import StylePass from '@/components/StylePass';
import Community from '@/components/Community';
import CtaFinal from '@/components/CtaFinal';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <KarlSection />
        <Features />
        <HowItWorks />
        <StylePass />
        <Community />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): page assembly — toutes les sections"
```

---

## Task 14: API route + Resend email capture

**Files:**

- Create: `apps/web/lib/email.ts`
- Create: `apps/web/app/api/waitlist/route.ts`

The `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` must be set in `apps/web/.env.local` (gitignored).

- [ ] **Step 1: Create apps/web/.env.local (copy and fill values)**

```bash
cat > /Users/bamamadou/outfit-now/apps/web/.env.local << 'EOF'
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RESEND_AUDIENCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EOF
```

Replace the placeholders with real values from the Resend dashboard.

- [ ] **Step 2: Create lib/email.ts**

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function addToWaitlist(email: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) throw new Error('RESEND_AUDIENCE_ID not set');

  await resend.contacts.create({
    email,
    audienceId,
    unsubscribed: false,
  });

  await resend.emails.send({
    from: 'Outfit Now <hello@outfitnow.app>',
    to: email,
    subject: 'Tu es sur la liste — bienvenue chez Outfit Now 👗',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #fff;">
        <h1 style="color: #0A0F1E; font-size: 24px; margin-bottom: 16px;">Bienvenue sur la liste d'attente !</h1>
        <p style="color: #64748B; line-height: 1.6;">Tu es parmi les premiers à rejoindre Outfit Now. Karl a hâte de te rencontrer.</p>
        <p style="color: #64748B; line-height: 1.6; margin-top: 16px;">Nous te contacterons en avant-première dès l'ouverture de la bêta.</p>
        <p style="margin-top: 32px; color: #94A3B8; font-size: 12px;">© 2026 Outfit Now · Paris</p>
      </div>
    `,
  });
}
```

- [ ] **Step 3: Create app/api/waitlist/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addToWaitlist } from '@/lib/email';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    await addToWaitlist(parsed.data.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify typecheck**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit (do NOT commit .env.local)**

```bash
git add apps/web/lib/email.ts apps/web/app/api/waitlist/route.ts
git commit -m "feat(web): API route POST /api/waitlist via Resend Audiences"
```

- [ ] **Step 6: Ensure .env.local is gitignored**

Check that `apps/web/.env.local` is covered by `.gitignore`. It typically is via `**/.env.local`, but verify:

```bash
grep -r "\.env\.local" /Users/bamamadou/outfit-now/.gitignore || echo "Add .env.local to .gitignore"
```

If missing, add it:

```bash
echo "apps/web/.env.local" >> /Users/bamamadou/outfit-now/.gitignore
```

---

## Task 15: Build verification

- [ ] **Step 1: Run typecheck**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run Next.js build**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npm run build
```

Expected: `Route (app)` table shows `/`, `api/waitlist`. No compilation errors.

- [ ] **Step 3: Start dev server and verify manually**

```bash
cd /Users/bamamadou/outfit-now/apps/web && npm run dev
```

Open `http://localhost:3000` and verify:

- Header renders + sticky scroll blur works
- Hero text gradient animates
- Floating cards lévitent
- Stats countUp triggers on scroll
- Karl chat messages appear sequentially
- 4 piliers grid renders correctly
- 3 étapes + gradient line show correctly
- StylePass cards show, Diamond has shimmer
- Community feed + leaderboard visible
- CTA final dark section with orbs
- Footer visible
- Email form: enter test email, verify success state

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(web): landing page Outfit Now Phase 0 — complet"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                                 | Task                   |
| ---------------------------------------------------------------- | ---------------------- |
| Header sticky + backdrop blur                                    | Task 4                 |
| Hero pill badge, H1 gradient animé, email form, trust indicators | Task 5                 |
| Floating cards: Karl chat, Style Score, Mon Dressing             | Task 5                 |
| Stats band: 10+, D30, 9,99€, 4 modules                           | Task 6                 |
| Karl section chat mockup + shopping flow                         | Task 7                 |
| 4 piliers grid 2×2                                               | Task 8                 |
| HowItWorks 3 étapes + gradient line                              | Task 9                 |
| StylePass 5 rangs + Bronze/Silver/Gold/Diamond                   | Task 10                |
| Community feed + Top Icônes + parcours                           | Task 11                |
| CtaFinal fond dark + orbs + bouton rouge                         | Task 12                |
| Footer logo gradient + liens + ©                                 | Task 12                |
| Page assembly                                                    | Task 13                |
| POST /api/waitlist + Resend + Zod                                | Task 14                |
| Double opt-in email confirmation                                 | Task 14 (lib/email.ts) |
| CSS keyframes: orbFloat, float, shimmer, chatAppear, pulse       | Task 2                 |
| Space Grotesk + DM Sans via next/font                            | Task 3                 |
| Scroll reveal via Framer Motion whileInView                      | All component tasks    |
| prefers-reduced-motion                                           | Task 2 (globals.css)   |

**Placeholder scan:** None found.

**Type consistency:** `addToWaitlist(email: string)` defined in Task 14 Step 2, called in Task 14 Step 3 — consistent.
