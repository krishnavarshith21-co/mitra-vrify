'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Activity, Server, BarChart3, 
  HelpCircle, FileText, ShieldAlert, Globe, Clock, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const CHART_DATA = [
  { time: '00:00', verified: 120, blocked: 12 },
  { time: '02:00', verified: 150, blocked: 18 },
  { time: '04:00', verified: 110, blocked: 8 },
  { time: '06:00', verified: 280, blocked: 35 },
  { time: '08:00', verified: 850, blocked: 120 },
  { time: '10:00', verified: 1200, blocked: 210 },
  { time: '12:00', verified: 1350, blocked: 240 },
  { time: '14:00', verified: 1400, blocked: 260 },
  { time: '16:00', verified: 1150, blocked: 190 },
  { time: '18:00', verified: 900, blocked: 150 },
  { time: '20:00', verified: 600, blocked: 80 },
  { time: '22:00', verified: 350, blocked: 45 },
];

const THREAT_DISTRIBUTION = [
  { type: 'Synthetic Media (Deepfake)', count: 1245, percentage: 45, color: '#ff3366' },
  { type: 'Presentation Attack (2D Screen)', count: 830, percentage: 30, color: '#ffb800' },
  { type: 'Session Replay', count: 415, percentage: 15, color: '#7c3aed' },
  { type: 'Camera Injection', count: 276, percentage: 10, color: '#3b82f6' },
];

const LIVE_EVENTS = [
  { id: 'req_982xPq', time: 'Just now', status: 'verified', score: 0.99, latency: 245, location: 'New York, US', ip: '192.168.**.**' },
  { id: 'req_981mYz', time: '2s ago', status: 'blocked', score: 0.12, latency: 310, location: 'St. Petersburg, RU', ip: '45.132.**.**', reason: 'Deepfake Detected' },
  { id: 'req_980vBc', time: '12s ago', status: 'verified', score: 0.97, latency: 210, location: 'London, UK', ip: '82.165.**.**' },
  { id: 'req_979aRt', time: '15s ago', status: 'verified', score: 0.98, latency: 195, location: 'Frankfurt, DE', ip: '144.76.**.**' },
  { id: 'req_978fGh', time: '21s ago', status: 'blocked', score: 0.34, latency: 280, location: 'Unknown Proxy', ip: '104.28.**.**', reason: 'Presentation Attack' },
  { id: 'req_977kLm', time: '28s ago', status: 'verified', score: 0.99, latency: 220, location: 'Tokyo, JP', ip: '133.200.**.**' },
];

// Custom Tooltip for Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050a17]/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-white text-xs font-bold mb-2">{label}</p>
        <div className="space-y-1 text-xs">
          <p className="text-[#00d4ff]">
            Verified: <span className="font-mono">{payload[0].value}</span>
          </p>
          <p className="text-[#ff3366]">
            Blocked: <span className="font-mono">{payload[1].value}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-[#020813] flex flex-col relative overflow-hidden pt-20">
        
        {/* Global Dashboard Background Layers */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#00d4ff]/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#7c3aed]/10 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full relative z-10">
          <div className="p-6 md:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  Enterprise Security Command Center
                </h1>
                <p className="text-sm text-slate-400 mt-2 font-light max-w-2xl">
                  Real-time threat monitoring and biometric telemetry across global edge nodes.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/developer" className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center gap-2">
                  <FileText size={16} /> API Docs
                </Link>
                <Link href="/demo/enterprise" className="px-5 py-2.5 bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:brightness-110 rounded-xl text-[13px] font-bold text-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                  <Activity size={16} /> Live Demo
                </Link>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Verified Identities (24h)', value: '1.2M+', trend: '+12.4%', good: true, icon: CheckCircle2, color: '#00d4ff' },
                { label: 'Fraud Attempts Blocked', value: '45,291', trend: '+4.1%', good: false, icon: ShieldAlert, color: '#ff3366' },
                { label: 'Average Trust Score', value: '99.4%', trend: '+0.2%', good: true, icon: Activity, color: '#00ff88' },
                { label: 'Global Edge Latency', value: '24ms', trend: '-2ms', good: true, icon: Globe, color: '#7c3aed' },
              ].map((kpi, i) => (
                <div key={i} className="relative p-5 rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 hover:border-white/10 transition-colors group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom right, ${kpi.color}, transparent)` }} />
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                      <kpi.icon size={18} color={kpi.color} />
                    </div>
                    <span className={`text-[11px] font-bold tracking-wider px-2 py-1 rounded bg-white/[0.03] border border-white/5 ${kpi.good ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl font-bold text-white tracking-tight mb-1">{kpi.value}</div>
                    <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold">{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts & Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Chart */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Verification Volume</h3>
                    <p className="text-xs text-slate-500 mt-1">Total requests vs. blocked threats across all zones.</p>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="verified" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                      <Area type="monotone" dataKey="blocked" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Threat Intelligence Distribution */}
              <div className="p-6 rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 h-[400px] flex flex-col">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#ffb800]" /> Threat Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Blocked vectors breakdown.</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-5">
                  {THREAT_DISTRIBUTION.map((threat, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[13px] text-white font-medium">{threat.type}</span>
                        <div className="text-right">
                          <span className="text-[13px] font-mono text-white">{threat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${threat.percentage}%`, 
                            backgroundColor: threat.color,
                            boxShadow: `0 0 10px ${threat.color}80`
                          }} 
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">{threat.count.toLocaleString()} mitigations</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Operations Feed */}
            <div className="rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-[#00d4ff]" /> Live Security Operations
                </h3>
                <span className="flex items-center gap-2 text-[11px] font-mono text-[#00ff88] bg-[#00ff88]/10 px-2 py-1 rounded border border-[#00ff88]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> Live Stream
                </span>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] text-slate-500 uppercase tracking-widest font-semibold bg-white/[0.01]">
                      <th className="p-4 font-medium">Request ID</th>
                      <th className="p-4 font-medium">Time</th>
                      <th className="p-4 font-medium">Location / IP</th>
                      <th className="p-4 font-medium">Confidence</th>
                      <th className="p-4 font-medium">Latency</th>
                      <th className="p-4 font-medium text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {LIVE_EVENTS.map((event, i) => (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 font-mono text-slate-300">{event.id}</td>
                        <td className="p-4 text-slate-400 flex items-center gap-1.5"><Clock size={14} className="opacity-50" /> {event.time}</td>
                        <td className="p-4">
                          <div className="text-white">{event.location}</div>
                          <div className="text-[11px] font-mono text-slate-500">{event.ip}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white">{(event.score * 100).toFixed(1)}%</span>
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${event.score * 100}%`, backgroundColor: event.status === 'verified' ? '#00d4ff' : '#ff3366' }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-400">{event.latency}ms</td>
                        <td className="p-4 text-right">
                          {event.status === 'verified' ? (
                            <span className="inline-flex items-center gap-1.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex flex-col items-end gap-0.5">
                              <span className="inline-flex items-center gap-1.5 bg-[#ff3366]/10 text-[#ff3366] border border-[#ff3366]/20 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">
                                <XCircle size={12} /> Blocked
                              </span>
                              <span className="text-[10px] text-slate-500 tracking-wider uppercase mt-1">{event.reason}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
