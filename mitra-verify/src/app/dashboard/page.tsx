'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  CheckCircle2, ShieldAlert, Activity, Search,
  EyeOff, Clock, Server, Check, Link as LinkIcon, Database, CheckCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';

interface ApiPerf {
  requests: number;
  pass: number;
  fail: number;
  spoof: number;
  faceLost: number;
  totalLatency: number;
}

interface TelemetryData {
  executive_overview: {
    total_verifications: number;
    successful_verifications: number;
    failed_verifications: number;
    spoof_attempts_blocked: number;
    face_lost_events: number;
    avg_processing_time_ms: number;
  };
  api_performance: Record<string, ApiPerf>;
  analytics_chart: any[];
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
}

const PIE_COLORS = ['#00ff88', '#94a3b8', '#ff3366', '#f59e0b']; // Pass, Fail, Spoof, Face Lost
const BAR_COLORS = ['#00E5FF', '#7c3aed', '#00ff88'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table search & filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chart timeframe
  const [timeframe, setTimeframe] = useState('24 Hours');

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
    const interval = setInterval(() => fetchData(), 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      return ev.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
             ev.apiType.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 10); // show only recent 10
  }, [events, searchQuery]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#01081A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { executive_overview, api_performance, analytics_chart } = telemetry || {
    executive_overview: { total_verifications: 0, successful_verifications: 0, failed_verifications: 0, spoof_attempts_blocked: 0, face_lost_events: 0, avg_processing_time_ms: 0 },
    api_performance: {
      Basic: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, totalLatency: 0 },
      Advanced: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, totalLatency: 0 },
      Enterprise: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, totalLatency: 0 }
    },
    analytics_chart: []
  };

  // Pie Chart Data
  const pieData = [
    { name: 'Passed', value: executive_overview.successful_verifications },
    { name: 'Failed', value: executive_overview.failed_verifications - executive_overview.spoof_attempts_blocked - executive_overview.face_lost_events },
    { name: 'Spoof', value: executive_overview.spoof_attempts_blocked },
    { name: 'Face Lost', value: executive_overview.face_lost_events }
  ].filter(d => d.value > 0);
  
  // Ensure we show pie chart even if 0
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1 });

  // Bar Chart Data
  const barData = [
    { 
      name: 'API 1', 
      requests: api_performance['Basic']?.requests || 0,
      fill: BAR_COLORS[0]
    },
    { 
      name: 'API 2', 
      requests: api_performance['Advanced']?.requests || 0,
      fill: BAR_COLORS[1]
    },
    { 
      name: 'API 3', 
      requests: api_performance['Enterprise']?.requests || 0,
      fill: BAR_COLORS[2]
    }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#01081A] font-sans selection:bg-[#00E5FF]/30 text-slate-300">
        <Navbar />

        <main className="pt-32 pb-16 px-6 md:px-12 max-w-[1440px] mx-auto space-y-8">
           
           {/* TOP SECTION: Welcome & Status */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                   Good Morning, {user?.name?.split(' ')[0] || 'Krishna'}
                 </h1>
                 <p className="text-slate-400 text-sm">Monitor all your biometric verification activity in one place.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                All Systems Operational
              </div>
           </div>

           {/* FIRST ROW: 6 KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
             <KpiCard title="Total Verifications" value={executive_overview.total_verifications.toLocaleString()} trend="+12% Today" icon={Activity} />
             <KpiCard title="Successful" value={executive_overview.successful_verifications.toLocaleString()} trend="+14% Today" icon={CheckCircle2} />
             <KpiCard title="Failed" value={(executive_overview.failed_verifications - executive_overview.spoof_attempts_blocked - executive_overview.face_lost_events).toLocaleString()} trend="-2% Today" icon={Server} />
             <KpiCard title="Spoofs Blocked" value={executive_overview.spoof_attempts_blocked.toLocaleString()} trend="+4% Today" icon={ShieldAlert} />
             <KpiCard title="Face Lost" value={executive_overview.face_lost_events.toLocaleString()} trend="-1% Today" icon={EyeOff} />
             <KpiCard title="Avg Verification Time" value={`${executive_overview.avg_processing_time_ms}ms`} trend="-5ms Today" icon={Clock} />
           </div>

           {/* SECOND ROW: Charts */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Left: Verification Trend (Line Chart) */}
             <div className="lg:col-span-2 bg-[#020A1A] border border-white/5 rounded-2xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-semibold text-white">Verification Trend</h3>
                 <div className="flex items-center bg-white/5 rounded-lg p-1">
                    {['24 Hours', '7 Days', '30 Days'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeframe === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
               </div>
               <div className="h-[280px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analytics_chart}>
                     <defs>
                       <linearGradient id="cPass" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/><stop offset="95%" stopColor="#00ff88" stopOpacity={0}/></linearGradient>
                       <linearGradient id="cSpoof" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff3366" stopOpacity={0.2}/><stop offset="95%" stopColor="#ff3366" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
                     <Tooltip contentStyle={{ backgroundColor: '#020A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                     <Area type="monotone" dataKey="pass" name="Success" stroke="#00ff88" fill="url(#cPass)" strokeWidth={2} />
                     <Area type="monotone" dataKey="failed" name="Failed" stroke="#94a3b8" fill="transparent" strokeWidth={2} />
                     <Area type="monotone" dataKey="spoof" name="Spoof" stroke="#ff3366" fill="url(#cSpoof)" strokeWidth={2} />
                     <Area type="monotone" dataKey="faceLost" name="Face Lost" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Right: Verification Results (Donut) */}
             <div className="bg-[#020A1A] border border-white/5 rounded-2xl p-6 flex flex-col">
               <h3 className="text-sm font-semibold text-white mb-6">Verification Results</h3>
               <div className="flex-1 relative flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#020A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{executive_overview.total_verifications.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3 mt-4">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                       <span className="text-xs text-slate-400">{d.name}</span>
                       <span className="text-xs font-semibold text-white ml-auto">{d.value}</span>
                    </div>
                  ))}
               </div>
             </div>
           </div>

           {/* THIRD ROW: API Usage & System Status */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* API Usage */}
              <div className="lg:col-span-2 bg-[#020A1A] border border-white/5 rounded-2xl p-6">
                 <h3 className="text-sm font-semibold text-white mb-6">API Usage</h3>
                 <div className="h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                       <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#e2e8f0', fontWeight: 500 }} width={50} />
                       <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#020A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                       <Bar dataKey="requests" name="Requests" radius={[0, 4, 4, 0]} barSize={24}>
                         {barData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              {/* System Status Card */}
              <div className="bg-[#020A1A] border border-white/5 rounded-2xl p-6">
                 <h3 className="text-sm font-semibold text-white mb-6">System Status</h3>
                 <div className="space-y-4">
                    <StatusItem label="API 1 (Fast)" status="Online" />
                    <StatusItem label="API 2 (Secure)" status="Online" />
                    <StatusItem label="API 3 (Enterprise)" status="Online" />
                    <StatusItem label="Webhook" status="Connected" />
                    <StatusItem label="SDK" status="Connected" />
                    <StatusItem label="Database" status="Healthy" />
                 </div>
              </div>
           </div>

           {/* FOURTH ROW: Recent Verification Activity */}
           <div className="bg-[#020A1A] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <h3 className="text-sm font-semibold text-white">Recent Verification Activity</h3>
                 <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#01081A] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]/50 w-full sm:w-64 transition-colors"
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-[#01081A]/50 text-slate-400">
                       <tr>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">API Used</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Verification ID</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Duration</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {filteredEvents.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">No events found</td>
                         </tr>
                       ) : (
                         filteredEvents.map(ev => (
                           <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-3 text-sm text-slate-400">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</td>
                              <td className="px-6 py-3 text-sm text-white font-medium">{ev.apiType === 'Basic' ? 'API 1' : ev.apiType === 'Advanced' ? 'API 2' : 'API 3'}</td>
                              <td className="px-6 py-3 text-xs font-mono text-slate-500">{ev.id.substring(0, 18)}...</td>
                              <td className="px-6 py-3"><ActivityBadge status={ev.status} spoofFlag={ev.spoofFlag} faceDetectedFlag={ev.faceDetectedFlag} /></td>
                              <td className="px-6 py-3 text-sm text-slate-400">{ev.processingTimeMs}ms</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* FIFTH ROW: API Performance Table */}
           <div className="bg-[#020A1A] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                 <h3 className="text-sm font-semibold text-white">API Performance Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-[#01081A]/50 text-slate-400">
                       <tr>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">API</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Requests</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Passed</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Failed</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Spoof</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Face Lost</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Average Time</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-right">Success Rate</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {['Basic', 'Advanced', 'Enterprise'].map((key, i) => {
                         const perf = api_performance[key] || { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, totalLatency: 0 };
                         const label = key === 'Basic' ? 'API 1' : key === 'Advanced' ? 'API 2' : 'API 3';
                         const avgTime = perf.requests > 0 ? Math.round(perf.totalLatency / perf.requests) : 0;
                         const successRate = perf.requests > 0 ? ((perf.pass / perf.requests) * 100).toFixed(2) : "0.00";
                         
                         return (
                           <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-white flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BAR_COLORS[i] }} />
                                {label}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300 text-right">{perf.requests.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-green-400 text-right">{perf.pass.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-slate-400 text-right">{(perf.fail - perf.spoof - perf.faceLost).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-red-400 text-right">{perf.spoof.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-orange-400 text-right">{perf.faceLost.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-slate-400 text-right">{avgTime}ms</td>
                              <td className="px-6 py-4 text-sm text-white font-semibold text-right">{successRate}%</td>
                           </tr>
                         )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* BOTTOM: Compact Footer */}
           <footer className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs font-medium text-slate-500">
              <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="#" className="hover:text-white transition-colors">API Keys</Link>
              <Link href="#" className="hover:text-white transition-colors">Billing</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500" />
                 System Status
              </div>
           </footer>

        </main>
      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function KpiCard({ title, value, trend, icon: Icon }: { title: string, value: string, trend: string, icon: any }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-[#020A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
       <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
             <Icon size={16} className="text-slate-400" />
          </div>
          <span className="text-xs font-medium text-slate-400">{title}</span>
       </div>
       <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
             {trend}
          </span>
       </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-sm font-medium text-slate-400">{label}</span>
       <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
         <CheckCircle size={14} className="text-green-500" /> {status}
       </div>
    </div>
  );
}

function ActivityBadge({ status, spoofFlag, faceDetectedFlag }: { status: string, spoofFlag: boolean, faceDetectedFlag?: boolean }) {
  if (status === 'VERIFIED' || status === 'IDENTITY MATCHED') {
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#00ff88]/10 text-[#00ff88] text-[11px] font-semibold"><CheckCircle2 size={12}/> Passed</span>;
  }
  if (spoofFlag || status === 'SPOOF ATTEMPT') {
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#ff3366]/10 text-[#ff3366] text-[11px] font-semibold"><ShieldAlert size={12}/> Spoof Detected</span>;
  }
  if (status === 'NO FACE DETECTED' || faceDetectedFlag === false) {
    return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 text-[11px] font-semibold"><EyeOff size={12}/> Face Lost</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-500/10 text-slate-300 text-[11px] font-semibold"><Activity size={12}/> {status}</span>;
}
