#!/bin/bash
set -e

# MITRA VERIFY Backend Startup Script

echo "============================================="
echo " Starting MITRA VERIFY Backend & Tunnel"
echo "============================================="

# 1. Kill any existing ngrok or uvicorn processes to free up ports
echo "[1/3] Terminating existing processes..."
pkill -f ngrok || true
pkill -f uvicorn || true
sleep 1

# 2. Start the FastAPI backend in the background
echo "[2/3] Starting FastAPI backend on port 8000..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/mitra-verify-backend"
cd "$BACKEND_DIR"
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

# 3. Start the permanent Ngrok tunnel
echo "[3/3] Starting permanent Ngrok tunnel..."
# We explicitly specify the domain to ensure we claim the static free domain
ngrok http --domain=bootie-outweigh-pebble.ngrok-free.dev 8000 --log stdout > /tmp/ngrok.log &
NGROK_PID=$!

echo "============================================="
echo " ✓ Backend is running locally on port 8000"
echo " ✓ Tunnel is routing traffic to:"
echo "   https://bootie-outweigh-pebble.ngrok-free.dev"
echo "============================================="
echo "Press Ctrl+C to stop both processes."

# Wait and capture Ctrl+C
trap 'echo "Stopping processes..."; kill $BACKEND_PID $NGROK_PID; exit' SIGINT SIGTERM
wait
