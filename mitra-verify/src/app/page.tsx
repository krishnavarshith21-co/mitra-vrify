'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Fingerprint, Activity, Eye, Building, GraduationCap, Landmark, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';
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

function useCounter(end: number, duration: number = 2) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const update = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return count;
}

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number, suffix?: string, prefix?: string }) {
  const count = useCounter(value, 2.5);
  return <span>{prefix}{count}{suffix}</span>;
}

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
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, Math.random() * 0.3 + 0.1, 0],
              scale: [0, Math.random() + 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
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
              boxShadow: '0 0 10px #00d4ff',
            }}
          />
        ))}
      </div>

      {/* ── 1. HERO SECTION (100vh) ───────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={mounted ? { opacity: heroOpacity, y: heroY } : {}}
        className="relative min-h-[100dvh] flex items-center pt-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(0,212,255,0.05),transparent)] z-0 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            <div className="flex flex-col gap-8 z-20">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-3 py-1.5 rounded-full">
                  <Shield size={12} /> Next-Generation Security
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-[76px] font-bold text-white tracking-tight leading-[1.05]"
              >
                Enterprise Biometric Identity Infrastructure
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg lg:text-2xl text-slate-400 font-light leading-relaxed max-w-xl"
              >
                Real-time liveness detection, anti-spoof intelligence and continuous authentication.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} 
                className="flex flex-col sm:flex-row gap-4 mt-4"
              >
                <Link href="/demo/enterprise" className="group inline-flex items-center justify-center px-8 py-4 font-semibold text-[#020617] transition-all bg-white rounded-lg hover:bg-slate-200">
                  Request Demo <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/docs" className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all bg-white/[0.03] border border-white/10 rounded-lg hover:bg-white/[0.08]">
                  Documentation
                </Link>
              </motion.div>
            </div>

            <div className="relative w-full h-[500px] lg:h-[700px] flex items-center justify-center -mr-12 lg:-mr-24">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-[600px] h-[600px] bg-[#00d4ff]/10 rounded-full blur-[120px] mix-blend-screen" />
              </motion.div>
              
              <div className="relative w-full h-full z-10 pointer-events-auto scale-90 lg:scale-100">
                {mounted && (
                  <HeroSceneErrorBoundary>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-10 h-10 border border-[#00d4ff]/50 rounded-full animate-pulse" /></div>}>
                      <HeroScene phase={PHASES[currentPhase].id as ScanPhase} />
                    </Suspense>
                  </HeroSceneErrorBoundary>
                )}
              </div>
              
              {/* Floating Verification Status Panel */}
              <motion.div 
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute bottom-16 -right-4 lg:right-12 bg-black/60 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-5 w-64"
              >
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#10b981]/10 border border-[#10b981]/30">
                  <Activity size={20} className="text-[#10b981]" />
                  <div className="absolute inset-0 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Status</div>
                  <div className="text-[15px] font-medium text-white">Verification Active</div>
                  <div className="text-[11px] text-[#10b981] font-mono mt-1">99.98% Confidence</div>
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>
      </motion.section>

      {/* ── 2. ENTERPRISE METRICS ───────────────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-white/[0.01] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }}
            className="flex flex-wrap justify-between items-center gap-8 md:gap-12"
          >
            {[
              { value: 478, label: 'Facial Landmarks', suffix: '+' },
              { value: 99, label: 'Accuracy', suffix: '%' },
              { value: 1, label: 'Verification', prefix: '<', suffix: 's' },
              { value: 24, label: 'Monitoring', suffix: '/7' },
              { value: 0, label: 'Zero Trust Security', override: '100%' }
            ].map((metric) => (
              <div key={metric.label} className="flex flex-col md:items-start text-center md:text-left flex-1 min-w-[120px]">
                <div className="text-3xl md:text-4xl font-semibold text-white mb-2 tracking-tight">
                  {metric.override ? metric.override : (mounted ? <AnimatedNumber value={metric.value} prefix={metric.prefix} suffix={metric.suffix} /> : metric.value + (metric.suffix || ''))}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">{metric.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. PRODUCT SHOWCASE (DASHBOARD) ───────────────────────────────────── */}
      <section className="py-24 lg:py-32 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#00d4ff] mb-4 block">Command Center</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Unparalleled Visibility</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Monitor biometric authentications globally with real-time threat detection and confidence scoring.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="w-full">
              <div className="rounded-2xl border border-white/10 bg-[#050b14]/80 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00d4ff] via-[#3b82f6] to-[#7c3aed]" />
                <div className="p-4 border-b border-white/5 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Main Score Card */}
                  <div className="md:col-span-1 bg-white/[0.02] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.05),transparent)] pointer-events-none" />
                    <div className="w-32 h-32 rounded-full border-[4px] border-[#00d4ff]/20 flex items-center justify-center relative mb-6">
                      <div className="absolute inset-0 rounded-full border-[4px] border-[#00d4ff] border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                      <div className="text-4xl font-bold text-white">99<span className="text-xl text-slate-400">.8</span></div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Verification Score</h3>
                    <p className="text-sm text-slate-400">High Confidence Level</p>
                  </div>

                  {/* Metrics List */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Liveness Status', value: 'Live Human', icon: Eye, color: '#10b981' },
                      { label: 'Identity Match', value: 'Confirmed', icon: Shield, color: '#3b82f6' },
                      { label: 'Deepfake Risk', value: '0.01% (Low)', icon: Activity, color: '#00d4ff' },
                      { label: 'Multi-Face Detection', value: 'Clear (1 Face)', icon: Fingerprint, color: '#7c3aed' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex items-center gap-5 hover:bg-white/[0.04] transition-colors">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                          <item.icon size={20} color={item.color} />
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{item.label}</div>
                          <div className="text-[15px] font-medium text-white">{item.value}</div>
                        </div>
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
      <section className="py-24 lg:py-32 relative z-10 bg-[#01040a] border-y border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Mission-Critical Deployments</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Securing high-assurance environments across the globe.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Government', icon: Landmark, desc: 'High-assurance verification for citizen services and digital identity portals.', color: '#00d4ff' },
              { title: 'Banking & FinTech', icon: Shield, desc: 'KYC compliance, secure wire transfers, and fraud prevention at scale.', color: '#10b981' },
              { title: 'Corporate Security', icon: Building, desc: 'Zero-trust biometric access for VPNs, secure facilities, and internal tools.', color: '#3b82f6' },
              { title: 'Education', icon: GraduationCap, desc: 'Prevent impersonation and ensure academic integrity during remote testing.', color: '#7c3aed' },
            ].map((useCase, i) => (
              <motion.div key={useCase.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, ${useCase.color}, transparent)` }} />
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: `${useCase.color}15`, border: `1px solid ${useCase.color}30` }}>
                        <useCase.icon size={28} color={useCase.color} />
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

      {/* ── 5. API SOLUTIONS ───────────────────────────────────── */}
      <section className="py-24 lg:py-32 relative z-10 bg-[#020617]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">API Solutions</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Scale securely with API tiers designed for every level of threat modeling.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Fast API', latency: '< 1s', target: 'Frictionless Login', color: '#00d4ff', features: ['Blink Detection', 'Smile Detection', 'Head Rotation'] },
              { name: 'Advanced API', latency: '2s', target: 'FinTech & KYC', color: '#3b82f6', features: ['Challenge Response', 'Deepfake Risk', 'Lighting Consistency'], popular: true },
              { name: 'Enterprise API', latency: '3s+', target: 'Military-Grade', color: '#7c3aed', features: ['1:N Face Recognition', 'Continuous Checks', 'Multi-Face Detection'] },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative flex flex-col h-full bg-[#050b14] p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all group overflow-hidden"
                style={{ ...(plan.popular ? { borderColor: `${plan.color}50`, boxShadow: `0 0 30px ${plan.color}15` } : {}) }}
              >
                {plan.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-b-lg">Most Popular</div>}
                <div className="absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-[0.03] transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom, ${plan.color}, transparent)` }} />
                
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight mt-4">{plan.name}</h3>
                <div className="text-[13px] text-slate-400 mb-8 border-b border-white/10 pb-6">
                  Optimized for <span className="text-white font-medium">{plan.target}</span><br/>
                  Avg. Latency: <span className="text-white font-medium">{plan.latency}</span>
                </div>
                
                <div className="space-y-4 flex-grow mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle2 size={16} color={plan.color} />
                      <span className="text-[14px] font-light text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
                
                <Link href="/contact" className="block text-center py-3 rounded-lg font-medium transition-all bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10">
                  Contact Sales
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SECURITY ENGINE (PIPELINE) ───────────────────────────────────── */}
      <section className="py-24 lg:py-40 relative z-10 border-t border-white/5 bg-[#01040a] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-24 text-center">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#7c3aed] mb-4 block">Security Engine</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Neural Verification Pipeline</h2>
            <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">Every request passes through our rigorous multi-stage AI architecture.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative p-12 lg:p-20 rounded-2xl bg-[#050b14]/50 border border-white/10 shadow-2xl backdrop-blur-md max-w-6xl mx-auto">
              
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full gap-8 md:gap-0">
                {[
                  { id: '1', title: 'Face Detection', icon: Eye },
                  { id: '2', title: 'Landmarks', icon: Activity },
                  { id: '3', title: 'Liveness', icon: Zap },
                  { id: '4', title: 'Anti-Spoof', icon: Shield },
                  { id: '5', title: 'Match', icon: Fingerprint },
                  { id: '6', title: 'Granted', icon: Lock }
                ].map((step, index, arr) => (
                  <div key={step.id} className="flex flex-col md:flex-row items-center flex-1 w-full md:w-auto relative">
                    
                    <div className="flex flex-col items-center group relative shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-[#020617] border border-white/10 flex items-center justify-center group-hover:border-[#00d4ff] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 relative z-20">
                        <step.icon size={20} className="text-slate-400 group-hover:text-[#00d4ff] transition-colors" />
                      </div>
                      <span className="md:absolute md:top-20 mt-4 md:mt-0 text-[11px] uppercase tracking-widest text-slate-400 text-center group-hover:text-white transition-colors w-24 md:left-1/2 md:-translate-x-1/2 font-medium">
                        {step.title}
                      </span>
                    </div>

                    {index < arr.length - 1 && (
                      <div className="flex-1 w-px h-12 md:w-full md:h-px bg-white/10 mx-auto my-4 md:my-0 md:mx-6 relative overflow-hidden">
                        <motion.div
                          animate={{ left: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                          className="absolute hidden md:block top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent shadow-[0_0_10px_#00d4ff]"
                        />
                        <motion.div
                          animate={{ top: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
                          className="absolute md:hidden left-0 h-1/2 w-full bg-gradient-to-b from-transparent via-[#00d4ff] to-transparent shadow-[0_0_10px_#00d4ff]"
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
      <section className="py-32 lg:py-48 relative z-10 bg-[#020617] border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.08),transparent_60%)] pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">Ready To Deploy Identity Trust?</h2>
            
            <Link href="/demo/enterprise" className="group inline-flex items-center justify-center px-10 py-5 font-semibold text-[#020617] transition-all bg-white rounded-xl hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)] text-lg">
              Request Enterprise Demo <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="py-8 border-t border-white/5 bg-[#01040a] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield className="text-[#00d4ff]" size={20} />
            <span className="text-lg font-bold text-white tracking-tight">MITRA<span className="text-slate-400">VERIFY</span></span>
          </div>
          
          <div className="flex gap-8 text-sm font-light text-slate-400">
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
