# Décisions architecturales (ADR)

## ADR-001 — Monorepo npm workspaces

**Date** : Avril 2026  
**Statut** : Accepté

**Contexte** : Mobile, API, workers et packages partagés dans un seul dépôt.

**Décision** : npm workspaces (sans Turborepo pour commencer, ajout si la CI ralentit > 5 min).

**Raison** : Simplicité d'outillage, types partagés sans publication, refactoring cross-packages facile. Turborepo ajouterait du cache de build mais aussi de la complexité en M1.

**Conséquences** : `npm run test` à la racine exécute tous les tests. Types `@outfit-now/shared-types` importables partout sans build step en dev.

---

## ADR-002 — Fastify plutôt qu'Express

**Date** : Avril 2026  
**Statut** : Accepté

**Contexte** : Choix du framework API Node.

**Décision** : Fastify 4.x

**Raison** : Schema validation JSON natif (2-3× plus rapide qu'Express), TypeScript first, plugin system structuré, OpenAPI autogen avec `@fastify/swagger`. Express est plus connu mais plus lent et moins typé.

**Conséquences** : `@fastify/jwt`, `@fastify/rate-limit`, `@fastify/sensible` couvrent 90% des besoins sans bibliothèques tierces.

---

## ADR-003 — Prisma comme ORM

**Date** : Avril 2026  
**Statut** : Accepté

**Contexte** : Accès base de données depuis l'API et les workers.

**Décision** : Prisma 5.x avec Postgres 16.

**Raison** : Schema as source of truth, migrations typées, client généré avec types exacts, Prisma Studio pour debug. Alternatives (Drizzle, TypeORM) : Drizzle plus léger mais migrations moins matures, TypeORM trop verbeux.

**Conséquences** : `prisma generate` doit tourner après chaque changement de schema. Client partagé via singleton pour éviter pool exhaustion en dev.

---

## ADR-004 — Refresh tokens Redis (pas DB)

**Date** : Avril 2026  
**Statut** : Accepté

**Contexte** : Où stocker les refresh tokens pour permettre la révocation.

**Décision** : Redis avec TTL (30 jours), hash SHA-256 comme clé.

**Raison** : Révocation instantanée (DEL), TTL automatique sans cron, lecture O(1). Stocker en DB ajouterait une requête SQL à chaque refresh. Inconvénient : perte si Redis crash sans persistance — mitigé par `appendonly yes`.

**Conséquences** : Redis doit être en haute dispo en production. Tokens tournants : chaque refresh invalide l'ancien et émet un nouveau.
