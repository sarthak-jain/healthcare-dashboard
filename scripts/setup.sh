#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Healthcare Dashboard — Setup"
echo "========================================="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# --- Backend ---
echo ""
echo "[1/4] Setting up backend..."
cd "$ROOT_DIR/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "  Created virtual environment"
fi

source .venv/bin/activate
pip install -q -r requirements.txt
echo "  Backend dependencies installed"

# --- Database ---
echo ""
echo "[2/4] Setting up PostgreSQL..."
if command -v createdb &> /dev/null; then
  createdb healthcare 2>/dev/null && echo "  Created database 'healthcare'" || echo "  Database 'healthcare' already exists"
  createdb healthcare_test 2>/dev/null && echo "  Created database 'healthcare_test'" || echo "  Database 'healthcare_test' already exists"
else
  echo "  WARNING: 'createdb' not found. Please create databases manually:"
  echo "    createdb healthcare"
  echo "    createdb healthcare_test"
fi

# --- Test deps ---
echo ""
echo "[3/4] Installing test dependencies..."
pip install -q -r requirements-dev.txt
echo "  Test dependencies installed"

# --- Frontend ---
echo ""
echo "[4/4] Setting up frontend..."
cd "$ROOT_DIR/frontend"
npm install --silent
echo "  Frontend dependencies installed"

echo ""
echo "========================================="
echo "  Setup complete!"
echo ""
echo "  Start the app:  ./scripts/dev.sh"
echo "  Run tests:       ./scripts/test.sh"
echo "========================================="
