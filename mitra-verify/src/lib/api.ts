import axios from 'axios';

// Set global 5-second timeout limit for all axios requests
axios.defaults.timeout = 5000;

// Read API URL from environment variable strictly
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Log active API URL during startup
console.log(`[MITRA VERIFY STARTUP] Active API URL: ${API_BASE || 'MISSING'}`);

// Add request/response logging interceptors to global axios
axios.interceptors.request.use(config => {
  console.log(`[AXIOS REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error(`[AXIOS REQUEST ERROR]`, error);
  return Promise.reject(error);
});

// Automatic retry with exponential backoff interceptor on global axios
axios.interceptors.response.use(
  response => {
    console.log(`[AXIOS RESPONSE SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async error => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Track retries
    config.__retryCount = config.__retryCount || 0;
    if (config.__retryCount < 3) {
      config.__retryCount += 1;
      const delay = Math.pow(2, config.__retryCount) * 250; // 500ms, 1000ms, 2000ms
      console.warn(`[AXIOS RETRY] Connection failed. Retrying ${config.method?.toUpperCase()} ${config.url} in ${delay}ms (Attempt ${config.__retryCount}/3)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return axios(config);
    }

    console.error(`[AXIOS RESPONSE ERROR] ${config.method?.toUpperCase()} ${config.url} - ${error.message}`);
    return Promise.reject(error);
  }
);

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

// Token refresh on 401, detailed logging, and automatic retry with backoff on api instance
api.interceptors.response.use(
  res => {
    console.log(`[API RESPONSE SUCCESS] Endpoint: ${res.config.url}, Status: ${res.status}, Body:`, JSON.stringify(res.data));
    return res;
  },
  async err => {
    const config = err.config;
    if (config) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        const delay = Math.pow(2, config.__retryCount) * 250; // 500ms, 1000ms, 2000ms
        console.warn(`[API RETRY] Connection failed. Retrying ${config.url} in ${delay}ms (Attempt ${config.__retryCount}/3)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }

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

export { API_BASE };
export const checkHealth = () => api.get('/health');

export default api;
