#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Healthcare Dashboard — Tests"
echo "========================================="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXIT_CODE=0

# --- Backend tests ---
echo ""
echo "[1/3] Running backend tests..."
cd "$ROOT_DIR/backend"
source .venv/bin/activate

DB_USER="${DB_USER:-$(whoami)}"
TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql+asyncpg://$DB_USER@localhost:5432/healthcare_test}" \
  python -m pytest tests/ -v || EXIT_CODE=1

# --- Frontend type check ---
echo ""
echo "[2/3] Running TypeScript type check..."
cd "$ROOT_DIR/frontend"
npx tsc --noEmit || EXIT_CODE=1

# --- Frontend lint ---
echo ""
echo "[3/3] Running ESLint..."
npx eslint src/ || EXIT_CODE=1

echo ""
echo "========================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "  All checks passed!"
else
  echo "  Some checks failed. See output above."
fi
echo "========================================="

exit $EXIT_CODE
