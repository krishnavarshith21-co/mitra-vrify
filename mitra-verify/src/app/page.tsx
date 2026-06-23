'use client';

import { Suspense, lazy, Component, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Server, FileText, Globe, CheckCircle2, Terminal, Cpu, Database, Eye, Zap, ShieldAlert, Code } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

const HeroScene = lazy(() => import('@/components/3d/HeroScene'));
class HeroSceneErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: Error) { console.warn('[HeroScene] 3D render failed silently:', error.message); }
  render() {
    if (this.state.crashed) {
      return <div className="absolute inset-0 bg-[#020813] border border-white/5 rounded-2xl flex items-center justify-center text-slate-500 font-mono text-sm">Preview Unavailable</div>;
    }
    return this.props.children;
  }
}

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#020813] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white relative">
      <Navbar />

      {/* Global Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#00d4ff]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#7c3aed]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto space-y-24">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-[11px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            System API v2.4 Operational
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Enterprise Face Liveness & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#0066ff]">
              Identity Verification
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl leading-relaxed">
            Deploy production-grade computer vision models at the edge. Prevent presentation attacks, detect synthetic media, and verify identities with a unified API.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/demo/enterprise" className="px-8 py-3.5 bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:brightness-110 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2">
              <Activity size={18} /> Request Demo
            </Link>
            <Link href="/developer" className="px-8 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
              <FileText size={18} /> Read Documentation
            </Link>
          </div>
        </section>

        {/* PLATFORM STATUS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'System Readiness', value: 'Operational', icon: CheckCircle2, color: '#00ff88' },
            { label: 'API Uptime', value: '99.99%', icon: Activity, color: '#00d4ff' },
            { label: 'Edge Network', value: '12 Regions', icon: Globe, color: '#7c3aed' },
            { label: 'Engine Version', value: 'v2.4.1-stable', icon: Server, color: '#ffb800' },
          ].map((status, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${status.color}15`, border: `1px solid ${status.color}30` }}>
                <status.icon size={20} color={status.color} />
              </div>
              <div>
                <div className="text-[12px] text-slate-400 uppercase tracking-wider font-semibold mb-1">{status.label}</div>
                <div className="text-lg font-bold text-white tracking-tight">{status.value}</div>
              </div>
            </div>
          ))}
        </section>

        {/* VERIFICATION ARCHITECTURE FLOW */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Verification Architecture</h2>
            <p className="text-sm text-slate-400 font-light">
              Our multi-layered engine processes raw video streams through specialized neural networks to ensure absolute authenticity before identity matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#050a17]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:border-[#7c3aed]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center mb-6"><Eye size={24} className="text-[#7c3aed]" /></div>
              <h3 className="text-white font-bold text-lg mb-3">1. MediaPipe Face Mesh</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Extracts 478 3D facial landmarks in real-time, calculating precise head pose, gaze vectors, and facial geometry geometry.
              </p>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">Module Active</div>
            </div>

            <div className="bg-[#050a17]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:border-[#00d4ff]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center mb-6"><Zap size={24} className="text-[#00d4ff]" /></div>
              <h3 className="text-white font-bold text-lg mb-3">2. Liveness Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Analyzes temporal micro-expressions, blink cadence, and texture consistency to guarantee physical presence.
              </p>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">Module Active</div>
            </div>

            <div className="bg-[#050a17]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden group hover:border-[#ff3366]/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center mb-6"><ShieldAlert size={24} className="text-[#ff3366]" /></div>
              <h3 className="text-white font-bold text-lg mb-3">3. Anti-Spoofing AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Identifies presentation attacks (2D/3D masks, screens) and deepfake/synthetic media injection vectors.
              </p>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t border-white/5 pt-4">Module Active</div>
            </div>
          </div>
        </section>

        {/* LIVE PRODUCT PREVIEW PANEL & ENTERPRISE API MODULES */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Enterprise API Modules</h2>
              <p className="text-sm text-slate-400 font-light mb-8">
                Integrate robust verification capabilities into your existing stack using our RESTful endpoints and drop-in SDKs.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                { title: 'Core Verification API', icon: Terminal, desc: 'REST endpoints for stateless frame analysis and identity matching.' },
                { title: 'Continuous Auth SDK', icon: Cpu, desc: 'Drop-in WebAssembly modules for client-side persistence.' },
                { title: 'Identity Directory', icon: Database, desc: 'Secure, encrypted storage for registered biometric templates.' },
              ].map((module, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-white/[0.05] flex items-center justify-center text-white"><module.icon size={18} /></div>
                  <div>
                    <h4 className="text-white font-bold text-[15px] mb-1">{module.title}</h4>
                    <p className="text-slate-400 text-xs">{module.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Link href="/developer" className="inline-flex items-center gap-2 text-[#00d4ff] text-sm font-bold hover:text-white transition-colors">
                Explore API Reference &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-[#050a17]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden h-[500px] relative flex flex-col shadow-2xl">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-[#ff3366]" />
                 <span className="w-2.5 h-2.5 rounded-full bg-[#ffb800]" />
                 <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88]" />
               </div>
               <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Live Engine Preview</div>
               <div className="w-16"></div> {/* Spacer for centering */}
            </div>
            <div className="flex-1 relative bg-[#020610]">
               {mounted && (
                 <HeroSceneErrorBoundary>
                   <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>}>
                     <HeroScene />
                   </Suspense>
                 </HeroSceneErrorBoundary>
               )}
               {/* UI Overlay on top of 3D */}
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="bg-[#050a17]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex justify-between items-center shadow-xl">
                   <div>
                     <div className="text-[10px] text-[#00d4ff] font-mono uppercase mb-1">Status</div>
                     <div className="text-white text-sm font-bold">Scanning Biometrics...</div>
                   </div>
                   <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                     <div className="w-3 h-3 rounded-full bg-[#00d4ff] animate-pulse shadow-[0_0_10px_#00d4ff]" />
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* DEVELOPER INTEGRATION */}
        <section className="bg-gradient-to-br from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10">
             <Code size={120} className="text-[#00d4ff]" />
           </div>
           <div className="relative z-10 max-w-2xl">
             <h2 className="text-3xl font-bold text-white mb-4">Built for Developers</h2>
             <p className="text-slate-300 mb-8 leading-relaxed">
               Get up and running in minutes. Our SDK handles complex video streaming, frame extraction, and local tensor processing before securely sending encrypted payloads to the verification gateway.
             </p>
             <div className="bg-[#020813] border border-white/10 rounded-xl p-6 font-mono text-sm text-slate-300 overflow-x-auto shadow-2xl">
               <div className="text-[#7c3aed] mb-2">{'//'} Initialize the verification client</div>
               <div><span className="text-[#00d4ff]">import</span> {'{'} MitraClient {'}'} <span className="text-[#00d4ff]">from</span> <span className="text-[#00ff88]">'@mitra/verify-sdk'</span>;</div>
               <br />
               <div><span className="text-[#00d4ff]">const</span> client = <span className="text-[#ff3366]">new</span> MitraClient(process.env.MITRA_API_KEY);</div>
               <br />
               <div className="text-[#7c3aed] mb-2">{'//'} Run liveness verification</div>
               <div><span className="text-[#00d4ff]">const</span> result = <span className="text-[#00d4ff]">await</span> client.verifyLiveness(videoStream);</div>
               <div><span className="text-[#00d4ff]">if</span> (result.passed) {'{'}</div>
               <div className="pl-4">console.log(<span className="text-[#00ff88]">'Identity confirmed'</span>);</div>
               <div>{'}'}</div>
             </div>
           </div>
        </section>

      </main>
    </div>
  );
}
