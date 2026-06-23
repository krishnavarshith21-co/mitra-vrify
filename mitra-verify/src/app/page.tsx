'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Suspense, lazy, Component, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Activity, Server, FileText, CheckCircle2, Terminal, Cpu, Database, Eye, Zap, ShieldAlert,
  Code, Lock, Network, Maximize, Key, Play, Fingerprint, Layers, Globe
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

// ─── 3D Engine Component ──────────────────────────────────────────────────────
const HeroScene = lazy(() => import('@/components/3d/HeroScene'));
class HeroSceneErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: Error) { console.warn('[HeroScene] 3D render failed silently:', error.message); }
  render() {
    if (this.state.crashed) {
      return (
        <div className="absolute inset-0 bg-[#020610] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-500 font-mono text-sm">
          <Activity size={32} className="mb-4 text-slate-700" />
          Engine Offline
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Enterprise Framer Motion Components ─────────────────────────────────────
const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 500], [1, 0.3]);
  const headerY = useTransform(scrollY, [0, 500], [0, 100]);

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
    <div className="min-h-screen bg-[#030712] overflow-x-hidden selection:bg-[#00d4ff]/30 selection:text-white relative">
      <Navbar />

      {/* ─── Global Background & Atmosphere ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)]" />
        
        {/* Deep ambient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#00d4ff]/5 blur-[200px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#0ea5e9]/5 blur-[200px] rounded-full mix-blend-screen" />
      </div>

      <main className="relative z-10">
        {/* ─── 1. HERO SECTION ──────────────────────────────────────────────── */}
        <section className="relative pt-40 pb-20 px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto min-h-[90vh] flex flex-col justify-center items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-5xl w-full"
            style={{ opacity: headerOpacity, y: headerY }}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#020610]/80 backdrop-blur-md border border-white/10 rounded-full shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse delay-75" />
                  <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse delay-150" />
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-300 uppercase tracking-widest border-l border-white/10 pl-3">
                  Enterprise Platform v3.0
                </span>
              </div>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-[84px] font-bold text-white tracking-tight leading-[1.05] mb-8 relative">
              <div className="absolute -inset-x-20 top-1/2 -translate-y-1/2 h-[120%] bg-[#00d4ff]/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
              Enterprise Face Liveness &<br />
              Identity Verification
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 font-light max-w-3xl leading-relaxed mb-12">
              Protect digital systems using advanced biometric authentication, anti-spoofing intelligence, identity assurance, and real-time liveness verification at edge scale.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-5">
              <Link href="/demo/enterprise" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#00d4ff] text-[#020610] text-sm font-bold uppercase tracking-wider rounded-xl overflow-hidden transition-all hover:bg-white hover:shadow-[0_0_40px_rgba(0,212,255,0.4)]">
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play size={16} fill="currentColor" /> Launch Verification Session
              </Link>
              <Link href="/developer" className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.02] border border-white/10 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                <Code size={16} /> Developer Documentation
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── 2. CENTERPIECE (VERIFICATION ENGINE) ────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl bg-[#020610]/80 backdrop-blur-2xl border border-white/10 relative overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Top HUD Bar */}
            <div className="absolute top-0 inset-x-0 h-12 border-b border-white/5 bg-white/[0.02] px-4 flex items-center justify-between z-20">
               <div className="flex gap-2">
                 <span className="w-3 h-3 rounded-full bg-slate-800" />
                 <span className="w-3 h-3 rounded-full bg-slate-800" />
                 <span className="w-3 h-3 rounded-full bg-slate-800" />
               </div>
               <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Activity size={12} className="text-[#00d4ff]" />
                  Engine Diagnostic Stream
               </div>
               <div className="w-16 flex justify-end">
                  <Maximize size={14} className="text-slate-600" />
               </div>
            </div>

            {/* 3D Container */}
            <div className="absolute inset-0 pt-12">
              {mounted && (
                <HeroSceneErrorBoundary>
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>}>
                    <HeroScene />
                  </Suspense>
                </HeroSceneErrorBoundary>
              )}
            </div>

            {/* Overlay Panels */}
            <div className="absolute bottom-8 left-8 p-6 bg-[#020610]/80 backdrop-blur-xl border border-white/10 rounded-xl z-20 max-w-xs hidden md:block">
              <div className="text-[10px] text-[#00d4ff] font-mono tracking-widest uppercase mb-4">Real-Time Telemetry</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Latency</span>
                  <span className="text-white font-mono">14ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">FPS</span>
                  <span className="text-white font-mono">60.0</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Confidence</span>
                  <span className="text-[#00ff88] font-mono">99.8%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ─── 3. VERIFICATION PIPELINE ──────────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise Workflow Pipeline</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A seamless, sub-second orchestration of computer vision models determining presence and authenticity.</p>
          </div>

          <div className="relative">
            {/* Desktop Horizontal Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent -translate-y-1/2" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
              {[
                { title: 'Capture Face', icon: Eye, color: 'text-slate-300' },
                { title: 'Mesh Extraction', icon: Activity, color: 'text-[#00d4ff]' },
                { title: 'Liveness Analysis', icon: Zap, color: 'text-[#00ff88]' },
                { title: 'Anti-Spoofing', icon: ShieldAlert, color: 'text-[#ff3366]' },
                { title: 'Identity Matching', icon: Fingerprint, color: 'text-[#7c3aed]' },
                { title: 'Auth Decision', icon: CheckCircle2, color: 'text-white' },
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center group cursor-default"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#020610] border border-white/10 flex items-center justify-center mb-6 group-hover:border-white/30 group-hover:scale-110 transition-all duration-300 shadow-xl relative">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <step.icon size={24} className={step.color} />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-mono text-slate-500 mb-1">STEP 0{i + 1}</div>
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4. CORE CAPABILITIES ──────────────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Core Intelligence Engines</h2>
            <p className="text-slate-400 max-w-2xl">Proprietary neural architectures built for extreme accuracy and absolute zero-trust verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'MediaPipe Face Mesh', desc: 'Real-time extraction of 478 3D facial landmarks processing deep geometry and head pose estimation.', icon: Activity, color: '#00d4ff' },
              { title: 'Liveness Detection', desc: 'Analyzes micro-expressions, blink cadence, and depth fields to guarantee physical human presence.', icon: Eye, color: '#00ff88' },
              { title: 'Anti-Spoofing AI', desc: 'Identifies presentation attacks, 2D/3D masks, screen replays, and deepfake injection vectors instantly.', icon: ShieldAlert, color: '#ff3366' },
              { title: 'Identity Matching', desc: 'One-to-one and one-to-many secure biometric comparison engine powered by highly dimensional embeddings.', icon: Fingerprint, color: '#7c3aed' },
              { title: 'Continuous Auth', desc: 'Background session verification ensuring the authenticated user remains the operator throughout the lifecycle.', icon: Zap, color: '#f59e0b' },
              { title: 'Multi-Face Detection', desc: 'Instantly detect and flag unauthorized participants entering the field of view during sensitive sessions.', icon: Layers, color: '#3b82f6' },
            ].map((capability, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-[#050a17]/60 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-[#080d1e]/80 transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-[${capability.color}]/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
                  <capability.icon size={20} color={capability.color} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{capability.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{capability.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── 5. ARCHITECTURE SECTION ───────────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Zero-Trust Data Flow</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">A secure, cascading pipeline isolating data processing layers from client to response.</p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/10 z-0 hidden md:block" />
            
            <div className="space-y-8 relative z-10">
              {[
                { label: 'Client Device', type: 'Gateway', icon: Globe },
                { label: 'Capture Engine', type: 'Processor', icon: Eye },
                { label: 'Biometric Processor', type: 'Tensor', icon: Cpu },
                { label: 'Liveness Engine', type: 'Heuristic', icon: Zap },
                { label: 'Identity Engine', type: 'Matching', icon: Fingerprint },
                { label: 'Risk Engine', type: 'Policy', icon: ShieldAlert },
                { label: 'Authentication Service', type: 'Service', icon: Key },
                { label: 'Secure Response', type: 'Output', icon: CheckCircle2 },
              ].map((node, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 hidden md:block ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                     <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{node.type}</span>
                  </div>
                  
                  <div className="w-16 h-16 shrink-0 rounded-full bg-[#020610] border border-white/10 flex items-center justify-center shadow-xl relative group hover:border-[#00d4ff]/50 transition-colors">
                    <node.icon size={20} className="text-slate-300 group-hover:text-[#00d4ff] transition-colors" />
                    <div className="absolute inset-0 rounded-full border border-[#00d4ff]/0 group-hover:border-[#00d4ff]/50 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  </div>
                  
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-left' : 'text-right md:text-left'}`}>
                    <h4 className="text-white font-bold text-lg">{node.label}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 6. ENTERPRISE FEATURES GRID ───────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise Modules</h2>
            <p className="text-slate-400 max-w-2xl">Composable identity primitives designed to scale globally.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Fast Liveness API',
              'Advanced Anti-Spoof API',
              'Enterprise Identity API',
              'Continuous Session Authentication',
              'Developer SDK',
              'Webhooks & Integrations',
              'Audit Logs',
              'Risk Intelligence'
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-colors flex flex-col justify-between aspect-square group">
                <Network size={24} className="text-slate-600 group-hover:text-white transition-colors" />
                <h4 className="text-white font-semibold text-sm leading-tight pr-4">{feature}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 7. DEVELOPER EXPERIENCE ───────────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Developer Experience</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                A seamless developer journey with comprehensive SDKs, RESTful endpoints, and robust webhook support. Engineered for typescript-native environments.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'API Key Management',
                  'REST API',
                  'Webhook Integration',
                  'SDK Support',
                  'Documentation',
                  'Sample Code'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#00d4ff]" />
                    <span className="text-sm text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <Link href="/developer" className="text-sm font-bold text-[#00d4ff] hover:text-white transition-colors">
                Explore the Developer Portal &rarr;
              </Link>
           </div>
           
           <div className="relative rounded-2xl bg-[#020610] border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-800" />
                  <span className="w-3 h-3 rounded-full bg-slate-800" />
                  <span className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">POST /v2/verify/liveness</div>
                <div className="w-12"></div>
              </div>
              <div className="p-6 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto">
                 <div className="text-slate-500 mb-2">{'//'} Send an encrypted tensor payload</div>
                 <div><span className="text-[#7c3aed]">const</span> response = <span className="text-[#7c3aed]">await</span> <span className="text-[#00d4ff]">fetch</span>(<span className="text-[#00ff88]">'https://api.mitra.com/v2/verify/liveness'</span>, {'{'}</div>
                 <div className="pl-4">method: <span className="text-[#00ff88]">'POST'</span>,</div>
                 <div className="pl-4">headers: {'{'}</div>
                 <div className="pl-8"><span className="text-[#00ff88]">'Authorization'</span>: <span className="text-[#00ff88]">'Bearer sk_live_xxx'</span>,</div>
                 <div className="pl-8"><span className="text-[#00ff88]">'Content-Type'</span>: <span className="text-[#00ff88]">'application/json'</span></div>
                 <div className="pl-4">{'}'},</div>
                 <div className="pl-4">body: <span className="text-[#00d4ff]">JSON</span>.stringify({'{'}</div>
                 <div className="pl-8">tensorData: encodedPayload,</div>
                 <div className="pl-8">challengeId: <span className="text-[#00ff88]">'req_8f7d9a'</span></div>
                 <div className="pl-4">{'}'})</div>
                 <div>{'}'});</div>
                 <br/>
                 <div><span className="text-[#7c3aed]">const</span> {'{'} passed, confidence {'}'} = <span className="text-[#7c3aed]">await</span> response.json();</div>
                 <div><span className="text-[#7c3aed]">if</span> (passed) {'{'}</div>
                 <div className="pl-4 text-slate-500">{'//'} Liveness confirmed</div>
                 <div>{'}'}</div>
              </div>
           </div>
        </section>

        {/* ─── 8. SECURITY SECTION ───────────────────────────────────────────── */}
        <section className="px-6 md:px-8 lg:px-10 max-w-[1440px] mx-auto py-32 border-t border-white/5 mb-20">
          <div className="text-center mb-16">
             <Shield size={48} className="text-white mx-auto mb-6" strokeWidth={1} />
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise Grade Security</h2>
             <p className="text-slate-400 max-w-2xl mx-auto">Designed from the ground up for zero-trust environments, privacy, and rigorous compliance.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
             {[
               { title: 'End-to-End Encryption', desc: 'All biometric streams are encrypted using AES-256 before leaving the client device.' },
               { title: 'Privacy-First Architecture', desc: 'No facial imagery is ever stored. Only irreversible mathematical hashes are retained.' },
               { title: 'Biometric Hashing', desc: 'Proprietary one-way transformations prevent reverse engineering of identity vectors.' },
               { title: 'Zero Trust Authentication', desc: 'Every verification request must be independently authorized and cryptographically signed.' },
               { title: 'Continuous Monitoring', desc: 'Real-time threat intelligence analyzes global spoofing patterns to update models actively.' },
               { title: 'Compliance Ready', desc: 'Architected to meet stringent requirements for SOC2, GDPR, CCPA, and HIPAA compliance.' },
             ].map((sec, i) => (
               <div key={i} className="text-center">
                 <div className="w-10 h-10 mx-auto rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-4 text-slate-300">
                   <Lock size={16} />
                 </div>
                 <h4 className="text-white font-bold text-sm mb-2">{sec.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">{sec.desc}</p>
               </div>
             ))}
          </div>
        </section>

      </main>
    </div>
  );
}
