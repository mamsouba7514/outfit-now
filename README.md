# Outfit Now

> Porte mieux. Achète moins.

Voir [docs/README.md](./docs/README.md) pour la documentation complète.

## Démarrage rapide

```bash
npm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
cd apps/api && npx prisma migrate dev && npm run dev
```
