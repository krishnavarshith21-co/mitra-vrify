'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Network, AlertTriangle, 
  Lock, Search, Download, ChevronLeft, ChevronRight,
  Crosshair, Zap, Server, Database, Code, GitBranch, Key
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const BiometricCore3D = dynamic(() => import('@/components/BiometricCore3D'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>
});

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface TelemetryData {
  executive_overview: {
    total_verifications: number;
    successful_verifications: number;
    failed_verifications: number;
    spoof_attempts_blocked: number;
    identity_matches: number;
    face_enrollments: number;
    webhook_deliveries: number;
    avg_processing_time_ms: number;
    active_api_keys: number;
  };
  api_usage: Record<string, number>;
  analytics_chart: any[];
  security_events: any;
}

interface VerificationEvent {
  id: string;
  timestamp: string;
  apiType: string;
  status: string;
  confidence: number;
  processingTimeMs: number;
  spoofFlag: boolean;
  faceDetectedFlag?: boolean;
  identityMatchedFlag: boolean;
}

// ─── FRAMER VARIANTS ────────────────────────────────────────────────────────
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const PIE_COLORS = ['#00E5FF', '#7c3aed', '#00ff88'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{time: number, latency: number, throughput: number, pass: number, failed: number, spoof: number}[]>([]);

  // Activity Feed State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  // Biometric Console segmented control
  const [selectedApi, setSelectedApi] = useState<string>('Enterprise');

  const fetchData = async () => {
    try {
      const [overviewRes, eventsRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/events')
      ]);
      const overviewData = await overviewRes.json();
      const eventsData = await eventsRes.json();
      
      setTelemetry(overviewData.data);
      setChartData(overviewData.data.analytics_chart || []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 3000); // Poll real data every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter & Pagination Logic
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      return ev.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
             ev.apiType.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [events, searchQuery]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Biometric Console selected event
  const latestSelectedApiEvent = useMemo(() => {
    return events.find(ev => ev.apiType === selectedApi) || events[0];
  }, [events, selectedApi]);

  const exportCSV = () => {
    const headers = ['ID,Timestamp,API,Status,Liveness Confidence,Processing Time (ms),Spoof Flag,Identity Match Flag\n'];
    const rows = filteredEvents.map(e => 
      `${e.id},${e.timestamp},${e.apiType},${e.status},${e.confidence},${e.processingTimeMs},${e.spoofFlag},${e.identityMatchedFlag}`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification_audit_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#01081A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = telemetry && telemetry.executive_overview.total_verifications > 0;

  // Pie chart data formatting
  const pieData = telemetry ? [
    { name: 'API 1 (Fast)', value: telemetry.api_usage['Basic'] || 0 },
    { name: 'API 2 (Secure)', value: telemetry.api_usage['Advanced'] || 0 },
    { name: 'API 3 (Enterprise)', value: telemetry.api_usage['Enterprise'] || 0 },
  ] : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#01081A] font-sans selection:bg-[#00E5FF]/30 text-slate-300 overflow-x-hidden relative">
        <Navbar />

        {/* Premium Animated Grid Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#00E5FF]/5 blur-[250px] rounded-full mix-blend-screen" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#0066ff]/5 blur-[250px] rounded-full mix-blend-screen" />
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-[1920px] mx-auto space-y-12">
           
           {/* HERO SECTION */}
           <motion.section 
             variants={containerVariants} initial="hidden" animate="visible"
             className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4"
           >
              <motion.div variants={itemVariants} className="max-w-4xl">
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 text-xs font-semibold uppercase tracking-wider mb-6">
                   <Globe size={14} /> Ecosystem Control Center
                 </div>
                 <h1 className="text-5xl md:text-7xl font-semibold text-white tracking-tighter mb-6 flex flex-col gap-2 leading-[1.1]">
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Platform</span>
                   <span>Overview</span>
                 </h1>
                 <p className="text-lg md:text-xl text-slate-400 font-light mb-8 max-w-2xl leading-relaxed">
                   Comprehensive telemetry across all MITRA VERIFY APIs. Monitor high-volume authentication, active anti-spoofing, and zero-trust identity deployments.
                 </p>
              </motion.div>
           </motion.section>

           {/* EXECUTIVE SUMMARY */}
           <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[#010A20]/60 ring-1 ring-white/5 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white tracking-tight mb-8">
                Executive Platform Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-y-8 gap-x-6">
                <SummaryStat label="API 1 Requests" value={telemetry?.api_usage['Basic']?.toLocaleString() || "0"} color="text-white" />
                <SummaryStat label="API 2 Requests" value={telemetry?.api_usage['Advanced']?.toLocaleString() || "0"} color="text-white" />
                <SummaryStat label="API 3 Requests" value={telemetry?.api_usage['Enterprise']?.toLocaleString() || "0"} color="text-[#00E5FF]" />
                <SummaryStat label="Liveness Checks" value={telemetry?.executive_overview.total_verifications.toLocaleString() || "0"} color="text-[#7c3aed]" />
                <SummaryStat label="Face Enrollments" value={telemetry?.executive_overview.face_enrollments.toLocaleString() || "0"} color="text-[#00ff88]" />
                <SummaryStat label="Identity Matches" value={telemetry?.executive_overview.identity_matches.toLocaleString() || "0"} color="text-white" />
                <SummaryStat label="Spoofs Blocked" value={telemetry?.executive_overview.spoof_attempts_blocked.toLocaleString() || "0"} color="text-[#ff3366]" />
                <SummaryStat label="Webhook Deliveries" value={telemetry?.executive_overview.webhook_deliveries.toLocaleString() || "0"} color="text-slate-400" />
              </div>
           </motion.section>

           {/* PLATFORM PRODUCTS CARDS */}
           <motion.section variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <ProductCard 
               name="API 1 – Fast Verification" 
               icon={Zap} color="#00E5FF" 
               features={['Face Detection', 'Basic Liveness', 'Fastest Response', 'High-volume Authentication']}
             />
             <ProductCard 
               name="API 2 – Secure Verification" 
               icon={ShieldAlert} color="#7c3aed" 
               features={['Multi-step Liveness', 'Anti-Spoof Protection', 'Risk Analysis', 'Enterprise Authentication']}
             />
             <ProductCard 
               name="API 3 – Enterprise Identity" 
               icon={Fingerprint} color="#00ff88" 
               features={['Face Enrollment', 'Identity Matching', 'Maximum Security', 'Continuous Verification']}
             />
           </motion.section>

           {/* VERIFICATION SERVICES GRID */}
           <motion.section variants={itemVariants} initial="hidden" animate="visible">
             <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6 ml-2">Modular Verification Services</h3>
             <div className="flex flex-wrap gap-4">
               {['Face Detection', 'Face Recognition', 'Face Enrollment', 'Liveness Detection', 'Anti-Spoof Engine', 'Identity Matching', 'API Gateway', 'Webhooks', 'SDKs', 'Developer Portal'].map(service => (
                 <div key={service} className="px-5 py-3 rounded-xl bg-[#010A20]/40 ring-1 ring-white/5 flex items-center gap-3 text-sm font-medium text-slate-300 hover:ring-[#00E5FF]/30 hover:bg-[#00E5FF]/5 transition-all cursor-default">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
                   {service}
                 </div>
               ))}
             </div>
           </motion.section>

           {/* BRANCHING ARCHITECTURE DIAGRAM */}
           <motion.section variants={itemVariants} initial="hidden" animate="visible" className="py-12 bg-[#010A20]/40 ring-1 ring-white/5 rounded-2xl px-8 backdrop-blur-sm relative overflow-hidden">
             <h3 className="text-sm font-medium text-slate-300 mb-8 flex items-center gap-2">
               <GitBranch size={16} className="text-[#00E5FF]" /> Platform Architecture
             </h3>
             <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative z-10 w-full max-w-5xl mx-auto">
                
                {/* Input Node */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-3">
                    <Eye size={20} className="text-slate-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Camera Input</span>
                </div>

                {/* Arrow / Gateway */}
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent relative hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#010A20] ring-1 ring-[#00E5FF]/30 flex items-center justify-center z-20">
                    <Server size={12} className="text-[#00E5FF]" />
                  </div>
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-[#00E5FF] uppercase tracking-widest whitespace-nowrap">API Gateway</span>
                </div>

                {/* API Nodes */}
                <div className="flex flex-col gap-6">
                  <ApiNode name="API 1 (Fast)" icon={Zap} color="#00E5FF" delay={0} />
                  <ApiNode name="API 2 (Secure)" icon={ShieldAlert} color="#7c3aed" delay={0.5} />
                  <ApiNode name="API 3 (Enterprise)" icon={Fingerprint} color="#00ff88" delay={1} />
                </div>
             </div>
           </motion.section>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: Data & Operations (Col 1-8) */}
              <div className="xl:col-span-8 flex flex-col gap-8">
                 
                 {/* API Usage Analytics */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[#010A20]/60 ring-1 ring-white/5 rounded-2xl p-8 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-8">API Usage Distribution</h3>
                    <div className="flex flex-col md:flex-row items-center gap-12">
                      <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#010A20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                          <span className="text-xs text-slate-500">Total</span>
                          <span className="text-xl font-bold text-white">{telemetry?.executive_overview.total_verifications.toLocaleString() || 0}</span>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-4 w-full">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] ring-1 ring-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                              <span className="text-sm font-medium text-slate-300">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-bold text-white">{d.value.toLocaleString()} req</span>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                {telemetry?.executive_overview.total_verifications ? Math.round((d.value / telemetry.executive_overview.total_verifications) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </motion.section>

                 {/* Real-time Verification Feed */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="flex-1 flex flex-col bg-[#010A20]/60 ring-1 ring-white/5 rounded-2xl backdrop-blur-sm p-8">
                   <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2 mb-2">
                          Live Platform Feed
                        </h3>
                        <p className="text-sm text-slate-400 font-light">Real-time audit log of events across all APIs.</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search ID or API..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white/[0.02] ring-1 ring-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-[#00E5FF]/50 w-56 transition-all"
                            />
                         </div>
                         <button onClick={exportCSV} disabled={events.length === 0} className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 transition-colors text-sm font-medium text-slate-300 flex items-center gap-2 ring-1 ring-white/5">
                            <Download size={14} /> Export
                         </button>
                      </div>
                   </div>

                   {!hasData ? (
                      <div className="w-full h-64 rounded-xl flex flex-col items-center justify-center text-center bg-white/[0.01] ring-1 ring-white/5">
                        <Activity size={32} className="text-slate-600 mb-4 animate-pulse" />
                        <h4 className="text-lg font-medium text-white mb-2">Awaiting Telemetry</h4>
                        <p className="text-slate-500 text-sm font-light">Listening for incoming API requests...</p>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left whitespace-nowrap">
                             <thead className="bg-transparent text-slate-400 border-b border-white/5">
                                <tr>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">Timestamp</th>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">API</th>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">Request ID</th>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">Liveness</th>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">Latency</th>
                                   <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider">Status</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                {paginatedEvents.map((ev) => (
                                   <motion.tr 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0 }}
                                      key={ev.id} 
                                      className="hover:bg-white/[0.02] transition-colors group"
                                   >
                                      <td className="px-4 py-4 text-sm text-slate-400">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}</td>
                                      <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${
                                          ev.apiType === 'Basic' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20' : 
                                          ev.apiType === 'Advanced' ? 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20' : 
                                          'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                                        }`}>
                                          {ev.apiType}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 font-mono text-xs text-slate-300">{ev.id.substring(0, 18)}...</td>
                                      <td className="px-4 py-4">
                                         <div className="flex items-center gap-2">
                                           <div className={`w-1.5 h-1.5 rounded-full ${ev.spoofFlag ? 'bg-[#ff3366]' : 'bg-[#00ff88]'}`} />
                                           <span className="text-sm font-medium text-slate-200">{Math.round(ev.confidence)}%</span>
                                         </div>
                                      </td>
                                      <td className="px-4 py-4 font-mono text-xs text-slate-400">{ev.processingTimeMs}ms</td>
                                      <td className="px-4 py-4">
                                         <ResultBadge status={ev.status} spoofFlag={ev.spoofFlag} />
                                      </td>
                                   </motion.tr>
                                ))}
                                </AnimatePresence>
                             </tbody>
                          </table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="py-4 mt-2 border-t border-white/5 flex items-center justify-between text-sm text-slate-500">
                           <span>{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events</span>
                           <div className="flex gap-2">
                              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
                                 <ChevronLeft size={16} />
                              </button>
                              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors">
                                 <ChevronRight size={16} />
                              </button>
                           </div>
                        </div>
                      </div>
                   )}
                 </motion.section>
              </div>

              {/* RIGHT COLUMN: Biometric Console & Telemetry (Col 9-12) */}
              <div className="xl:col-span-4 flex flex-col gap-8">
                 
                 {/* Mission Control 3D */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="relative w-full h-[300px] rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden ring-1 ring-white/5 group bg-[#010A20]/60 backdrop-blur-sm">
                   <div className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-1000 flex items-center justify-center">
                      <div className="w-full h-full scale-[1.1] origin-center -translate-y-4">
                         <BiometricCore3D />
                      </div>
                   </div>
                   <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-end z-10 bg-gradient-to-t from-[#01081A] via-[#01081A]/40 to-transparent">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00E5FF]/10 text-[#00E5FF]">
                          <Globe size={14} />
                        </div>
                        <h2 className="text-xl font-semibold text-white tracking-tight">Mission Control</h2>
                      </div>
                      <p className="text-slate-400 text-xs max-w-xl font-light">Global edge network primed for ultra-low latency liveness detection.</p>
                   </div>
                 </motion.section>

                 {/* Live Biometric Console */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[#010A20]/60 ring-1 ring-white/5 rounded-2xl p-8 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-8 flex gap-1">
                      <div className="w-1.5 h-4 bg-[#00E5FF] rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                      <div className="w-1.5 h-4 bg-[#00E5FF] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
                      <div className="w-1.5 h-4 bg-[#00E5FF] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s]" />
                    </div>
                    
                    <div className="flex flex-col gap-4 mb-8">
                      <h3 className="text-lg font-semibold text-white tracking-tight">
                         Live Biometric Console
                      </h3>
                      {/* Segmented Control */}
                      <div className="flex items-center bg-white/5 ring-1 ring-white/10 rounded-xl p-1 relative z-10">
                        {['Basic', 'Advanced', 'Enterprise'].map(api => (
                          <button 
                            key={api}
                            onClick={() => setSelectedApi(api)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedApi === api ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                          >
                            {api === 'Basic' ? 'API 1' : api === 'Advanced' ? 'API 2' : 'API 3'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                       <BiometricMetric label="Face Detection" value={latestSelectedApiEvent?.faceDetectedFlag !== false ? "Active" : "Not Found"} status={latestSelectedApiEvent?.faceDetectedFlag !== false ? "good" : "bad"} />
                       <BiometricMetric label="Liveness Confidence" value={`${Math.round(latestSelectedApiEvent?.confidence || 0)}%`} status={(latestSelectedApiEvent?.confidence || 0) > 85 ? "good" : "bad"} />
                       <BiometricMetric label="Spoof Flag" value={latestSelectedApiEvent?.spoofFlag ? "Detected" : "Clean"} status={latestSelectedApiEvent?.spoofFlag ? "bad" : "good"} />
                       <BiometricMetric label="Processing Time" value={`${latestSelectedApiEvent?.processingTimeMs || 0} ms`} status={(latestSelectedApiEvent?.processingTimeMs || 0) < 500 ? "good" : "neutral"} />
                       <BiometricMetric label="Identity Matching" value={latestSelectedApiEvent?.identityMatchedFlag ? "Matched" : (latestSelectedApiEvent?.apiType === "Enterprise" ? "Mismatched" : "N/A")} status={latestSelectedApiEvent?.identityMatchedFlag ? "good" : (latestSelectedApiEvent?.apiType === "Enterprise" ? "bad" : "neutral")} />
                       
                       <div className="pt-6 border-t border-white/10 mt-6 space-y-6">
                         <div className="flex justify-between items-end">
                           <div>
                             <p className="text-sm text-slate-400 mb-1">Target API View</p>
                             <p className="text-3xl font-semibold text-white tracking-tight">{latestSelectedApiEvent?.apiType || selectedApi}</p>
                           </div>
                           <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center animate-[spin_4s_linear_infinite] ${latestSelectedApiEvent?.spoofFlag ? 'border-[#ff3366]/20 border-t-[#ff3366]' : 'border-[#00ff88]/20 border-t-[#00ff88]'}`}>
                             <Shield size={24} className={`${latestSelectedApiEvent?.spoofFlag ? 'text-[#ff3366]' : 'text-[#00ff88]'} animate-[spin_4s_linear_infinite_reverse]`} />
                           </div>
                         </div>

                         <div>
                            <div className="flex justify-between text-sm mb-2">
                               <span className="text-slate-400">Latest Event Risk</span>
                               <span className={latestSelectedApiEvent?.spoofFlag ? "text-[#ff3366] font-medium" : "text-[#00ff88] font-medium"}>{latestSelectedApiEvent?.spoofFlag ? "High Risk" : "Low Risk"}</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                               <div className={`h-full transition-all duration-500 ${latestSelectedApiEvent?.spoofFlag ? 'bg-[#ff3366]' : 'bg-[#00ff88]'}`} style={{ width: latestSelectedApiEvent?.spoofFlag ? '100%' : '5%' }} />
                            </div>
                         </div>
                       </div>
                    </div>
                 </motion.section>

                 {/* Animated Telemetry Charts */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[#010A20]/60 ring-1 ring-white/5 rounded-2xl p-8 backdrop-blur-sm">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-semibold text-white tracking-tight">
                       System Telemetry
                     </h3>
                     <span className="flex items-center gap-2 text-xs font-medium text-[#00ff88] bg-[#00ff88]/10 px-3 py-1 rounded-full border border-[#00ff88]/20">
                       <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" /> Operational
                     </span>
                   </div>

                   <div className="space-y-8">
                     <div>
                       <div className="flex justify-between items-end mb-4">
                         <p className="text-sm text-slate-400">Avg Latency</p>
                         <p className="text-2xl font-semibold text-white tracking-tight">{telemetry?.executive_overview.avg_processing_time_ms || 0} <span className="text-sm text-slate-500">ms</span></p>
                       </div>
                       <div className="h-24 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                             <defs>
                               <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <Tooltip contentStyle={{ backgroundColor: '#010A20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#00E5FF' }} />
                             <Area type="monotone" dataKey="latency" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" isAnimationActive={false} />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between items-end mb-4">
                         <p className="text-sm text-slate-400">Request Throughput</p>
                         <p className="text-2xl font-semibold text-white tracking-tight">{telemetry?.executive_overview.total_verifications.toLocaleString() || 0} <span className="text-sm text-slate-500">req/hr</span></p>
                       </div>
                       <div className="h-24 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                             <defs>
                               <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <Tooltip contentStyle={{ backgroundColor: '#010A20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#7c3aed' }} />
                             <Area type="monotone" dataKey="throughput" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" isAnimationActive={false} />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between items-end mb-4">
                         <p className="text-sm text-slate-400">Verification Results</p>
                       </div>
                       <div className="h-32 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                             <defs>
                               <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                               </linearGradient>
                               <linearGradient id="colorSpoof" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                               </linearGradient>
                               <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <Tooltip contentStyle={{ backgroundColor: '#010A20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                             <Area type="monotone" dataKey="pass" stackId="1" stroke="#00ff88" strokeWidth={1} fillOpacity={1} fill="url(#colorPass)" isAnimationActive={false} name="Passed" />
                             <Area type="monotone" dataKey="failed" stackId="1" stroke="#94a3b8" strokeWidth={1} fillOpacity={1} fill="url(#colorFailed)" isAnimationActive={false} name="Failed" />
                             <Area type="monotone" dataKey="spoof" stackId="1" stroke="#ff3366" strokeWidth={1} fillOpacity={1} fill="url(#colorSpoof)" isAnimationActive={false} name="Spoofed" />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                   </div>
                 </motion.section>

              </div>
           </div>

           {/* SECTION 8: Clean Footer */}
           <motion.footer variants={itemVariants} initial="hidden" animate="visible" className="pt-16 pb-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex gap-8 text-sm font-medium text-slate-500">
                 <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
                 <Link href="#" className="hover:text-white transition-colors">Security</Link>
                 <Link href="#" className="hover:text-white transition-colors">Architecture</Link>
                 <Link href="#" className="hover:text-white transition-colors">Support</Link>
              </div>
              <div className="flex gap-6 text-xs font-mono text-slate-600 uppercase tracking-widest">
                 <span className="flex items-center gap-2"><Shield size={14} className="text-[#00ff88]" /> SOC2 TYPE II</span>
                 <span className="flex items-center gap-2"><Lock size={14} className="text-slate-500" /> AES-256</span>
              </div>
           </motion.footer>

        </main>
      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function SummaryStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function ProductCard({ name, icon: Icon, features, color }: { name: string, icon: any, features: string[], color: string }) {
  return (
    <div className="bg-[#010A20]/40 ring-1 ring-white/5 rounded-2xl p-6 hover:ring-white/10 transition-all flex flex-col group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ color }}>
          <Icon size={20} />
        </div>
        <h3 className="font-semibold text-white">{name}</h3>
      </div>
      <ul className="space-y-3 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color }} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-4 border-t border-white/5">
        <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          View API Docs <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ApiNode({ name, icon: Icon, color, delay }: { name: string, icon: any, color: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4 relative"
    >
      <div className="w-8 h-[2px] bg-white/10 hidden md:block" />
      <div className="px-5 py-3 rounded-xl bg-[#010A20] ring-1 ring-white/10 flex items-center gap-3 shadow-lg min-w-[200px]">
        <Icon size={16} style={{ color }} />
        <span className="text-sm font-medium text-white">{name}</span>
      </div>
    </motion.div>
  );
}

function BiometricMetric({ label, value, status }: { label: string, value: string, status: 'good' | 'neutral' | 'bad' }) {
  const statusColor = status === 'good' ? 'text-[#00ff88] bg-[#00ff88]/10' : status === 'neutral' ? 'text-slate-300 bg-white/10' : 'text-[#ff3366] bg-[#ff3366]/10';
  
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor}`}>
        {value}
      </span>
    </div>
  );
}

function ResultBadge({ status, spoofFlag }: { status: string, spoofFlag: boolean }) {
  if (status === 'VERIFIED' || status === 'IDENTITY MATCHED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 text-xs font-medium">
        <CheckCircle2 size={12}/> Verified
      </span>
    );
  }
  if (status === 'SPOOF ATTEMPT' || spoofFlag) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3366]/10 text-[#ff3366] border border-[#ff3366]/20 text-xs font-medium">
        <ShieldAlert size={12}/> Spoof Detected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-medium">
      <AlertTriangle size={12}/> {status}
    </span>
  );
}
