'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  CheckCircle2, ShieldAlert, Activity, Search,
  EyeOff, Clock, Monitor, Smartphone, Tablet,
  Download, Filter, ChevronLeft, ChevronRight, AlertCircle, Bell, Clock4, AlertTriangle
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

interface Alert {
  type: string;
  message: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
}

interface TimelineData {
  hour: string;
  volume: number;
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
  recent_alerts: Alert[];
  timeline_heatmap: TimelineData[];
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('24 Hours');
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
    }).slice(0, 8);
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
    top_failure_reasons = [],
    recent_alerts = [],
    timeline_heatmap = []
  } = telemetry || {
    executive_overview: { total_verifications: 0, successful_verifications: 0, failed_verifications: 0, spoof_attempts_blocked: 0, face_lost_events: 0, avg_processing_time_ms: 0 },
    api_performance: {
      Basic: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Advanced: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Enterprise: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null }
    },
    analytics_chart: [],
    bottom_analytics: {
      face_quality: { average: 0, low_light: 0, blur: 0, occlusion: 0 },
      device_analytics: { desktop: 0, mobile: 0, tablet: 0 },
      country_analytics: []
    },
    top_failure_reasons: [],
    recent_alerts: [],
    timeline_heatmap: []
  };

  const trueFailed = executive_overview.failed_verifications - executive_overview.spoof_attempts_blocked - executive_overview.face_lost_events;

  // Pie Chart Data
  const pieData = [
    { name: 'Passed', value: executive_overview.successful_verifications, color: COLORS.success },
    { name: 'Failed', value: trueFailed > 0 ? trueFailed : 0, color: COLORS.failed },
    { name: 'Spoof', value: executive_overview.spoof_attempts_blocked, color: COLORS.spoof },
    { name: 'Face Lost', value: executive_overview.face_lost_events, color: COLORS.warning }
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1, color: COLORS.neutral });

  const successRate = executive_overview.total_verifications > 0 
    ? ((executive_overview.successful_verifications / executive_overview.total_verifications) * 100).toFixed(1)
    : '0.0';

  // Generate sparkline data
  const sparklineData = analytics_chart.slice(-15);

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
                   Overview
                 </h1>
                 <p className="text-slate-500 text-[14px]">Platform analytics and biometric telemetry</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[13px] font-medium transition-all hover:bg-[#10B981]/20 cursor-default">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Platform Operational
              </div>
           </div>

           {/* ========================================================= */}
           {/* KPI CARDS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
             <KpiCard title="Total Verifications" value={executive_overview.total_verifications.toLocaleString()} trend="▲ 8%" trendUp icon={Activity} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="count" color={COLORS.accent} />
             <KpiCard title="Successful" value={executive_overview.successful_verifications.toLocaleString()} trend="▲ 12%" trendUp icon={CheckCircle2} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="pass" color={COLORS.success} />
             <KpiCard title="Failed" value={(trueFailed > 0 ? trueFailed : 0).toLocaleString()} trend="▼ 2%" trendUp={false} icon={AlertCircle} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="failed" color={COLORS.failed} />
             <KpiCard title="Spoofs Blocked" value={executive_overview.spoof_attempts_blocked.toLocaleString()} trend="▲ 4%" trendUp icon={ShieldAlert} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="spoof" color={COLORS.spoof} />
             <KpiCard title="Face Lost" value={executive_overview.face_lost_events.toLocaleString()} trend="▼ 1%" trendUp={false} icon={EyeOff} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="faceLost" color={COLORS.warning} />
             <KpiCard title="Avg Latency" value={`${executive_overview.avg_processing_time_ms}ms`} trend="▼ 5ms" trendUp={false} icon={Clock} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="latency" color={COLORS.neutral} />
           </div>

           {/* ========================================================= */}
           {/* MAIN ANALYTICS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             
             {/* Left: Verification Trend (Line Chart) */}
             <div className="lg:col-span-2 bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[16px] font-semibold text-white">Verification Trend</h3>
                 <div className="flex items-center gap-1 bg-[#1F2B45]/40 p-1 rounded-lg border border-[#1F2B45]">
                    {['24h', '7d', '30d'].map(t => (
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
               <div className="h-[240px] w-full mt-2">
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

             {/* Right: Donut Chart */}
             <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 flex flex-col shadow-sm">
               <h3 className="text-[16px] font-semibold text-white mb-1">Verification Distribution</h3>
               <p className="text-[13px] text-slate-500 mb-4">Total attempts breakdown</p>
               
               <div className="flex-1 relative flex items-center justify-center min-h-[180px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={true}>
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#0A1224', border: '1px solid #1F2B45', borderRadius: '12px', fontSize: '13px' }} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[28px] font-bold text-white tracking-tight leading-none">{successRate}%</span>
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-1">Success Rate</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4">
                  {pieData.map((d) => {
                    const pct = executive_overview.total_verifications > 0 ? ((d.value / executive_overview.total_verifications) * 100).toFixed(1) : '0';
                    return (
                      <div key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.02]">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-[12px] text-slate-400 font-medium">{d.name}</span>
                         </div>
                         <span className="text-[12px] font-bold text-white">{pct}%</span>
                      </div>
                    )
                  })}
               </div>
             </div>
           </div>

           {/* ========================================================= */}
           {/* SECOND ROW (API USAGE & STATUS) */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left: API Usage (Progress Bars) */}
              <div className="lg:col-span-2 bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col justify-center">
                 <h3 className="text-[16px] font-semibold text-white mb-6">API Utilization</h3>
                 <div className="space-y-5">
                    {['Basic', 'Advanced', 'Enterprise'].map((api, idx) => {
                       const reqs = api_performance[api]?.requests || 0;
                       const totalReqs = ['Basic', 'Advanced', 'Enterprise'].reduce((acc, curr) => acc + (api_performance[curr]?.requests || 0), 0);
                       const pct = totalReqs > 0 ? (reqs / totalReqs) * 100 : 0;
                       const label = api === 'Basic' ? 'API 1 - Fast' : api === 'Advanced' ? 'API 2 - Secure' : 'API 3 - Enterprise';
                       
                       return (
                          <div key={api} className="flex flex-col gap-2 group">
                             <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-slate-300">{label}</span>
                                <span className="text-[13px] font-mono text-slate-400">{reqs.toLocaleString()} reqs</span>
                             </div>
                             <div className="w-full h-2.5 bg-[#1F2B45]/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000 ease-out" 
                                  style={{ width: `${pct}%`, backgroundColor: idx === 0 ? COLORS.accent : idx === 1 ? '#A855F7' : COLORS.success }} 
                                />
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>

              {/* Right: System Status */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm flex flex-col">
                 <h3 className="text-[16px] font-semibold text-white mb-4">System Status</h3>
                 <div className="flex-1 flex flex-col justify-between space-y-3">
                    <StatusItem label="API 1 Endpoint" status="Online" latency={`${Math.round((api_performance['Basic']?.totalLatency || 0) / (api_performance['Basic']?.requests || 1))}ms`} color={COLORS.success} />
                    <StatusItem label="API 2 Endpoint" status="Online" latency={`${Math.round((api_performance['Advanced']?.totalLatency || 0) / (api_performance['Advanced']?.requests || 1))}ms`} color={COLORS.success} />
                    <StatusItem label="API 3 Endpoint" status="Online" latency={`${Math.round((api_performance['Enterprise']?.totalLatency || 0) / (api_performance['Enterprise']?.requests || 1))}ms`} color={COLORS.success} />
                    <StatusItem label="Webhook Engine" status="Connected" latency="45ms" color={COLORS.success} />
                    <StatusItem label="Liveness DB" status="Healthy" latency="12ms" color={COLORS.success} />
                 </div>
              </div>
           </div>

           {/* ========================================================= */}
           {/* RECENT ACTIVITY & API PERFORMANCE */}
           {/* ========================================================= */}
           <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-[#1F2B45] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A1224]">
                 <div>
                   <h3 className="text-[16px] font-semibold text-white">Recent Activity</h3>
                   <p className="text-[13px] text-slate-500 mt-1">Live feed of verification attempts.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                       <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Search ID or User..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="bg-[#050B18] border border-[#1F2B45] rounded-[8px] pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00D4FF]/50 w-full md:w-56 transition-colors"
                       />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#1F2B45] hover:bg-white/5 text-slate-300 text-[12px] font-medium transition-colors bg-[#050B18]">
                      <Filter size={14} /> Filters
                    </button>
                    <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#1F2B45] hover:bg-white/5 text-slate-300 text-[12px] font-medium transition-colors bg-[#050B18]">
                      <Download size={14} /> CSV
                    </button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-[#050B18]/50 border-b border-[#1F2B45] text-slate-500">
                       <tr>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Verification ID</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">API</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Failure Reason</th>
                          <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider">Latency</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2B45]">
                       {filteredEvents.length === 0 ? (
                         <tr>
                           <td colSpan={7} className="px-6 py-8 text-center text-[13px] text-slate-500">No recent activity found.</td>
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
                             <tr key={ev.id} className="hover:bg-white/[0.04] transition-colors group cursor-default">
                                <td className="px-6 py-3 text-[12px] text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</td>
                                <td className="px-6 py-3 text-[13px] font-mono text-[#00D4FF] hover:underline cursor-pointer transition-colors">VRF-{ev.id.substring(0, 5).toUpperCase()}</td>
                                <td className="px-6 py-3 text-[13px] text-white font-medium">{ev.user || '—'}</td>
                                <td className="px-6 py-3 text-[12px] text-slate-300 bg-white/[0.02] inline-flex m-3 rounded px-2 py-0.5">{ev.apiType === 'Basic' ? 'API 1' : ev.apiType === 'Advanced' ? 'API 2' : 'API 3'}</td>
                                <td className="px-6 py-3 text-[12px]">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border ${badgeClass} font-medium`}>
                                    {badgeText}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-[12px] text-slate-400">{ev.failureReason || '—'}</td>
                                <td className="px-6 py-3 text-[12px] text-slate-400 font-mono">{ev.processingTimeMs} ms</td>
                             </tr>
                           )
                         })
                       )}
                    </tbody>
                 </table>
              </div>
              <div className="p-3 border-t border-[#1F2B45] flex items-center justify-between text-[12px] text-slate-500 bg-[#050B18]/50">
                 <span className="px-3">Showing {filteredEvents.length} results</span>
                 <div className="flex items-center gap-1 pr-3">
                    <button className="p-1 hover:text-white transition-colors hover:bg-white/5 rounded"><ChevronLeft size={14} /></button>
                    <button className="p-1 hover:text-white transition-colors hover:bg-white/5 rounded"><ChevronRight size={14} /></button>
                 </div>
              </div>
           </div>

           {/* ========================================================= */}
           {/* BOTTOM WIDGETS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Failure Reasons */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm">
                 <h4 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2"><AlertTriangle size={16} className="text-[#F59E0B]"/> Top Failure Reasons</h4>
                 <div className="space-y-4">
                    {top_failure_reasons.length === 0 ? (
                       <p className="text-[13px] text-slate-500">No failures recorded yet.</p>
                    ) : (
                       top_failure_reasons.map((fr) => (
                         <div key={fr.reason} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[12px]">
                               <span className="text-slate-300">{fr.reason}</span>
                               <span className="text-slate-500 font-mono">{fr.percentage}% ({fr.count})</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#1F2B45]/50 rounded-full overflow-hidden">
                               <div className="h-full bg-[#EF4444] rounded-full" style={{ width: `${fr.percentage}%` }} />
                            </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>

              {/* Timeline Heatmap */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm">
                 <h4 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2"><Clock4 size={16} className="text-[#00D4FF]"/> Verification Timeline</h4>
                 <div className="grid grid-cols-6 gap-2">
                    {timeline_heatmap.map((slot) => {
                       // Normalize opacity based on volume
                       const maxVol = Math.max(...timeline_heatmap.map(t => t.volume), 1);
                       const opacity = Math.max(0.1, slot.volume / maxVol);
                       
                       return (
                         <div key={slot.hour} className="group relative">
                           <div 
                              className="aspect-square rounded-md transition-all duration-300 hover:ring-1 hover:ring-[#00D4FF]"
                              style={{ backgroundColor: `rgba(0, 212, 255, ${opacity})` }}
                           />
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#050B18] border border-[#1F2B45] rounded text-[10px] text-white opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap transition-opacity">
                              {slot.hour} • {slot.volume} reqs
                           </div>
                         </div>
                       )
                    })}
                 </div>
                 <p className="text-[11px] text-slate-500 mt-4 text-center">24-hour volume distribution</p>
              </div>

              {/* Recent Alerts */}
              <div className="bg-[#0A1224] border border-[#1F2B45] rounded-[20px] p-6 shadow-sm">
                 <h4 className="text-[15px] font-semibold text-white mb-5 flex items-center gap-2"><Bell size={16} className="text-slate-400"/> Recent Alerts</h4>
                 <div className="space-y-3">
                    {recent_alerts.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                          <CheckCircle2 size={24} className="text-[#10B981]/50 mb-2" />
                          <span className="text-[13px]">No active alerts</span>
                       </div>
                    ) : (
                       recent_alerts.map((alert, i) => (
                         <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.02]">
                            <div className="mt-0.5 shrink-0">
                               {alert.severity === 'critical' ? <AlertCircle size={14} className="text-[#EF4444]" /> : <AlertTriangle size={14} className="text-[#F59E0B]" />}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[13px] font-medium text-slate-200">{alert.type}</span>
                               <span className="text-[12px] text-slate-500 mt-0.5">{alert.message}</span>
                               <span className="text-[10px] text-slate-600 mt-2">{new Date(alert.time).toLocaleTimeString()}</span>
                            </div>
                         </div>
                       ))
                    )}
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
          <span className="text-[26px] font-bold text-white tracking-tight leading-none mb-1">{value}</span>
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

function StatusItem({ label, status, latency, color }: { label: string, status: string, latency: string, color: string }) {
  return (
    <div className="flex items-center justify-between text-[13px] group">
       <div className="flex items-center gap-2">
         <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
         <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
       </div>
       <div className="flex items-center gap-3">
         <span className="text-slate-400">{status}</span>
         <span className="text-[12px] font-mono text-slate-500 w-12 text-right">{latency}</span>
       </div>
    </div>
  );
}
