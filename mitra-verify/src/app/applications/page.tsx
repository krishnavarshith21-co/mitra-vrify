'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Trash2, CheckCircle, Zap, Shield, Fingerprint, RefreshCcw, Layers, Globe, Code2 } from 'lucide-react';
import { applicationsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/cyber/PageTransition';
import TiltCard from '@/components/cyber/TiltCard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface ClientApplication {
  id: string;
  name: string;
  api_level: string;
  client_id: string;
  api_key_prefix: string;
  server_secret_prefix: string;
  allowed_redirect_uris: string[];
  is_active: boolean;
  request_count: number;
  verified_count: number;
  failed_count: number;
  created_at: string;
  
  // Only available after creation or key rotation
  api_key?: string;
  server_secret?: string;
}

const API_TYPE_META: Record<string, { color: string; icon: React.ComponentType<{ size?: number; color?: string }>; label: string }> = {
  api1: { color: '#00d4ff', icon: Zap, label: 'Level 1: Fast Liveness' },
  api2: { color: '#7c3aed', icon: Shield, label: 'Level 2: Anti-Spoof' },
  api3: { color: '#00ff88', icon: Fingerprint, label: 'Level 3: Enterprise Identity' },
};

const SDK_EXAMPLES = {
  nextjs: (app: ClientApplication) => `// Frontend (Client-side)
const response = await fetch("https://api.mitraverify.com/api/v1/verification/sessions", {
  method: "POST",
  headers: {
    "X-API-Key": "${app.api_key || app.api_key_prefix + '...'}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    application_id: "${app.client_id}",
    redirect_uri: "https://your-app.com/callback"
  })
});
const { verification_url } = await response.json();
window.location.href = verification_url;

// Backend (Server-side Callback)
const resultResponse = await fetch(\`https://api.mitraverify.com/api/v1/verification/sessions/\${sessionId}/result\`, {
  method: "POST",
  headers: {
    "X-Server-Secret": "${app.server_secret || app.server_secret_prefix + '...'}"
  }
});
const result = await resultResponse.json();
if (result.status === "VERIFIED") {
  // Login user
}
`,
};

export default function ApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [apps, setApps] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [newAppName, setNewAppName] = useState('');
  const [newAppLevel, setNewAppLevel] = useState('api1');
  const [newAppRedirects, setNewAppRedirects] = useState('http://localhost:3000/callback');
  
  const [showCreate, setShowCreate] = useState(false);
  const [justCreated, setJustCreated] = useState<ClientApplication | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<ClientApplication | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadApps();
  }, [router, isAuthenticated, authLoading]);

  async function loadApps() {
    setLoading(true);
    try {
      const res = await applicationsAPI.list();
      setApps(res.data);
      setError(null);
    } catch (err: any) {
      console.warn(err);
      setError('Failed to load applications. The request timed out or the server is unavailable.');
      if (err?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }

  async function createApp() {
    if (!newAppName.trim()) return;
    setCreating(true); setError(null);
    try {
      const redirects = newAppRedirects.split(',').map(r => r.trim()).filter(Boolean);
      const res = await applicationsAPI.create({ 
        name: newAppName, 
        api_level: newAppLevel,
        allowed_redirect_uris: redirects
      });
      const newApp = res.data;
      setJustCreated(newApp);
      setApps(prev => [newApp, ...prev]);
      setShowCreate(false);
      
      // Reset form
      setNewAppName('');
      setNewAppLevel('api1');
      setNewAppRedirects('http://localhost:3000/callback');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create application');
      if (err?.response?.status === 401) logout();
    } finally {
      setCreating(false);
    }
  }

  async function deleteApp(id: string) {
    if (!confirm('Deactivate this application? It will no longer be able to create verification sessions.')) return;
    try {
      await applicationsAPI.delete(id);
      setApps(prev => prev.filter(a => a.id !== id));
      if (justCreated?.id === id) setJustCreated(null);
    } catch {
      alert('Failed to delete application');
    }
  }

  async function rotateKeys(id: string) {
    if (!confirm('Rotate keys? The old API Key and Server Secret will stop working immediately.')) return;
    try {
      const res = await applicationsAPI.rotateKeys(id);
      const { api_key, server_secret, api_key_prefix, server_secret_prefix } = res.data;
      
      // Update the app list
      setApps(prev => prev.map(app => {
        if (app.id === id) {
          return {
            ...app,
            api_key_prefix,
            server_secret_prefix
          };
        }
        return app;
      }));

      // Show the newly rotated keys in the justCreated banner style
      setJustCreated({
        id,
        name: apps.find(a => a.id === id)?.name || 'Updated App',
        api_key,
        server_secret
      } as any);

    } catch {
      alert('Failed to rotate keys');
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Navbar />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <div className="section-container" style={{ paddingTop: 112, paddingBottom: 64 }}>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <span className="text-label" style={{ color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Layers size={16} color="#00d4ff" />
              VERIFICATION PLATFORM
            </span>
            <h1 className="heading-section" style={{ marginBottom: 8 }}>Applications</h1>
            <p style={{ fontSize: 15, color: '#94a3b8' }}>Register applications to integrate the Hosted Verification flow.</p>
          </div>
          <button className="btn-primary w-full sm:w-auto" onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0 }}>
            <Plus size={16} /> New Application
          </button>
        </div>

        {/* Just Created / Rotated Banner */}
        <AnimatePresence>
          {justCreated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: 24, padding: 24, borderRadius: 16,
                background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle size={20} color="#00ff88" />
                <span style={{ fontWeight: 600, color: '#00ff88', fontSize: 16 }}>Application Credentials Ready</span>
                <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>These will only be shown once!</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#00ff88]/80 mb-2 block font-semibold uppercase tracking-wider">Client API Key (Frontend)</label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,136,0.15)',
                  }}>
                    <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#00ff88', wordBreak: 'break-all' }}>
                      {justCreated.api_key}
                    </code>
                    <button onClick={() => copyToClipboard(justCreated.api_key!, 'apikey')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'apikey' ? '#00ff88' : '#475569', flexShrink: 0 }}>
                      {copied === 'apikey' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[#ff3366]/80 mb-2 block font-semibold uppercase tracking-wider">Server Secret (Backend)</label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,51,102,0.2)',
                  }}>
                    <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#ff3366', wordBreak: 'break-all' }}>
                      {justCreated.server_secret}
                    </code>
                    <button onClick={() => copyToClipboard(justCreated.server_secret!, 'secret')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'secret' ? '#ff3366' : '#475569', flexShrink: 0 }}>
                      {copied === 'secret' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <button onClick={() => setJustCreated(null)}
                  style={{ fontSize: 13, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  {"I've saved my credentials — dismiss"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create App Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass w-full max-w-[550px] mx-4 p-6 md:p-9 max-h-[90vh] overflow-y-auto custom-scrollbar"
                style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Register Application</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>Create a new integration for MITRA VERIFY.</p>

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', fontSize: 13, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Application Name</label>
                  <input
                    value={newAppName} onChange={e => setNewAppName(e.target.value)}
                    placeholder="e.g. My FinTech App"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Default Verification Level</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['api1', 'api2', 'api3'].map(type => {
                      const meta = API_TYPE_META[type];
                      return (
                        <label key={type} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          borderRadius: 10, cursor: 'pointer',
                          background: newAppLevel === type ? `${meta.color}0d` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${newAppLevel === type ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.2s',
                        }}>
                          <input type="radio" value={type} checked={newAppLevel === type} onChange={() => setNewAppLevel(type)} style={{ display: 'none' }} />
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <meta.icon size={14} color={meta.color} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{meta.label}</div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Globe size={14} /> Allowed Redirect URIs
                  </label>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Comma-separated list of absolute URLs we can redirect back to.</p>
                  <textarea
                    value={newAppRedirects} onChange={e => setNewAppRedirects(e.target.value)}
                    placeholder="https://yourapp.com/callback, http://localhost:3000/callback"
                    rows={3}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      resize: 'vertical', fontFamily: 'monospace'
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={createApp} disabled={creating || !newAppName.trim()} className="btn-primary"
                    style={{ flex: 1, opacity: creating || !newAppName.trim() ? 0.7 : 1 }}>
                    {creating ? 'Registering...' : 'Register App'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apps List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }} />
          </div>
        ) : error && apps.length === 0 ? (
          <div className="glass p-10 rounded-2xl text-center border border-red-500/20">
            <p className="text-red-400 text-sm mb-5">{error}</p>
            <button onClick={loadApps} className="btn-primary inline-flex items-center gap-2">Retry</button>
          </div>
        ) : apps.length === 0 ? (
          <div className="glass p-16 rounded-3xl text-center flex flex-col items-center">
            <Layers size={48} className="text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Applications Yet</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">Register your first application to get an API Key and Server Secret for integrating the hosted verification flow.</p>
            <button className="btn-primary inline-flex items-center gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Register Application
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {apps.map(app => {
                const meta = API_TYPE_META[app.api_level] || API_TYPE_META.api1;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, height: 0, y: 15 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="overflow-hidden"
                  >
                    <TiltCard className={`p-5 rounded-2xl border ${app.is_active ? 'border-white/5 opacity-100' : 'border-red-500/10 opacity-60'}`}>
                      <div className="flex flex-col md:flex-row gap-6 md:items-center">
                        {/* Title & Stats */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                              <Layers size={18} className="text-white/80" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white">{app.name}</h3>
                                {!app.is_active && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>}
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">App ID: {app.client_id}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Total Sessions</span>
                              <span className="font-medium text-white">{app.request_count.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Passed</span>
                              <span className="font-medium text-[#00ff88]">{app.verified_count.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Failed</span>
                              <span className="font-medium text-[#ff3366]">{app.failed_count.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-semibold`} style={{ backgroundColor: `${meta.color}11`, borderColor: `${meta.color}30`, color: meta.color }}>
                            <meta.icon size={12} />
                            {meta.label}
                          </div>
                          
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                              <Code2 size={16} />
                            </button>
                            {app.is_active && (
                              <button onClick={() => rotateKeys(app.id)}
                                title="Rotate API Key and Server Secret"
                                className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition-colors">
                                <RefreshCcw size={16} />
                              </button>
                            )}
                            {app.is_active && (
                              <button onClick={() => deleteApp(app.id)}
                                title="Deactivate Application"
                                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Code Example Expansion */}
                      <AnimatePresence>
                        {selectedApp?.id === app.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-6 pt-6 border-t border-white/10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-[#00d4ff] font-bold uppercase">Client API Key Prefix</span>
                                    <code className="text-xs text-slate-300 font-mono mt-1">{app.api_key_prefix}</code>
                                  </div>
                                </div>
                                <div className="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-[#ff3366] font-bold uppercase">Server Secret Prefix</span>
                                    <code className="text-xs text-slate-300 font-mono mt-1">{app.server_secret_prefix}</code>
                                  </div>
                                </div>
                              </div>
                              
                              <h4 className="text-sm font-semibold text-white mb-3">Integration Example</h4>
                              <div className="terminal relative">
                                <button onClick={() => copyToClipboard(SDK_EXAMPLES.nextjs(app), `code-${app.id}`)}
                                  className={`absolute top-3 right-3 bg-transparent border-none cursor-pointer ${copied === `code-${app.id}` ? 'text-[#00ff88]' : 'text-slate-500 hover:text-slate-300'}`}>
                                  {copied === `code-${app.id}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                </button>
                                <pre className="m-0 text-xs text-slate-300 font-mono whitespace-pre-wrap">{SDK_EXAMPLES.nextjs(app)}</pre>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
    </ProtectedRoute>
  );
}
