#!/bin/bash
# Start all Outfit Now dev services

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT/apps/api"
MOBILE_DIR="$ROOT/apps/mobile"

# Load env
export $(grep -v '^#' "$API_DIR/.env" | grep '=' | xargs)

echo "🚀 Starting API server..."
npx --prefix "$API_DIR" tsx "$API_DIR/src/server.ts" > /tmp/api.log 2>&1 &
API_PID=$!
echo "   API PID=$API_PID"

echo "⚙️  Starting composition worker..."
npx --prefix "$API_DIR" tsx "$API_DIR/src/workers/index.ts" > /tmp/worker.log 2>&1 &
WORKER_PID=$!
echo "   Worker PID=$WORKER_PID"

sleep 3
if curl -sf http://localhost:3000/health > /dev/null; then
  echo "✅ API running on :3000"
else
  echo "❌ API failed to start — check /tmp/api.log"
  exit 1
fi

echo "📱 Starting Metro bundler..."
cd "$MOBILE_DIR" && npx expo start --port 8081

# Cleanup on exit
trap "kill $API_PID $WORKER_PID 2>/dev/null" EXIT
