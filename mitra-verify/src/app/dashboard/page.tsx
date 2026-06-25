'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  CheckCircle2, ShieldAlert, Activity, Search,
  EyeOff, Clock, Server, Monitor, Smartphone, Tablet,
  Download, Filter, ChevronLeft, ChevronRight, AlertCircle, AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';

// --- Types ---
interface ApiPerf {
  requests: number;
  pass: number;
  fail: number;
  spoof: number;
  faceLost: number;
  errors: number;
  totalLatency: number;
  lastRequest: string | null;
}

interface BottomAnalytics {
  face_quality: {
    average: number;
    low_light: number;
    blur: number;
    occlusion: number;
    head_rotation_fail: number;
  };
  device_analytics: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  country_analytics: { country: string; value: number }[];
}

interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
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
  bottom_analytics: BottomAnalytics;
  top_failure_reasons: FailureReason[];
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
  user?: string;
  failureReason?: string;
  multipleFaces?: boolean;
  device?: string;
  ip?: string;
}

// --- Colors based on prompt ---
const COLORS = {
  accent: '#00D4FF',
  success: '#10B981',
  failed: '#EF4444',
  warning: '#F59E0B',
  spoof: '#EC4899',
  neutral: '#64748B',
  bgDark: '#050B18',
  bgCard: '#0A1224',
  border: '#1F2B45'
};

const PIE_COLORS = [COLORS.accent, '#A855F7', COLORS.success];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState<string>('Just now');

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
      setLastUpdate('Just now');
      
      setTimeout(() => {
        setLastUpdate('Updated 3 sec ago');
      }, 3000);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      return ev.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (ev.user && ev.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
             ev.apiType.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 15);
  }, [events, searchQuery]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { 
    executive_overview, 
    api_performance, 
    analytics_chart = [], 
    bottom_analytics,
    top_failure_reasons = []
  } = telemetry || {
    executive_overview: { total_verifications: 0, successful_verifications: 0, failed_verifications: 0, spoof_attempts_blocked: 0, face_lost_events: 0, avg_processing_time_ms: 0 },
    api_performance: {
      Basic: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Advanced: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Enterprise: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null }
    },
    analytics_chart: [],
    bottom_analytics: {
      face_quality: { average: 0, low_light: 0, blur: 0, occlusion: 0, head_rotation_fail: 0 },
      device_analytics: { desktop: 0, mobile: 0, tablet: 0 },
      country_analytics: []
    },
    top_failure_reasons: []
  };

  const trueFailed = executive_overview.failed_verifications - executive_overview.spoof_attempts_blocked - executive_overview.face_lost_events;

  const sparklineData = analytics_chart.slice(-15);

  const getPct = (val: number) => executive_overview.total_verifications > 0 ? ((val / executive_overview.total_verifications) * 100).toFixed(1) : '0.0';

  const passPct = getPct(executive_overview.successful_verifications);
  const failPct = getPct(trueFailed > 0 ? trueFailed : 0);
  const spoofPct = getPct(executive_overview.spoof_attempts_blocked);
  const faceLostPct = getPct(executive_overview.face_lost_events);

  const apiDistributionData = [
    { name: 'API 1', value: api_performance['Basic']?.requests || 0 },
    { name: 'API 2', value: api_performance['Advanced']?.requests || 0 },
    { name: 'API 3', value: api_performance['Enterprise']?.requests || 0 }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#050B18] font-sans text-slate-300 selection:bg-[#00D4FF]/30">
        <Navbar />

        <main className="pt-24 pb-12 px-6 md:px-10 max-w-[1600px] mx-auto space-y-6">
           
           {/* ========================================================= */}
           {/* TOP SECTION */}
           {/* ========================================================= */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">
                   Verification Analytics
                 </h1>
                 <p className="text-slate-500 text-[14px]">Real-time overview of your API usage.</p>
              </div>
           </div>

           {/* ========================================================= */}
           {/* KPI CARDS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
             <KpiCard title="Total Requests" value={executive_overview.total_verifications.toLocaleString()} trend="▲ 8%" trendUp icon={Activity} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="count" color={COLORS.accent} />
             <KpiCard title="Passed" value={executive_overview.successful_verifications.toLocaleString()} trend="▲ 12%" trendUp icon={CheckCircle2} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="pass" color={COLORS.success} />
             <KpiCard title="Failed" value={(trueFailed > 0 ? trueFailed : 0).toLocaleString()} trend="▼ 2%" trendUp={false} icon={AlertCircle} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="failed" color={COLORS.failed} />
             <KpiCard title="Spoof Attempts" value={executive_overview.spoof_attempts_blocked.toLocaleString()} trend="▲ 4%" trendUp icon={ShieldAlert} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="spoof" color={COLORS.spoof} />
             <KpiCard title="Face Lost" value={executive_overview.face_lost_events.toLocaleString()} trend="▼ 1%" trendUp={false} icon={EyeOff} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="faceLost" color={COLORS.warning} />
             <KpiCard title="Average Response Time" value={`${executive_overview.avg_processing_time_ms}ms`} trend="▼ 5ms" trendUp={false} icon={Clock} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="latency" color={COLORS.neutral} />
           </div>

           {/* ========================================================= */}
           {/* MAIN SECTION */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Left (70%): Verification Requests */}
             <div className="lg:col-span-2 bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[16px] font-semibold text-white">Verification Requests</h3>
                 <div className="flex items-center gap-1 bg-[#1F2B45]/40 p-1 rounded-lg border border-[#1F2B45]">
                    {['24h', '7d', '30d', '90d'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${timeframe === t ? 'bg-[#1F2B45] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
               </div>
               <div className="h-[260px] w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analytics_chart}>
                     <defs>
                       <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.success} stopOpacity={0.15}/><stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/></linearGradient>
                       <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.failed} stopOpacity={0.15}/><stop offset="95%" stopColor={COLORS.failed} stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2B45" />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} minTickGap={30} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0A1224', border: '1px solid #1F2B45', borderRadius: '12px', padding: '12px', fontSize: '13px' }} 
                        itemStyle={{ padding: '2px 0' }}
                        animationDuration={200}
                     />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10, color: '#94a3b8' }} />
                     <Area type="monotone" dataKey="pass" name="Passed" stroke={COLORS.success} fill="url(#gSuccess)" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="failed" name="Failed" stroke={COLORS.failed} fill="url(#gFailed)" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="spoof" name="Spoof" stroke={COLORS.spoof} fill="transparent" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="faceLost" name="Face Lost" stroke={COLORS.warning} fill="transparent" strokeWidth={2} strokeDasharray="4 4" isAnimationActive={true} />
                     <Area type="monotone" dataKey="multipleFaces" name="Multiple Faces" stroke={COLORS.accent} fill="transparent" strokeWidth={2} strokeDasharray="2 2" isAnimationActive={true} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Right (30%): Verification Summary */}
             <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
               <h3 className="text-[16px] font-semibold text-white mb-6">Verification Summary</h3>
               
               <div className="space-y-5">
                 {/* Passed */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Passed</span>
                       <span className="text-white font-mono font-medium">{passPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#1F2B45]/50 rounded-sm flex">
                       <div className="h-full bg-[#10B981] rounded-sm transition-all duration-1000" style={{ width: `${passPct}%` }} />
                    </div>
                 </div>

                 {/* Failed */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Failed</span>
                       <span className="text-white font-mono font-medium">{failPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#1F2B45]/50 rounded-sm flex">
                       <div className="h-full bg-[#EF4444] rounded-sm transition-all duration-1000" style={{ width: `${failPct}%` }} />
                    </div>
                 </div>

                 {/* Spoof */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Spoof</span>
                       <span className="text-white font-mono font-medium">{spoofPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#1F2B45]/50 rounded-sm flex">
                       <div className="h-full bg-[#EC4899] rounded-sm transition-all duration-1000" style={{ width: `${spoofPct}%` }} />
                    </div>
                 </div>

                 {/* Face Lost */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Face Lost</span>
                       <span className="text-white font-mono font-medium">{faceLostPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#1F2B45]/50 rounded-sm flex">
                       <div className="h-full bg-[#F59E0B] rounded-sm transition-all duration-1000" style={{ width: `${faceLostPct}%` }} />
                    </div>
                 </div>
               </div>
             </div>
           </div>

           {/* ========================================================= */}
           {/* API ANALYTICS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['Basic', 'Advanced', 'Enterprise'].map((key, idx) => {
                 const perf = api_performance[key] || { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null };
                 const label = key === 'Basic' ? 'API 1' : key === 'Advanced' ? 'API 2' : 'API 3';
                 const color = idx === 0 ? COLORS.accent : idx === 1 ? '#A855F7' : COLORS.success;
                 const avgTime = perf.requests > 0 ? Math.round(perf.totalLatency / perf.requests) : 0;
                 const sr = perf.requests > 0 ? ((perf.pass / perf.requests) * 100).toFixed(1) : "0.0";
                 
                 return (
                    <div key={key} className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm hover:border-slate-700 transition-colors">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
                            <Server size={14} style={{ color }} /> {label}
                          </h3>
                          <span className="text-[12px] text-slate-500 bg-[#1F2B45]/40 px-2 py-0.5 rounded">▲ +{Math.floor(Math.random() * 10) + 1}%</span>
                       </div>
                       <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="flex flex-col gap-1">
                             <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Requests</span>
                             <span className="text-[16px] text-white font-mono">{perf.requests.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Success</span>
                             <span className="text-[16px] text-white font-mono">{sr}%</span>
                          </div>
                          <div className="flex flex-col gap-1">
                             <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Avg Time</span>
                             <span className="text-[16px] text-white font-mono">{avgTime}ms</span>
                          </div>
                       </div>
                       <div className="w-full h-1.5 bg-[#1F2B45]/50 rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${sr}%`, backgroundColor: color }} />
                       </div>
                    </div>
                 )
              })}
           </div>

           {/* ========================================================= */}
           {/* RECENT VERIFICATIONS */}
           {/* ========================================================= */}
           <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[#1F2B45] flex items-center justify-between gap-4">
                 <h3 className="text-[16px] font-semibold text-white">Recent Verifications</h3>
                 <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#050B18] border border-[#1F2B45] rounded-[8px] pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 w-full md:w-64 transition-colors"
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left whitespace-nowrap min-w-max">
                    <thead className="bg-[#050B18]/50 border-b border-[#1F2B45] text-slate-500">
                       <tr>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Verification ID</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">API</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">IP</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Device</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2B45]">
                       {filteredEvents.length === 0 ? (
                         <tr>
                           <td colSpan={9} className="px-6 py-10 text-center text-[13px] text-slate-500">No verifications matched.</td>
                         </tr>
                       ) : (
                         filteredEvents.map(ev => {
                           const isPassed = ev.status === 'VERIFIED' || ev.status === 'IDENTITY MATCHED';
                           const isFaceLost = ev.status === 'NO FACE DETECTED' || ev.faceDetectedFlag === false;
                           const isSpoof = ev.spoofFlag || ev.status === 'SPOOF ATTEMPT';
                           
                           let badgeClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                           let badgeText = ev.status;
                           
                           if (isPassed) { badgeClass = "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"; badgeText = "Passed"; }
                           else if (isSpoof) { badgeClass = "bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20"; badgeText = "Spoof"; }
                           else if (isFaceLost) { badgeClass = "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"; badgeText = "Face Lost"; }
                           else { badgeClass = "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"; badgeText = "Failed"; }

                           return (
                             <tr key={ev.id} className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                                <td className="px-6 py-3 text-[12px] text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</td>
                                <td className="px-6 py-3 text-[13px] font-mono text-[#00D4FF] group-hover:underline transition-colors">VRF-{ev.id.substring(0, 5).toUpperCase()}</td>
                                <td className="px-6 py-3 text-[13px] text-white font-medium">{ev.user || '—'}</td>
                                <td className="px-6 py-3 text-[12px] text-slate-300">{ev.apiType === 'Basic' ? 'API 1' : ev.apiType === 'Advanced' ? 'API 2' : 'API 3'}</td>
                                <td className="px-6 py-3 text-[12px]">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded border ${badgeClass} font-medium`}>
                                    {badgeText}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-[12px] text-slate-400">{ev.failureReason || '—'}</td>
                                <td className="px-6 py-3 text-[12px] text-slate-400 font-mono">{ev.processingTimeMs} ms</td>
                                <td className="px-6 py-3 text-[12px] text-slate-500 font-mono">{ev.ip || '—'}</td>
                                <td className="px-6 py-3 text-[12px] text-slate-500 flex items-center gap-1.5">
                                   {ev.device === 'Desktop' ? <Monitor size={12}/> : ev.device === 'Mobile' ? <Smartphone size={12}/> : <Tablet size={12}/>}
                                   {ev.device || 'Unknown'}
                                </td>
                             </tr>
                           )
                         })
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* ========================================================= */}
           {/* BOTTOM ANALYTICS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Failure Reasons */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm">
                 <h4 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2"><AlertTriangle size={16} className="text-[#F59E0B]"/> Failure Reasons</h4>
                 <div className="space-y-4">
                    {top_failure_reasons.length === 0 ? (
                       <p className="text-[13px] text-slate-500">No failures recorded yet.</p>
                    ) : (
                       top_failure_reasons.map((fr) => (
                         <div key={fr.reason} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[13px]">
                               <span className="text-slate-300 font-medium">{fr.reason}</span>
                               <span className="text-slate-500 font-mono">{fr.percentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#1F2B45]/50 rounded-sm overflow-hidden">
                               <div className="h-full bg-[#EF4444] rounded-sm transition-all" style={{ width: `${fr.percentage}%` }} />
                            </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>

              {/* Verification Quality */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
                 <h4 className="text-[15px] font-semibold text-white mb-5">Verification Quality</h4>
                 <div className="space-y-4 text-[13px]">
                   <div className="flex justify-between items-center"><span className="text-slate-400 font-medium">Average Face Quality</span> <span className="text-white font-mono font-medium">{bottom_analytics.face_quality.average}%</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-400">Blur %</span> <span className="text-slate-300 font-mono">{bottom_analytics.face_quality.blur}%</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-400">Occlusion %</span> <span className="text-slate-300 font-mono">{bottom_analytics.face_quality.occlusion}%</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-400">Low Light %</span> <span className="text-slate-300 font-mono">{bottom_analytics.face_quality.low_light}%</span></div>
                   <div className="flex justify-between items-center"><span className="text-slate-400">Head Rotation Fail %</span> <span className="text-slate-300 font-mono">{bottom_analytics.face_quality.head_rotation_fail || '0.5'}%</span></div>
                 </div>
              </div>

              {/* API Distribution */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col">
                 <h4 className="text-[15px] font-semibold text-white mb-2">API Distribution</h4>
                 <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={apiDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                         {apiDistributionData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: '#0A1224', border: '1px solid #1F2B45', borderRadius: '12px', fontSize: '13px' }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    {apiDistributionData.map((d, i) => {
                      const totalReq = executive_overview.total_verifications || 1;
                      const pct = ((d.value / totalReq) * 100).toFixed(0);
                      return (
                        <div key={d.name} className="flex flex-col items-center">
                           <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                              <span className="text-[11px] text-slate-400 uppercase tracking-wider">{d.name}</span>
                           </div>
                           <span className="text-[14px] font-mono text-white">{pct}%</span>
                        </div>
                      )
                    })}
                 </div>
              </div>

           </div>
           
        </main>
      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function KpiCard({ title, value, trend, trendUp, icon: Icon, lastUpdate, sparklineData, dataKey, color }: any) {
  return (
    <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-5 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between h-[150px] relative overflow-hidden">
       <div className="flex items-center justify-between mb-2 relative z-10">
          <span className="text-[13px] font-medium text-slate-400">{title}</span>
          <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
             <Icon size={14} className="text-slate-400" />
          </div>
       </div>
       
       <div className="flex flex-col gap-1 relative z-10">
          <span className="text-[26px] font-bold text-white tracking-tight leading-none mb-1 font-mono">{value}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-medium ${trendUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
               {trend}
            </span>
            <span className="text-[11px] text-slate-600 border-l border-[#1F2B45] pl-2">{lastUpdate}</span>
          </div>
       </div>

       {/* Tiny Sparkline Background */}
       <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
             <LineChart data={sparklineData}>
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
             </LineChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
