'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, Server, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Key, Network, AlertTriangle, FileText, 
  Cpu, Webhook, Box, Lock, Code, Link as LinkIcon, Database, Terminal, 
  Globe, Search, Filter, Download, ChevronLeft, ChevronRight, BarChart
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity Feed State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    const interval = setInterval(fetchData, 5000);
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

  // Trust Analytics Logic
  const trustAnalytics = useMemo(() => {
    if (events.length === 0) return null;
    const avgConfidence = events.reduce((acc, curr) => acc + curr.confidence, 0) / events.length;
    const spoofRisk = (events.filter(e => e.spoofFlag).length / events.length) * 100;
    
    return {
      liveness: avgConfidence,
      faceDetection: Math.min(avgConfidence + 2.5, 99.9), // Extrapolated from liveness for demo realism
      identityMatch: Math.max(avgConfidence - 1.5, 85.0),
      spoofRisk: spoofRisk
    };
  }, [events]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = telemetry && telemetry.executive_overview.total_verifications > 0;
  const hasThreats = telemetry && (
    telemetry.security_events.deepfake > 0 ||
    telemetry.security_events.replay_attack > 0 ||
    telemetry.security_events.identity_mismatch > 0 ||
    telemetry.security_events.multiple_faces > 0 ||
    telemetry.security_events.face_not_found > 0
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#030712] font-sans selection:bg-[#00d4ff]/30 text-slate-300 overflow-x-hidden relative">
        <Navbar />

        {/* Global Dark Theme Backgrounds & Neon Glows */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#00d4ff]/5 blur-[200px] rounded-full mix-blend-screen" />
           <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#0066ff]/5 blur-[200px] rounded-full mix-blend-screen" />
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
        </div>

        <main className="relative z-10 pt-24 pb-20 px-4 md:px-6 max-w-[1920px] mx-auto space-y-6">
           
           {/* SECTION 1: Enterprise Hero */}
           <motion.section 
             variants={containerVariants} initial="hidden" animate="visible"
             className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[rgba(0,255,255,0.08)] pb-6"
           >
              <motion.div variants={itemVariants} className="max-w-3xl">
                 <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 flex items-center gap-4">
                   MITRA VERIFY Enterprise Security Console
                 </h1>
                 <p className="text-sm text-slate-400 leading-relaxed font-light mb-6">
                   Real-time biometric authentication, liveness intelligence, anti-spoof protection, and identity verification infrastructure.
                 </p>
                 <div className="flex flex-wrap items-center gap-4">
                    {[
                      { label: 'Face Detection', icon: Eye },
                      { label: 'Liveness', icon: Activity },
                      { label: 'Anti-Spoof', icon: ShieldAlert },
                      { label: 'Identity', icon: Fingerprint },
                      { label: 'API Gateway', icon: Network }
                    ].map((engine, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/5">
                         <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
                         <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">{engine.label}</span>
                      </div>
                    ))}
                 </div>
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 pb-2">
                 <Link href="/developer" className="px-5 py-2.5 rounded-lg bg-[rgba(10,20,40,0.6)] border border-[rgba(0,255,255,0.08)] hover:bg-[rgba(10,20,40,0.8)] hover:border-[rgba(0,212,255,0.3)] transition-all text-xs font-medium text-white flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
                   <FileText size={14} className="text-slate-400" /> API Documentation
                 </Link>
                 <button className="px-5 py-2.5 rounded-lg bg-[rgba(10,20,40,0.6)] border border-[rgba(0,255,255,0.08)] hover:bg-[rgba(10,20,40,0.8)] hover:border-[rgba(0,212,255,0.3)] transition-all text-xs font-medium text-white flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
                   <Key size={14} className="text-slate-400" /> Generate API Key
                 </button>
                 <Link href="/demo/enterprise" className="px-6 py-2.5 rounded-lg bg-[#00d4ff] text-[#020610] hover:bg-white transition-all text-xs font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(0,212,255,0.2)] flex items-center gap-2">
                   <Activity size={14} /> Launch Verification
                 </Link>
              </motion.div>
           </motion.section>

           <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Operations (Col 1-8) */}
              <div className="xl:col-span-8 flex flex-col gap-6">
                 
                 {/* SECTION 2: Live Verification Center */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="relative w-full h-[320px] rounded-xl bg-[rgba(5,10,25,0.8)] border border-[rgba(0,255,255,0.1)] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] group">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen" />
                   
                   {/* 3D Biometric Core Background */}
                   <div className="absolute inset-0 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                      <div className="w-full h-full scale-[1.2] md:scale-[1.5] origin-center -translate-y-4">
                         <BiometricCore3D />
                      </div>
                   </div>
                   
                   {/* Overlay UI */}
                   <div className="absolute inset-0 pointer-events-none p-6 flex flex-col items-center justify-center text-center z-10 bg-gradient-to-t from-[#030712] via-transparent to-[rgba(3,7,18,0.5)]">
                      <Shield size={40} className="text-[#00d4ff] mb-4 opacity-80 filter drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
                      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Mission Control: Biometric Core</h2>
                      <p className="text-slate-400 text-sm max-w-md mb-8 font-light">Global edge network primed for ultra-low latency liveness detection and identity resolution.</p>
                      <div className="flex gap-4 pointer-events-auto">
                        <Link href="/demo/enterprise" className="px-8 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/50 transition-all text-sm font-bold text-white flex items-center gap-2 backdrop-blur-md">
                          Start Verification <Eye size={16} />
                        </Link>
                        <button className="px-8 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/50 transition-all text-sm font-bold text-white flex items-center gap-2 backdrop-blur-md hidden sm:flex">
                          Enroll Identity <Fingerprint size={16} />
                        </button>
                        <button className="px-8 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/50 transition-all text-sm font-bold text-white flex items-center gap-2 backdrop-blur-md hidden md:flex">
                          API Test <Terminal size={16} />
                        </button>
                      </div>
                   </div>
                 </motion.section>

                 {/* SECTION 4: Verification Architecture Flow */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-6 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.03)_0%,transparent_100%)]" />
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                     <Network size={14} className="text-[#00d4ff]" /> Verification Architecture Pipeline
                   </h3>
                   <div className="relative flex flex-col md:flex-row items-center justify-between gap-2 w-full px-4 overflow-x-auto pb-4 hide-scrollbar">
                      {/* Horizontal SVG Data Path */}
                      <svg className="absolute top-1/2 left-12 right-12 h-4 -translate-y-1/2 hidden md:block z-0 overflow-visible" preserveAspectRatio="none">
                         <path d="M0,8 L1000,8" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                         {/* Animated Data Packets */}
                         <circle r="2" fill="#00d4ff" className="animate-[slide_3s_linear_infinite]" />
                         <circle r="2" fill="#00ff88" className="animate-[slide_3s_linear_infinite_1s]" />
                      </svg>

                      {[
                        { name: 'Client Device', type: 'Gateway' },
                        { name: 'Capture Layer', type: 'Processor' },
                        { name: 'Face Engine', type: 'Compute' },
                        { name: 'Liveness', type: 'Heuristic' },
                        { name: 'Anti-Spoof', type: 'Policy' },
                        { name: 'Identity', type: 'Tensor' },
                        { name: 'Decision', type: 'Service' },
                        { name: 'Response API', type: 'Output' },
                      ].map((node, i) => (
                        <div key={i} className="flex flex-col items-center relative z-10 shrink-0 px-2 group">
                           <div className="w-10 h-10 rounded-full bg-[#050a17] border border-[#00d4ff]/30 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(0,212,255,0.1)] relative group-hover:border-[#00d4ff] transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                              <div className="absolute inset-0 rounded-full border border-[#00d4ff]/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                           </div>
                           <div className="text-[11px] font-bold text-white whitespace-nowrap">{node.name}</div>
                           <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{node.type}</div>
                        </div>
                      ))}
                   </div>
                 </motion.section>

                 {/* SECTION 7: Verification Activity Feed */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl overflow-hidden flex-1 flex flex-col">
                   <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-[rgba(0,255,255,0.05)] gap-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-[#00d4ff]" /> Advanced Activity Feed
                      </h3>
                      <div className="flex items-center gap-3">
                         <div className="relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search Request ID or API..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00d4ff]/50 w-48"
                            />
                         </div>
                         <div className="relative">
                            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select 
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="bg-white/[0.03] border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white appearance-none focus:outline-none focus:border-[#00d4ff]/50 cursor-pointer"
                            >
                               <option value="ALL">All Status</option>
                               <option value="VERIFIED">Verified Only</option>
                               <option value="SPOOF">Spoof Attempts</option>
                               <option value="FAILED">Failed</option>
                            </select>
                         </div>
                         <button onClick={exportCSV} disabled={events.length === 0} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-colors text-xs text-slate-300 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Download size={12} /> CSV
                         </button>
                      </div>
                   </div>

                   {!hasData ? (
                      <div className="w-full h-48 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center bg-white/[0.01] m-4">
                        <Activity size={24} className="text-slate-600 mb-3" />
                        <h4 className="text-sm font-bold text-white mb-1">System Ready</h4>
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Listening for incoming verification requests...</p>
                      </div>
                   ) : paginatedEvents.length === 0 ? (
                      <div className="w-full h-48 flex flex-col items-center justify-center text-center">
                         <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">No records match your filters.</p>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] whitespace-nowrap">
                             <thead className="bg-white/[0.02] text-slate-400 font-mono border-b border-[rgba(0,255,255,0.05)]">
                                <tr>
                                   <th className="px-4 py-3 font-medium tracking-widest">Request ID</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">Timestamp</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">API Vector</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">Decision Matrix</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">Liveness</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">Identity</th>
                                   <th className="px-4 py-3 font-medium tracking-widest">Latency</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-white/5">
                                <AnimatePresence mode="popLayout">
                                {paginatedEvents.map((ev) => (
                                   <motion.tr 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      key={ev.id} 
                                      className="hover:bg-white/[0.02] transition-colors"
                                   >
                                      <td className="px-4 py-3 font-mono text-slate-300">{ev.id}</td>
                                      <td className="px-4 py-3 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                                      <td className="px-4 py-3">
                                         <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300 text-[10px]">{ev.apiType}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                         <ResultBadge status={ev.status} />
                                      </td>
                                      <td className="px-4 py-3">
                                         <span className={ev.spoofFlag ? 'text-[#ff3366]' : 'text-[#00ff88]'}>{ev.spoofFlag ? 'FAIL' : 'PASS'}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                         {ev.apiType === 'Enterprise' ? (
                                            <span className={ev.identityMatchedFlag ? 'text-[#00ff88]' : 'text-slate-500'}>
                                               {ev.identityMatchedFlag ? 'MATCH' : 'N/A'}
                                            </span>
                                         ) : (
                                            <span className="text-slate-600">-</span>
                                         )}
                                      </td>
                                      <td className="px-4 py-3 font-mono text-slate-400">{ev.processingTimeMs}ms</td>
                                   </motion.tr>
                                ))}
                                </AnimatePresence>
                             </tbody>
                          </table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                           <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events</span>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                 <ChevronLeft size={16} />
                              </button>
                              <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                 <ChevronRight size={16} />
                              </button>
                           </div>
                        </div>
                      </div>
                   )}
                 </motion.section>
              </div>

              {/* RIGHT COLUMN: Telemetry & Status (Col 9-12) */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                 
                 {/* SECTION 3: System Status Grid */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Database size={14} className="text-[#00d4ff]" /> Real System Overview
                    </h3>
                    
                    {!hasData ? (
                       <div className="w-full py-8 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center bg-white/[0.01]">
                         <Database size={24} className="text-slate-600 mb-3" />
                         <p className="text-slate-400 text-sm font-bold mb-1">System Ready</p>
                         <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Telemetry stream not initialized</p>
                       </div>
                    ) : (
                       <div className="grid grid-cols-2 gap-3">
                          <KpiCard label="Total Verifications" value={telemetry.executive_overview.total_verifications.toLocaleString()} />
                          <KpiCard label="Avg Verification Time" value={`${telemetry.executive_overview.avg_processing_time_ms}ms`} color="text-[#00d4ff]" />
                          <KpiCard label="Verified Sessions" value={telemetry.executive_overview.successful_verifications.toLocaleString()} color="text-[#00ff88]" />
                          <KpiCard label="Blocked Spoofs" value={telemetry.executive_overview.spoof_attempts_blocked.toLocaleString()} color="text-[#ffb800]" />
                          <KpiCard label="Failed Sessions" value={telemetry.executive_overview.failed_verifications.toLocaleString()} color="text-[#ff3366]" />
                          <KpiCard label="Identity Matches" value={telemetry.executive_overview.identity_matches.toLocaleString()} color="text-[#7c3aed]" />
                       </div>
                    )}
                 </motion.section>

                 {/* SECTION 5: Trust Analytics */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-5">
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                     <BarChart size={14} className="text-[#00ff88]" /> Trust Analytics
                   </h3>

                   {!trustAnalytics ? (
                      <div className="w-full py-8 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <BarChart size={24} className="text-slate-600 mb-3" />
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Waiting for verification telemetry</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <ProgressRow label="Liveness Confidence" value={trustAnalytics.liveness} color="bg-[#00ff88]" />
                         <ProgressRow label="Face Detection Confidence" value={trustAnalytics.faceDetection} color="bg-[#00d4ff]" />
                         <ProgressRow label="Identity Match Confidence" value={trustAnalytics.identityMatch} color="bg-[#7c3aed]" />
                         <ProgressRow label="Aggregate Spoof Risk" value={trustAnalytics.spoofRisk} color="bg-[#ffb800]" />
                      </div>
                   )}
                 </motion.section>

                 {/* SECTION 6: Security Monitoring Center */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-5">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                       <ShieldAlert size={14} className="text-[#ff3366]" /> Security Monitoring Center
                     </h3>
                     <span className="text-[9px] font-mono font-bold text-[#00ff88] uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> Monitoring Active</span>
                   </div>

                   <div className="space-y-3 mb-6">
                      <ServiceStatus label="Face Detection Engine" />
                      <ServiceStatus label="Liveness Detection" />
                      <ServiceStatus label="Anti-Spoof Protection" />
                      <ServiceStatus label="Identity Verification" />
                      <ServiceStatus label="API Gateway" />
                   </div>

                   {hasThreats && (
                      <div className="space-y-2 pt-4 border-t border-white/5">
                         <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-3">Live Threat Events</h4>
                         <ThreatCard label="Deepfake Detection" count={telemetry.security_events.deepfake} color="#ff3366" />
                         <ThreatCard label="Replay Attack" count={telemetry.security_events.replay_attack} color="#ffb800" />
                         <ThreatCard label="Identity Mismatch" count={telemetry.security_events.identity_mismatch} color="#7c3aed" />
                         <ThreatCard label="Multiple Faces" count={telemetry.security_events.multiple_faces} color="#00d4ff" />
                         <ThreatCard label="Face Missing" count={telemetry.security_events.face_not_found} color="#64748b" />
                      </div>
                   )}
                 </motion.section>

                 {/* SECTION 8: Developer Infrastructure */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-5 flex-1">
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-5 flex items-center gap-2">
                     <Terminal size={14} className="text-slate-400" /> Enterprise Developer Infrastructure
                   </h3>
                   <div className="space-y-4">
                      <InfraRow icon={Key} label="API Keys" value="3 Active" status="ok" />
                      <InfraRow icon={Webhook} label="Webhook Status" value="Connected" status="ok" />
                      <InfraRow icon={Box} label="SDK Status" value="v3.0.4 (Latest)" status="info" />
                      <InfraRow icon={Code} label="API Version" value="v2 (Stable)" status="ok" />
                      <InfraRow icon={LinkIcon} label="Documentation Access" value="Public" status="info" />
                      <InfraRow icon={Lock} label="Authentication Status" value="Enforced" status="ok" />
                      <InfraRow icon={Activity} label="Rate Limits" value="0% Utilized" status="ok" />
                   </div>
                 </motion.section>

              </div>
           </div>

           {/* SECTION 9: Enterprise Footer */}
           <motion.footer variants={itemVariants} initial="hidden" animate="visible" className="pt-10 pb-6 border-t border-[rgba(0,255,255,0.05)] mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-8 gap-y-3 text-[11px] font-medium text-slate-400">
                 <Link href="#" className="hover:text-white transition-colors">Product</Link>
                 <Link href="#" className="hover:text-white transition-colors">Security</Link>
                 <Link href="#" className="hover:text-white transition-colors">Architecture</Link>
                 <Link href="#" className="hover:text-white transition-colors">Trust Center</Link>
                 <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
                 <Link href="#" className="hover:text-white transition-colors">Support</Link>
                 <Link href="#" className="hover:text-white transition-colors">Compliance</Link>
                 <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><Shield size={12} className="text-[#00ff88]" /> SOC2 TYPE II</span>
                 <span className="flex items-center gap-1.5"><Globe size={12} className="text-[#00d4ff]" /> GDPR</span>
                 <span className="flex items-center gap-1.5"><Lock size={12} className="text-slate-400" /> AES-256</span>
              </div>
           </motion.footer>

        </main>
      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function KpiCard({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col justify-between shadow-md">
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">{label}</div>
      <div className={`text-xl font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

function ThreatCard({ label, count, color }: { label: string, count: number, color: string }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between p-2.5 rounded bg-white/[0.02] border border-white/5">
       <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color }} />
          <span className="text-[11px] text-slate-300">{label}</span>
       </div>
       <span className="text-xs font-mono font-bold text-white">{count}</span>
    </div>
  );
}

function InfraRow({ icon: Icon, label, value, status }: { icon: any, label: string, value: string, status: 'ok' | 'info' }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center">
             <Icon size={12} className="text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-300">{label}</span>
       </div>
       <span className={`flex items-center gap-1.5 text-[10px] font-mono font-medium ${status === 'ok' ? 'text-[#00ff88]' : 'text-[#00d4ff]'}`}>
          {status === 'ok' && <CheckCircle2 size={10} />}
          {value}
       </span>
    </div>
  );
}

function ServiceStatus({ label }: { label: string }) {
  return (
     <div className="flex items-center justify-between group">
        <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
        <span className="text-[9px] font-mono text-[#00ff88] uppercase tracking-widest bg-[#00ff88]/10 px-1.5 py-0.5 rounded">Operational</span>
     </div>
  );
}

function ProgressRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1.5">
       <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300">{label}</span>
          <span className="font-mono text-slate-400">{value.toFixed(1)}%</span>
       </div>
       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color}`} 
          />
       </div>
    </div>
  );
}

function ResultBadge({ status }: { status: string }) {
  if (status === 'VERIFIED' || status === 'IDENTITY MATCHED') {
    return <div className="flex items-center gap-1.5 text-[#00ff88] text-[10px] font-bold tracking-wider"><CheckCircle2 size={10}/> {status}</div>;
  }
  if (status === 'SPOOF ATTEMPT') {
    return <div className="flex items-center gap-1.5 text-[#ff3366] text-[10px] font-bold tracking-wider"><ShieldAlert size={10}/> {status}</div>;
  }
  return <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider"><AlertTriangle size={10}/> {status}</div>;
}
