'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Activity, Eye, Building, GraduationCap, Landmark, Lock, ChevronRight, Server, Cpu, Database, Network, Fingerprint, ShieldAlert, Key } from 'lucide-react';
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
    <div className="min-h-screen bg-[#020813] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white relative">
      <Navbar />

      {/* ── GLOBAL FIXED BACKGROUND LAYERS ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
        {/* Soft Glow Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00d4ff]/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00ff88]/5 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[40%] bg-[#3b82f6]/10 blur-[120px] rounded-full mix-blend-screen" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

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
        className="relative min-h-[100dvh] flex items-center pt-32 pb-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_60%_40%,rgba(0,212,255,0.06),transparent)] z-0 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            
            <div className="flex flex-col gap-8 z-20 xl:pr-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00d4ff] border border-[#00d4ff]/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,212,255,0.1)] backdrop-blur-md">
                  <Shield size={14} /> Identity Infrastructure For The Fortune 500
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]"
              >
                Enterprise Biometric Intelligence
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg lg:text-xl text-slate-400 font-light leading-relaxed max-w-xl"
              >
                Real-time liveness detection, deepfake defense, and zero-trust authentication for mission-critical systems. Build trust at a global scale.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} 
                className="flex flex-col sm:flex-row gap-5 mt-4"
              >
                <MagneticButton href="/demo/enterprise">
                  Request Demo <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                <GlassButton href="/docs">
                  Documentation
                </GlassButton>
              </motion.div>
            </div>

            {/* Scale reduced by ~20% from scale-125 to scale-[0.95] for visual balance */}
            <div className="relative w-full h-[500px] lg:h-[700px] flex items-center justify-center scale-90 lg:scale-[0.95] mt-12 lg:mt-0">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-[600px] h-[600px] bg-[#00d4ff]/10 rounded-full blur-[120px] mix-blend-screen" />
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
                  className="w-[450px] h-[450px] border border-white/5 rounded-full border-dashed opacity-50"
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-[550px] h-[550px] border border-[#00d4ff]/10 rounded-full border-dotted opacity-30"
                />
              </div>
            </div>
            
          </div>
        </div>
      </motion.section>

      {/* ── 2. REAL CAPABILITIES (Replaces Fake Metrics) ─────────────────── */}
      <section className="py-16 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-between items-center gap-8 lg:gap-12"
          >
            {[
              { title: 'Zero-Day Spoof Prevention', desc: 'Defends against synthetic media & replays via multi-spectral analysis' },
              { title: 'Continuous Tracking', desc: 'Real-time session persistence with passive background verification' },
              { title: 'Sub-Millisecond Inference', desc: 'Global edge processing for near-zero latency auth events' },
              { title: 'Encrypted Biometrics', desc: 'Mathematical hash storage only; raw imagery is instantly discarded' },
            ].map((capability) => (
              <div key={capability.title} className="flex flex-col flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  <div className="text-[13px] font-semibold text-white tracking-wide uppercase">
                    {capability.title}
                  </div>
                </div>
                <div className="text-[14px] text-slate-500 font-light leading-relaxed pl-3 border-l border-white/10 ml-[3px]">
                  {capability.desc}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. PRODUCT SHOWCASE (THREAT INTELLIGENCE) ────────────────────── */}
      <section className="py-20 lg:py-24 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Active Threat Intelligence</h2>
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
                
                <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* Intelligence Matrix - Increased Density */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.08),transparent)] pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Identity Cryptography</h3>
                        <p className="text-sm text-slate-400 font-light">Analyzing 478 vector points to generate an irreversible, salted biometric signature.</p>
                      </div>
                      <ShieldAlert className="text-[#00d4ff] opacity-50" size={32} />
                    </div>

                    <div className="space-y-5 relative z-10 flex-1">
                      {[
                        { label: 'Spatial Consistency', desc: 'Geometry mapping across 3D axes', status: 'Cryptographically Sound', color: '#10b981' },
                        { label: 'Micro-expression Sync', desc: 'Involuntary muscular movement verification', status: 'Liveness Confirmed', color: '#10b981' },
                        { label: 'Texture Depth Analysis', desc: 'Sub-surface light scattering patterns', status: 'Human Verified', color: '#10b981' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[15px] text-white font-medium">{item.label}</span>
                            <span className="text-[11px] uppercase tracking-widest font-semibold bg-[#10b981]/10 text-[#10b981] px-2 py-1 rounded">
                              {item.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-light">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threat Vectors - Increased Density */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Threat Vectors Mitigated</h3>
                      <p className="text-sm text-slate-400 font-light mb-6">Our engine automatically isolates and nullifies incoming attack vectors before they hit your infrastructure.</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Deepfake Injection', risk: 'Mitigated - Synthetic Media Detected', icon: Activity, color: '#3b82f6', desc: 'GAN-generated artifacts identified in video feed.' },
                        { label: 'Presentation Attack', risk: 'Blocked - 2D Screen Detected', icon: Eye, color: '#00d4ff', desc: 'Lack of depth variance triggers spoof defense.' },
                        { label: 'Replay Attack', risk: 'Blocked - Stale Session Hash', icon: Lock, color: '#7c3aed', desc: 'Re-used biometric payload instantly rejected.' },
                      ].map((item, i) => (
                        <div key={i} className="bg-[#020617] border border-white/5 rounded-xl p-5 hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}>
                              <item.icon size={20} color={item.color} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-medium text-white mb-1">{item.label}</span>
                              <span className="text-xs text-slate-400 leading-relaxed mb-2">{item.desc}</span>
                              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: item.color }}>{item.risk}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── 4. ENTERPRISE USE CASES ───────────────────────────────────── */}
      <section className="py-20 lg:py-24 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Mission-Critical Deployments</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Securing high-assurance environments where traditional authentication protocols are insufficient.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Government', icon: Landmark, desc: 'High-assurance verification for citizen services, border control, and digital identity portals.', color: '#00d4ff' },
              { title: 'Banking & FinTech', icon: Shield, desc: 'KYC compliance, secure wire transfers, and comprehensive fraud prevention at global scale.', color: '#00FFB2' },
              { title: 'Corporate Security', icon: Building, desc: 'Zero-trust biometric access for VPNs, secure facilities, and sensitive internal tools.', color: '#3b82f6' },
              { title: 'Education', icon: GraduationCap, desc: 'Prevent impersonation and strictly enforce academic integrity during remote testing.', color: '#7c3aed' },
            ].map((useCase, i) => (
              <motion.div key={useCase.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-2xl bg-[#020617] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, ${useCase.color}, transparent)` }} />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: `${useCase.color}10`, border: `1px solid ${useCase.color}20` }}>
                        <useCase.icon size={22} color={useCase.color} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{useCase.title}</h3>
                      <p className="text-slate-400 font-light leading-relaxed text-[15px]">{useCase.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. ARCHITECTURE PILLARS ───────────────────────────────────── */}
      <section className="py-20 lg:py-24 relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Deep-Tech Architecture</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Built from the ground up to prevent spoofing, protect privacy, and scale infinitely across distributed systems.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Edge Processing', icon: Cpu, desc: 'WebAssembly models run directly on the client to extract landmarks and assess lighting instantly without server round-trips.', color: '#00d4ff' },
              { name: 'Core Engine', icon: Server, desc: 'Proprietary cloud infrastructure executes heavy-weight anti-spoofing heuristics and multi-frame deepfake analysis.', color: '#3b82f6' },
              { name: 'Zero-Trust Vault', icon: Database, desc: 'No facial imagery is stored. We retain only mathematically irreversible biometric hashes secured by KMS encryption.', color: '#00FFB2' },
            ].map((pillar, i) => (
              <motion.div key={pillar.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex flex-col h-full bg-[#050b14] p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom, ${pillar.color}, transparent)` }} />
                
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ background: `${pillar.color}05` }}>
                  <pillar.icon size={22} color={pillar.color} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{pillar.name}</h3>
                <p className="text-[14px] text-slate-400 font-light leading-relaxed mb-6">
                  {pillar.desc}
                </p>
                
              </motion.div>
            ))}
          </div>

          {/* Visual System Diagram */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.3 }}
            className="mt-12 p-8 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.03),transparent_70%)] pointer-events-none" />
             
             <div className="flex flex-col items-center z-10">
               <div className="w-14 h-14 rounded-full border border-white/10 bg-[#020617] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                 <Network size={20} className="text-[#00d4ff]" />
               </div>
               <span className="text-xs uppercase tracking-widest text-slate-500 mt-3 font-semibold">Client Edge</span>
             </div>

             <div className="hidden md:flex flex-1 max-w-[200px] h-px bg-gradient-to-r from-[#00d4ff]/20 via-[#3b82f6]/50 to-[#00FFB2]/20 relative">
                <motion.div animate={{ left: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute top-1/2 -translate-y-1/2 w-8 h-[2px] bg-[#3b82f6] shadow-[0_0_10px_#3b82f6]" />
             </div>

             <div className="flex flex-col items-center z-10">
               <div className="w-16 h-16 rounded-full border border-white/10 bg-[#020617] flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                 <Server size={24} className="text-[#3b82f6]" />
               </div>
               <span className="text-xs uppercase tracking-widest text-slate-500 mt-3 font-semibold">Core Verification API</span>
             </div>

             <div className="hidden md:flex flex-1 max-w-[200px] h-px bg-gradient-to-r from-[#3b82f6]/20 via-[#00FFB2]/50 to-[#10b981]/20 relative">
                <motion.div animate={{ left: ['0%', '100%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }} className="absolute top-1/2 -translate-y-1/2 w-8 h-[2px] bg-[#00FFB2] shadow-[0_0_10px_#00FFB2]" />
             </div>

             <div className="flex flex-col items-center z-10">
               <div className="w-14 h-14 rounded-full border border-white/10 bg-[#020617] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,178,0.1)]">
                 <Key size={20} className="text-[#00FFB2]" />
               </div>
               <span className="text-xs uppercase tracking-widest text-slate-500 mt-3 font-semibold">Customer Vault</span>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ── 6. ANIMATED WORKFLOW (Expanded Descriptions) ────────────────── */}
      <section className="py-20 lg:py-24 relative z-10 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-24 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Data Workflow</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Every authentication request is systematically packetized, verified, and secured.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative p-10 lg:p-16 rounded-3xl bg-[#050b14]/30 border border-white/5 shadow-2xl backdrop-blur-md max-w-6xl mx-auto overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.02),transparent)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start justify-between relative z-10 w-full gap-12 md:gap-0">
                {[
                  { id: '1', title: 'Capture', icon: Eye, desc: 'High-res frame sampling' },
                  { id: '2', title: 'Landmarks', icon: Activity, desc: '478-point mesh extraction' },
                  { id: '3', title: 'Anti-Spoof', icon: Shield, desc: 'Liveness & depth checks' },
                  { id: '4', title: 'Match', icon: Fingerprint, desc: 'Cryptographic hash pairing' },
                  { id: '5', title: 'Auth Token', icon: Lock, desc: 'Signed JWT generation' }
                ].map((step, index, arr) => (
                  <div key={step.id} className="flex flex-col md:flex-row items-center flex-1 w-full md:w-auto relative group">
                    
                    <div className="flex flex-col items-center relative shrink-0 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#020617] border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] relative z-20 group-hover:border-[#00d4ff]/30 group-hover:shadow-[0_0_25px_rgba(0,212,255,0.2)] transition-all duration-300">
                        <step.icon size={24} className="text-[#00d4ff]" />
                      </div>
                      <span className="mt-5 text-[13px] uppercase tracking-widest text-white font-semibold">
                        {step.title}
                      </span>
                      <span className="mt-2 text-[11px] text-slate-500 max-w-[120px] leading-relaxed">
                        {step.desc}
                      </span>
                    </div>

                    {index < arr.length - 1 && (
                      <div className="flex-1 w-px h-16 md:w-full md:h-px bg-white/5 mx-auto my-4 md:my-0 md:mx-4 relative overflow-hidden rounded-full self-start md:mt-8">
                        {/* Data Packets flowing through pipeline */}
                        <motion.div
                          animate={{ left: ['-20%', '120%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                          className="absolute hidden md:block top-1/2 -translate-y-1/2 w-6 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent"
                        />
                        <motion.div
                          animate={{ top: ['-20%', '120%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                          className="absolute md:hidden left-1/2 -translate-x-1/2 h-6 w-[2px] bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent"
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

      {/* ── 7. FINAL CTA (Height Reduced) ───────────────────────────────── */}
      <section className="py-20 lg:py-28 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.06),transparent_60%)] pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Deploy Trust At Scale</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">Strengthen security, reduce fraud, and build trust at every interaction with our enterprise API.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <MagneticButton href="/demo/enterprise">
                Request Enterprise Demo <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <GlassButton href="/docs">
                Read Documentation
              </GlassButton>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
