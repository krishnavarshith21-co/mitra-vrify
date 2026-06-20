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
import { useAuth } from '@/context/AuthContext';
import SecurityRadar from '@/components/dashboard/SecurityRadar';
import VerificationFunnel from '@/components/dashboard/VerificationFunnel';
import LiveActivityFeed from '@/components/dashboard/LiveActivityFeed';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import NeuralNetworkAnimation from '@/components/dashboard/NeuralNetworkAnimation';
import Global3DBackground from '@/components/cyber/Global3DBackground';
import LiveStatusIndicators from '@/components/dashboard/LiveStatusIndicators';
import EnhancedKPICard from '@/components/dashboard/EnhancedKPICard';


interface Overview {
  total_requests: number;
  successful_verifications: number;
  failed_verifications: number;
  no_face_detected: number;
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
  noFace: number;
  total: number;
}



export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [usageData, setUsageData] = useState<UsageDataItem[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
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
      const buckets: Record<string, { pass: number; fail: number; spoof: number; noFace: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'MMM d');
        buckets[d] = { pass: 0, fail: 0, spoof: 0, noFace: 0 };
      }
      rawData.forEach(item => {
        const d = format(new Date(item.date), 'MMM d');
        if (buckets[d]) {
          const res = (item.result || '').toLowerCase();
          if (res === 'pass' || res === 'success' || res === 'identity_match_success') buckets[d].pass++;
          else if (res === 'spoof' || res === 'spoof_detected') buckets[d].spoof++;
          else if (res === 'no_face_detected') buckets[d].noFace++;
          else buckets[d].fail++;
        }
      });
      setUsageData(Object.entries(buckets).map(([date, counts]) => ({ date, ...counts, total: counts.pass + counts.fail + counts.spoof + counts.noFace })));
      setLastRefresh(new Date());
      setError(null);
      setIsDemoMode(false);
    } catch (err: unknown) {
      console.warn('Telemetry API unavailable. Falling back to demo statistics.', err);
      // Load demo statistics
      const demoOverview = {
        total_requests: 12450,
        successful_verifications: 12180,
        failed_verifications: 85,
        no_face_detected: 0,
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
        const noFace = Math.floor(Math.random() * 2);
        demoUsageData.push({
          date: dateStr,
          pass,
          spoof,
          fail,
          noFace,
          total: pass + spoof + fail + noFace
        });
      }
      setUsageData(demoUsageData);
      setLastRefresh(new Date());
      setIsDemoMode(true);
      setError(null); // Do not show the fatal telemetry error screen

      const apiErr = err as { response?: { status?: number } };
      if (apiErr?.response?.status === 401) {
        localStorage.removeItem('mv_access_token');
      }
    } finally {
      setLoading(false);
    }
  }

  const pieData = overview ? [
    { name: 'Pass', value: overview.successful_verifications, color: '#00ff88' },
    { name: 'Fail', value: overview.failed_verifications, color: '#ff3366' },
    { name: 'Spoof', value: overview.spoof_attempts, color: '#ffb800' },
    { name: 'No Face', value: overview.no_face_detected, color: '#94a3b8' },
  ].filter(d => d.value > 0) : [];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#030712] relative text-slate-300 font-sans selection:bg-[#00d4ff]/30">
        <Navbar />
        
        {/* Abstract Particle / Neural Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <Global3DBackground />
          <NeuralNetworkAnimation />
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#00d4ff]/[0.03] to-transparent" />
        </div>

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-fade-up">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-2">
                Security Operations Center
              </h1>
              <p className="text-sm text-slate-400">
                Live biometric telemetry and threat intelligence. Auto-refreshes every 30s.
              </p>
              <LiveStatusIndicators />
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              {isDemoMode && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffb800]/10 border border-[#ffb800]/20 text-[#ffb800] text-xs font-semibold">
                  ⚠️ Demo Mode
                </span>
              )}
              <button onClick={loadData} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center gap-2 text-sm font-medium text-white">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync
              </button>
              <Link href="/developer" className="px-4 py-2 rounded-lg bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 transition-colors flex items-center gap-2 text-sm font-medium text-[#00d4ff]">
                <Zap size={14} /> API Keys
              </Link>
            </div>
          </div>

          {error && !isDemoMode && (
             <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center backdrop-blur-md">
               <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
               <h3 className="text-white font-medium mb-1">Telemetry Interrupted</h3>
               <p className="text-red-200/70 text-sm mb-4">{error}</p>
               <button onClick={loadData} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 text-sm font-medium transition-colors">Retry Connection</button>
             </div>
          )}

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* Top Row: AI Insights & Core KPIs */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up animate-delay-1">
              {/* Insights spans 1 */}
              <div className="premium-glass spotlight-card col-span-1 md:col-span-2 lg:col-span-1">
                <AIInsightsPanel overview={overview} />
              </div>
              
              {/* Primary KPIs span 3 */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <EnhancedKPICard 
                  label="Total Requests" 
                  value={overview?.total_requests || 0} 
                  icon={Activity} 
                  color="#00d4ff" 
                  delta={+12.4}
                  sparklineData={usageData.map(d => d.total)}
                />
                <EnhancedKPICard 
                  label="Passed" 
                  value={overview?.successful_verifications || 0} 
                  icon={Shield} 
                  color="#00ff88" 
                  delta={+8.2}
                  sparklineData={usageData.map(d => d.pass)}
                />
                <EnhancedKPICard 
                  label="Spoof Attempts" 
                  value={overview?.spoof_attempts || 0} 
                  icon={AlertTriangle} 
                  color="#ffb800" 
                  delta={-15.3}
                  sparklineData={usageData.map(d => d.spoof)}
                />
                <EnhancedKPICard 
                  label="Success Rate" 
                  value={parseFloat((overview?.success_rate || 0).toFixed(1))}
                  unit="%" 
                  icon={TrendingUp} 
                  color="#7c3aed" 
                  delta={+2.1}
                />
              </div>
            </div>

            {/* Middle Row: Radar, Area Chart, Funnel */}
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up animate-delay-2">
              
              {/* Radar - spans 3 */}
              <div className="premium-glass spotlight-card lg:col-span-3 p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Active Scanning</h3>
                <div className="flex-1 flex items-center justify-center">
                  <SecurityRadar />
                </div>
              </div>

              {/* Area Chart - spans 6 */}
              <div className="premium-glass spotlight-card lg:col-span-6 p-6">
                <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Volume & Velocity (30D)</h3>
                <div className="h-[280px]">
                  {usageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData.slice(-15)}>
                        <defs>
                          <linearGradient id="passGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="spoofGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffb800" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#ffb800" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }} itemStyle={{ fontSize: 13 }} labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }} />
                        <Area type="monotone" dataKey="pass" stroke="#00ff88" strokeWidth={2} fill="url(#passGrad2)" />
                        <Area type="monotone" dataKey="spoof" stroke="#ffb800" strokeWidth={2} fill="url(#spoofGrad2)" />
                        <Area type="monotone" dataKey="fail" stroke="#ff3366" strokeWidth={2} fill="transparent" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">Waiting for telemetry...</div>
                  )}
                </div>
              </div>

              {/* Funnel - spans 3 */}
              <div className="premium-glass spotlight-card lg:col-span-3 p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">Conversion Funnel</h3>
                <VerificationFunnel overview={overview} />
              </div>
            </div>

            {/* Bottom Row: Live Feed & ThreeGlobe */}
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up animate-delay-3">
              
              {/* ThreeGlobe - spans 8 */}
              <div className="premium-glass spotlight-card lg:col-span-8 p-6 relative overflow-hidden flex flex-col min-h-[400px]">
                <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider relative z-10">Global Threat Origins</h3>
                <p className="text-xs text-slate-400 mb-4 relative z-10">Real-time geospatial mapping of spoofing attempts.</p>
                <div className="absolute inset-0 top-16 flex items-center justify-center">
                  <ThreeGlobe />
                </div>
              </div>

              {/* Live Activity Feed - spans 4 */}
              <div className="premium-glass spotlight-card lg:col-span-4 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff] animate-pulse" />
                    Live Activity
                  </h3>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 font-mono">WS Connected</span>
                </div>
                <LiveActivityFeed isDemoMode={isDemoMode} />
              </div>

            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
