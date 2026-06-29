import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mitra-vrify-production.up.railway.app/api/v1',
  },
  turbopack: { root: "./" },
};

export default nextConfig;
