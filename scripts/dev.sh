#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Healthcare Dashboard — Dev Servers"
echo "========================================="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Detect current user for local PostgreSQL
DB_USER="${DB_USER:-$(whoami)}"
DATABASE_URL="${DATABASE_URL:-postgresql+asyncpg://$DB_USER@localhost:5432/healthcare}"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT

# --- Backend ---
echo ""
echo "Starting backend on http://localhost:8000 ..."
cd "$ROOT_DIR/backend"
source .venv/bin/activate
DATABASE_URL="$DATABASE_URL" uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# --- Frontend ---
echo "Starting frontend on http://localhost:3000 ..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "========================================="

wait
