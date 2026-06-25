'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Key, Network, AlertTriangle, FileText, 
  Cpu, Webhook, Box, Lock, Code, Link as LinkIcon, Terminal, 
  Globe, Search, Filter, Download, ChevronLeft, ChevronRight,
  Crosshair, Zap
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
    avg_processing_time_ms: number;
    active_api_keys: number;
  };
  security_events: {
    deepfake: number;
    replay_attack: number;
    identity_mismatch: number;
    multiple_faces: number;
    face_not_found: number;
  };
}

interface VerificationEvent {
  id: string;
  timestamp: string;
  apiType: string;
  status: string;
  confidence: number;
  processingTimeMs: number;
  spoofFlag: boolean;
  identityMatchedFlag: boolean;
}

// ─── FRAMER VARIANTS ────────────────────────────────────────────────────────
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } // Premium easing
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{time: number, latency: number, throughput: number}[]>([]);

  // Activity Feed State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Slightly less to give more whitespace

  const fetchData = async () => {
    try {
      const [overviewRes, eventsRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/events')
      ]);
      const overviewData = await overviewRes.json();
      const eventsData = await eventsRes.json();
      
      setTelemetry(overviewData.data);
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
    // Generate initial chart data
    const initialChart = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      latency: 80 + Math.random() * 40,
      throughput: 500 + Math.random() * 200,
    }));
    setChartData(initialChart);

    const interval = setInterval(() => {
      fetchData();
      // Update chart data smoothly
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          latency: 80 + Math.random() * 40,
          throughput: 500 + Math.random() * 200,
        });
        return newData;
      });
    }, 3000); // Faster polling for "live" feel
    return () => clearInterval(interval);
  }, []);

  // Filter & Pagination Logic
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ev.apiType.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'VERIFIED') matchesStatus = !ev.spoofFlag && ev.status === 'VERIFIED';
      if (statusFilter === 'SPOOF') matchesStatus = ev.spoofFlag;
      if (statusFilter === 'FAILED') matchesStatus = ev.status === 'FAILED';
      
      return matchesSearch && matchesStatus;
    });
  }, [events, searchQuery, statusFilter]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

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
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = telemetry && telemetry.executive_overview.total_verifications > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#02040a] font-sans selection:bg-[#00d4ff]/30 text-slate-300 overflow-x-hidden relative">
        <Navbar />

        {/* Premium Animated Grid Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#00d4ff]/5 blur-[250px] rounded-full mix-blend-screen" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#0066ff]/5 blur-[250px] rounded-full mix-blend-screen" />
           
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-[1920px] mx-auto space-y-12">
           
           {/* SECTION 1: Premium Hero */}
           <motion.section 
             variants={containerVariants} initial="hidden" animate="visible"
             className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-8"
           >
              <motion.div variants={itemVariants} className="max-w-4xl">
                 <h1 className="text-5xl md:text-7xl font-semibold text-white tracking-tighter mb-6 flex flex-col gap-2 leading-[1.1]">
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Enterprise</span>
                   <span>Security Console</span>
                 </h1>
                 <p className="text-lg md:text-xl text-slate-400 font-light mb-8 max-w-2xl leading-relaxed">
                   Real-time biometric authentication, zero-trust liveness intelligence, and identity verification infrastructure.
                 </p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pb-2">
                 {/* Only one primary CTA */}
                 <Link href="/demo/enterprise" className="px-8 py-4 rounded-xl bg-[#00d4ff] text-[#020610] hover:bg-white hover:scale-105 transition-all text-sm font-bold tracking-wide shadow-[0_0_40px_rgba(0,212,255,0.3)] flex items-center gap-2 group">
                   Launch Verification <Activity size={16} className="group-hover:animate-pulse" />
                 </Link>
                 
                 {/* Ghost Buttons */}
                 <button className="px-6 py-4 rounded-xl bg-transparent hover:bg-white/5 transition-all text-sm font-medium text-slate-300 flex items-center gap-2">
                   <Key size={16} className="text-slate-400" /> API Keys
                 </button>
                 <Link href="/developer" className="px-6 py-4 rounded-xl bg-transparent hover:bg-white/5 transition-all text-sm font-medium text-slate-300 flex items-center gap-2">
                   <FileText size={16} className="text-slate-400" /> Docs
                 </Link>
              </motion.div>
           </motion.section>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: Operations (Col 1-8) */}
              <div className="xl:col-span-8 flex flex-col gap-8">
                 
                 {/* SECTION 2: Live Verification Center (Cleaner, no heavy borders) */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="relative w-full h-[400px] rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden ring-1 ring-white/5 group">
                   
                   {/* 3D Biometric Core Background */}
                   <div className="absolute inset-0 z-0 opacity-60 group-hover:opacity-100 transition-opacity duration-1000 flex items-center justify-center">
                      <div className="w-full h-full scale-[1.3] origin-center -translate-y-8">
                         <BiometricCore3D />
                      </div>
                   </div>
                   
                   {/* Overlay UI */}
                   <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-end z-10 bg-gradient-to-t from-[#02040a] via-[#02040a]/40 to-transparent">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00d4ff]/10 text-[#00d4ff]">
                          <Shield size={16} />
                        </div>
                        <h2 className="text-3xl font-semibold text-white tracking-tight">Mission Control</h2>
                      </div>
                      <p className="text-slate-400 text-base max-w-xl font-light">Global edge network primed for ultra-low latency liveness detection and identity resolution.</p>
                   </div>
                 </motion.section>

                 {/* SECTION 3: Animated Verification Pipeline */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="py-8">
                   <h3 className="text-sm font-medium text-slate-300 mb-8 flex items-center gap-2">
                     <Network size={16} className="text-[#00d4ff]" /> Live Verification Pipeline
                   </h3>
                   <div className="relative flex items-center justify-between w-full px-4">
                      {/* Flowing animated line */}
                      <svg className="absolute top-1/2 left-10 right-10 h-6 -translate-y-1/2 z-0 overflow-visible w-[calc(100%-80px)]" preserveAspectRatio="none">
                         <path d="M0,12 L2000,12" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
                         {/* Animated Particles */}
                         <motion.circle 
                           r="3" fill="#00d4ff" 
                           animate={{ cx: ["0%", "100%"] }} 
                           transition={{ duration: 3, ease: "linear", repeat: Infinity }} 
                           cy="12" className="shadow-[0_0_10px_#00d4ff]"
                         />
                         <motion.circle 
                           r="3" fill="#00ff88" 
                           animate={{ cx: ["0%", "100%"] }} 
                           transition={{ duration: 3, ease: "linear", repeat: Infinity, delay: 1.5 }} 
                           cy="12" className="shadow-[0_0_10px_#00ff88]"
                         />
                      </svg>

                      {[
                        { name: 'Camera', icon: Eye },
                        { name: 'Face Mesh', icon: Crosshair },
                        { name: 'Liveness', icon: Activity },
                        { name: 'Anti-Spoof', icon: ShieldAlert },
                        { name: 'Identity', icon: Fingerprint },
                        { name: 'Decision', icon: Zap },
                      ].map((node, i) => (
                        <div key={i} className="flex flex-col items-center relative z-10 group">
                           <div className="w-12 h-12 rounded-2xl bg-[#0a0d14] ring-1 ring-white/10 flex items-center justify-center mb-4 group-hover:ring-[#00d4ff]/50 transition-all group-hover:-translate-y-1 shadow-lg bg-clip-padding backdrop-filter backdrop-blur-xl">
                              <node.icon size={18} className="text-slate-400 group-hover:text-[#00d4ff] transition-colors" />
                           </div>
                           <div className="text-sm font-medium text-slate-200">{node.name}</div>
                        </div>
                      ))}
                   </div>
                 </motion.section>

                 {/* SECTION 4: Real-time Verification Feed */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="flex-1 flex flex-col">
                   <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2 mb-2">
                          Live Verification Feed
                        </h3>
                        <p className="text-sm text-slate-400 font-light">Real-time audit log of API events and identity decisions.</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search ID..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white/[0.02] ring-1 ring-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-[#00d4ff]/50 w-56 transition-all"
                            />
                         </div>
                         <button onClick={exportCSV} disabled={events.length === 0} className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 transition-colors text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Download size={14} /> Export
                         </button>
                      </div>
                   </div>

                   {!hasData ? (
                      <div className="w-full h-64 rounded-2xl flex flex-col items-center justify-center text-center bg-white/[0.01] ring-1 ring-white/5">
                        <Activity size={32} className="text-slate-600 mb-4 animate-pulse" />
                        <h4 className="text-lg font-medium text-white mb-2">Awaiting Telemetry</h4>
                        <p className="text-slate-500 text-sm font-light">Listening for incoming verification requests...</p>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col bg-white/[0.01] rounded-2xl ring-1 ring-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left whitespace-nowrap">
                             <thead className="bg-transparent text-slate-400 border-b border-white/5">
                                <tr>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Timestamp</th>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Request ID</th>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Liveness</th>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Identity</th>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Latency</th>
                                   <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider">Status</th>
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
                                      <td className="px-6 py-4 text-sm text-slate-400">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}</td>
                                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{ev.id.substring(0, 18)}...</td>
                                      <td className="px-6 py-4">
                                         <div className="flex items-center gap-2">
                                           <div className={`w-1.5 h-1.5 rounded-full ${ev.spoofFlag ? 'bg-[#ff3366]' : 'bg-[#00ff88]'}`} />
                                           <span className="text-sm font-medium text-slate-200">{Math.round(ev.confidence)}%</span>
                                         </div>
                                      </td>
                                      <td className="px-6 py-4">
                                         {ev.apiType === 'Enterprise' ? (
                                            <span className={`text-sm font-medium ${ev.identityMatchedFlag ? 'text-slate-200' : 'text-slate-500'}`}>
                                               {ev.identityMatchedFlag ? 'Matched' : 'N/A'}
                                            </span>
                                         ) : (
                                            <span className="text-slate-600">-</span>
                                         )}
                                      </td>
                                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{ev.processingTimeMs}ms</td>
                                      <td className="px-6 py-4">
                                         <ResultBadge status={ev.status} spoofFlag={ev.spoofFlag} />
                                      </td>
                                   </motion.tr>
                                ))}
                                </AnimatePresence>
                             </tbody>
                          </table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-500 bg-[#02040a]/50">
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
                 
                 {/* SECTION 5: Live Biometric Console */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-gradient-to-b from-white/[0.03] to-transparent ring-1 ring-white/10 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 flex gap-1">
                      <div className="w-1.5 h-4 bg-[#00d4ff] rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                      <div className="w-1.5 h-4 bg-[#00d4ff] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
                      <div className="w-1.5 h-4 bg-[#00d4ff] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s]" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-8">
                       Live Biometric Console
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                       <BiometricMetric label="Face Detection" value="Active" status="good" />
                       <BiometricMetric label="Landmark Tracking" value="478 points" status="good" />
                       <BiometricMetric label="Blink Detection" value="Natural" status="good" />
                       <BiometricMetric label="Head Rotation" value="Yaw 2° / Pitch -1°" status="neutral" />
                       <BiometricMetric label="Texture Analysis" value="Organic" status="good" />
                       
                       <div className="pt-6 border-t border-white/10 mt-6 space-y-6">
                         <div className="flex justify-between items-end">
                           <div>
                             <p className="text-sm text-slate-400 mb-1">Confidence Score</p>
                             <p className="text-4xl font-semibold text-white tracking-tighter">99.8<span className="text-xl text-slate-500">%</span></p>
                           </div>
                           <div className="w-16 h-16 rounded-full border-4 border-[#00ff88]/20 border-t-[#00ff88] flex items-center justify-center animate-[spin_4s_linear_infinite]">
                             <Shield size={24} className="text-[#00ff88] animate-[spin_4s_linear_infinite_reverse]" />
                           </div>
                         </div>

                         <div>
                            <div className="flex justify-between text-sm mb-2">
                               <span className="text-slate-400">Risk Assessment</span>
                               <span className="text-[#00ff88] font-medium">Low Risk</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                               <div className="h-full w-[5%] bg-[#00ff88]" />
                            </div>
                         </div>
                       </div>
                    </div>
                 </motion.section>

                 {/* SECTION 6: Animated Telemetry Charts */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-white/[0.01] ring-1 ring-white/5 rounded-2xl p-8">
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
                                 <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <Tooltip contentStyle={{ backgroundColor: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#00d4ff' }} />
                             <Area type="monotone" dataKey="latency" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" isAnimationActive={false} />
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
                             <Tooltip contentStyle={{ backgroundColor: '#0a0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#7c3aed' }} />
                             <Area type="monotone" dataKey="throughput" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" isAnimationActive={false} />
                           </AreaChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                   </div>
                 </motion.section>

                 {/* SECTION 7: Executive Summary */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-white/[0.01] ring-1 ring-white/5 rounded-2xl p-8">
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-6">
                      Executive Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <SummaryStat label="Verified Sessions" value={telemetry?.executive_overview.successful_verifications.toLocaleString() || "0"} color="text-white" />
                      <SummaryStat label="Blocked Spoofs" value={telemetry?.executive_overview.spoof_attempts_blocked.toLocaleString() || "0"} color="text-[#00d4ff]" />
                      <SummaryStat label="Identity Matches" value={telemetry?.executive_overview.identity_matches.toLocaleString() || "0"} color="text-[#7c3aed]" />
                      <SummaryStat label="Failed Sessions" value={telemetry?.executive_overview.failed_verifications.toLocaleString() || "0"} color="text-slate-500" />
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

function SummaryStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
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
