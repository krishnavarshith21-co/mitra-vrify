import axios from 'axios';
import { supabase } from './supabase';

// ── Shared axios instance for all authenticated API calls ─────────────────────
const api = axios.create({
  timeout: 15000, // 15s — Render cold starts can be slow
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  },
});

let configPromise: Promise<string> | null = null;
let currentApiBaseUrl = '';

/**
 * Loads the API base URL from GitHub at runtime.
 * Fallback to local /config.json ONLY for local development.
 */
export async function getApiBaseUrl(): Promise<string> {
  if (currentApiBaseUrl) return currentApiBaseUrl;
  if (configPromise) return configPromise;

  configPromise = new Promise(async (resolve, reject) => {
    try {
      // Primary: Fetch from external GitHub configuration file with timestamp cache busting
      const githubUrl = `https://raw.githubusercontent.com/krishnavarshith21-co/mitra-vrify/main/backend_config.json?t=${Date.now()}`;
      let response = await fetch(githubUrl).catch(() => null);
      
      // Fallback: Local /config.json ONLY if we are in local development
      if ((!response || !response.ok) && process.env.NODE_ENV !== 'production') {
        console.warn(`[MITRA VERIFY] Failed to load GitHub config, falling back to local /config.json for local dev`);
        response = await fetch('/config.json');
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to load configuration from GitHub. Status: ${response?.status}. Vercel fallback disabled.`);
      }

      const config = await response.json();
      let base = config.apiBaseUrl;
      
      if (!base) {
        throw new Error('apiBaseUrl is missing in configuration');
      }

      if (!base.startsWith('http://') && !base.startsWith('https://')) {
        base = 'https://' + base;
      }
      if (!base.endsWith('/api/v1')) {
        base = base.replace(/\/+$/, '') + '/api/v1';
      }
      
      currentApiBaseUrl = base;
      api.defaults.baseURL = base;
      console.log(`[MITRA VERIFY] API Base URL dynamically configured to: ${currentApiBaseUrl}`);
      resolve(currentApiBaseUrl);
    } catch (err) {
      console.error('[MITRA VERIFY] FATAL: Configuration Error. Backend config could not be loaded.', err);
      reject(err);
    }
  });

  return configPromise;
}

// ── Request interceptor: inject auth token ────────────────────────────────────
api.interceptors.request.use(
  async config => {
    // 1. Ensure runtime configuration is loaded first
    try {
      const baseUrl = await getApiBaseUrl();
      config.baseURL = baseUrl;
    } catch (err) {
      return Promise.reject(new Error('Backend configuration (config.json) could not be loaded.'));
    }

    const url = `${config.baseURL || ''}${config.url || ''}`;
    let hasSession = false;
    let hasToken = false;
    let userId = null;

    if (typeof window !== 'undefined') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          hasSession = true;
          userId = session.user?.id;
          if (session.access_token) {
            hasToken = true;
            config.headers.set('Authorization', `Bearer ${session.access_token}`);
          }
        }
      } catch (err) {
        console.error('[API] Failed to get Supabase session', err);
      }
    }

    const isProtected = url.includes('/liveness/') || url.includes('/identity/') || url.includes('/keys') || url.includes('/demo/');
    if (isProtected && !hasSession) {
      console.warn(`[API] Blocked request to ${url}: No active session.`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      return Promise.reject(new Error('Authentication required. Please sign in again.'));
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${url} | Session: ${hasSession} | Token: ${hasToken} | User: ${userId}`);
    return config;
  },
  error => Promise.reject(error)
);

// ── Response interceptor: retry network/5xx errors only ──────────────────────
// IMPORTANT: Do NOT retry 4xx errors (401, 403, 404, 422) — they are deterministic.
// Do NOT auto-redirect on 401 here — AuthContext handles session expiry.
api.interceptors.response.use(
  res => {
    const url = `${res.config.baseURL || ''}${res.config.url || ''}`;
    console.log(`[API] ✓ ${res.status} ${url}`);
    return res;
  },
  async err => {
    const config = err.config;
    const status = err.response?.status;
    const url = `${config?.baseURL || ''}${config?.url || ''}`;

    if (status === 401) {
      console.warn(`[API] ✗ 401 Unauthorized ${url} - Dispatching auth:unauthorized event`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      return Promise.reject(err);
    }

    // Only retry on network errors or 5xx — never on 4xx
    // DO NOT retry on high-frequency biometric frame endpoints
    const isHighFrequencyBiometric = url.includes('/liveness/demo/process');
    const isRetryable = (!err.response || status >= 500) && !isHighFrequencyBiometric;
    const retryCount = config?.__retryCount ?? 0;

    if (isRetryable && config && retryCount < 3) {
      config.__retryCount = retryCount + 1;
      const delay = Math.pow(2, config.__retryCount) * 1000; // 2s, 4s, 8s
      console.warn(`[API] Retrying ${url} in ${delay}ms (attempt ${config.__retryCount}/3)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    if (status) {
      console.warn(`[API] ✗ ${status} ${url}`, err.response?.data);
    } else {
      console.warn(`[API] ✗ Network error ${url}`, err.message);
      console.error(`[API] Stack:`, err.stack);
    }

    return Promise.reject(err);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout').catch(() => {}), // fire-and-forget
};

// ── API Keys ──────────────────────────────────────────────────────────────────
export const keysAPI = {
  create: (data: { name: string; api_type: string }) => api.post('/keys', data),
  list: () => api.get('/keys'),
  revoke: (id: string) => api.delete(`/keys/${id}`),
};

// ── Liveness ──────────────────────────────────────────────────────────────────
export const livenessAPI = {
  basic: (image: string, sessionId?: string) =>
    api.post(`/liveness/basic`, { image, session_id: sessionId }),
  advanced: (image: string, challengeType?: string, sessionId?: string) =>
    api.post(`/liveness/advanced`, { image, challenge_type: challengeType, session_id: sessionId }),
  identity: (image: string, subjectId?: string, sessionId?: string) =>
    api.post(`/identity/verify`, { image, subject_id: subjectId, session_id: sessionId }),
  startSession: (apiType: string) => api.post('/liveness/session/start', { api_type: apiType }),
  processDemoFrame: (image: string, sessionId?: string, challengeType?: string, enrolledEmbedding?: number[], apiType?: string, frameId?: string) =>
    api.post('/liveness/demo/process', { image, frame_id: frameId, session_id: sessionId, challenge_type: challengeType, enrolled_embedding: enrolledEmbedding, api_type: apiType }),
  logEvent: (sessionId: string, eventType: string, apiType: string) =>
    api.post('/liveness/demo/log_event', { session_id: sessionId, event_type: eventType, api_type: apiType }),
  enrollFace: (image: string, subjectId?: string, sessionId?: string) => api.post('/identity/enroll', { image, subject_id: subjectId, session_id: sessionId }),
  getEnrolledFace: () => api.get('/identity/enrolled'),
};

// ── Analytics (Single Source of Truth) ────────────────────────────────────────
export const analyticsAPI = {
  dashboard: (timeframe?: string) => api.get(`/analytics/dashboard${timeframe ? `?timeframe=${timeframe}` : ''}`),
  overview: () => api.get('/analytics/overview'),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  usage: (_days?: number) => api.get('/analytics/usage'),
  events: (limit?: number) => api.get(`/analytics/events?limit=${limit || 100}`),
  logVerificationEvent: (data: {
    apiType: string;
    status: string;
    confidence: number;
    processingTimeMs: number;
    spoofFlag: boolean;
    faceDetectedFlag: boolean;
    identityMatchedFlag: boolean;
    attentionScore?: number;
    user?: string;
    device?: string;
  }) => api.post('/analytics/events', { ...data, processingTimeMs: Math.round(data.processingTimeMs) }),
};

// ── Platform: Applications ────────────────────────────────────────────────────
export const applicationsAPI = {
  create: (data: { name: string; api_level: string; allowed_redirect_uris: string[] }) => 
    api.post('/applications', data),
  list: () => api.get('/applications'),
  get: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: { name?: string; api_level?: string; allowed_redirect_uris?: string[] }) => 
    api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  rotateKeys: (id: string) => api.post(`/applications/${id}/rotate-keys`),
};

// ── Platform: Verification Sessions ───────────────────────────────────────────
export const verificationAPI = {
  getSession: (sessionId: string) => api.get(`/verification/sessions/${sessionId}`),
  startSession: (sessionId: string) => api.post(`/verification/sessions/${sessionId}/start`),
  processFrame: (sessionId: string, data: { image: string; frame_id?: string; challenge_type?: string }) => 
    api.post(`/verification/sessions/${sessionId}/process`, data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  updateRole: (userId: string, role: string) => api.put(`/admin/users/${userId}/role`, { role }),
  updateStatus: (userId: string, isActive: boolean) => api.put(`/admin/users/${userId}/status`, { is_active: isActive }),
  systemLogs: (limit?: number, level?: string) => api.get(`/admin/logs/system?limit=${limit || 50}${level ? `&level=${level}` : ''}`),
  auditLogs: (limit?: number) => api.get(`/admin/logs/audit?limit=${limit || 50}`),
  clearSystemLogs: () => api.delete('/admin/logs/system'),
  clearAuditLogs: () => api.delete('/admin/logs/audit'),
};

export const checkHealth = () => api.get('/health');

export function parseNetworkError(error: unknown, targetUrl: string): string {
  if (!error) return 'Internal Server Error';
  const err = error as { code?: string; message?: string; response?: { status: number; data: unknown } };

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return `Backend Sleeping: Backend took too long to respond (limit: 15s). Render may be cold-starting.`;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return `Offline: Your device is not connected to the internet.`;
  }
  if (!err.response) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl.startsWith('http:')) {
      return `Mixed Content Blocked: HTTPS frontend cannot call HTTP backend.`;
    }
    return `CORS Blocked / Backend Offline: Cannot reach ${targetUrl}.`;
  }
  
  if (err.response.status === 401) return `Authentication Failed: Token Missing or Expired`;
  if (err.response.status === 404) return `API Endpoint Not Found: ${targetUrl}`;
  if (err.response.status >= 500) return `Internal Server Error: Backend encountered an error`;
  
  return `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
}

export default api;
