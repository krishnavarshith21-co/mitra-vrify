'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Trash2, Key, CheckCircle, Zap, Shield, Fingerprint, ArrowRight, Activity, Code2, BookOpen } from 'lucide-react';
import { keysAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/cyber/PageTransition';
import TiltCard from '@/components/cyber/TiltCard';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  api_type: string;
  is_active: boolean;
  request_count: number;
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
  plaintext?: string;
}

const API_TYPE_META: Record<string, { color: string; icon: React.ComponentType<{ size?: number; color?: string }>; label: string; endpoint: string }> = {
  basic: { color: '#00d4ff', icon: Zap, label: 'Fast Liveness', endpoint: '/api/v1/liveness/basic' },
  advanced: { color: '#7c3aed', icon: Shield, label: 'Anti-Spoof', endpoint: '/api/v1/liveness/advanced' },
  enterprise: { color: '#00ff88', icon: Fingerprint, label: 'Enterprise Identity', endpoint: '/api/v1/identity/verify' },
};

const SDK_EXAMPLES = {
  curl: (key: string, type: string) => `curl -X POST http://localhost:8005/api/v1/${type === 'basic' ? 'liveness/basic' : type === 'advanced' ? 'liveness/advanced' : 'identity/verify'} \\
  -H "X-API-Key: ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"image": "<base64_image_data>"}'`,
  python: (key: string, type: string) => `import requests
 
response = requests.post(
    "http://localhost:8005/api/v1/${type === 'basic' ? 'liveness/basic' : type === 'advanced' ? 'liveness/advanced' : 'identity/verify'}",
    headers={"X-API-Key": "${key}"},
    json={"image": "<base64_image>"}
)
print(response.json())`,
  javascript: (key: string, type: string) => `const response = await fetch(
  "http://localhost:8005/api/v1/${type === 'basic' ? 'liveness/basic' : type === 'advanced' ? 'liveness/advanced' : 'identity/verify'}",
  {
    method: "POST",
    headers: {
      "X-API-Key": "${key}",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ image: "<base64_image>" })
  }
);
const result = await response.json();`,
};

export default function DeveloperPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyType, setNewKeyType] = useState('basic');
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [justCreated, setJustCreated] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'javascript'>('curl');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?reason=unauthenticated');
      return;
    }
    async function loadKeys() {
      try {
        const res = await keysAPI.list();
        setKeys(res.data);
        setError(null);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load API keys. The request timed out or the server is unavailable.');
        const apiErr = err as { response?: { status?: number } };
        if (apiErr?.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    }
    loadKeys();
  }, [router, isAuthenticated, authLoading, logout]);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true); setError(null);
    try {
      const res = await keysAPI.create({ name: newKeyName, api_type: newKeyType });
      const newKey = res.data;
      setJustCreated(newKey);
      setKeys(prev => [newKey, ...prev]);
      setShowCreate(false);
      setNewKeyName('');
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number, data?: { detail?: string } } };
      setError(apiErr?.response?.data?.detail || 'Failed to create key');
      if (apiErr?.response?.status === 401) {
        logout();
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await keysAPI.revoke(id);
      setKeys(prev => prev.filter(k => k.id !== id));
      if (justCreated?.id === id) setJustCreated(null);
    } catch {
      alert('Failed to revoke key');
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
        <p style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Key size={20} color="#00d4ff" />
              <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', fontWeight: 600 }}>DEVELOPER PORTAL</span>
            </div>
            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>API Keys</h1>
            <p style={{ fontSize: 15, color: '#94a3b8' }}>Generate and manage API keys for all three verification APIs</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Plus size={16} /> Generate API Key
          </button>
        </div>

        {/* Just Created Banner */}
        <AnimatePresence>
          {justCreated && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: 24, padding: 20, borderRadius: 16,
                background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle size={16} color="#00ff88" />
                <span style={{ fontWeight: 600, color: '#00ff88' }}>API Key Created — Copy it now!</span>
                <span style={{ fontSize: 12, color: '#475569' }}>This is shown only once</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,255,136,0.15)',
              }}>
                <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#00ff88', wordBreak: 'break-all' }}>
                  {justCreated.plaintext}
                </code>
                <button onClick={() => copyToClipboard(justCreated.plaintext!, 'created')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'created' ? '#00ff88' : '#475569', flexShrink: 0 }}>
                  {copied === 'created' ? <CheckCircle size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button onClick={() => setJustCreated(null)}
                style={{ marginTop: 10, fontSize: 12, color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                {"I've saved my key — dismiss"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Key Modal */}
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
                className="glass"
                style={{ width: 480, padding: 36, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Generate API Key</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>The key will be shown once after creation.</p>

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366', fontSize: 13, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Key Name</label>
                  <input
                    value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production App Key"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                  />
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 10 }}>API Type</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['basic', 'advanced', 'enterprise'].map(type => {
                      const meta = API_TYPE_META[type];
                      return (
                        <label key={type} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                          borderRadius: 10, cursor: 'pointer',
                          background: newKeyType === type ? `${meta.color}0d` : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${newKeyType === type ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`,
                          transition: 'all 0.2s',
                        }}>
                          <input type="radio" name="api_type" value={type} checked={newKeyType === type} onChange={() => setNewKeyType(type)} style={{ display: 'none' }} />
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <meta.icon size={16} color={meta.color} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{meta.label}</div>
                            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{meta.endpoint}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={createKey} disabled={creating || !newKeyName.trim()} className="btn-primary"
                    style={{ flex: 1, opacity: creating || !newKeyName.trim() ? 0.7 : 1 }}>
                    {creating ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keys List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>Loading API keys...</div>
        ) : error && keys.length === 0 ? (
          <div className="glass" style={{ padding: 40, borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,51,102,0.2)' }}>
            <p style={{ color: '#ff3366', fontSize: 14, marginBottom: 20 }}>{error}</p>
            <button onClick={() => { setLoading(true); setError(null); router.refresh(); }} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Retry Loading Keys
            </button>
          </div>
        ) : keys.length === 0 ? (
          <div className="glass" style={{ padding: 60, borderRadius: 24, textAlign: 'center' }}>
            <Key size={40} color="#475569" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No API Keys Yet</h3>
            <p style={{ color: '#475569', fontSize: 14, marginBottom: 24 }}>Generate your first API key to start integrating</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Generate First Key
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {keys.map(key => {
              const meta = API_TYPE_META[key.api_type] || API_TYPE_META.basic;
              return (
                <motion.div key={key.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <TiltCard
                    style={{ padding: 24, borderRadius: 16, border: `1px solid ${key.is_active ? 'rgba(255,255,255,0.06)' : 'rgba(255,51,102,0.1)'}`, opacity: key.is_active ? 1 : 0.6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <meta.icon size={18} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{key.name}</span>
                          {!key.is_active && <span style={{ fontSize: 10, color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>REVOKED</span>}
                        </div>
                        <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{key.key_prefix}</code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: meta.color }}>{key.request_count.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#475569' }}>requests</div>
                        </div>
                        <div style={{ padding: '4px 10px', borderRadius: 6, background: `${meta.color}11`, border: `1px solid ${meta.color}30`, fontSize: 11, color: meta.color, fontWeight: 600 }}>
                          {meta.label}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setSelectedKey(selectedKey?.id === key.id ? null : key); }}
                            style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer' }}>
                            <Code2 size={14} />
                          </button>
                          {key.is_active && (
                            <button onClick={() => revokeKey(key.id)}
                              style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,51,102,0.06)', border: '1px solid rgba(255,51,102,0.15)', color: '#ff3366', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Code example panel */}
                    <AnimatePresence>
                      {selectedKey?.id === key.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ marginTop: 20, overflow: 'hidden' }}>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                              {(['curl', 'python', 'javascript'] as const).map(tab => (
                                <button key={tab} onClick={() => setCodeTab(tab)}
                                  style={{
                                    padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                                    background: codeTab === tab ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: codeTab === tab ? '#00d4ff' : '#475569',
                                  }}>
                                  {tab === 'javascript' ? 'JavaScript' : tab === 'python' ? 'Python' : 'cURL'}
                                </button>
                              ))}
                            </div>
                            <div className="terminal" style={{ position: 'relative' }}>
                              <button onClick={() => copyToClipboard(SDK_EXAMPLES[codeTab](key.key_prefix, key.api_type), `code-${key.id}`)}
                                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: copied === `code-${key.id}` ? '#00ff88' : '#475569' }}>
                                {copied === `code-${key.id}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                              </button>
                              <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{SDK_EXAMPLES[codeTab](key.key_prefix, key.api_type)}</pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 40 }}>
          {[
            { href: '/docs', icon: BookOpen, label: 'Documentation', desc: 'API reference and guides' },
            { href: '/dashboard', icon: Activity, label: 'Analytics', desc: 'Usage stats and metrics' },
            { href: '/compare', icon: Zap, label: 'Compare APIs', desc: 'Speed & accuracy comparison' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <TiltCard style={{ padding: 20, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,212,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#00d4ff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{desc}</div>
                </div>
                <ArrowRight size={14} color="#475569" style={{ marginLeft: 'auto' }} />
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
