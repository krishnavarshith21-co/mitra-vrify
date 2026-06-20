'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, Suspense, lazy, Component } from 'react';
import Link from 'next/link';
import {
  Zap, Shield, Fingerprint, ArrowRight, CheckCircle, Code2,
  Activity, Eye, Lock, Globe, Star, ChevronRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import AuthenticatedDashboard from '@/components/AuthenticatedDashboard';
import type { ScanPhase } from '@/components/3d/HeroScene';

// Dynamically import 3D scene to avoid SSR issues
const HeroScene = lazy(() => import('@/components/3d/HeroScene'));

// Local error boundary that silently catches 3D / WebGL crashes
// so the rest of the homepage is never blanked by a Three.js failure.
class HeroSceneErrorBoundary extends Component<{ children: React.ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(error: Error) { console.warn('[HeroScene] 3D render failed silently:', error.message); }
  render() {
    if (this.state.crashed) {
      // Graceful fallback: gradient background instead of blank
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

const PHASES = [
  { id: 'searching', label: 'Searching for Face', color: '#ffb800' },
  { id: 'detected', label: 'Face Detected', color: '#00d4ff' },
  { id: 'landmarks', label: 'Generating 478 Landmarks', color: '#00d4ff' },
  { id: 'liveness', label: 'Liveness Verification', color: '#7c3aed' },
  { id: 'identity', label: 'Identity Matching', color: '#0066ff' },
  { id: 'granted', label: 'Access Granted', color: '#00ff88' },
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
    accuracy: '90%',
    endpoint: 'POST /api/v1/liveness/basic',
    checks: ['Blink Detection', 'Mouth Movement', 'Smile Detection', 'Head Rotation', 'Face Presence'],
    useCase: 'Quick user verification, web logins',
  },
  {
    id: 'advanced',
    name: 'Advanced Anti-Spoof',
    icon: Shield,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))',
    border: 'rgba(124,58,237,0.2)',
    target: '2–4 seconds',
    accuracy: '97%',
    endpoint: 'POST /api/v1/liveness/advanced',
    checks: ['Challenge Response', 'Replay Attack Detection', 'Video Spoof Detection', 'Deepfake Risk', 'Lighting Analysis'],
    useCase: 'Banking, KYC, high-security apps',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Identity',
    icon: Fingerprint,
    color: '#00ff88',
    gradient: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,102,255,0.05))',
    border: 'rgba(0,255,136,0.2)',
    target: '3–6 seconds',
    accuracy: '99%',
    endpoint: 'POST /api/v1/identity/verify',
    checks: ['Face Recognition', 'Eye Tracking', 'Continuous Verification', 'Multiple Face Detection', 'Deepfake Detection'],
    useCase: 'Enterprise security, continuous auth',
  },
];

const FEATURES = [
  { icon: Lock, title: 'API Key Auth', desc: 'Secure SHA-256 hashed API keys with rate limiting and per-key analytics.' },
  { icon: Activity, title: 'Real-Time Analytics', desc: 'Full request logs, spoof detection rates, and identity matching metrics.' },
  { icon: Code2, title: 'Multi-Language SDKs', desc: 'JavaScript, TypeScript, Python, Node.js, React, and cURL examples.' },
  { icon: Globe, title: 'Open Source', desc: 'Fully open source under MIT license. Self-host, contribute, and extend.' },
  { icon: Shield, title: 'Anti-Spoof Engine', desc: 'Detects print attacks, video replays, deepfakes, and screen spoofs.' },
  { icon: Eye, title: 'MediaPipe Powered', desc: '478 facial landmarks, iris tracking, and head pose estimation.' },
];

const CODE_EXAMPLE = `import requests

# Initialize with your API key
api_key = "mv_basic_xxxxxxxxxxxxx"

# Send image for liveness check
response = requests.post(
  "http://localhost:8005/api/v1/liveness/basic",
  headers={"X-API-Key": api_key},
  json={"image": "<base64_image>"}
)

result = response.json()
print(f"Result: {result['result']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Liveness: {result['liveness_score']:.2%}")
# Output:
# Result: pass
# Confidence: 93.45%
# Liveness: 91.20%`;

function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {PHASES.map((phase, i) => (
        <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            animate={{
              background: i === currentPhase ? phase.color : i < currentPhase ? '#00ff88' : 'rgba(255,255,255,0.1)',
              scale: i === currentPhase ? 1.2 : 1,
            }}
            transition={{ duration: 0.3 }}
            style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }}
          />
          <motion.span
            animate={{
              color: i === currentPhase ? phase.color : i < currentPhase ? '#94a3b8' : '#475569',
              fontWeight: i === currentPhase ? 600 : 400,
            }}
            style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {phase.label}
          </motion.span>
          {i === currentPhase && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ width: 20, height: 1, background: phase.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // ── Scroll tracking: track viewport scroll directly without target ref ──────
  // This completely avoids the Framer Motion "Target ref is defined but not hydrated" error.
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    const interval = setInterval(() => {
      setCurrentPhase(p => (p + 1) % PHASES.length);
    }, 2500);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <Navbar />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }}
        />
        <p style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>Verifying session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <AuthenticatedDashboard />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <motion.section
        ref={heroRef}
        style={mounted ? { opacity: heroOpacity } : {}}
        className="grid-bg relative min-h-[90dvh] lg:min-h-[100dvh] flex items-center pt-8 pb-8 md:pt-20 md:pb-16 lg:pt-0 lg:pb-0 overflow-hidden"
      >
        {/* Gradient overlays */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(3,7,18,0.7))',
          zIndex: 1, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
          background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Hero Content */}
        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Text & Stats */}
            <div className="lg:col-span-7 flex flex-col gap-4 lg:gap-6">
              {/* Open Source Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: 8 }}
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 8px', borderRadius: 20,
                    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
                    textDecoration: 'none',
                  }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, background: 'rgba(0,212,255,0.15)', color: '#00d4ff',
                    padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                  }}>
                    <Star size={10} fill="#00d4ff" /> Open Source
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Free forever · MIT License</span>
                  <ArrowRight size={12} color="#94a3b8" />
                </a>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: 'clamp(2rem, 1.5rem + 3vw, var(--text-5xl))', fontWeight: 800,
                  letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 8,
                }}
              >
                Enterprise
                <br />
                <span className="gradient-text-cyan glow-cyan">Face Liveness</span>
                <br />
                & Identity APIs
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ fontSize: 'var(--text-base)', color: '#94a3b8', lineHeight: 1.7, maxWidth: 'min(520px, 100%)', marginBottom: 16 }}
              >
                Production-ready biometric verification platform. Face liveness detection,
                anti-spoof, and continuous identity authentication — all open source.
              </motion.p>

               {!isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
                >
                  <Link href="/auth/signup" className="btn-primary w-full sm:flex-1 flex items-center justify-center" style={{ textDecoration: 'none', height: 48, minHeight: 48 }}>
                    Start Building Free <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link href="/demo/basic" className="btn-ghost w-full sm:flex-1 flex items-center justify-center" style={{ textDecoration: 'none', height: 48, minHeight: 48 }}>
                    <Eye size={16} className="mr-2" /> Try Live Demo
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
                >
                  <Link href="/dashboard" className="btn-primary w-full sm:flex-1 flex items-center justify-center" style={{ textDecoration: 'none', height: 48, minHeight: 48 }}>
                    Go To Dashboard <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link href="/developer" className="btn-ghost w-full sm:flex-1 flex items-center justify-center" style={{ textDecoration: 'none', height: 48, minHeight: 48 }}>
                    Open API Console
                  </Link>
                  <Link href="/docs" className="btn-ghost w-full sm:flex-1 flex items-center justify-center" style={{ textDecoration: 'none', height: 48, minHeight: 48 }}>
                    View Documentation
                  </Link>
                </motion.div>
              )}

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 lg:mt-6 w-full"
              >
                {[
                  { value: '99%', label: 'Max Accuracy', color: '#00ff88' },
                  { value: '< 1s', label: 'Fast Mode', color: '#00d4ff' },
                  { value: '3 APIs', label: 'Products', color: '#7c3aed' },
                  { value: 'MIT', label: 'License', color: '#ffb800' },
                ].map(stat => (
                  <div key={stat.label} className="glass card-hover" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white tracking-tight" style={{ lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: HUD & Globe Animation */}
            <div className="lg:col-span-5 flex flex-col gap-6 items-center">
              {/* HUD Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass scan-line w-full"
                style={{
                  padding: 24, borderRadius: 16,
                  border: '1px solid rgba(0,212,255,0.15)',
                  background: 'rgba(3,7,18,0.7)',
                }}
              >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    BIOMETRIC SCAN
                  </span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}
                  >
                    ● LIVE
                  </motion.span>
                </div>
                <PhaseIndicator currentPhase={currentPhase} />
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <motion.div
                    key={currentPhase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontSize: 11, color: PHASES[currentPhase].color,
                      fontFamily: 'monospace',
                      padding: '8px 12px', borderRadius: 6,
                      background: `${PHASES[currentPhase].color}11`,
                      border: `1px solid ${PHASES[currentPhase].color}22`,
                    }}
                  >
                    STATUS: {PHASES[currentPhase].label.toUpperCase()}
                  </motion.div>
                </div>
              </motion.div>

              {/* 3D Canvas Box */}
              <div className="w-full h-[240px] sm:h-[300px] lg:h-[420px] relative">
                {mounted && (
                  <HeroSceneErrorBoundary>
                    <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,212,255,0.03), transparent)' }} />}>
                      <HeroScene phase={PHASES[currentPhase].id as ScanPhase} />
                    </Suspense>
                  </HeroSceneErrorBoundary>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── API PRODUCTS ─────────────────────────────────── */}
      <section style={{ background: 'var(--bg-secondary)' }} className="section-padding">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}
          >
            <span className="text-label" style={{ color: '#00d4ff', display: 'block', marginBottom: 'var(--space-2)' }}>
              THREE POWERFUL APIs
            </span>
            <h2 className="heading-section" style={{ marginBottom: 'var(--space-2)' }}>
              Choose Your Verification Level
            </h2>
            <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 560, margin: '0 auto' }}>
              From fast 1-second liveness checks to enterprise-grade continuous authentication
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {API_PRODUCTS.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover"
                style={{
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)',
                  background: product.gradient,
                  border: `1px solid ${product.border}`,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column' as const, height: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${product.color}15`,
                    border: `1px solid ${product.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <product.icon size={22} color={product.color} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: product.color }}>{product.accuracy}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Accuracy</div>
                  </div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>{product.name}</h3>

                <div style={{
                  fontFamily: 'monospace', fontSize: 11, color: product.color,
                  background: `${product.color}0d`, padding: '6px 10px', borderRadius: 6,
                  marginBottom: 'var(--space-2)', display: 'inline-block',
                }}>
                  {product.endpoint}
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  {product.checks.map(check => (
                    <div key={check} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <CheckCircle size={13} color={product.color} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{check}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>Target Speed</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{product.target}</div>
                  </div>
                  <Link href={`/demo/${product.id === 'basic' ? 'basic' : product.id === 'advanced' ? 'advanced' : 'enterprise'}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 13, color: product.color, textDecoration: 'none', fontWeight: 600,
                    }}>
                    Try Demo <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
            <Link href="/compare" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Full API Comparison <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CODE EXAMPLE ─────────────────────────────────── */}
      <section style={{ background: 'var(--bg-primary)' }} className="section-padding">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', fontWeight: 600, display: 'block', marginBottom: 16 }}>
                DEVELOPER FIRST
              </span>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>
                Integrate in
                <br />
                <span className="gradient-text-green">minutes, not days</span>
              </h2>
              <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
                One API call. Real MediaPipe-powered face analysis. Instant structured responses
                with confidence scores, landmark data, and spoof detection.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[
                  'JavaScript, TypeScript, Python, Node SDKs',
                  'OpenAPI / Swagger documentation included',
                  'Real response with confidence scores',
                  'Full request logging and audit trails',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={11} color="#00ff88" />
                    </div>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/docs" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} /> View Documentation
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="terminal">
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12, overflowX: 'auto' }}>
                  <span className="comment"># Install and integrate MITRA VERIFY</span>{'\n'}
                  <span className="prompt">$ </span><span className="keyword">pip install</span> <span className="string">requests</span>{'\n\n'}
                  {CODE_EXAMPLE.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.startsWith('#') ? <span className="comment">{line}</span>
                        : line.includes('"') ? line.replace(/"([^"]+)"/g, '<q>"$1"</q>').includes('<q>') ? line : line
                        : line}
                      {'\n'}
                    </span>
                  ))}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section style={{ background: 'var(--bg-secondary)' }} className="section-padding">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Everything You Need
            </h2>
            <p style={{ fontSize: 16, color: '#94a3b8' }}>
              Production-ready platform with zero compromises
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass card-hover"
                style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', height: '100%' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <feature.icon size={20} color="#00d4ff" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="section-container" style={{ maxWidth: 720, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-bright px-6 py-12 md:px-12 md:py-16 rounded-3xl"
          >
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px',
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0,212,255,0.3)',
            }}>
              <Eye size={28} color="#fff" />
            </div>
            {!isAuthenticated ? (
              <>
                <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
                  Open Source & Free Forever
                </h2>
                <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                  No subscriptions. No hidden fees. No rate limit walls. Fork it, self-host it, contribute to it.
                  Enterprise biometrics for everyone.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/auth/signup" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                    Create Free Account <ArrowRight size={16} />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
                  Welcome Back, {user?.name || 'Developer'}
                </h2>
                <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                  You are authenticated. Access your dashboard, configure API keys, and launch verification sessions.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                    Open Dashboard <ArrowRight size={16} />
                  </Link>
                  <Link href="/developer" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                    Developer Portal
                  </Link>
                  <Link href="/developer" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                    Manage API Keys
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
