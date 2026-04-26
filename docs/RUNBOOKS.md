# Runbooks — Outfit Now

## Démarrage de l'environnement local

```bash
# Infra
docker compose -f infra/docker-compose.yml up -d

# Vérifier que tout est healthy
docker compose -f infra/docker-compose.yml ps

# API
cd apps/api
npx prisma migrate dev
npm run dev

# Mobile (autre terminal)
cd apps/mobile
npx expo start
```

## Reset de la base de données

```bash
cd apps/api
npx prisma migrate reset  # ⚠️ Efface toutes les données
npx prisma db seed
```

## Vérifier les logs en prod

```bash
# API logs (Datadog)
# Dashboard : https://app.datadoghq.eu/logs?service=outfit-now-api

# Erreurs mobile (Sentry)
# Dashboard : https://sentry.io/organizations/outfit-now/
```

## Incident : API down

1. Vérifier health check : `curl https://api.outfit-now.app/health`
2. Vérifier logs Datadog pour erreurs récentes
3. Vérifier connexion Postgres : `pg_isready -h <host>`
4. Vérifier connexion Redis : `redis-cli -h <host> ping`
5. Restart service ECS si nécessaire

## Dépasser le rate limit Redis

Le rate limit est 100 req/min par user. Pour augmenter en urgence :
- Variable d'env `RATE_LIMIT_MAX` à surcharger
- Ou restart avec nouvelle config

## Rotation des secrets JWT

1. Générer nouveau `JWT_SECRET` (min 32 chars)
2. Déployer avec les deux secrets en parallèle (grace period 15min pour access tokens en cours)
3. Révoquer tous les refresh tokens via admin route (à implémenter M4)
