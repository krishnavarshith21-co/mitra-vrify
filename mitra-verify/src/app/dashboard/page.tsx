'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  Shield, Users, Activity, Lock, ExternalLink, RefreshCw, Key, 
  BarChart3, Settings, BookOpen, AlertTriangle, Eye, Server,
  CheckCircle, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const usageData = [
  { date: 'Jun 15', pass: 42000, spoof: 1200, fail: 400 },
  { date: 'Jun 16', pass: 45000, spoof: 1500, fail: 600 },
  { date: 'Jun 17', pass: 48000, spoof: 900, fail: 300 },
  { date: 'Jun 18', pass: 52000, spoof: 2100, fail: 800 },
  { date: 'Jun 19', pass: 51000, spoof: 1800, fail: 700 },
  { date: 'Jun 20', pass: 56000, spoof: 2500, fail: 900 },
  { date: 'Jun 21', pass: 61000, spoof: 1100, fail: 400 },
];

const threatData = [
  { time: '10:02', threat: 'Deepfake', count: 12 },
  { time: '10:05', threat: 'Replay', count: 8 },
  { time: '10:08', threat: 'Mask', count: 2 },
  { time: '10:11', threat: 'Print', count: 15 },
  { time: '10:14', threat: 'Deepfake', count: 18 },
  { time: '10:17', threat: 'Replay', count: 5 },
];

const RECENT_ACTIVITY = [
  { id: 'act_1', type: 'verification.passed', user: 'usr_89x12p', time: '2m ago', ip: '192.168.1.1' },
  { id: 'act_2', type: 'verification.failed', user: 'usr_99z41k', time: '12m ago', ip: '10.0.0.5' },
  { id: 'act_3', type: 'spoof.blocked', user: 'unknown', time: '18m ago', ip: '172.16.0.4' },
  { id: 'act_4', type: 'verification.passed', user: 'usr_12a77b', time: '1h ago', ip: '192.168.0.10' },
  { id: 'act_5', type: 'apikey.created', user: 'system', time: '3h ago', ip: '10.0.0.1' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#030712] flex flex-col md:flex-row pt-16">
        
        {/* SIDEBAR (Desktop) */}
        <div className="w-full md:w-64 bg-[#0a0f1e] border-r border-white/5 flex-shrink-0 flex flex-col h-[calc(100vh-64px)] sticky top-16 hidden md:flex">
          <div className="p-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#7c3aed]/20 border border-[#00d4ff]/30 flex items-center justify-center mb-3">
              <Shield size={20} color="#00d4ff" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">Production Environment</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">ID: env_prd_9x81b</p>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-2">Platform</div>
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'logs', label: 'Verification Logs', icon: Server },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === item.id ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <item.icon size={16} /> {item.label}
              </button>
            ))}

            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 mt-6">Developer</div>
            {[
              { id: 'keys', label: 'API Keys', icon: Key },
              { id: 'webhooks', label: 'Webhooks', icon: RefreshCw },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors \${activeTab === item.id ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#00d4ff] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-white truncate">{user?.email || 'admin@company.com'}</div>
                <div className="text-xs text-slate-500 truncate">Enterprise Plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 bg-[#030712] relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00d4ff]/5 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Overview</h1>
                <p className="text-sm text-slate-400 mt-1">Monitor your authentication traffic and security events.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2">
                  <BookOpen size={16} /> View Docs
                </button>
                <button className="px-4 py-2 bg-[#00d4ff] hover:bg-[#00b8e6] rounded-lg text-sm font-bold text-[#030712] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                  <Plus size={16} /> Create Project
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Total API Calls', value: '355,000', trend: '+12.5%', color: '#00d4ff' },
                { label: 'Passed Verifications', value: '342,100', trend: '+14.2%', color: '#00ff88' },
                { label: 'Spoof Attempts', value: '11,240', trend: '-2.4%', color: '#ffb800' },
                { label: 'Average Latency', value: '312ms', trend: '-18ms', color: '#7c3aed' },
              ].map((kpi, i) => (
                <div key={i} className="bg-[#0a0f1e] p-5 rounded-xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors shadow-lg">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-current transition-colors opacity-20" style={{ color: kpi.color }} />
                  <div className="text-xs text-slate-400 font-medium mb-3">{kpi.label}</div>
                  <div className="text-3xl font-bold text-white mb-2">{kpi.value}</div>
                  <div className="text-xs font-mono" style={{ color: kpi.color }}>{kpi.trend}</div>
                </div>
              ))}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Usage Area Chart */}
              <div className="lg:col-span-2 bg-[#0a0f1e] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-white">Verification Volume</h3>
                    <p className="text-xs text-slate-500">Total requests over the last 7 days</p>
                  </div>
                  <div className="text-xs font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-slate-300">
                    Last 7 Days
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorSpoof" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ffb800" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                        <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ fontSize: 13 }} labelStyle={{ color: '#94a3b8', marginBottom: 4 }} />
                        <Area type="monotone" dataKey="pass" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" />
                        <Area type="monotone" dataKey="spoof" stroke="#ffb800" strokeWidth={2} fillOpacity={1} fill="url(#colorSpoof)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Threat Detection Bar Chart */}
              <div className="bg-[#0a0f1e] p-6 rounded-xl border border-white/10 shadow-lg relative">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-white">Threat Vectors</h3>
                    <p className="text-xs text-slate-500">Live spoof detection</p>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={threatData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#030712', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#ff3366" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Row: API Keys & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
              
              {/* API Keys */}
              <div className="bg-[#0a0f1e] rounded-xl border border-white/10 shadow-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h3 className="text-base font-semibold text-white">API Keys</h3>
                  <button className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors">Manage Keys</button>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">Production Key</span>
                          <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">pk_live_**********************8x92</div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-white bg-white/5 rounded-md">Roll Key</button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">Test Key</span>
                          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">Sandbox</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">pk_test_**********************4b11</div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-white bg-white/5 rounded-md">Roll Key</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[#0a0f1e] rounded-xl border border-white/10 shadow-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                  <button className="text-xs font-medium text-[#00d4ff] hover:text-white transition-colors">View All Logs</button>
                </div>
                <div className="p-0">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                      <tr>
                        <th className="px-6 py-3 font-medium">Event</th>
                        <th className="px-6 py-3 font-medium">Target</th>
                        <th className="px-6 py-3 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {RECENT_ACTIVITY.map(act => (
                        <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3 font-mono text-[12px]">
                            {act.type.includes('passed') ? <span className="text-[#00ff88]">■</span> : act.type.includes('failed') ? <span className="text-[#ff3366]">■</span> : <span className="text-[#ffb800]">■</span>} {act.type}
                          </td>
                          <td className="px-6 py-3 font-mono text-[12px] text-slate-400">{act.user}</td>
                          <td className="px-6 py-3 text-right text-xs text-slate-500">{act.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
