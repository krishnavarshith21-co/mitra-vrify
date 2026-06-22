'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
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

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [mounted, setMounted] = useState(false);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);

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
    <div className="min-h-screen bg-[#01040a] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white">
      <Navbar />

      {/* ── 1. HERO SECTION ───────────────────────────────────── */}
      <motion.section
        style={mounted ? { opacity: heroOpacity, y: heroY } : {}}
        className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 min-h-screen flex flex-col justify-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(0,212,255,0.03),transparent_50%)] z-0 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 w-full relative z-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center mb-24">
            
            <div className="lg:col-span-7 flex flex-col gap-8 z-20">
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-[76px] font-medium text-white tracking-tight leading-[1.05]"
              >
                Enterprise Biometric Identity Infrastructure
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg lg:text-xl text-slate-400 font-light leading-relaxed max-w-xl"
              >
                Real-time liveness detection, anti-spoof intelligence, and continuous authentication for mission-critical systems.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} 
                className="flex flex-col sm:flex-row gap-4 mt-4"
              >
                <Link href="/docs" className="inline-flex items-center justify-center px-8 py-3.5 font-medium text-[#01040a] transition-all bg-white hover:bg-slate-200">
                  Documentation
                </Link>
                <Link href="/demo/enterprise" className="inline-flex items-center justify-center px-8 py-3.5 font-medium text-white transition-all bg-white/[0.03] border border-white/10 hover:bg-white/[0.08]">
                  Request Demo
                </Link>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative w-full h-[400px] lg:h-[500px] flex items-center justify-center scale-90">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2 }} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute w-[500px] h-[500px] bg-[#00d4ff]/5 rounded-full blur-[120px] mix-blend-screen" />
              </motion.div>
              <div className="relative w-full h-full z-10 pointer-events-auto">
                {mounted && (
                  <HeroSceneErrorBoundary>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border border-[#00d4ff]/50 rounded-full animate-pulse" /></div>}>
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
                className="absolute bottom-10 -right-4 lg:-right-12 bg-[#050b14]/80 backdrop-blur-xl border border-white/10 p-4 shadow-2xl flex items-center gap-4"
              >
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Status</div>
                  <div className="text-sm font-mono text-[#10b981]">Access Granted</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Trust Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pt-8 border-t border-white/5 flex flex-wrap gap-8 md:gap-16 items-center"
          >
            {['478 Facial Landmarks', '99% Accuracy', '<1s Verification', '24/7 Monitoring', 'Zero-Trust Architecture'].map((metric) => (
              <div key={metric} className="text-xs md:text-sm font-medium text-slate-400 tracking-wide uppercase">
                {metric}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 2. ENTERPRISE TRUST ───────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#020611] border-t border-white/5 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <h2 className="text-2xl font-light text-slate-300 mb-12 tracking-wide">
              Trusted For High-Assurance Verification
            </h2>
            <div className="flex flex-wrap gap-4">
              {['Government Access', 'Financial Services', 'Healthcare Systems', 'Workforce Identity', 'Education Platforms', 'Enterprise Security'].map((badge) => (
                <div key={badge} className="px-5 py-2.5 bg-white/[0.02] border border-white/10 text-sm font-light text-slate-400 hover:text-white hover:border-white/20 transition-colors">
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 3. VERIFICATION PIPELINE ───────────────────────────────────── */}
      <section className="py-32 lg:py-48 relative z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.02),transparent_70%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-100px" }} 
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-[#050b14] border border-white/5 p-12 lg:p-20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent" />
              
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full gap-8 md:gap-0">
                {[
                  { id: '1', title: 'Face Detection' },
                  { id: '2', title: 'Landmark Extraction' },
                  { id: '3', title: 'Liveness Validation' },
                  { id: '4', title: 'Anti-Spoof Analysis' },
                  { id: '5', title: 'Identity Match' },
                  { id: '6', title: 'Access Granted' }
                ].map((step, index, arr) => (
                  <div key={step.id} className="flex flex-col md:flex-row items-center flex-1 w-full md:w-auto">
                    
                    <div className="flex flex-col items-center group relative shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#0a1220] border border-white/20 group-hover:border-[#00d4ff] group-hover:bg-[#00d4ff]/20 transition-colors relative z-20" />
                      <span className="md:absolute md:top-8 mt-4 md:mt-0 text-[10px] uppercase tracking-widest text-slate-500 text-center group-hover:text-white transition-colors w-24 md:left-1/2 md:-translate-x-1/2">
                        {step.title}
                      </span>
                    </div>

                    {index < arr.length - 1 && (
                      <div className="flex-1 w-px h-12 md:w-full md:h-px bg-white/5 mx-auto my-4 md:my-0 md:mx-6 relative overflow-hidden">
                        <motion.div
                          animate={{ left: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: index * 0.3 }}
                          className="absolute hidden md:block top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"
                        />
                        <motion.div
                          animate={{ top: ['-100%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: index * 0.3 }}
                          className="absolute md:hidden left-0 h-1/2 w-full bg-gradient-to-b from-transparent via-[#00d4ff]/40 to-transparent"
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

      {/* ── 4. CTA & FOOTER ──────────────────────────────────────── */}
      <section className="pt-24 pb-12 relative z-10 bg-[#020611] border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-32">
            <h2 className="text-4xl md:text-6xl font-medium text-white mb-6 tracking-tight">Deploy Trust At Scale</h2>
            <p className="text-lg md:text-xl text-slate-400 font-light mb-10 max-w-2xl mx-auto">Enterprise-grade biometric verification infrastructure built for modern security architectures.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo/enterprise" className="inline-flex items-center justify-center px-8 py-4 font-medium text-[#01040a] transition-all bg-white hover:bg-slate-200">
                Request Demo
              </Link>
              <Link href="/docs" className="inline-flex items-center justify-center px-8 py-4 font-medium text-white transition-all bg-white/[0.03] border border-white/10 hover:bg-white/[0.08]">
                Documentation
              </Link>
            </div>
          </motion.div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light text-slate-600">
            <div className="flex items-center gap-2 text-slate-500 font-medium tracking-widest uppercase">
              <Shield size={14} /> MITRA VERIFY © {new Date().getFullYear()}
            </div>
            <div className="flex gap-8">
              <Link href="/product" className="hover:text-white transition-colors">Product</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
