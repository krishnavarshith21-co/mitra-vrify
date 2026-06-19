'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Eye, Zap, Fingerprint, AlertTriangle, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import TiltCard from '@/components/cyber/TiltCard';
import AnimatedCounter from '@/components/cyber/AnimatedCounter';
import ThreeGlobe from '@/components/cyber/ThreeGlobe';
import PageTransition from '@/components/cyber/PageTransition';

interface Overview {
  total_requests: number;
  successful_verifications: number;
  spoof_attempts: number;
  identity_matches: number;
  success_rate: number;
  avg_processing_time: number;
  active_api_keys: number;
}

interface Activity {
  date: string;
  result: string;
  type: string;
}

interface Threat {
  id: string;
  result: string;
  confidence: number;
  spoof_score: number;
  api_type: string;
  timestamp: string;
}

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
}

interface UsageDataItem {
  date: string;
  pass: number;
  fail: number;
  spoof: number;
  total: number;
}

function KPICard({ label, value, unit, delta, icon: Icon, color = '#00d4ff' }: KPICardProps) {
  return (
    <TiltCard style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          background: `${color}12`, border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {delta !== undefined && (
            <span style={{ fontSize: 11, color: delta >= 0 ? '#00ff88' : '#ff3366', fontWeight: 600 }}>
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
          )}
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
        </div>
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc', lineHeight: 1 }}>
        <AnimatedCounter value={value} />
        {unit && <span style={{ fontSize: 'var(--text-sm)', color: '#475569', marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: '#94a3b8', marginTop: 6 }}>{label}</div>
    </TiltCard>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [usageData, setUsageData] = useState<UsageDataItem[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Check token directly from localStorage — no AuthContext race condition
    const token = typeof window !== 'undefined' ? localStorage.getItem('mv_access_token') : null;
    if (!token) {
      router.replace('/auth/login?reason=unauthenticated');
      return;
    }
    setTokenChecked(true);
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!tokenChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw size={32} color="#00d4ff" />
        </motion.div>
      </div>
    );
  }

  async function loadData() {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Biometric telemetry request timed out (5s)')), 5000)
      );
      const [overviewRes, usageRes, threatsRes] = await Promise.race([
        Promise.all([
          analyticsAPI.overview(),
          analyticsAPI.usage(30),
          analyticsAPI.threats(),
        ]),
        timeoutPromise
      ]) as any;
      setOverview(overviewRes.data);
      setThreats(threatsRes.data.threats || []);

      // Process usage data into daily buckets
      const rawData: Activity[] = usageRes.data.data || [];
      const buckets: Record<string, { pass: number; fail: number; spoof: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'MMM d');
        buckets[d] = { pass: 0, fail: 0, spoof: 0 };
      }
      rawData.forEach(item => {
        const d = format(new Date(item.date), 'MMM d');
        if (buckets[d]) {
          if (item.result === 'pass') buckets[d].pass++;
          else if (item.result === 'spoof') buckets[d].spoof++;
          else buckets[d].fail++;
        }
      });
      setUsageData(Object.entries(buckets).map(([date, counts]) => ({ date, ...counts, total: counts.pass + counts.fail + counts.spoof })));
      setLastRefresh(new Date());
      setError(null);
      setIsDemoMode(false);
    } catch (err: unknown) {
      console.warn('Telemetry API unavailable. Falling back to demo statistics.', err);
      // Load demo statistics
      const demoOverview = {
        total_requests: 12450,
        successful_verifications: 12180,
        spoof_attempts: 185,
        identity_matches: 9840,
        success_rate: 97.83,
        avg_processing_time: 142.0,
        active_api_keys: 3
      };
      setOverview(demoOverview);

      const demoThreats = [
        { id: '1', result: 'spoof', confidence: 0.98, spoof_score: 0.98, api_type: 'basic', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', result: 'fail', confidence: 0.45, spoof_score: 0.12, api_type: 'enterprise', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', result: 'spoof', confidence: 0.94, spoof_score: 0.94, api_type: 'advanced', timestamp: new Date(Date.now() - 14400000).toISOString() }
      ];
      setThreats(demoThreats);

      const demoUsageData = [];
      for (let i = 29; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), 'MMM d');
        const pass = Math.floor(Math.random() * 100) + 150;
        const spoof = Math.floor(Math.random() * 5);
        const fail = Math.floor(Math.random() * 10);
        demoUsageData.push({
          date: dateStr,
          pass,
          spoof,
          fail,
          total: pass + spoof + fail
        });
      }
      setUsageData(demoUsageData);
      setLastRefresh(new Date());
      setIsDemoMode(true);
      setError(null); // Do not show the fatal telemetry error screen

      const apiErr = err as { response?: { status?: number } };
      if (apiErr?.response?.status === 401) {
        localStorage.removeItem('mv_access_token');
        router.replace('/auth/login?reason=unauthenticated');
      }
    } finally {
      setLoading(false);
    }
  }

  const pieData = overview ? [
    { name: 'Pass', value: overview.successful_verifications, color: '#00ff88' },
    { name: 'Fail', value: overview.total_requests - overview.successful_verifications - overview.spoof_attempts, color: '#ff3366' },
    { name: 'Spoof', value: overview.spoof_attempts, color: '#ffb800' },
  ].filter(d => d.value > 0) : [];

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
        <Navbar />
        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 16px', paddingTop: 112, paddingBottom: 80, position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Dashboard</h1>
              <p style={{ color: '#475569', fontSize: 14 }}>
                Last updated {lastRefresh ? format(lastRefresh, 'HH:mm:ss') : '--:--:--'} ·
                <span style={{ color: '#00d4ff' }}> Auto-refreshes every 30s</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {isDemoMode && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ffb800',
                  background: 'rgba(255, 184, 0, 0.1)',
                  border: '1px solid rgba(255, 184, 0, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  ⚠️ Demo Mode (Server Offline)
                </span>
              )}
              <button onClick={loadData} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Refresh
              </button>
              <Link href="/developer" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} /> API Keys
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw size={32} color="#00d4ff" />
              </motion.div>
              <p style={{ color: '#475569', marginTop: 16 }}>Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="glass" style={{ padding: 40, borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,51,102,0.2)' }}>
              <AlertTriangle size={36} color="#ff3366" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>Unable to Load Analytics</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>{error}</p>
              <button onClick={loadData} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          ) : (
            <>
              {/* Unified KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KPICard label="Total Requests" value={overview?.total_requests || 0} icon={Activity} color="#00d4ff" />
                <KPICard label="Successful Verifications" value={overview?.successful_verifications || 0} icon={Eye} color="#00ff88" />
                <KPICard label="Spoof Attempts" value={overview?.spoof_attempts || 0} icon={Shield} color="#ff3366" />
                <KPICard label="Identity Matches" value={overview?.identity_matches || 0} icon={Fingerprint} color="#7c3aed" />
                <KPICard label="Success Rate" value={`${(overview?.success_rate || 0).toFixed(1)}`} unit="%" icon={TrendingUp} color="#00ff88" />
                <KPICard label="Avg Processing Time" value={`${(overview?.avg_processing_time || 0).toFixed(0)}`} unit="ms" icon={Clock} color="#ffb800" />
                <KPICard label="Active API Keys" value={overview?.active_api_keys || 0} icon={Zap} color="#00d4ff" />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Usage Area Chart */}
                <TiltCard className="lg:col-span-1" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Requests (Last 30 Days)</h3>
                  {usageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={usageData.slice(-15)}>
                        <defs>
                          <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="spoofGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff3366" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#ff3366" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(10, 15, 30, 0.9)', border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 8, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                        <Area type="monotone" dataKey="pass" stroke="#00ff88" strokeWidth={2} fill="url(#passGrad)" name="Pass" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" activeDot={{ r: 4, strokeWidth: 0, fill: '#00ff88' }} />
                        <Area type="monotone" dataKey="spoof" stroke="#ff3366" strokeWidth={2} fill="url(#spoofGrad)" name="Spoof" isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" activeDot={{ r: 4, strokeWidth: 0, fill: '#ff3366' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }}>
                      No usage data yet. Start making API calls to see analytics.
                    </div>
                  )}
                </TiltCard>

                {/* Holographic 3D Globe Vector */}
                <TiltCard style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' as const }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Global Threat Vector</h3>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ThreeGlobe />
                  </div>
                </TiltCard>

                {/* Result Distribution */}
                <TiltCard style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Result Distribution</h3>
                  {pieData.length > 0 ? (
                    <>
                      <div style={{ position: 'relative', width: '100%', height: 130 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={56} paddingAngle={4} dataKey="value">
                              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} style={{ outline: 'none' }} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(10, 15, 30, 0.9)', border: '1px solid rgba(0, 212, 255, 0.15)', borderRadius: 8, backdropFilter: 'blur(12px)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          pointerEvents: 'none'
                        }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {overview ? overview.total_requests.toLocaleString() : '0'}
                          </span>
                          <span style={{ fontSize: 8, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>
                            Total
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                        {pieData.map(d => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color }} />
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.name}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: d.color }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13, textAlign: 'center' }}>
                      Make API calls to see result distribution
                    </div>
                  )}
                </TiltCard>
              </div>

            {/* Threat Feed */}
            <div className="glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color="#ffb800" />
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>Threat Monitoring</h3>
                </div>
                <span style={{ fontSize: 12, color: '#475569' }}>{threats.length} detected events</span>
              </div>
              {threats.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 14 }}>
                  <Shield size={28} color="#00ff88" style={{ marginBottom: 12 }} />
                  <div style={{ color: '#00ff88', fontWeight: 600, marginBottom: 4 }}>All Clear</div>
                  No threats or spoof attempts detected
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {threats.slice(0, 10).map(threat => (
                    <div key={threat.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl" style={{
                      background: threat.result === 'spoof' ? 'rgba(255,184,0,0.04)' : 'rgba(255,51,102,0.04)',
                      border: `1px solid ${threat.result === 'spoof' ? 'rgba(255,184,0,0.15)' : 'rgba(255,51,102,0.12)'}`,
                    }}>
                      <div className="flex items-center gap-3 flex-1">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: threat.result === 'spoof' ? '#ffb800' : '#ff3366', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: threat.result === 'spoof' ? '#ffb800' : '#ff3366', fontWeight: 600, width: 60 }}>
                          {threat.result.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{threat.api_type} API</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
                          confidence: {(threat.confidence * 100).toFixed(0)}%
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {format(new Date(threat.timestamp), 'MMM d HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
