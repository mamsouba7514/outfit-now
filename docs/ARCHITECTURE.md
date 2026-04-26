# Architecture — Outfit Now

## Vue d'ensemble

```
┌─────────────────────────────────────────────┐
│              Mobile (React Native)           │
│   Expo Router / Zustand / SecureStore        │
└────────────────────┬────────────────────────┘
                     │ HTTPS / JWT
┌────────────────────▼────────────────────────┐
│              API (Fastify)                   │
│   Routes → Services → Prisma → Postgres      │
│   BullMQ queues → Redis                      │
└──────┬────────────────────────┬─────────────┘
       │                        │
┌──────▼──────┐        ┌────────▼────────────┐
│   Workers   │        │   External Services  │
│  Vision     │        │   Claude API (LLM)   │
│  Composition│        │   Pinecone (vector)  │
│  (BullMQ)  │        │   Stripe (payments)  │
└──────┬──────┘        │   S3/MinIO (storage) │
       │               └─────────────────────┘
┌──────▼──────┐
│  SAM2+CLIP  │
│  (GPU AWS)  │
└─────────────┘
```

## Flux principaux

### Auth
1. Signup/Login → JWT access (15m) + refresh token (30j, stocké Redis)
2. Access token expiré → auto-refresh côté mobile via `apiRequest`
3. Refresh token tournant : chaque refresh émet un nouveau refresh token

### Scan d'une pièce (M2)
1. Mobile → `POST /v1/dressing/items/upload-url` → S3 presigned URL
2. Mobile upload direct S3
3. Mobile → `POST /v1/dressing/items` → BullMQ job enqueued
4. Worker : SAM 2 segmentation → CLIP embedding → Claude Haiku tags
5. Upsert Pinecone + update DressingItem
6. Mobile poll/webhook → affiche pièce taguée

### Génération tenue (M3)
1. Mobile → `POST /v1/briefs` → BullMQ job
2. Worker : filtre candidats Pinecone → top-50 → Claude Sonnet prompt → validation règles
3. Retry si règle cassée (max 1)
4. Outfits créés en base → Mobile poll `/v1/briefs/:id`

## Décisions clés

Voir [DECISIONS.md](./DECISIONS.md).
