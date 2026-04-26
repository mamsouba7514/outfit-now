# Outfit Now

> Porte mieux. Achète moins.

App mobile de stylisme IA — dressing numérique + styliste IA + suggestions d'achat contextuelles.

## Stack

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native 0.74 (Expo Dev Client), TypeScript strict |
| API | Node 20, Fastify, Prisma, Postgres 16, Redis 7 |
| Vector | Pinecone |
| Vision | SAM 2 + CLIP (GPU AWS) |
| LLM | Claude Sonnet |
| Paiements | Stripe |
| Infra | AWS eu-west-3 |
| CI | GitHub Actions + EAS Build |

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone <repo>
cd outfit-now
npm install

# 2. Variables d'env
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Infrastructure locale
docker compose -f infra/docker-compose.yml up -d

# 4. Base de données
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 5. API
npm run dev  # depuis apps/api

# 6. Mobile
cd apps/mobile
npx expo start
```

## Structure

```
outfit-now/
├── apps/
│   ├── mobile/     # React Native Expo
│   ├── api/        # Fastify backend
│   └── workers/    # Workers async (vision, composition)
├── packages/
│   ├── shared-types/    # Types partagés
│   ├── design-tokens/   # Design system
│   └── config/          # ESLint, Prettier
├── infra/               # Docker, Terraform
├── docs/                # Documentation
└── .github/workflows/   # CI
```

## Milestones

- **M1** (sem. 1-3) — Fondations : auth, monorepo, CI ✅
- **M2** (sem. 4-8) — Dressing & Scan : pipeline vision
- **M3** (sem. 9-14) — Styliste IA : briefs → tenues
- **M4** (sem. 15-20) — Premium, affiliation, stores

## Commandes

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test          # Tous les tests
npm run format        # Prettier
```
