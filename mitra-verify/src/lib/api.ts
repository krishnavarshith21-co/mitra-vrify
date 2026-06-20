import axios from 'axios';

// Read API URL from environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

console.log(`[MITRA VERIFY] API Base URL: ${API_BASE || 'MISSING — set NEXT_PUBLIC_API_URL'}`);

// ── Shared axios instance for all authenticated API calls ─────────────────────
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s — Railway cold starts can be slow
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// ── Request interceptor: inject auth token ────────────────────────────────────
api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('mv_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    const url = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[API] ${config.method?.toUpperCase()} ${url}`);
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

    // Only retry on network errors or 5xx — never on 4xx
    const isRetryable = !err.response || status >= 500;
    const retryCount = config?.__retryCount ?? 0;

    if (isRetryable && config && retryCount < 2) {
      config.__retryCount = retryCount + 1;
      const delay = config.__retryCount * 1000; // 1s, 2s
      console.warn(`[API] Retrying ${url} in ${delay}ms (attempt ${config.__retryCount}/2)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    if (status) {
      console.warn(`[API] ✗ ${status} ${url}`, err.response?.data);
    } else {
      console.warn(`[API] ✗ Network error ${url}`, err.message);
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
// Liveness calls use raw axios (no auth token) with an X-API-Key header
const rawAxios = axios.create({ timeout: 15000 });

export const livenessAPI = {
  basic: (apiKey: string, image: string, sessionId?: string) =>
    rawAxios.post(`${API_BASE}/liveness/basic`, { image, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  advanced: (apiKey: string, image: string, challengeType?: string, sessionId?: string) =>
    rawAxios.post(`${API_BASE}/liveness/advanced`, { image, challenge_type: challengeType, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  identity: (apiKey: string, image: string, subjectId?: string, sessionId?: string) =>
    rawAxios.post(`${API_BASE}/identity/verify`, { image, subject_id: subjectId, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  startSession: (apiType: string) => api.post('/liveness/session/start', { api_type: apiType }),
  processDemoFrame: (image: string, sessionId?: string, challengeType?: string, enrolledEmbedding?: number[], apiType?: string) =>
    api.post('/liveness/demo/process', { image, session_id: sessionId, challenge_type: challengeType, enrolled_embedding: enrolledEmbedding, api_type: apiType }),
  logEvent: (sessionId: string, eventType: string, apiType: string) =>
    api.post('/liveness/demo/log_event', { session_id: sessionId, event_type: eventType, api_type: apiType }),
  enrollFace: (image: string, subjectId?: string) => api.post('/identity/enroll', { image, subject_id: subjectId }),
  getEnrolledFace: () => api.get('/identity/enrolled'),
};

// ── Analytics (Single Source of Truth) ────────────────────────────────────────
export const analyticsAPI = {
  overview: () => axios.get('/api/analytics/overview'),
  usage: (days?: number) => axios.get('/api/analytics/usage'),
  logVerificationEvent: (data: {
    apiType: string;
    status: string;
    confidence: number;
    processingTimeMs: number;
    spoofFlag: boolean;
    faceDetectedFlag: boolean;
    identityMatchedFlag: boolean;
    attentionScore?: number;
  }) => axios.post('/api/events', data),
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

export { API_BASE };
export const checkHealth = () => api.get('/health');

export function parseNetworkError(error: unknown, targetUrl: string): string {
  if (!error) return 'Unknown Connection Error';
  const err = error as { code?: string; message?: string; response?: { status: number; data: unknown } };

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return `Connection Timeout: Backend took too long to respond (limit: 15s). Railway may be cold-starting.`;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return `Offline: Your device is not connected to the internet.`;
  }
  if (!err.response) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && targetUrl.startsWith('http:')) {
      return `Mixed Content Blocked: HTTPS frontend cannot call HTTP backend.`;
    }
    return `Network Error: Cannot reach ${targetUrl}. Check CORS or backend availability.`;
  }
  return `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
}

export default api;
