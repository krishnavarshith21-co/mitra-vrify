# MITRA VERIFY - Local Deployment Guide

This guide explains how to run the MITRA VERIFY stack locally on your macOS machine while securely exposing it to the internet using **Cloudflare Tunnels**. 

This allows you to bypass paid hosting (Render, Railway, etc.) and seamlessly test your application with an end-to-end HTTPS flow.

## Prerequisites
- **Python 3.11+** installed.
- **Node.js** installed.
- **Homebrew** installed.

## How It Works
We use a master orchestrator script (`scripts/dev.sh`) to start three core services simultaneously:
1. **FastAPI Backend:** Runs locally on `localhost:8000`.
2. **Cloudflare Tunnel:** Automatically installs (if missing) and exposes `localhost:8000` to a secure, dynamically generated `trycloudflare.com` HTTPS URL.
3. **Next.js Frontend:** The tunnel script intercepts the dynamically generated URL and automatically injects it into your frontend's `.env.local` as `NEXT_PUBLIC_API_URL`. Finally, it starts the frontend server on `localhost:3005`.

## Usage

Start everything with a single command:

```bash
chmod +x scripts/*.sh
./scripts/dev.sh
```

### Accessing the Application
- **Frontend GUI:** [http://localhost:3005](http://localhost:3005)
- **Backend API Docs (Tunneled):** Found in the terminal output (e.g., `https://random-words.trycloudflare.com/docs`)

To stop all services gracefully, press `Ctrl+C` in the terminal running the `dev.sh` script.
