'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, Shield, Fingerprint, ArrowRight, CheckCircle, 
  Activity, Eye, Lock, Star, ChevronRight,
  Building, GraduationCap, CreditCard, Stethoscope, Landmark, UserPlus,
  ShieldCheck, Fingerprint as FingerprintIcon, Focus,
  Cpu, Copy, Terminal, Check
} from 'lucide-react';
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
  { id: 'searching', label: 'Searching for Face', color: '#ffb800' },
  { id: 'detected', label: 'Face Detected', color: '#00d4ff' },
  { id: 'landmarks', label: 'Generating 478 Landmarks', color: '#00d4ff' },
  { id: 'liveness', label: 'Liveness Verification', color: '#7c3aed' },
  { id: 'identity', label: 'Identity Matching', color: '#0066ff' },
  { id: 'granted', label: 'Access Granted', color: '#00ff88' },
];

const WHY_US_FEATURES = [
  { title: '478 Facial Landmarks', icon: Focus, color: '#00d4ff', desc: 'Real-time extraction of dense micro-landmarks for unparalleled precision and expression analysis.' },
  { title: '99% Verification Accuracy', icon: ShieldCheck, color: '#00ff88', desc: 'Military-grade identity matching trained on diverse, global datasets to eliminate false positives.' },
  { title: 'Sub-Second Processing', icon: Zap, color: '#ffb800', desc: 'Lightning-fast inference at the edge ensures zero friction during user onboarding or login.' },
  { title: 'Deepfake Detection', icon: Eye, color: '#ff3366', desc: 'Advanced AI models detect synthetic media, injection attacks, and 3D silicone masks instantly.' },
  { title: 'Continuous Authentication', icon: Activity, color: '#7c3aed', desc: 'Passive, background verification ensures the session remains secure long after initial login.' },
  { title: 'Multi-Face Detection', icon: UserPlus, color: '#3b82f6', desc: 'Automatically flags unauthorized individuals in the background for zero-trust environments.' },
];

const API_PRODUCTS = [
  {
    id: 'basic',
    name: 'Fast Liveness API',
    icon: Zap,
    color: '#00d4ff',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,102,255,0.05))',
    border: 'rgba(0,212,255,0.2)',
    target: '< 1 second',
    securityLevel: 'Standard',
    endpoint: 'POST /api/v1/liveness/basic',
    checks: ['Blink Detection', 'Mouth Movement', 'Smile Detection', 'Head Rotation'],
    useCase: 'Frictionless web logins, quick account recovery',
  },
  {
    id: 'advanced',
    name: 'Advanced Anti-Spoof',
    icon: Shield,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))',
    border: 'rgba(124,58,237,0.2)',
    target: '2–4 seconds',
    securityLevel: 'High',
    endpoint: 'POST /api/v1/liveness/advanced',
    checks: ['Challenge Response', 'Replay Attack Detection', 'Deepfake Risk Analysis', 'Lighting Consistency'],
    useCase: 'Banking transfers, high-value transactions, FinTech KYC',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Identity',
    icon: Fingerprint,
    color: '#00ff88',
    gradient: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,102,255,0.05))',
    border: 'rgba(0,255,136,0.2)',
    target: '3–6 seconds',
    securityLevel: 'Military-Grade',
    endpoint: 'POST /api/v1/identity/verify',
    checks: ['1:N Face Recognition', 'Continuous Verification', 'Multi-Face Detection', 'Behavioral Biometrics'],
    useCase: 'Corporate VPN access, secure facility terminals, online exams',
  },
];

const CRITICAL_APPS = [
  { title: 'Online Exams', icon: GraduationCap, color: '#00d4ff', desc: 'Prevent impersonation and ensure academic integrity during remote testing.' },
  { title: 'Employee Login', icon: Building, color: '#00ff88', desc: 'Zero-trust biometric authentication for corporate VPNs and internal tools.' },
  { title: 'Fintech KYC', icon: CreditCard, color: '#7c3aed', desc: 'Instant identity verification for onboarding, transactions, and compliance.' },
  { title: 'Healthcare Access', icon: Stethoscope, color: '#ff3366', desc: 'Secure patient portals and medical staff authentication.' },
  { title: 'Government', icon: Landmark, color: '#f59e0b', desc: 'High-assurance identity verification for citizen services.' },
  { title: 'Customer Verification', icon: UserPlus, color: '#3b82f6', desc: 'Frictionless, secure sign-ups with automated liveness checks.' },
];

const CODE_EXAMPLES = {
  javascript: `import { MitraVerify } from '@mitra-verify/sdk';

const client = new MitraVerify({
  apiKey: process.env.MITRA_API_KEY
});

// Perform high-security liveness and identity match
const result = await client.verifyIdentity({
  imageBuffer: userCameraFrame,
  userId: "usr_88a91bx",
  requireAntiSpoof: true,
  strictMode: true
});

if (result.status === "passed" && result.confidence > 0.98) {
  grantAccess();
}`,
  typescript: `import { MitraVerify, VerificationResult } from '@mitra-verify/sdk';

const client = new MitraVerify({
  apiKey: process.env.MITRA_API_KEY!
});

export async function authenticateUser(frame: Buffer, userId: string): Promise<boolean> {
  const result: VerificationResult = await client.verifyIdentity({
    imageBuffer: frame,
    userId,
    requireAntiSpoof: true,
    strictMode: true
  });

  return result.status === "passed" && result.confidence > 0.98;
}`,
  python: `import os
from mitra_verify import Client

client = Client(api_key=os.environ.get("MITRA_API_KEY"))

def authenticate_user(image_bytes: bytes, user_id: str) -> bool:
    # Perform high-security liveness and identity match
    result = client.verify_identity(
        image_bytes=image_bytes,
        user_id=user_id,
        require_anti_spoof=True,
        strict_mode=True
    )
    
    return result.status == "passed" and result.confidence > 0.98`,
  curl: `curl -X POST https://api.mitraverify.com/v1/identity/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "base64_encoded_frame",
    "user_id": "usr_88a91bx",
    "require_anti_spoof": true,
    "strict_mode": true
  }'`
};

// Counter Hook for animated numbers
function useCounter(end: number, duration: number = 2) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const update = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out expo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// 3D Tilt Card Component
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
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotation({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotation.x, rotateY: rotation.y }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      className={className}
    >
      <div style={{ transform: 'translateZ(30px)' }} className="w-full h-full relative">
        {children}
      </div>
    </motion.div>
  );
}

// Animated Counter Component
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number, suffix?: string, prefix?: string }) {
  const count = useCounter(value, 2.5);
  return <span>{prefix}{count}{suffix}</span>;
}

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<keyof typeof CODE_EXAMPLES>('typescript');
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeCodeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <Navbar />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 rounded-full border-2 border-[#00d4ff]/10 border-t-[#00d4ff]" />
        <p className="text-slate-400 text-sm font-mono tracking-widest">VERIFYING SESSION</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white">
      <Navbar />

      {/* Floating Ambient Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, Math.random() * 0.5 + 0.1, 0],
              scale: [0, Math.random() + 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 8 + 7,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute rounded-full"
            style={{
              left: `\${Math.random() * 100}%`,
              top: `\${Math.random() * 100}%`,
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              background: i % 3 === 0 ? '#00ff88' : '#00d4ff',
              boxShadow: `0 0 \${Math.random() * 15 + 5}px \${i % 3 === 0 ? '#00ff88' : '#00d4ff'}`,
            }}
          />
        ))}
      </div>

      {/* ── HERO SECTION ───────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={mounted ? { opacity: heroOpacity, y: heroY } : {}}
        className="relative min-h-[90dvh] lg:min-h-[100dvh] flex items-center pt-24 pb-12 lg:pt-0 lg:pb-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(0,212,255,0.05),transparent)] z-0 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-px bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent" />

        <div className="max-w-[1400px] mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 flex flex-col gap-6 lg:gap-8 z-20">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(0,212,255,0.05)] cursor-default">
                  <span className="flex items-center gap-1.5 text-[11px] bg-[#00d4ff]/10 text-[#00d4ff] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-[#00d4ff]/20">
                    <Star size={12} fill="#00d4ff" /> Enterprise Edition
                  </span>
                  <span className="text-[13px] text-slate-400 font-medium">World-class Biometric Authentication</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-6xl lg:text-[72px] font-extrabold text-white tracking-tight leading-[1.05]"
              >
                Secure Identity <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#00ff88] to-[#00d4ff] animate-gradient-x drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]">Verification</span> <br />
                Infrastructure
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-[540px]"
              >
                Deploy military-grade liveness detection, anti-spoofing, and continuous authentication with just a few lines of code. Built for mission-critical applications.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} 
                className="flex flex-col sm:flex-row gap-4 mt-2"
              >
                <Link href="/signup" className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-300 bg-transparent rounded-xl overflow-hidden hover:scale-[1.02]">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]" />
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center gap-2">Start Building Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
                </Link>
                <Link href="/demo/basic" className="group inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-300 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <Eye size={18} className="mr-2 text-slate-400 group-hover:text-white transition-colors" /> Try Live Demo
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                {[ 
                  { value: 99, suffix: '%', label: 'Accuracy', color: '#00ff88' }, 
                  { value: 1, prefix: '<', suffix: 's', label: 'Response', color: '#00d4ff' }, 
                  { value: 3, label: 'Verification APIs', color: '#7c3aed' }, 
                  { value: 100, suffix: '%', label: 'Enterprise Security', color: '#ffb800' } 
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col">
                    <div className="text-2xl font-bold text-white mb-1 tracking-tight">
                      {mounted ? <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /> : stat.value + (stat.suffix || '')}
                    </div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color, boxShadow: `0 0 6px \${stat.color}` }} />
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Content: 3D Visualization */}
            <div className="lg:col-span-6 relative w-full h-[400px] lg:h-[600px] flex items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00d4ff]/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#7c3aed]/10 rounded-full blur-[80px]" />
              </motion.div>
              
              <div className="relative w-full h-full z-10 pointer-events-auto">
                {mounted && (
                  <HeroSceneErrorBoundary>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" /></div>}>
                      <HeroScene phase={PHASES[currentPhase].id as ScanPhase} />
                    </Suspense>
                  </HeroSceneErrorBoundary>
                )}
              </div>

              {/* Holographic Status Overlay */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} 
                className="absolute right-0 bottom-10 lg:bottom-20 p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20 w-64">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest">SYSTEM STATUS</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_5px_#00ff88]" />
                    <span className="text-[10px] text-[#00ff88] font-mono tracking-widest">LIVE</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {PHASES.map((phase, i) => (
                    <div key={phase.id} className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-4 h-4">
                        <motion.div
                          animate={{
                            scale: i === currentPhase ? [1, 1.5, 1] : 1,
                            opacity: i === currentPhase ? 1 : i < currentPhase ? 0.5 : 0.1,
                            backgroundColor: i === currentPhase ? phase.color : i < currentPhase ? '#00ff88' : '#ffffff'
                          }}
                          transition={{ duration: 1, repeat: i === currentPhase ? Infinity : 0 }}
                          className="w-1.5 h-1.5 rounded-full"
                        />
                        {i === currentPhase && (
                          <motion.div animate={{ scale: [1, 2.5], opacity: [0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 rounded-full border border-current" style={{ color: phase.color }} />
                        )}
                      </div>
                      <span className="text-[11px] font-mono" style={{ color: i === currentPhase ? '#fff' : i < currentPhase ? '#94a3b8' : '#475569' }}>
                        {phase.label.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── TRUSTED INDUSTRIES MARQUEE ─────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-[#030712] relative z-10 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
        <div className="max-w-[1400px] mx-auto px-6 mb-8 text-center text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Securing identity for critical sectors globally</span>
        </div>
        <div className="flex whitespace-nowrap opacity-60 relative">
          <div className="absolute left-0 top-0 w-48 h-full bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />
          <motion.div
            animate={{ x: [0, -1500] }}
            transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
            className="flex items-center gap-16 px-8"
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-16">
                {['Education', 'Banking', 'Healthcare', 'Government', 'Enterprise', 'FinTech', 'Insurance', 'Remote Workforce', 'Online Exams', 'Customer Verification'].map(ind => (
                  <span key={ind} className="text-xl md:text-2xl font-bold tracking-tight text-slate-400 hover:text-white hover:text-shadow-sm transition-colors cursor-default">
                    {ind}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── WHY ORGANIZATIONS CHOOSE MITRA VERIFY ────────── */}
      <section className="py-24 lg:py-32 relative z-10 bg-[#030712]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.03),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Why Organizations Choose MITRA VERIFY</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for mission-critical identity verification. We combine dense facial landmarks, behavioral biometrics, and active anti-spoofing to deliver zero-trust security.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {WHY_US_FEATURES.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1 }}>
                <TiltCard className="h-full bg-white/[0.01] rounded-2xl p-8 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                  {/* Subtle hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, \${feature.color}, transparent)` }} />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300" style={{ background: `\${feature.color}15`, border: `1px solid \${feature.color}30`, boxShadow: `0 0 20px \${feature.color}10` }}>
                      <feature.icon size={28} color={feature.color} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-[15px]">{feature.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE ANALYTICS DASHBOARD ─────────────────────── */}
      <section className="py-24 lg:py-32 relative z-10 overflow-hidden bg-[#0a0f1e]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#00d4ff]/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Enterprise Operations Center</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Monitor your security posture in real-time. Track verification success rates, block spoof attempts, and analyze global API usage from a single pane of glass.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mx-auto max-w-[1100px]">
            {/* Dashboard Mock Window */}
            <div className="rounded-2xl border border-white/10 bg-[#030712] shadow-[0_30px_100px_-20px_rgba(0,212,255,0.2)] overflow-hidden relative">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-white">Overview</span>
                    <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Logs</span>
                    <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">API Keys</span>
                    <span className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Settings</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <span className="text-xs font-mono text-slate-300">us-east-1</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d4ff] to-[#7c3aed]" />
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-6 md:p-8 bg-gradient-to-b from-[#030712] to-[#0a0f1e]">
                
                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                  {[
                    { label: 'Total Verifications', value: '2.4M', trend: '+18.2%', color: '#00d4ff', up: true },
                    { label: 'Passed', value: '2.1M', trend: '+15.4%', color: '#00ff88', up: true },
                    { label: 'Spoofs Blocked', value: '45.2K', trend: '+2.1%', color: '#ffb800', up: true },
                    { label: 'Avg Latency', value: '342ms', trend: '-45ms', color: '#7c3aed', up: false },
                  ].map((kpi, i) => (
                    <div key={i} className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-current transition-colors opacity-20" style={{ color: kpi.color }} />
                      <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">{kpi.label}</div>
                      <div className="text-3xl font-bold text-white tracking-tight mb-2">{kpi.value}</div>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-medium" style={{ color: kpi.up ? '#00ff88' : '#00d4ff' }}>
                        {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {kpi.trend} this week
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Chart */}
                  <div className="lg:col-span-2 p-6 rounded-xl border border-white/5 bg-white/[0.01] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-sm font-semibold text-white">Verification Volume</div>
                      <div className="text-xs text-slate-500 border border-white/10 px-2 py-1 rounded">30 Days</div>
                    </div>
                    <div className="h-48 flex items-end justify-between px-2 relative z-10">
                      {[...Array(40)].map((_, i) => {
                        const h = Math.random() * 80 + 20;
                        return (
                          <motion.div key={i} className="w-[1.5%] rounded-t-sm"
                            style={{ 
                              height: `\${h}%`, 
                              background: i > 35 ? 'linear-gradient(to top, rgba(0,212,255,0.2), rgba(0,212,255,0.8))' : 'linear-gradient(to top, rgba(255,255,255,0.05), rgba(255,255,255,0.2))',
                              transformOrigin: "bottom"
                            }}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.02 }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Threat Feed */}
                  <div className="p-6 rounded-xl border border-white/5 bg-white/[0.01]">
                    <div className="text-sm font-semibold text-white mb-6">Recent Threats Blocked</div>
                    <div className="space-y-4">
                      {[
                        { type: 'Deepfake (Video)', ip: '192.168.1.1', time: '2m ago', color: '#ff3366' },
                        { type: 'Screen Replay', ip: '10.0.0.4', time: '14m ago', color: '#ffb800' },
                        { type: 'Mask Attack', ip: '172.16.0.1', time: '1h ago', color: '#ff3366' },
                        { type: 'Photo Print', ip: '192.168.0.10', time: '3h ago', color: '#ffb800' },
                      ].map((threat, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: threat.color, boxShadow: `0 0 5px \${threat.color}` }} />
                            <div>
                              <div className="text-[13px] text-white font-medium">{threat.type}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{threat.ip}</div>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500">{threat.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Glow behind dashboard */}
            <div className="absolute -inset-4 bg-gradient-to-b from-[#00d4ff]/10 to-transparent blur-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── ANIMATED VERIFICATION PIPELINE ─────────────────── */}
      <section className="py-24 lg:py-32 relative z-10 bg-[#030712] border-t border-white/5 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7c3aed] mb-4 block flex items-center gap-2">
                <Cpu size={14} /> Neural Processing Pipeline
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Security Architecture</h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                MITRA VERIFY routes every request through a rigorous 5-stage neural pipeline. From spatial bounding to liveness checking and deepfake risk analysis, nothing bypasses the architecture.
              </p>
              
              <Link href="/signup" className="inline-flex items-center gap-2 text-[#00d4ff] font-semibold hover:text-white transition-colors">
                Read the Security Whitepaper <ArrowRight size={16} />
              </Link>
            </motion.div>

            {/* Visual Pipeline */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-[400px] flex flex-col justify-between py-4">
              {/* Connecting vertical line */}
              <div className="absolute left-[27px] top-8 bottom-8 w-px bg-white/10 z-0" />
              {/* Animated glow moving down the line */}
              <motion.div 
                className="absolute left-[26px] w-[3px] h-16 bg-[#00d4ff] rounded-full shadow-[0_0_15px_#00d4ff] z-10"
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />

              {[
                { step: '01', title: 'Face Detection & Bounding', color: '#475569', activeColor: '#00d4ff' },
                { step: '02', title: '478-Point Landmark Extraction', color: '#475569', activeColor: '#00d4ff' },
                { step: '03', title: 'Liveness & Anti-Spoof Engine', color: '#475569', activeColor: '#7c3aed' },
                { step: '04', title: '1:N Identity Matching', color: '#475569', activeColor: '#0066ff' },
                { step: '05', title: 'Access Granted & Token Issued', color: '#475569', activeColor: '#00ff88' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 relative z-20 group">
                  <div className="w-14 h-14 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center font-mono text-sm font-bold text-slate-500 group-hover:border-current group-hover:text-current transition-colors" style={{ color: item.color }} onMouseEnter={(e) => e.currentTarget.style.color = item.activeColor} onMouseLeave={(e) => e.currentTarget.style.color = item.color}>
                    {item.step}
                  </div>
                  <div className="flex-1 p-4 rounded-xl border border-transparent group-hover:border-white/5 group-hover:bg-white/[0.01] transition-all">
                    <div className="text-lg font-semibold text-slate-300 group-hover:text-white transition-colors">{item.title}</div>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── DEVELOPER EXPERIENCE (CODE INTEGRATION) ────────── */}
      <section className="py-24 lg:py-32 relative z-10 bg-[#0a0f1e] border-t border-white/5 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Developer First</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Integrate enterprise-grade biometric security into your stack in minutes. We provide strongly-typed SDKs for modern architectures.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-white/10 bg-[#030712] overflow-hidden shadow-2xl">
              
              {/* Terminal Header */}
              <div className="flex justify-between items-center bg-white/[0.02] border-b border-white/10 px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => setActiveCodeTab('typescript')} className={`text-[13px] font-mono px-3 py-1.5 rounded-md transition-colors \${activeCodeTab === 'typescript' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>TypeScript</button>
                  <button onClick={() => setActiveCodeTab('javascript')} className={`text-[13px] font-mono px-3 py-1.5 rounded-md transition-colors \${activeCodeTab === 'javascript' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Node.js</button>
                  <button onClick={() => setActiveCodeTab('python')} className={`text-[13px] font-mono px-3 py-1.5 rounded-md transition-colors \${activeCodeTab === 'python' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Python</button>
                  <button onClick={() => setActiveCodeTab('curl')} className={`text-[13px] font-mono px-3 py-1.5 rounded-md transition-colors \${activeCodeTab === 'curl' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>cURL</button>
                </div>
                <button onClick={handleCopy} className="text-slate-500 hover:text-white transition-colors p-2 rounded-md hover:bg-white/5" title="Copy code">
                  {copied ? <Check size={16} color="#00ff88" /> : <Copy size={16} />}
                </button>
              </div>
              
              {/* Terminal Body */}
              <div className="p-6 overflow-x-auto">
                <pre className="text-[13px] font-mono leading-relaxed text-[#a8b2d1]">
                  {activeCodeTab === 'typescript' && (
                    <>
                      <span className="text-[#c678dd]">import</span> {'{ MitraVerify, VerificationResult }'} <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">'@mitra-verify/sdk'</span>;<br/><br/>
                      <span className="text-[#c678dd]">const</span> client = <span className="text-[#c678dd]">new</span> <span className="text-[#e5c07b]">MitraVerify</span>({'{'}<br/>
                      {'  '}apiKey: process.env.MITRA_API_KEY!<br/>
                      {'}'});<br/><br/>
                      <span className="text-[#c678dd]">export async function</span> <span className="text-[#61afef]">authenticateUser</span>(frame: <span className="text-[#e5c07b]">Buffer</span>, userId: <span className="text-[#e5c07b]">string</span>): <span className="text-[#e5c07b]">Promise</span>{'<'}<span className="text-[#e5c07b]">boolean</span>{'> {'}<br/>
                      {'  '}<span className="text-[#c678dd]">const</span> result: <span className="text-[#e5c07b]">VerificationResult</span> = <span className="text-[#c678dd]">await</span> client.<span className="text-[#61afef]">verifyIdentity</span>({'{'}<br/>
                      {'    '}imageBuffer: frame,<br/>
                      {'    '}userId,<br/>
                      {'    '}requireAntiSpoof: <span className="text-[#d19a66]">true</span>,<br/>
                      {'    '}strictMode: <span className="text-[#d19a66]">true</span><br/>
                      {'  }'});<br/><br/>
                      {'  '}<span className="text-[#c678dd]">return</span> result.status === <span className="text-[#98c379]">"passed"</span> && result.confidence {'>'} <span className="text-[#d19a66]">0.98</span>;<br/>
                      {'}'}
                    </>
                  )}
                  {activeCodeTab === 'javascript' && CODE_EXAMPLES.javascript}
                  {activeCodeTab === 'python' && CODE_EXAMPLES.python}
                  {activeCodeTab === 'curl' && CODE_EXAMPLES.curl}
                </pre>
              </div>
              
              {/* Terminal Footer */}
              <div className="bg-[#00d4ff]/10 border-t border-[#00d4ff]/20 px-6 py-3 flex items-center gap-3">
                <Terminal size={14} color="#00d4ff" />
                <span className="text-[12px] font-mono text-[#00d4ff]">npm install @mitra-verify/sdk</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── API COMPARISON ─────────────────────────────────── */}
      <section className="py-24 lg:py-32 relative z-10 bg-[#030712] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00d4ff] mb-4 block">THREE POWERFUL APIs</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Choose Your Verification Level</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">From frictionless 1-second liveness checks to high-assurance enterprise identity validation.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {API_PRODUCTS.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col h-full bg-[#0a0f1e] p-8 rounded-2xl border transition-colors group" style={{ borderColor: product.border }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `\${product.color}15`, border: `1px solid \${product.color}30` }}>
                    <product.icon size={26} color={product.color} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: product.color }}>{product.securityLevel}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Security Level</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{product.name}</h3>
                <div className="text-sm text-slate-400 mb-6 min-h-[40px] leading-relaxed">{product.useCase}</div>
                
                <div className="font-mono text-[11px] px-3 py-2 rounded-lg mb-6 truncate" style={{ color: product.color, background: `\${product.color}10`, border: `1px solid \${product.color}20` }}>
                  {product.endpoint}
                </div>
                
                <div className="space-y-4 flex-grow mb-8">
                  {product.checks.map(check => (
                    <div key={check} className="flex items-start gap-3">
                      <CheckCircle size={16} color={product.color} className="mt-0.5 shrink-0" />
                      <span className="text-[14px] text-slate-300 font-medium">{check}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Latency Target</div>
                    <div className="text-base font-bold text-white">{product.target}</div>
                  </div>
                  <Link href={`/demo/\${product.id}`} className="flex items-center gap-2 text-sm font-bold transition-transform hover:translate-x-1" style={{ color: product.color }}>
                    Try Demo <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section className="py-32 relative z-10 overflow-hidden bg-[#030712] border-t border-white/5">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-[#0a0f1e] to-[#030712] p-12 md:p-24 rounded-[40px] text-center border border-white/10 relative overflow-hidden shadow-[0_0_100px_rgba(0,212,255,0.05)]">
            
            {/* Massive background glows */}
            <div className="absolute -top-[50%] -left-[10%] w-[800px] h-[800px] bg-[#00d4ff]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute -bottom-[50%] -right-[10%] w-[800px] h-[800px] bg-[#7c3aed]/10 rounded-full blur-[150px] pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">Secure Identity Verification Starts Here</h2>
              <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed">
                Deploy enterprise-grade biometric authentication in minutes. Stop identity fraud, eliminate deepfakes, and build profound trust with your users.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/signup" className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white text-lg transition-all duration-300 bg-transparent rounded-2xl overflow-hidden hover:scale-[1.02] w-full sm:w-auto">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88]" />
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center gap-2">Start Building Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></span>
                </Link>
                <Link href="/contact" className="group inline-flex items-center justify-center px-10 py-5 font-bold text-white text-lg transition-all duration-300 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] w-full sm:w-auto">
                  Book a Demo
                </Link>
              </div>
              
              <p className="mt-10 text-[13px] text-slate-500 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-4">
                <span><CheckCircle size={14} className="inline mr-1 mb-0.5 text-[#00ff88]" /> No credit card</span>
                <span><CheckCircle size={14} className="inline mr-1 mb-0.5 text-[#00ff88]" /> 10k free API calls/mo</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

function TrendingUp(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
}

function TrendingDown(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>;
}
