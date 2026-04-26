#!/bin/bash
# ── Outfit Now — Démarrage dev ────────────────────────────────────────────────
# Usage : ./dev.sh
# Démarre MinIO + API + Metro dans des onglets Terminal séparés

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       OUTFIT NOW — DEV START         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. MinIO ─────────────────────────────────────────────────────────────────
echo "▶ MinIO (stockage photos)..."
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
  echo "  ✓ MinIO déjà actif"
else
  mkdir -p /tmp/minio-data
  MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
    nohup minio server /tmp/minio-data --address :9000 --console-address :9001 \
    > /tmp/minio.log 2>&1 &
  sleep 2
  # Créer le bucket si besoin
  mc alias set local http://localhost:9000 minioadmin minioadmin --api S3v4 > /dev/null 2>&1
  mc mb local/outfit-now --ignore-existing > /dev/null 2>&1
  mc anonymous set download local/outfit-now > /dev/null 2>&1
  echo "  ✓ MinIO démarré"
fi

# ── 2. API ────────────────────────────────────────────────────────────────────
echo "▶ API (port 3000)..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "  ✓ API déjà active"
else
  # Important: lancer depuis le dossier api pour que .env soit trouvé
  (cd "$ROOT/apps/api" && nohup npx tsx --env-file=.env src/server.ts > /tmp/api.log 2>&1 &)
  sleep 3
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "  ✓ API démarrée"
  else
    echo "  ✗ API en erreur — voir /tmp/api.log"
  fi
fi

# ── 3. Metro ─────────────────────────────────────────────────────────────────
echo "▶ Metro (port 8081)..."

# Fix HMR crash: HmrServer uses relative ./node_modules/expo-router/entry
# Make sure symlinks exist in apps/mobile/node_modules
mkdir -p "$ROOT/apps/mobile/node_modules"
for pkg in expo-router expo react react-native; do
  LINK="$ROOT/apps/mobile/node_modules/$pkg"
  TARGET="$ROOT/node_modules/$pkg"
  if [ ! -e "$LINK" ] && [ -e "$TARGET" ]; then
    ln -sf "$TARGET" "$LINK"
  fi
done

if curl -s http://localhost:8081/status > /dev/null 2>&1; then
  echo "  ✓ Metro déjà actif"
else
  # IMPORTANT: doit être lancé depuis apps/mobile, pas la racine du monorepo
  (cd "$ROOT/apps/mobile" && nohup npx expo start --port 8081 > /tmp/metro.log 2>&1 &)
  sleep 5
  if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "  ✓ Metro démarré"
  else
    echo "  ✗ Metro en erreur — voir /tmp/metro.log"
  fi
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║  Tout est prêt ! Lance le simulateur ║"
echo "║  avec : npx expo run:ios --no-install║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Logs disponibles :"
echo "  MinIO  →  tail -f /tmp/minio.log"
echo "  API    →  tail -f /tmp/api.log"
echo "  Metro  →  tail -f /tmp/metro.log"
echo ""
