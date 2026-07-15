#!/bin/bash
set -e
echo "Starting backend..."
cd mitra-verify-backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8000
