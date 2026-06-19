'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Key, ShieldAlert, Activity, Database, CheckCircle, XCircle,
  Search, Trash2, Clock, Terminal, RefreshCw, Layers, Shield, Cpu
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/cyber/PageTransition';
import TiltCard from '@/components/cyber/TiltCard';
import AnimatedCounter from '@/components/cyber/AnimatedCounter';

interface AdminStats {
  users: { total: number; active: number; admin: number };
  keys: { total: number; active: number };
  requests: {
    total: number;
    passed: number;
    failed: number;
    spoof: number;
    error: number;
    success_rate: number;
    avg_processing_time: number;
  };
  system: { db_size_bytes: number; cpu_load: number; memory_usage_pct: number; status: string };
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string | null;
  last_login: string | null;
}

interface SystemLog {
  id: string;
  level: string;
  message: string;
  meta_data: Record<string, unknown> | null;
  created_at: string | null;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  meta_data: Record<string, unknown> | null;
  ip_address: string;
  created_at: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'syslogs' | 'audit'>('overview');
  
  // States for stats and listings
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [syslogs, setSyslogs] = useState<SystemLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Loading & Filtering state
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  
  // Actions states
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load functions (declared as function statements to hoist them and avoid TDZ compile errors)
  async function loadDashboardStats() {
    setLoadingStats(true);
    try {
      const res = await adminAPI.stats();
      setStats(res.data);
    } catch (err) {
      console.warn('Failed to load admin stats', err);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadUsersList() {
    setLoadingUsers(true);
    try {
      const res = await adminAPI.users();
      setUsers(res.data);
    } catch (err) {
      console.warn('Failed to fetch users', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadSystemLogs() {
    setLoadingLogs(true);
    try {
      const filter = logLevelFilter === 'ALL' ? undefined : logLevelFilter;
      const res = await adminAPI.systemLogs(50, filter);
      setSyslogs(res.data);
    } catch (err) {
      console.warn('Failed to fetch system logs', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function loadAuditLogs() {
    setLoadingLogs(true);
    try {
      const res = await adminAPI.auditLogs(50);
      setAuditLogs(res.data);
    } catch (err) {
      console.warn('Failed to fetch audit logs', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?reason=unauthenticated');
      return;
    }
    if (user?.role === 'admin') {
      const timer = setTimeout(() => {
        setIsAdmin(true);
        setCheckingAuth(false);
        loadDashboardStats();
        loadUsersList();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsAdmin(false);
        setCheckingAuth(false);
        router.replace('/auth/login?reason=unauthenticated');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [router, isAuthenticated, authLoading, user]);

  // Tab switching side effect
  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      if (activeTab === 'syslogs') {
        loadSystemLogs();
      } else if (activeTab === 'audit') {
        loadAuditLogs();
      } else if (activeTab === 'overview') {
        loadDashboardStats();
      } else if (activeTab === 'users') {
        loadUsersList();
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, logLevelFilter, isAdmin]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await adminAPI.updateRole(userId, newRole);
      setActionSuccess('Role updated successfully.');
      loadUsersList();
      loadDashboardStats();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setActionError(apiErr?.response?.data?.detail || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setUpdatingUserId(userId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await adminAPI.updateStatus(userId, !currentStatus);
      setActionSuccess('User status updated successfully.');
      loadUsersList();
      loadDashboardStats();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setActionError(apiErr?.response?.data?.detail || 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleClearLogs = async (type: 'system' | 'audit') => {
    if (!confirm(`Are you sure you want to clear all ${type} logs? This cannot be undone.`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      if (type === 'system') {
        await adminAPI.clearSystemLogs();
        setActionSuccess('System logs cleared.');
        loadSystemLogs();
      } else {
        await adminAPI.clearAuditLogs();
        setActionSuccess('Audit logs cleared.');
        loadAuditLogs();
      }
    } catch {
      setActionError(`Failed to clear ${type} logs.`);
    }
  };

  // Search filter for users
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Auth Protection fallback
  if (authLoading || checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={40} className="shimmer" color="var(--brand-cyan)" style={{ margin: '0 auto 16px', animation: 'spin 2s linear infinite' }} />
          <div>Checking Administrator Privileges...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: 40 }} className="glass">
          <ShieldAlert size={60} color="var(--brand-red)" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#94a3b8', maxWidth: 450, margin: '0 auto 24px', lineHeight: 1.6 }}>
            You do not have administrative credentials to view the control panel. Please contact the administrator or login with an admin account.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/" className="btn-ghost" style={{ textDecoration: 'none' }}>
              Return Home
            </Link>
            <Link href="/auth/login" className="btn-primary" style={{ textDecoration: 'none' }}>
              Sign In Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '128px 24px 60px' }}>
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Shield size={20} color="var(--brand-cyan)" />
              <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brand-cyan)', fontWeight: 600 }}>CONTROL HUB</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>System oversight, database stats, audit streams and role managers.</p>
          </div>
          <button 
            onClick={() => {
              if (activeTab === 'overview') loadDashboardStats();
              else if (activeTab === 'users') loadUsersList();
              else if (activeTab === 'syslogs') loadSystemLogs();
              else loadAuditLogs();
            }} 
            className="btn-ghost w-full sm:w-auto" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.2)', color: 'var(--brand-green)', fontSize: 13, marginBottom: 20 }}>
              ✓ {actionSuccess}
            </motion.div>
          )}
          {actionError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255, 51, 102, 0.08)', border: '1px solid rgba(255, 51, 102, 0.2)', color: 'var(--brand-red)', fontSize: 13, marginBottom: 20 }}>
              ⚠ {actionError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-nowrap overflow-x-auto border-b border-[var(--border-subtle)] pb-1 mb-8 gap-2 scrollbar-none">
          {[
            { id: 'overview', label: 'System Overview', icon: Activity },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'syslogs', label: 'System Logs', icon: Terminal },
            { id: 'audit', label: 'Audit Trail', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as 'overview' | 'users' | 'syslogs' | 'audit'); setActionError(null); setActionSuccess(null); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '12px 16px', fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                  color: isSelected ? 'var(--brand-cyan)' : 'var(--text-secondary)',
                  borderBottom: `2px solid ${isSelected ? 'var(--brand-cyan)' : 'transparent'}`,
                  transition: 'all 0.2s',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div style={{ minHeight: 400 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {loadingStats ? (
                <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading telemetry data...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                  {/* Stats Cards */}
                  <TiltCard style={{ padding: '14px 18px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Users size={15} color="var(--brand-cyan)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
                        <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1 }}>
                      <AnimatedCounter value={stats?.users.total || 0} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500, letterSpacing: '0.02em' }}>TOTAL USERS</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span>Active: <strong style={{ color: 'var(--brand-green)' }}>{stats?.users.active}</strong></span>
                      <span>Admins: <strong style={{ color: 'var(--brand-cyan)' }}>{stats?.users.admin}</strong></span>
                    </div>
                  </TiltCard>

                  <TiltCard style={{ padding: '14px 18px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Key size={15} color="var(--brand-violet)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
                        <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1 }}>
                      <AnimatedCounter value={stats?.keys.total || 0} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500, letterSpacing: '0.02em' }}>API KEYS STATUS</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span>Active Keys: <strong style={{ color: 'var(--brand-cyan)' }}>{stats?.keys.active}</strong></span>
                    </div>
                  </TiltCard>

                  <TiltCard style={{ padding: '14px 18px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(0, 255, 136, 0.08)', border: '1px solid rgba(0, 255, 136, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckCircle size={15} color="var(--brand-green)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
                        <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1 }}>
                      <AnimatedCounter value={stats?.requests.total || 0} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500, letterSpacing: '0.02em' }}>VERIFICATIONS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 10, color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span>Pass: <strong style={{ color: 'var(--brand-green)' }}>{stats?.requests.passed}</strong></span>
                      <span>Fail: <strong style={{ color: 'var(--brand-red)' }}>{stats?.requests.failed}</strong></span>
                      <span>Spoof: <strong style={{ color: 'var(--brand-amber)' }}>{stats?.requests.spoof}</strong></span>
                    </div>
                  </TiltCard>

                  <TiltCard style={{ padding: '14px 18px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Activity size={15} color="var(--brand-cyan)" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
                        <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1 }}>
                      <AnimatedCounter value={stats?.requests.success_rate || 0} />%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500, letterSpacing: '0.02em' }}>PERFORMANCE</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                      <span>Latency: <strong>{stats?.requests.avg_processing_time}s</strong></span>
                    </div>
                  </TiltCard>

                  {/* Telemetry Monitor */}
                  <div className="glass" style={{ padding: 24, borderRadius: 16, gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Cpu size={16} color="var(--brand-cyan)" /> Telemetry & Infrastructure
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>DB Storage (SQLite)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Database size={15} color="var(--brand-cyan)" /> {formatBytes(stats?.system.db_size_bytes || 0)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>System CPU Load</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {stats?.system.cpu_load.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Memory Util (Engine)</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {stats?.system.memory_usage_pct}%
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Engine status:</span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                        background: 'rgba(0, 255, 136, 0.08)', color: 'var(--brand-green)', border: '1px solid rgba(0, 255, 136, 0.15)'
                      }}>
                        ONLINE & HEALTHY
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 sm:items-center">
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Registered System Accounts</h3>
                {/* Search Bar */}
                <div className="relative w-full sm:w-[300px]">
                  <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    style={{
                      width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {loadingUsers ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Retrieving accounts...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No accounts match the criteria.</div>
              ) : (
                <div className="overflow-x-auto w-full border border-slate-800/40 rounded-xl">
                  <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: 12 }}>Name / Email</th>
                        <th style={{ padding: 12 }}>Role</th>
                        <th style={{ padding: 12 }}>Verified</th>
                        <th style={{ padding: 12 }}>Account Status</th>
                        <th style={{ padding: 12 }}>Created</th>
                        <th style={{ padding: 12 }}>Last Login</th>
                        <th style={{ padding: 12 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: 12 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name || 'No Name'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user.email}</div>
                          </td>
                          <td style={{ padding: 12 }}>
                            <select
                              value={user.role}
                              disabled={updatingUserId === user.id}
                              onChange={e => handleUpdateRole(user.id, e.target.value)}
                              style={{
                                padding: '4px 8px', borderRadius: 6,
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', outline: 'none'
                              }}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>
                          <td style={{ padding: 12 }}>
                            {user.email_verified ? (
                              <span style={{ color: 'var(--brand-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={14} /> Yes
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <XCircle size={14} /> No
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 12 }}>
                            <span style={{
                              display: 'inline-block', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                              background: user.is_active ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 51, 102, 0.08)',
                              color: user.is_active ? 'var(--brand-green)' : 'var(--brand-red)'
                            }}>
                              {user.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
                            {new Date(user.created_at || '').toLocaleDateString()}
                          </td>
                          <td style={{ padding: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
                            {formatTime(user.last_login)}
                          </td>
                          <td style={{ padding: 12 }}>
                            <button
                              disabled={updatingUserId === user.id}
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              style={{
                                padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                background: user.is_active ? 'rgba(255, 51, 102, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                                border: `1px solid ${user.is_active ? 'rgba(255, 51, 102, 0.2)' : 'rgba(0, 255, 136, 0.2)'}`,
                                color: user.is_active ? 'var(--brand-red)' : 'var(--brand-green)'
                              }}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM LOGS */}
          {activeTab === 'syslogs' && (
            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>System Output Stream</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Server log telemetry tracking infrastructure operations.</p>
                </div>
                
                {/* Level filter & Clear logs */}
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                  <select
                    value={logLevelFilter}
                    onChange={e => setLogLevelFilter(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none',
                      flex: 1
                    }}
                  >
                    <option value="ALL">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                  <button 
                    onClick={() => handleClearLogs('system')} 
                    className="btn-ghost" 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 13, color: 'var(--brand-red)', borderColor: 'rgba(255,51,102,0.2)' }}
                  >
                    <Trash2 size={14} /> Clear Logs
                  </button>
                </div>
              </div>

              {loadingLogs ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Polling stream...</div>
              ) : syslogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No logs matched.</div>
              ) : (
                <div className="terminal" style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {syslogs.map(log => {
                    const levelColors: Record<string, string> = {
                      INFO: '#00ff88',
                      WARNING: '#ffb800',
                      ERROR: '#ff3366'
                    };
                    const badgeColor = levelColors[log.level] || 'var(--text-primary)';
                    return (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 8, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: 130, flexShrink: 0 }}>
                          [{new Date(log.created_at || '').toLocaleTimeString()}]
                        </span>
                        <span style={{ 
                          color: badgeColor, fontWeight: 700, fontFamily: 'monospace', minWidth: 70, flexShrink: 0,
                          fontSize: 10, border: `1px solid ${badgeColor}30`, borderRadius: 4, padding: '1px 5px', textAlign: 'center'
                        }}>
                          {log.level}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#f8fafc', wordBreak: 'break-all' }}>{log.message}</div>
                          {log.meta_data && Object.keys(log.meta_data).length > 0 && (
                            <pre style={{ margin: '6px 0 0', fontSize: 11, color: '#64748b', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6 }}>
                              {JSON.stringify(log.meta_data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT TRAILS */}
          {activeTab === 'audit' && (
            <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>System Audit Timeline</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Immutable trail of actions and system state modifications.</p>
                </div>
                
                <button 
                  onClick={() => handleClearLogs('audit')} 
                  className="btn-ghost" 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 13, color: 'var(--brand-red)', borderColor: 'rgba(255,51,102,0.2)' }}
                >
                  <Trash2 size={14} /> Clear Audit Trail
                </button>
              </div>

              {loadingLogs ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Polling trail...</div>
              ) : auditLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Audit trail is empty.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 16 }}>
                  {/* Timeline track bar */}
                  <div style={{ position: 'absolute', top: 10, bottom: 10, left: 4, width: 2, background: 'var(--border-subtle)' }} />

                  {auditLogs.map(audit => (
                    <div key={audit.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                      {/* Timeline dot */}
                      <div style={{ 
                        position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%',
                        background: audit.action.includes('clear') || audit.action.includes('delete') ? 'var(--brand-red)' : 'var(--brand-cyan)',
                        boxShadow: `0 0 10px ${audit.action.includes('clear') ? 'var(--brand-red)' : 'var(--brand-cyan)'}`
                      }} />
                      
                      <div className="glass" style={{ flex: 1, padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', textTransform: 'capitalize' }}>
                            {audit.action.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {formatTime(audit.created_at)}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
                          <span>Operator: <strong style={{ color: '#cbd5e1' }}>{audit.user_email}</strong></span>
                          <span>Resource: <strong style={{ color: '#cbd5e1' }}>{audit.resource_type}</strong></span>
                          <span>IP: <strong style={{ color: '#cbd5e1' }}>{audit.ip_address}</strong></span>
                        </div>
                        {audit.meta_data && Object.keys(audit.meta_data).length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {JSON.stringify(audit.meta_data)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
