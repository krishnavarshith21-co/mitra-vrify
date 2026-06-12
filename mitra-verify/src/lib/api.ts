import axios from 'axios';

// Set global 5-second timeout limit for all axios requests
axios.defaults.timeout = 5000;

// Enforce production URL safety rules
const isProduction = process.env.NODE_ENV === 'production';
let API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

if (isProduction) {
  // Production must NEVER point to localhost or 127.0.0.1
  if (!API_BASE || API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1')) {
    // Fallback to the production backend URL (the localtunnel domain)
    API_BASE = 'https://mitra-verify-backend-prod.loca.lt/api/v1';
  }
} else {
  if (!API_BASE) {
    API_BASE = 'http://localhost:8005/api/v1';
  }
}

// Startup validation: Log active API URL
console.log(`[MITRA VERIFY STARTUP] Active API URL: ${API_BASE}`);

// Add request/response logging interceptors to global axios
axios.interceptors.request.use(config => {
  console.log(`[AXIOS REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error(`[AXIOS REQUEST ERROR]`, error);
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  console.log(`[AXIOS RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
  return response;
}, error => {
  console.error(`[AXIOS RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.message}`);
  return Promise.reject(error);
});

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
});

// Auth token injection and request logging
api.interceptors.request.use(config => {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mv_access_token');
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        config.headers = { Authorization: `Bearer ${token}` } as any;
      }
    }
  }
  return config;
}, error => {
  console.error(`[API REQUEST ERROR]`, error);
  return Promise.reject(error);
});

// Token refresh on 401 and response/body logging
api.interceptors.response.use(
  res => {
    // Detailed logging: endpoint, status code, response body
    console.log(`[API RESPONSE SUCCESS] Endpoint: ${res.config.url}, Status: ${res.status}, Body:`, JSON.stringify(res.data));
    return res;
  },
  async err => {
    if (err.response) {
      console.error(`[API RESPONSE ERROR] Endpoint: ${err.config?.url}, Status: ${err.response.status}, Body:`, JSON.stringify(err.response.data));
    } else {
      console.error(`[API NETWORK/TIMEOUT ERROR] Endpoint: ${err.config?.url}, Message: ${err.message}`);
    }

    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('mv_access_token');
      localStorage.removeItem('mv_user_name');
      localStorage.removeItem('mv_user_email');
      localStorage.removeItem('mv_user_avatar');
      localStorage.removeItem('mv_user_provider');
      localStorage.removeItem('mv_user_has_enrolled_face');
      localStorage.removeItem('enrolledEmbedding');
      localStorage.removeItem('mv_enrolled_signature');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// ── API Keys ──────────────────────────────────────────────────
export const keysAPI = {
  create: (data: { name: string; api_type: string }) =>
    api.post('/keys', data),
  list: () => api.get('/keys'),
  revoke: (id: string) => api.delete(`/keys/${id}`),
};

// ── Liveness ──────────────────────────────────────────────────
export const livenessAPI = {
  basic: (apiKey: string, image: string, sessionId?: string) =>
    axios.post(`${API_BASE}/liveness/basic`, { image, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  advanced: (apiKey: string, image: string, challengeType?: string, sessionId?: string) =>
    axios.post(`${API_BASE}/liveness/advanced`, { image, challenge_type: challengeType, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  identity: (apiKey: string, image: string, subjectId?: string, sessionId?: string) =>
    axios.post(`${API_BASE}/identity/verify`, { image, subject_id: subjectId, session_id: sessionId },
      { headers: { 'X-API-Key': apiKey, 'Bypass-Tunnel-Reminder': 'true' } }),
  startSession: (apiType: string) =>
    api.post('/liveness/session/start', { api_type: apiType }),
  processDemoFrame: (image: string, sessionId?: string, challengeType?: string, enrolledEmbedding?: number[], apiType?: string) =>
    api.post('/liveness/demo/process', { image, session_id: sessionId, challenge_type: challengeType, enrolled_embedding: enrolledEmbedding, api_type: apiType }),
  enrollFace: (image: string, subjectId?: string) =>
    api.post('/identity/enroll', { image, subject_id: subjectId }),
  getEnrolledFace: () =>
    api.get('/identity/enrolled'),
};

// ── Analytics ──────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  usage: (days?: number) => api.get(`/analytics/usage?days=${days || 30}`),
  threats: () => api.get('/analytics/threats'),
};

// ── Admin ─────────────────────────────────────────────────────
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

export default api;
