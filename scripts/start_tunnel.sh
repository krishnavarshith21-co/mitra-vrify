#!/bin/bash

echo "Starting Cloudflare Tunnel..."
if ! command -v cloudflared &> /dev/null; then
    echo "cloudflared not found, installing via Homebrew..."
    brew install cloudflared
fi

rm -f tunnel.log
# Run tunnel in background
cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "Waiting for Cloudflare Tunnel URL..."
URL=""
for i in {1..30}; do
    URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' tunnel.log | head -n 1)
    if [ -n "$URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$URL" ]; then
    echo "Failed to start Cloudflare Tunnel or retrieve URL."
    cat tunnel.log
    kill $TUNNEL_PID 2>/dev/null
    exit 1
fi

echo "========================================="
echo "Tunnel is active!"
echo "Public URL: $URL"
echo "========================================="

# Update frontend env
if [ -f "mitra-verify/.env.local" ]; then
    echo "Updating frontend configuration..."
    # Ensure NEXT_PUBLIC_API_URL exists in the file, or add it
    if grep -q "^NEXT_PUBLIC_API_URL=" mitra-verify/.env.local; then
        sed -i '' "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$URL|g" mitra-verify/.env.local
    else
        echo -e "\nNEXT_PUBLIC_API_URL=$URL" >> mitra-verify/.env.local
    fi
    echo "Frontend configured with new backend URL."
else
    echo "Frontend .env.local not found. Please create it manually."
fi

# Keep the script alive so the orchestrator can trap it
wait $TUNNEL_PID
