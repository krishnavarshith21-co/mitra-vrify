#!/bin/bash

# Move to the root of the project
cd "$(dirname "$0")/.."

# Trap Ctrl+C (SIGINT) and kill all background jobs
trap 'echo -e "\nShutting down services..."; kill $(jobs -p) 2>/dev/null; exit 0' SIGINT SIGTERM EXIT

echo "========================================="
echo "MITRA VERIFY Local Dev Orchestrator"
echo "========================================="

# 1. Start Backend in background
echo "-> Booting FastAPI Backend..."
./scripts/start_backend.sh &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# 2. Start Tunnel in background
echo "-> Booting Cloudflare Tunnel..."
./scripts/start_tunnel.sh &
TUNNEL_PID=$!

# Wait for the tunnel script to grab the URL and update frontend
sleep 7

# 3. Start Frontend in background
echo "-> Booting Next.js Frontend..."
cd mitra-verify
# Kill any existing Next.js server on 3005 just in case
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
npm run dev &
FRONTEND_PID=$!
cd ..

echo "========================================="
echo "All services running! Press Ctrl+C to exit."
echo "Frontend is available at: http://localhost:3005"
echo "========================================="

# Wait indefinitely until interrupted
wait
