'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, Server, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Clock, Key, Zap, Network, Layers, AlertTriangle, XCircle, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  analytics_chart: Array<{ time: string, verified: number, failed: number, spoof: number }>;
  security_events: {
    deepfake: number;
    replay_attack: number;
    identity_mismatch: number;
    multiple_faces: number;
    face_not_found: number;
  };
  api_usage: {
    Basic: number;
    Advanced: number;
    Enterprise: number;
  };
  audit_logs: Array<{ id: string, timestamp: string, action: string, status: string, ip: string }>;
  system_health: {
    face_detection: string;
    liveness_engine: string;
    anti_spoof_engine: string;
    identity_engine: string;
    api_gateway: string;
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

  if (!mounted) return null;

  const hasData = telemetry && telemetry.executive_overview.total_verifications > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#030712] font-sans selection:bg-[#00d4ff]/30 text-slate-300">
        <Navbar />

        {/* Global Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#00d4ff]/5 blur-[200px] rounded-full mix-blend-screen" />
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_20%,transparent_100%)]" />
        </div>

        <main className="relative z-10 pt-28 pb-20 px-6 md:px-8 max-w-[1600px] mx-auto space-y-8">
           
           {/* Header */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                 <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                   Enterprise Security Console
                   <span className="px-2 py-0.5 rounded-md bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[10px] uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(0,255,136,0.2)]">Live Data</span>
                 </h1>
                 <p className="text-sm text-slate-400 mt-1">Real-time biometric telemetry and identity verification analytics.</p>
              </div>
           </div>

           {loading ? (
             <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
             </div>
           ) : !hasData ? (
             // PREMIUM EMPTY STATE
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-full bg-[#050a17] border border-white/10 flex items-center justify-center mb-8 relative shadow-[0_0_50px_rgba(0,212,255,0.1)]">
                   <div className="absolute inset-0 rounded-full border border-[#00d4ff]/20 animate-ping" />
                   <Activity size={40} className="text-[#00d4ff]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">System Online & Awaiting Telemetry</h2>
                <p className="text-slate-400 max-w-md text-sm leading-relaxed mb-8">
                  The MITRA VERIFY enterprise engines are fully operational. No verification events have been processed in this session yet. Run a test verification to populate the security console.
                </p>
             </div>
           ) : (
             // POPULATED ENTERPRISE DASHBOARD
             <div className="space-y-6">
                
                {/* 1. EXECUTIVE OVERVIEW */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                   <MetricCard label="Total Verifications" value={telemetry.executive_overview.total_verifications.toLocaleString()} />
                   <MetricCard label="Successful" value={telemetry.executive_overview.successful_verifications.toLocaleString()} color="text-[#00ff88]" />
                   <MetricCard label="Failed" value={telemetry.executive_overview.failed_verifications.toLocaleString()} color="text-[#ff3366]" />
                   <MetricCard label="Spoofs Blocked" value={telemetry.executive_overview.spoof_attempts_blocked.toLocaleString()} color="text-[#ffb800]" />
                   <MetricCard label="Identity Matches" value={telemetry.executive_overview.identity_matches.toLocaleString()} color="text-[#7c3aed]" />
                   <MetricCard label="Avg Processing" value={`${telemetry.executive_overview.avg_processing_time_ms}ms`} />
                   <MetricCard label="Active API Keys" value={telemetry.executive_overview.active_api_keys.toString()} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* 2. VERIFICATION ANALYTICS */}
                   <div className="lg:col-span-2 bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                           <Activity size={16} className="text-[#00d4ff]" /> Verification Analytics
                        </h3>
                      </div>
                      <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={telemetry.analytics_chart}>
                               <defs>
                                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                               <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} minTickGap={30} />
                               <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickFormatter={(value) => `${value}`} />
                               <Tooltip 
                                 contentStyle={{ backgroundColor: '#020610', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                                 itemStyle={{ color: '#fff' }}
                               />
                               <Area type="monotone" dataKey="verified" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                               <Area type="monotone" dataKey="failed" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* 3. SECURITY EVENTS */}
                   <div className="bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
                         <ShieldAlert size={16} className="text-[#ff3366]" /> Detected Threats
                      </h3>
                      <div className="space-y-4 flex-1">
                         <ThreatRow label="Deepfake Injection" count={telemetry.security_events.deepfake} color="#ff3366" />
                         <ThreatRow label="Replay Attack" count={telemetry.security_events.replay_attack} color="#ffb800" />
                         <ThreatRow label="Identity Mismatch" count={telemetry.security_events.identity_mismatch} color="#7c3aed" />
                         <ThreatRow label="Multiple Faces" count={telemetry.security_events.multiple_faces} color="#00d4ff" />
                         <ThreatRow label="Face Not Found" count={telemetry.security_events.face_not_found} color="#64748b" />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                   {/* 4. VERIFICATION ACTIVITY TABLE */}
                   <div className="lg:col-span-3 bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                      <div className="p-6 border-b border-white/5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                           <Layers size={16} className="text-[#00d4ff]" /> Recent Activity
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                         <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-white/[0.02] text-slate-400 font-mono">
                               <tr>
                                  <th className="px-6 py-4 font-medium tracking-widest">Verification ID</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">Timestamp</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">API Type</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">Liveness</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">Identity</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">Result</th>
                                  <th className="px-6 py-4 font-medium tracking-widest">Latency</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                               {events.map((ev) => (
                                  <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                                     <td className="px-6 py-4 font-mono text-slate-300">{ev.id}</td>
                                     <td className="px-6 py-4 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                                     <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300">{ev.apiType}</span>
                                     </td>
                                     <td className="px-6 py-4">
                                        <span className={ev.spoofFlag ? 'text-[#ff3366]' : 'text-[#00ff88]'}>{ev.spoofFlag ? 'FAILED' : 'PASS'}</span>
                                     </td>
                                     <td className="px-6 py-4">
                                        {ev.apiType === 'Enterprise' ? (
                                           <span className={ev.identityMatchedFlag ? 'text-[#00ff88]' : 'text-slate-500'}>
                                              {ev.identityMatchedFlag ? 'MATCH' : 'N/A'}
                                           </span>
                                        ) : (
                                           <span className="text-slate-600">-</span>
                                        )}
                                     </td>
                                     <td className="px-6 py-4">
                                        {ev.status === 'VERIFIED' || ev.status === 'IDENTITY MATCHED' ? (
                                           <div className="flex items-center gap-1.5 text-[#00ff88]"><CheckCircle2 size={14}/> {ev.status}</div>
                                        ) : ev.status === 'SPOOF ATTEMPT' ? (
                                           <div className="flex items-center gap-1.5 text-[#ff3366]"><ShieldAlert size={14}/> {ev.status}</div>
                                        ) : (
                                           <div className="flex items-center gap-1.5 text-slate-400"><AlertTriangle size={14}/> {ev.status}</div>
                                        )}
                                     </td>
                                     <td className="px-6 py-4 font-mono text-slate-400">{ev.processingTimeMs}ms</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* RIGHT SIDEBAR (System Health, API Usage, Audit) */}
                   <div className="space-y-6">
                      
                      {/* 5. SYSTEM HEALTH */}
                      <div className="bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
                         <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Server size={16} className="text-[#00ff88]" /> System Health
                         </h3>
                         <div className="space-y-3">
                            <HealthRow label="Face Detection Engine" status={telemetry.system_health.face_detection} />
                            <HealthRow label="Liveness Engine" status={telemetry.system_health.liveness_engine} />
                            <HealthRow label="Anti-Spoof Engine" status={telemetry.system_health.anti_spoof_engine} />
                            <HealthRow label="Identity Engine" status={telemetry.system_health.identity_engine} />
                            <HealthRow label="API Gateway" status={telemetry.system_health.api_gateway} />
                         </div>
                      </div>

                      {/* 6. API USAGE */}
                      <div className="bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
                         <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                            <Network size={16} className="text-[#00d4ff]" /> API Usage
                         </h3>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400">Basic API</span>
                               <span className="font-mono text-white">{telemetry.api_usage.Basic}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-slate-400">Advanced API</span>
                               <span className="font-mono text-white">{telemetry.api_usage.Advanced}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                               <span className="text-[#00d4ff]">Enterprise API</span>
                               <span className="font-mono text-[#00d4ff]">{telemetry.api_usage.Enterprise}</span>
                            </div>
                         </div>
                      </div>

                      {/* 7. AUDIT LOGS */}
                      <div className="bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl">
                         <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-slate-400" /> Audit Logs
                         </h3>
                         <div className="space-y-4">
                            {telemetry.audit_logs.slice(0, 4).map((log) => (
                               <div key={log.id} className="border-l-2 border-white/10 pl-3">
                                  <div className="text-[10px] font-mono text-slate-500 mb-0.5">{new Date(log.timestamp).toLocaleTimeString()} • {log.ip}</div>
                                  <div className="text-xs text-white">{log.action}</div>
                                  <div className={`text-[10px] font-bold uppercase mt-1 ${log.status === 'VERIFIED' || log.status === 'IDENTITY MATCHED' ? 'text-[#00ff88]' : log.status === 'SPOOF ATTEMPT' ? 'text-[#ff3366]' : 'text-slate-400'}`}>
                                     {log.status}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                   </div>
                </div>

             </div>
           )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function MetricCard({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-[#050a17]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">{label}</div>
      <div className={`text-2xl md:text-3xl font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  );
}

function ThreatRow({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
       <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: color, color }} />
          <span className="text-sm text-slate-300">{label}</span>
       </div>
       <span className="font-mono font-bold text-white">{count}</span>
    </div>
  );
}

function HealthRow({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
       <span className="text-slate-400">{label}</span>
       <div className="flex items-center gap-1.5 text-[#00ff88]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
          <span className="text-xs uppercase tracking-widest font-mono">{status}</span>
       </div>
    </div>
  );
}
