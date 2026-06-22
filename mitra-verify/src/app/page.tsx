'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Fingerprint, Activity, Eye, Building, GraduationCap, Landmark, Lock, ChevronRight, CheckCircle2, Server, Cpu, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import type { ScanPhase } from '@/components/3d/HeroScene';

// 3D Scene lazy load
const HeroScene = lazy(() => import('@/components/3d/HeroScene'));
class HeroSceneErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: Error) { console.warn('[HeroScene] 3D render failed silently:', error.message); }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,255,0.04), transparent)',
        }} />
      );
    }
    return this.props.children;
  }
}

// Data
const PHASES = [
  { id: 'searching', label: 'Searching for Face', color: '#f59e0b' },
  { id: 'detected', label: 'Face Detected', color: '#00d4ff' },
  { id: 'landmarks', label: 'Generating 478 Landmarks', color: '#00d4ff' },
  { id: 'liveness', label: 'Liveness Verification', color: '#10b981' },
  { id: 'identity', label: 'Identity Matching', color: '#3b82f6' },
  { id: 'granted', label: 'Access Granted', color: '#10b981' },
];

function TiltCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotation({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotation.x, rotateY: rotation.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      className={className}
    >
      <div style={{ transform: 'translateZ(30px)' }} className="w-full h-full relative">
        {children}
      </div>
    </motion.div>
  );
}

// Custom Magnetic Premium Button
function MagneticButton({ children, href }: { children: React.ReactNode, href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const mouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.2, y: y * 0.2 });
  };

  const mouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <Link
        href={href}
        ref={ref}
        onMouseMove={mouseMove}
        onMouseLeave={mouseLeave}
        className="relative group inline-flex items-center justify-center px-10 py-4 font-semibold text-[#020617] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,212,255,0.1)] hover:shadow-[0_8px_30px_rgba(0,212,255,0.3)]"
        style={{
          background: 'linear-gradient(135deg, #00D4FF, #00FFB2)',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Shine Sweep Animation (Every 8s) */}
        <motion.div
          animate={{ left: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 6.5, ease: 'easeInOut' }}
          className="absolute top-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]"
        />

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 flex items-center"
        >
          {children}
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Glass Button
function GlassButton({ children, href }: { children: React.ReactNode, href: string }) {
  return (
    <Link
      href={href}
      className="relative group inline-flex items-center justify-center px-10 py-4 font-semibold text-white rounded-xl backdrop-blur-md bg-white/[0.03] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]"
    >
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/30 transition-colors duration-300" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)' }} />
      <div className="relative z-10 flex items-center">{children}</div>
    </Link>
  );
}

// Main Page Component
export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 800], [1, 0]);
  const heroY = useTransform(scrollY, [0, 800], [0, 150]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setCurrentPhase(p => (p + 1) % PHASES.length), 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#020617] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white">
      <Navbar />

      {/* ── AMBIENT PARTICLES ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0, Math.random() * 0.4 + 0.1, 0],
              scale: [0, Math.random() + 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute rounded-full bg-[#00d4ff]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              boxShadow: '0 0 15px #00d4ff',
            }}
          />
        ))}
      </div>

      {/* ── 1. HERO SECTION (100vh) ───────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={mounted ? { opacity: heroOpacity, y: heroY } : {}}
        className="relative min-h-[100dvh] flex items-center pt-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_60%_40%,rgba(0,212,255,0.06),transparent)] z-0 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <div className="flex flex-col gap-10 z-20">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00d4ff] border border-[#00d4ff]/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.1)] backdrop-blur-md">
                  <Shield size={14} /> Identity Infrastructure For The Fortune 500
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-[80px] font-bold text-white tracking-tight leading-[1.05]"
              >
                Enterprise Biometric Intelligence
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl lg:text-2xl text-slate-400 font-light leading-relaxed max-w-xl"
              >
                Real-time liveness detection, deepfake defense, and zero-trust authentication for mission-critical systems.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} 
                className="flex flex-col sm:flex-row gap-6 mt-4"
              >
                <MagneticButton href="/demo/enterprise">
                  Request Demo <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                <GlassButton href="/docs">
                  Documentation
                </GlassButton>
              </motion.div>
            </div>

            <div className="relative w-full h-[600px] lg:h-[800px] flex items-center justify-center scale-100 lg:scale-125">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-[800px] h-[800px] bg-[#00d4ff]/10 rounded-full blur-[150px] mix-blend-screen" />
              </motion.div>
              
              <div className="relative w-full h-full z-10 pointer-events-auto">
                {mounted && (
                  <HeroSceneErrorBoundary>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-10 h-10 border border-[#00d4ff]/50 rounded-full animate-pulse" /></div>}>
                      <HeroScene phase={PHASES[currentPhase].id as ScanPhase} />
                    </Suspense>
                  </HeroSceneErrorBoundary>
                )}
              </div>
              
              {/* Complex Scanning Overlay Elements */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="w-[500px] h-[500px] border border-white/5 rounded-full border-dashed opacity-50"
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-[600px] h-[600px] border border-[#00d4ff]/10 rounded-full border-dotted opacity-30"
                />
              </div>
            </div>
            
          </div>
        </div>
      </motion.section>

      {/* ── 2. REAL CAPABILITIES (Replaces Fake Metrics) ─────────────────── */}
      <section className="py-16 border-y border-white/5 bg-[#01040a] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-between items-center gap-8 lg:gap-12"
          >
            {[
              { title: 'Zero-Day Spoof Prevention', desc: 'Defends against synthetic media & replays' },
              { title: 'Continuous Tracking', desc: 'Real-time session persistence' },
              { title: 'Sub-Millisecond Inference', desc: 'Global edge processing' },
              { title: 'Encrypted Biometrics', desc: 'Mathematical hash storage only' },
              { title: 'FIDO2 Compliant', desc: 'Enterprise security standards' }
            ].map((capability) => (
              <div key={capability.title} className="flex flex-col flex-1 min-w-[200px]">
                <div className="text-[13px] font-semibold text-white tracking-wide uppercase mb-2">
                  {capability.title}
                </div>
                <div className="text-[14px] text-slate-500 font-light leading-relaxed">
                  {capability.desc}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. PRODUCT SHOWCASE (THREAT INTELLIGENCE) ────────────────────── */}
      <section className="py-32 lg:py-48 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">Active Threat Intelligence</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Monitor authentication streams globally with deep cryptographic confidence scoring and real-time risk mitigation.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="w-full">
              <div className="rounded-3xl border border-white/10 bg-[#050b14]/90 backdrop-blur-3xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00d4ff] via-[#3b82f6] to-[#00FFB2]" />
                
                <div className="p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  
                  {/* Intelligence Matrix */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.08),transparent)] pointer-events-none" />
                    
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Identity Matrix</h3>
                      <p className="text-sm text-slate-400 font-light">Analyzing 478 vector points for cryptographic match.</p>
                    </div>

                    <div className="mt-12 space-y-6 relative z-10">
                      {[
                        { label: 'Spatial Consistency', score: 'Verified', color: '#10b981' },
                        { label: 'Micro-expression Sync', score: 'Verified', color: '#10b981' },
                        { label: 'Texture Depth Analysis', score: 'Verified', color: '#10b981' },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-sm text-slate-300 font-light">{item.label}</span>
                          <span className="text-[12px] uppercase tracking-widest font-semibold" style={{ color: item.color }}>{item.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threat Vectors */}
                  <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-white mb-2">Threat Vectors Mitigated</h3>
                    {[
                      { label: 'Deepfake Injection', risk: 'Mitigated', icon: Shield, color: '#3b82f6' },
                      { label: 'Presentation Attack (Print)', risk: 'Blocked', icon: Activity, color: '#00d4ff' },
                      { label: 'Replay Attack (Video)', risk: 'Blocked', icon: Lock, color: '#7c3aed' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#020617] border border-white/5 rounded-xl p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}>
                            <item.icon size={18} color={item.color} />
                          </div>
                          <span className="text-[15px] font-medium text-white">{item.label}</span>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-500">{item.risk}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── 4. ENTERPRISE USE CASES ───────────────────────────────────── */}
      <section className="py-32 relative z-10 bg-[#01040a] border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">Mission-Critical Deployments</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Securing high-assurance environments where traditional authentication fails.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Government', icon: Landmark, desc: 'High-assurance verification for citizen services and digital identity portals.', color: '#00d4ff' },
              { title: 'Banking & FinTech', icon: Shield, desc: 'KYC compliance, secure wire transfers, and fraud prevention at scale.', color: '#00FFB2' },
              { title: 'Corporate Security', icon: Building, desc: 'Zero-trust biometric access for VPNs, secure facilities, and internal tools.', color: '#3b82f6' },
              { title: 'Education', icon: GraduationCap, desc: 'Prevent impersonation and ensure academic integrity during remote testing.', color: '#7c3aed' },
            ].map((useCase, i) => (
              <motion.div key={useCase.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <TiltCard className="h-full">
                  <div className="h-full p-10 rounded-2xl bg-[#020617] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, ${useCase.color}, transparent)` }} />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-8" style={{ background: `${useCase.color}10`, border: `1px solid ${useCase.color}20` }}>
                        <useCase.icon size={26} color={useCase.color} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{useCase.title}</h3>
                      <p className="text-slate-400 font-light leading-relaxed text-[16px]">{useCase.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ARCHITECTURE PILLARS (Replaces Pricing) ────────────────── */}
      <section className="py-32 lg:py-48 relative z-10 bg-[#020617]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">Deep-Tech Architecture</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Built from the ground up to prevent spoofing, protect privacy, and scale infinitely.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Edge Processing', icon: Cpu, desc: 'Models run directly on the client to extract landmarks and assess lighting instantly.', color: '#00d4ff' },
              { name: 'Core Engine', icon: Server, desc: 'Proprietary cloud models execute heavy-weight anti-spoofing and deepfake analysis.', color: '#3b82f6' },
              { name: 'Zero-Trust Vault', icon: Database, desc: 'No facial imagery is stored. Only mathematically irreversible biometric hashes.', color: '#00FFB2' },
            ].map((pillar, i) => (
              <motion.div key={pillar.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex flex-col h-full bg-[#050b14] p-10 rounded-2xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom, ${pillar.color}, transparent)` }} />
                
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ background: `${pillar.color}05` }}>
                  <pillar.icon size={24} color={pillar.color} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{pillar.name}</h3>
                <p className="text-[15px] text-slate-400 font-light leading-relaxed mb-8">
                  {pillar.desc}
                </p>
                
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. ANIMATED WORKFLOW (Replaces Static Pipeline) ─────────────── */}
      <section className="py-32 lg:py-48 relative z-10 border-t border-white/5 bg-[#01040a] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-32 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">Data Workflow</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Every authentication request is broken down into packetized verification steps.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative p-12 lg:p-20 rounded-3xl bg-[#050b14]/30 border border-white/5 shadow-2xl backdrop-blur-md max-w-6xl mx-auto overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.02),transparent)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full gap-8 md:gap-0">
                {[
                  { id: '1', title: 'Capture', icon: Eye },
                  { id: '2', title: 'Landmarks', icon: Activity },
                  { id: '3', title: 'Anti-Spoof', icon: Shield },
                  { id: '4', title: 'Match', icon: Fingerprint },
                  { id: '5', title: 'Auth Token', icon: Lock }
                ].map((step, index, arr) => (
                  <div key={step.id} className="flex flex-col md:flex-row items-center flex-1 w-full md:w-auto relative">
                    
                    <div className="flex flex-col items-center relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] relative z-20">
                        <step.icon size={24} className="text-[#00d4ff]" />
                      </div>
                      <span className="md:absolute md:top-24 mt-4 md:mt-0 text-[12px] uppercase tracking-widest text-slate-300 text-center w-32 md:left-1/2 md:-translate-x-1/2 font-semibold">
                        {step.title}
                      </span>
                    </div>

                    {index < arr.length - 1 && (
                      <div className="flex-1 w-px h-16 md:w-full md:h-px bg-white/5 mx-auto my-4 md:my-0 md:mx-6 relative overflow-hidden rounded-full">
                        {/* Data Packets flowing through pipeline */}
                        <motion.div
                          animate={{ left: ['-20%', '120%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: index * 0.15 }}
                          className="absolute hidden md:block top-1/2 -translate-y-1/2 w-4 h-[2px] bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]"
                        />
                        <motion.div
                          animate={{ top: ['-20%', '120%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: index * 0.15 }}
                          className="absolute md:hidden left-1/2 -translate-x-1/2 h-4 w-[2px] bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]"
                        />
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 7. FINAL CTA ──────────────────────────────────────── */}
      <section className="py-40 lg:py-60 relative z-10 bg-[#020617] border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.06),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-10 tracking-tight leading-[1.05]">Deploy Trust At Scale</h2>
            
            <div className="flex justify-center">
              <MagneticButton href="/demo/enterprise">
                Request Enterprise Demo <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="py-10 border-t border-white/5 bg-[#01040a] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield className="text-[#00d4ff]" size={18} />
            <span className="text-sm font-bold text-white tracking-widest uppercase">MITRAVERIFY</span>
          </div>
          
          <div className="flex gap-10 text-[13px] font-medium text-slate-500 uppercase tracking-widest">
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
