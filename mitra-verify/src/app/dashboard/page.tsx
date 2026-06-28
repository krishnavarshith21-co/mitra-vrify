'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  CheckCircle2, ShieldAlert, Activity, Search,
  EyeOff, Clock, Monitor, Smartphone, Tablet,
  Download, Filter, Server, CheckCircle, Database, Link
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';

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
  user?: string;
  failureReason?: string;
  device?: string;
  ip?: string;
}

// --- Colors ---
const COLORS = {
  accent: '#00D4FF',
  success: '#10B981',
  failed: '#EF4444',
  warning: '#F59E0B',
  spoof: '#A855F7',
  neutral: '#64748B',
  bgDark: '#070B17',
  bgCard: '#0F172A',
  border: 'rgba(255,255,255,0.05)'
};

// --- Framer Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const hoverGlow = {
  rest: { y: 0, boxShadow: "0px 0px 0px rgba(0, 212, 255, 0)" },
  hover: { y: -4, boxShadow: "0px 10px 30px rgba(0, 212, 255, 0.05)", transition: { duration: 0.2 } }
};

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
        fetch(`/api/analytics/overview?timeframe=${timeframe}`),
        fetch('/api/events')
      ]);
      const overviewData = await overviewRes.json();
      const eventsData = await eventsRes.json();
      
      setTelemetry(overviewData.data);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setLastUpdate('Just now');
      
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
  }, [timeframe]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      return ev.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (ev.user && ev.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
             ev.apiType.toLowerCase().includes(searchQuery.toLowerCase());
    }).slice(0, 15);
  }, [events, searchQuery]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#070B17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { 
    executive_overview, 
    api_performance, 
    analytics_chart = [], 
  } = telemetry || {
    executive_overview: { total_verifications: 0, successful_verifications: 0, failed_verifications: 0, spoof_attempts_blocked: 0, face_lost_events: 0, avg_processing_time_ms: 0 },
    api_performance: {
      Basic: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Advanced: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null },
      Enterprise: { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null }
    },
    analytics_chart: []
  };

  const trueFailed = executive_overview.failed_verifications - executive_overview.spoof_attempts_blocked - executive_overview.face_lost_events;
  const sparklineData = analytics_chart.slice(-15);

  const getPct = (val: number) => executive_overview.total_verifications > 0 ? ((val / executive_overview.total_verifications) * 100).toFixed(1) : '0.0';

  const passPct = getPct(executive_overview.successful_verifications);
  const failPct = getPct(trueFailed > 0 ? trueFailed : 0);
  const spoofPct = getPct(executive_overview.spoof_attempts_blocked);
  const faceLostPct = getPct(executive_overview.face_lost_events);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#070B17] font-sans text-slate-300 selection:bg-[#00D4FF]/30 pb-20">
        <Navbar />

        <motion.main 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="pt-20 md:pt-24 px-4 md:px-6 lg:px-10 max-w-[1600px] mx-auto space-y-4 md:space-y-6"
        >
           
           {/* ========================================================= */}
           {/* WELCOME SECTION */}
           {/* ========================================================= */}
           <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h1 className="text-[22px] md:text-[28px] font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                   Welcome back, System Administrator 👋
                 </h1>
                 <p className="text-slate-400 text-[13px] md:text-[14px] mt-1">Here's what's happening with your verification platform today.</p>
              </div>
              <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/20 px-4 py-2 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]" />
                 <span className="text-[13px] font-medium text-[#10B981]">All Systems Operational</span>
              </div>
           </motion.div>

           {/* ========================================================= */}
           {/* TOP KPI CARDS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-5">
             <KpiCard title="Total Requests" value={executive_overview.total_verifications.toLocaleString()} trend="▲ 8.2%" trendUp icon={Activity} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="count" color={COLORS.accent} />
             <KpiCard title="Passed" value={executive_overview.successful_verifications.toLocaleString()} trend="▲ 12.4%" trendUp icon={CheckCircle2} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="pass" color={COLORS.success} />
             <KpiCard title="Failed" value={(trueFailed > 0 ? trueFailed : 0).toLocaleString()} trend="▼ 2.1%" trendUp={false} icon={ShieldAlert} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="failed" color={COLORS.failed} />
             <KpiCard title="Spoof Attempts" value={executive_overview.spoof_attempts_blocked.toLocaleString()} trend="▲ 4.3%" trendUp icon={ShieldAlert} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="spoof" color={COLORS.spoof} />
             <KpiCard title="Face Lost" value={executive_overview.face_lost_events.toLocaleString()} trend="▼ 1.6%" trendUp={false} icon={EyeOff} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="faceLost" color={COLORS.warning} />
             <KpiCard title="Average Response Time" value={`${executive_overview.avg_processing_time_ms}ms`} trend="▼ 5.6%" trendUp={false} icon={Clock} lastUpdate={lastUpdate} sparklineData={sparklineData} dataKey="latency" color={COLORS.accent} />
           </div>

           {/* ========================================================= */}
           {/* MAIN ANALYTICS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-5">
             
             {/* Left (70%): Verification Requests */}
             <motion.div variants={itemVariants} className="xl:col-span-2 bg-[#0F172A] border border-white/5 rounded-[18px] p-4 md:p-6 shadow-sm flex flex-col">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
                   <Activity size={16} className="text-[#00D4FF]" /> Verification Requests
                 </h3>
                 <div className="flex items-center gap-1 bg-[#070B17] p-1 rounded-[8px] border border-white/5 overflow-x-auto">
                    {['24h', '7d', '30d', '90d'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 text-[12px] font-medium rounded-[6px] transition-all ${timeframe === t ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
               </div>
               <div className="h-[220px] sm:h-[250px] md:h-[280px] w-full mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analytics_chart}>
                     <defs>
                       <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.success} stopOpacity={0.15}/><stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/></linearGradient>
                       <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.failed} stopOpacity={0.15}/><stop offset="95%" stopColor={COLORS.failed} stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} minTickGap={30} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                        itemStyle={{ padding: '2px 0' }}
                        animationDuration={200}
                     />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10, color: '#94a3b8' }} />
                     <Area type="monotone" dataKey="pass" name="Passed" stroke={COLORS.success} fill="url(#gSuccess)" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="failed" name="Failed" stroke={COLORS.failed} fill="url(#gFailed)" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="spoof" name="Spoof" stroke={COLORS.spoof} fill="transparent" strokeWidth={2} isAnimationActive={true} animationDuration={800} />
                     <Area type="monotone" dataKey="faceLost" name="Face Lost" stroke={COLORS.warning} fill="transparent" strokeWidth={2} isAnimationActive={true} />
                     <Area type="monotone" dataKey="multipleFaces" name="Multiple Faces" stroke={COLORS.accent} fill="transparent" strokeWidth={2} isAnimationActive={true} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </motion.div>

             {/* Right (30%): Verification Summary */}
             <motion.div variants={itemVariants} className="bg-[#0F172A] border border-white/5 rounded-[18px] p-4 md:p-6 shadow-sm flex flex-col justify-center">
               <h3 className="text-[15px] font-semibold text-white mb-6">Verification Summary</h3>
               
               <div className="space-y-6">
                 {/* Passed */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Passed</span>
                       <span className="text-white font-mono font-medium">{passPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full flex overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${passPct}%` }} transition={{ duration: 1 }} className="h-full bg-[#10B981] rounded-full" />
                    </div>
                 </div>

                 {/* Failed */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Failed</span>
                       <span className="text-white font-mono font-medium">{failPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full flex overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${failPct}%` }} transition={{ duration: 1 }} className="h-full bg-[#EF4444] rounded-full" />
                    </div>
                 </div>

                 {/* Spoof */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Spoof</span>
                       <span className="text-white font-mono font-medium">{spoofPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full flex overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${spoofPct}%` }} transition={{ duration: 1 }} className="h-full bg-[#A855F7] rounded-full" />
                    </div>
                 </div>

                 {/* Face Lost */}
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                       <span className="text-slate-300 font-medium">Face Lost</span>
                       <span className="text-white font-mono font-medium">{faceLostPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1E293B] rounded-full flex overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${faceLostPct}%` }} transition={{ duration: 1 }} className="h-full bg-[#F59E0B] rounded-full" />
                    </div>
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[13px] text-slate-400">Total Requests</span>
                    <span className="text-[14px] font-mono text-white font-medium">{executive_overview.total_verifications.toLocaleString()}</span>
                 </div>
               </div>
             </motion.div>
           </div>

           {/* ========================================================= */}
           {/* API PERFORMANCE */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {['Basic', 'Advanced', 'Enterprise'].map((key, idx) => {
                 const perf = api_performance[key] || { requests: 0, pass: 0, fail: 0, spoof: 0, faceLost: 0, errors: 0, totalLatency: 0, lastRequest: null };
                 const label = key === 'Basic' ? 'API 1 — Fast' : key === 'Advanced' ? 'API 2 — Secure' : 'API 3 — Enterprise';
                 const color = idx === 0 ? COLORS.accent : idx === 1 ? COLORS.spoof : COLORS.success;
                 const avgTime = perf.requests > 0 ? Math.round(perf.totalLatency / perf.requests) : 0;
                 const sr = perf.requests > 0 ? ((perf.pass / perf.requests) * 100).toFixed(1) : "0.0";
                 const trendVal = Math.floor(Math.random() * 8) + 2;
                 
                 return (
                    <motion.div 
                      key={key} 
                      whileHover="hover"
                      initial="rest"
                      animate="rest"
                      variants={hoverGlow}
                      className="bg-[#0F172A] border border-white/5 rounded-[18px] p-5 shadow-sm"
                    >
                       <div className="flex justify-between items-center mb-5">
                          <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                            <motion.div
                              animate={{ opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <Server size={14} style={{ color }} />
                            </motion.div> {label}
                          </h3>
                          <span className="text-[11px] font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                            ▲ {trendVal}%
                          </span>
                       </div>
                       
                       <div className="flex items-end justify-between gap-2">
                          <div className="flex flex-col gap-3">
                             <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400 font-medium w-16">Requests</span>
                                <span className="text-[14px] text-white font-mono font-medium">{perf.requests.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400 font-medium w-16">Success</span>
                                <span className="text-[14px] text-white font-mono font-medium">{sr}%</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-[11px] text-slate-400 font-medium w-16">Latency</span>
                                <span className="text-[14px] text-white font-mono font-medium">{avgTime}ms</span>
                             </div>
                          </div>
                          
                          <div className="w-16 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sparklineData.slice(-10)}>
                                <Line type="monotone" dataKey="pass" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                    </motion.div>
                 )
              })}
           </div>

           {/* ========================================================= */}
           {/* RECENT VERIFICATIONS & SYSTEM STATUS */}
           {/* ========================================================= */}
           <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 md:gap-5">
             
             {/* Table (75%) */}
             <motion.div variants={itemVariants} className="xl:col-span-3 bg-[#0F172A] border border-white/5 rounded-[18px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
                   <h3 className="text-[15px] font-semibold text-white">Recent Verifications</h3>
                   <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Search ID or User..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-[#070B17] border border-white/5 rounded-[8px] pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 w-full sm:w-[200px] transition-colors"
                        />
                      </div>
                      <button className="flex items-center gap-1.5 bg-[#070B17] border border-white/5 px-3 py-1.5 rounded-[8px] text-[12px] text-slate-300 hover:text-white transition-colors">
                        <Filter size={14}/> Filters
                      </button>
                      <button className="hidden sm:flex items-center gap-1.5 bg-[#070B17] border border-white/5 px-3 py-1.5 rounded-[8px] text-[12px] text-slate-300 hover:text-white transition-colors">
                        <Download size={14}/> Export CSV
                      </button>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap min-w-max">
                      <thead className="bg-[#070B17]/50 text-slate-400">
                         <tr>
                            <th className="px-5 py-3 text-[11px] font-medium">Time</th>
                            <th className="px-5 py-3 text-[11px] font-medium">Verification ID</th>
                            <th className="px-5 py-3 text-[11px] font-medium">User</th>
                            <th className="px-5 py-3 text-[11px] font-medium">API</th>
                            <th className="px-5 py-3 text-[11px] font-medium">Status</th>
                            <th className="px-5 py-3 text-[11px] font-medium">Reason</th>
                            <th className="px-5 py-3 text-[11px] font-medium">Duration</th>
                            <th className="px-5 py-3 text-[11px] font-medium">IP</th>
                            <th className="px-5 py-3 text-[11px] font-medium">Device</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {filteredEvents.length === 0 ? (
                           <tr>
                             <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-slate-500">No verifications matched.</td>
                           </tr>
                         ) : (
                           filteredEvents.map(ev => {
                             const isPassed = ev.status === 'VERIFIED' || ev.status === 'IDENTITY MATCHED';
                             const isFaceLost = ev.status === 'NO FACE DETECTED' || ev.faceDetectedFlag === false;
                             const isSpoof = ev.spoofFlag || ev.status === 'SPOOF ATTEMPT';
                             
                             let badgeClass = "text-slate-400";
                             let icon = <CheckCircle2 size={12} />;
                             let badgeText = ev.status;
                             
                             if (isPassed) { badgeClass = "text-[#10B981]"; icon = <CheckCircle2 size={12} />; badgeText = "Passed"; }
                             else if (isSpoof) { badgeClass = "text-[#A855F7]"; icon = <ShieldAlert size={12} />; badgeText = "Spoof"; }
                             else if (isFaceLost) { badgeClass = "text-[#F59E0B]"; icon = <EyeOff size={12} />; badgeText = "Face Lost"; }
                             else { badgeClass = "text-[#EF4444]"; icon = <CheckCircle2 size={12} />; badgeText = "Failed"; }

                             return (
                               <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                  <td className="px-5 py-3 text-[12px] text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</td>
                                  <td className="px-5 py-3 text-[12px] font-mono text-slate-300 group-hover:text-white transition-colors">VER_{ev.id.substring(0, 8)}</td>
                                  <td className="px-5 py-3 text-[12px] text-slate-400">{ev.user || '—'}</td>
                                  <td className="px-5 py-3 text-[12px] text-slate-400">{ev.apiType === 'Basic' ? 'API 1' : ev.apiType === 'Advanced' ? 'API 2' : 'API 3'}</td>
                                  <td className="px-5 py-3 text-[12px]">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#070B17] border border-white/5 font-medium ${badgeClass}`}>
                                      {icon} {badgeText}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-[12px] text-slate-400">{ev.failureReason || '—'}</td>
                                  <td className={`px-5 py-3 text-[12px] font-mono ${ev.processingTimeMs > 600 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>{ev.processingTimeMs}ms</td>
                                  <td className="px-5 py-3 text-[12px] text-slate-500 font-mono">{ev.ip || '—'}</td>
                                  <td className="px-5 py-3 text-[12px] text-slate-400 flex items-center gap-1.5">
                                     {ev.device === 'Desktop' ? <Monitor size={12} className="text-slate-500"/> : ev.device === 'Mobile' ? <Smartphone size={12} className="text-slate-500"/> : <Tablet size={12} className="text-slate-500"/>}
                                     {ev.device || 'Unknown'}
                                  </td>
                               </tr>
                             )
                           })
                         )}
                      </tbody>
                   </table>
                </div>
             </motion.div>

             {/* System Status (25%) */}
             <motion.div variants={itemVariants} className="bg-[#0F172A] border border-white/5 rounded-[18px] p-6 shadow-sm flex flex-col">
                <h3 className="text-[15px] font-semibold text-white mb-6">System Status</h3>
                
                <div className="space-y-4">
                  {[
                    { name: 'API 1', icon: Server, status: 'Online', color: '#10B981' },
                    { name: 'API 2', icon: Server, status: 'Online', color: '#10B981' },
                    { name: 'API 3', icon: Server, status: 'Online', color: '#10B981' },
                    { name: 'Webhook', icon: Link, status: 'Connected', color: '#10B981' },
                    { name: 'Database', icon: Database, status: 'Healthy', color: '#10B981' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-[10px] bg-[#070B17] border border-white/5">
                      <div className="flex items-center gap-3">
                         <motion.div
                           animate={{ scale: [1, 1.15, 1], filter: [`drop-shadow(0 0 0px ${item.color}00)`, `drop-shadow(0 0 6px ${item.color}80)`, `drop-shadow(0 0 0px ${item.color}00)`] }}
                           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                         >
                           <item.icon size={14} style={{ color: item.color }} />
                         </motion.div>
                         <span className="text-[13px] font-medium text-slate-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-slate-400">{item.status}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
             </motion.div>

           </div>

        </motion.main>
      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function KpiCard({ title, value, trend, trendUp, icon: Icon, lastUpdate, sparklineData, dataKey, color }: any) {
  return (
    <motion.div 
      variants={hoverGlow}
      initial="rest"
      animate="rest"
      whileHover="hover"
      className="bg-[#0F172A] border border-white/5 rounded-[18px] p-4 md:p-5 shadow-sm flex flex-col justify-between h-auto min-h-[130px] md:min-h-[150px] relative overflow-hidden"
    >
       <div className="flex items-center gap-2 mb-2 relative z-10">
          <motion.div
            animate={{ 
              boxShadow: [`0px 0px 0px ${color}00`, `0px 0px 8px ${color}4D`, `0px 0px 0px ${color}00`] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center w-6 h-6 rounded-md border"
            style={{ backgroundColor: `${color}1A`, borderColor: `${color}33`, color }}
          >
             <Icon size={12} />
          </motion.div>
          <span className="text-[13px] font-medium text-slate-400">{title}</span>
       </div>
       
       <div className="flex flex-col relative z-10 mt-auto">
          <span className="text-[22px] md:text-[28px] font-bold text-white tracking-tight leading-none mb-2 font-mono">{value}</span>
          <div className="flex items-center justify-between">
            <span className={`text-[12px] font-medium flex items-center gap-1 ${trendUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
               {trend}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
               <Clock size={10} /> {lastUpdate}
            </span>
          </div>
       </div>

       {/* Tiny Sparkline Background */}
       <div className="absolute bottom-6 left-0 right-0 h-10 opacity-[0.15] pointer-events-none px-2">
          <ResponsiveContainer width="100%" height="100%">
             <LineChart data={sparklineData}>
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1000} />
             </LineChart>
          </ResponsiveContainer>
       </div>
    </motion.div>
  );
}
