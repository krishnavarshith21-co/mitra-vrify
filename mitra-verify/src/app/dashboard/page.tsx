'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, Server, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Key, Network, AlertTriangle, FileText, 
  Cpu, Webhook, Box, Lock, Code, Link as LinkIcon, Database, Terminal, 
  Globe
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

  const fetchData = async () => {
    try {
      const [overviewRes, eventsRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/events')
      ]);
      const overviewData = await overviewRes.json();
      const eventsData = await eventsRes.json();
      
      setTelemetry(overviewData.data);
      setEvents(Array.isArray(eventsData) ? eventsData.slice(0, 15) : []);
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

        <main className="relative z-10 pt-24 pb-20 px-4 md:px-6 max-w-[1920px] mx-auto space-y-4">
           
           {/* SECTION 1: Enterprise Header */}
           <motion.section 
             variants={containerVariants} initial="hidden" animate="visible"
             className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[rgba(0,255,255,0.08)] pb-4"
           >
              <motion.div variants={itemVariants} className="max-w-3xl">
                 <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                   Enterprise Security Console
                   <span className="px-2 py-0.5 rounded bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[9px] uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(0,255,136,0.2)]">SOC Active</span>
                 </h1>
                 <p className="text-xs text-slate-400 leading-relaxed font-light">
                   Real-time biometric authentication, identity assurance, anti-spoof intelligence, and verification infrastructure monitoring.
                 </p>
              </motion.div>
              <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
                 <Link href="/developer" className="px-4 py-2 rounded-lg bg-[rgba(10,20,40,0.6)] border border-[rgba(0,255,255,0.08)] hover:bg-[rgba(10,20,40,0.8)] hover:border-[rgba(0,212,255,0.3)] transition-all text-xs font-medium text-white flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
                   <FileText size={14} className="text-slate-400" /> API Documentation
                 </Link>
                 <button className="px-4 py-2 rounded-lg bg-[rgba(10,20,40,0.6)] border border-[rgba(0,255,255,0.08)] hover:bg-[rgba(10,20,40,0.8)] hover:border-[rgba(0,212,255,0.3)] transition-all text-xs font-medium text-white flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
                   <Key size={14} className="text-slate-400" /> Generate Key
                 </button>
                 <Link href="/demo/enterprise" className="px-5 py-2 rounded-lg bg-[#00d4ff] text-[#020610] hover:bg-white transition-all text-xs font-bold uppercase tracking-wider shadow-[0_0_30px_rgba(0,212,255,0.2)] flex items-center gap-2">
                   <Activity size={14} /> Launch Verification
                 </Link>
              </motion.div>
           </motion.section>

           {/* Dense SOC Layout Grid */}
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              
              {/* LEFT COLUMN: Operations (Col 1-8) */}
              <div className="xl:col-span-8 flex flex-col gap-4">
                 
                 {/* SECTION 8: Live Verification Module Centerpiece */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="relative w-full h-[280px] rounded-xl bg-[rgba(5,10,25,0.8)] border border-[rgba(0,255,255,0.1)] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] group">
                   {/* Scanner Animation Background */}
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen" />
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#00d4ff]/30 rounded-full animate-[spin_10s_linear_infinite]" />
                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-[#00d4ff]/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                   <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#00d4ff]/50 shadow-[0_0_20px_#00d4ff] animate-[scan_3s_ease-in-out_infinite]" style={{ transformOrigin: 'center' }} />
                   
                   {/* Overlay UI */}
                   <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center z-10 bg-gradient-to-t from-[#030712] via-transparent to-transparent">
                      <Shield size={36} className="text-[#00d4ff] mb-3 opacity-80 filter drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
                      <h2 className="text-xl font-bold text-white mb-1">Live Biometric Command Center</h2>
                      <p className="text-slate-400 text-xs max-w-sm mb-6">Enterprise-grade liveness detection and facial recognition deployed instantaneously via the MITRA global edge network.</p>
                      <div className="flex gap-3">
                        <Link href="/demo/enterprise" className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/50 transition-all text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md">
                          Start Verification <Eye size={14} />
                        </Link>
                        <button className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d4ff]/50 transition-all text-xs font-bold text-white flex items-center gap-2 backdrop-blur-md">
                          Enroll Identity <Fingerprint size={14} />
                        </button>
                      </div>
                   </div>
                 </motion.section>

                 {/* SECTION 3: Verification Architecture */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-4 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.03)_0%,transparent_100%)]" />
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Network size={14} className="text-[#00d4ff]" /> Verification Architecture
                   </h3>
                   <div className="relative flex flex-col md:flex-row items-center justify-between gap-2 w-full px-2 overflow-x-auto pb-2 hide-scrollbar">
                      {/* Horizontal Line Connector */}
                      <div className="absolute top-1/2 left-8 right-8 h-[1px] bg-white/10 -translate-y-1/2 hidden md:block z-0" />
                      
                      {/* Animated Particle on Line */}
                      <div className="absolute top-1/2 left-8 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent -translate-y-1/2 hidden md:block z-0 animate-[shimmer_3s_infinite_linear]" style={{ backgroundSize: '200% 100%' }} />

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
                        <div key={i} className="flex flex-col items-center relative z-10 shrink-0 px-2">
                           <div className="w-8 h-8 rounded-full bg-[#050a17] border border-[#00d4ff]/30 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(0,212,255,0.1)] relative">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                              <div className="absolute inset-0 rounded-full border border-[#00d4ff]/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                           </div>
                           <div className="text-[10px] font-bold text-white whitespace-nowrap">{node.name}</div>
                           <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{node.type}</div>
                        </div>
                      ))}
                   </div>
                 </motion.section>

                 {/* SECTION 5: Verification Activity Feed */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl overflow-hidden flex-1 flex flex-col">
                   <div className="flex items-center justify-between p-4 border-b border-[rgba(0,255,255,0.05)]">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} className="text-[#00d4ff]" /> Live Activity Feed
                      </h3>
                   </div>

                   {!hasData ? (
                      <div className="w-full h-48 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center bg-white/[0.01] m-4">
                        <Activity size={24} className="text-slate-600 mb-2" />
                        <h4 className="text-sm font-bold text-white mb-1">No Verification Activity Recorded Yet</h4>
                        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Awaiting connections to edge nodes</p>
                      </div>
                   ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-[11px] whitespace-nowrap">
                           <thead className="bg-white/[0.02] text-slate-400 font-mono border-b border-[rgba(0,255,255,0.05)]">
                              <tr>
                                 <th className="px-4 py-2 font-medium tracking-widest">Request ID</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">Timestamp</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">API</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">Decision</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">Liveness</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">Identity</th>
                                 <th className="px-4 py-2 font-medium tracking-widest">Latency</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {events.map((ev) => (
                                 <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
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
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   )}
                 </motion.section>
              </div>

              {/* RIGHT COLUMN: Telemetry & Status (Col 9-12) */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                 
                 {/* SECTION 2: System Status Grid */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Server size={14} className="text-[#00ff88]" /> System Readiness
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                       {[
                         { label: 'Face Detection', icon: Eye },
                         { label: 'MediaPipe Engine', icon: Cpu },
                         { label: 'Liveness Engine', icon: Activity },
                         { label: 'Anti-Spoofing', icon: ShieldAlert },
                         { label: 'Identity Engine', icon: Fingerprint },
                         { label: 'API Gateway', icon: Network },
                       ].map((sys, i) => (
                         <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 flex items-center justify-between group hover:border-[#00ff88]/30 transition-colors">
                           <div className="flex items-center gap-2">
                              <sys.icon size={12} className="text-slate-400 group-hover:text-white transition-colors" />
                              <span className="text-[10px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{sys.label}</span>
                           </div>
                           <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
                         </div>
                       ))}
                    </div>
                 </motion.section>

                 {/* SECTION 4: Real System Overview (KPIs) */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Database size={14} className="text-[#00d4ff]" /> Global Telemetry
                    </h3>
                    
                    {!hasData ? (
                       <div className="w-full py-6 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center bg-white/[0.01]">
                         <Database size={20} className="text-slate-600 mb-2" />
                         <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">No Telemetry Recorded</p>
                       </div>
                    ) : (
                       <div className="grid grid-cols-2 gap-2">
                          <KpiCard label="Total Ops" value={telemetry.executive_overview.total_verifications.toLocaleString()} />
                          <KpiCard label="Avg Latency" value={`${telemetry.executive_overview.avg_processing_time_ms}ms`} color="text-[#00d4ff]" />
                          <KpiCard label="Verified" value={telemetry.executive_overview.successful_verifications.toLocaleString()} color="text-[#00ff88]" />
                          <KpiCard label="Blocked" value={telemetry.executive_overview.spoof_attempts_blocked.toLocaleString()} color="text-[#ffb800]" />
                       </div>
                    )}
                 </motion.section>

                 {/* SECTION 6: Security Event Center */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-4 flex-1">
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                     <ShieldAlert size={14} className="text-[#ff3366]" /> Threat Intelligence
                   </h3>

                   {!hasThreats ? (
                      <div className="w-full py-6 border border-dashed border-[#00ff88]/20 rounded-lg flex flex-col items-center justify-center text-center bg-[#00ff88]/5">
                        <CheckCircle2 size={20} className="text-[#00ff88] mb-2" />
                        <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest px-4">Security monitoring active. No threat events detected.</p>
                      </div>
                   ) : (
                      <div className="space-y-2">
                         <ThreatCard label="Deepfake Injection" count={telemetry.security_events.deepfake} color="#ff3366" />
                         <ThreatCard label="Replay Attack" count={telemetry.security_events.replay_attack} color="#ffb800" />
                         <ThreatCard label="Identity Mismatch" count={telemetry.security_events.identity_mismatch} color="#7c3aed" />
                         <ThreatCard label="Multiple Faces" count={telemetry.security_events.multiple_faces} color="#00d4ff" />
                         <ThreatCard label="Face Missing" count={telemetry.security_events.face_not_found} color="#64748b" />
                      </div>
                   )}
                 </motion.section>

                 {/* SECTION 7: Developer Infrastructure */}
                 <motion.section variants={itemVariants} initial="hidden" animate="visible" className="bg-[rgba(10,20,40,0.6)] backdrop-blur-md border border-[rgba(0,255,255,0.08)] rounded-xl p-4">
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Terminal size={14} className="text-slate-400" /> Infrastructure
                   </h3>
                   <div className="space-y-3">
                      <InfraRow icon={Key} label="API Keys" value="3 Active" status="ok" />
                      <InfraRow icon={Webhook} label="Webhooks" value="Connected" status="ok" />
                      <InfraRow icon={Box} label="SDK Version" value="v3.0.4" status="info" />
                      <InfraRow icon={Code} label="API Version" value="v2 (Stable)" status="ok" />
                      <InfraRow icon={Activity} label="Rate Limits" value="0% Utilized" status="ok" />
                   </div>
                 </motion.section>

              </div>
           </div>

           {/* Compliance & Security Footer */}
           <motion.footer variants={itemVariants} initial="hidden" animate="visible" className="pt-8 border-t border-[rgba(0,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                 <span className="flex items-center gap-1.5"><Shield size={12} className="text-slate-400" /> SOC2 TYPE II</span>
                 <span className="flex items-center gap-1.5"><Globe size={12} className="text-slate-400" /> GDPR COMPLIANT</span>
                 <span className="flex items-center gap-1.5"><Lock size={12} className="text-slate-400" /> AES-256 ENCRYPTION</span>
              </div>
              <div className="flex items-center gap-4">
                 <span>MITRA VERIFY CORE v3.0.0</span>
                 <span>LATENCY: &lt;50ms</span>
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
      <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-1">{label}</div>
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
       <span className={`text-[10px] font-mono font-medium ${status === 'ok' ? 'text-[#00ff88]' : 'text-[#00d4ff]'}`}>{value}</span>
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
