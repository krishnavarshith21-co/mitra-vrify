'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';
import Global3DBackground from '@/components/cyber/Global3DBackground';
import EnterpriseArchitecture from '@/components/home/EnterpriseArchitecture';
import EnterpriseBenefits from '@/components/home/EnterpriseBenefits';
import { 
  Shield, Eye, Lock, Cpu, Globe, Database, Fingerprint, Activity,
  AlertTriangle, Server, Network, Code2, Users, CheckCircle, Zap
} from 'lucide-react';

const FEATURES = [
  { icon: Lock, title: 'API Key Auth', desc: 'Secure SHA-256 hashed API keys with rate limiting and per-key analytics.' },
  { icon: Activity, title: 'Real-Time Analytics', desc: 'Full request logs, spoof detection rates, and identity matching metrics.' },
  { icon: Code2, title: 'Multi-Language SDKs', desc: 'JavaScript, TypeScript, Python, Node.js, React, and cURL examples.' },
  { icon: Globe, title: 'Global Deployment', desc: 'Enterprise-ready infrastructure hosted globally with multi-region redundancy.' },
  { icon: Shield, title: 'Anti-Spoof Engine', desc: 'Detects print attacks, video replays, deepfakes, and screen spoofs.' },
  { icon: Eye, title: 'MediaPipe Powered', desc: '478 facial landmarks, iris tracking, and head pose estimation.' },
];

const API_PRODUCTS = [
  {
    name: 'Fast Liveness API',
    icon: Zap,
    color: '#00d4ff',
    gradient: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,102,255,0.05))',
    border: 'rgba(0,212,255,0.2)',
    target: '< 1 second',
    accuracy: '90%',
    useCase: 'Quick user verification, web logins',
  },
  {
    name: 'Advanced Anti-Spoof',
    icon: Shield,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(0,212,255,0.05))',
    border: 'rgba(124,58,237,0.2)',
    target: '2–4 seconds',
    accuracy: '97%',
    useCase: 'Banking, KYC, high-security apps',
  },
  {
    name: 'Enterprise Identity',
    icon: Fingerprint,
    color: '#00ff88',
    gradient: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,102,255,0.05))',
    border: 'rgba(0,255,136,0.2)',
    target: '3–6 seconds',
    accuracy: '99%',
    useCase: 'Enterprise security, continuous auth',
  },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[var(--bg-primary)] relative text-slate-300 font-sans selection:bg-[#00d4ff]/30">
        <Navbar />
        
        {/* Abstract Particle / Neural Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <Global3DBackground />
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#00d4ff]/[0.05] to-transparent" />
        </div>

        <main className="relative z-10 w-full pt-32 pb-24">
          <div className="section-container">
            {/* 1. About MITRA VERIFY (Hero Section) */}
            <div className="text-center mb-32 animate-fade-up">
              <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
                ABOUT MITRA VERIFY
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
                Securing the <span className="gradient-text-cyan glow-cyan">Digital Frontier</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
                We build military-grade biometric infrastructure for the modern enterprise. 
                Our mission is to eliminate identity fraud through advanced AI, while 
                protecting user privacy with zero-trust architecture.
              </p>
            </div>

            {/* 2. Why MITRA VERIFY Exists */}
            <div className="mb-32">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Why We Exist</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  The internet was built without an identity layer. Today, organizations face unprecedented threats from generative AI and automated attacks.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Identity Fraud', desc: 'Synthetic identities and stolen credentials costing billions annually.', icon: Users },
                  { title: 'Deepfake Threats', desc: 'Hyper-realistic AI-generated video and audio bypassing legacy systems.', icon: Cpu },
                  { title: 'Replay Attacks', desc: 'Malicious actors injecting pre-recorded streams into verification flows.', icon: AlertTriangle },
                  { title: 'Spoofing Attacks', desc: 'High-res masks, 3D models, and screen-to-screen attacks defeating 2D checks.', icon: Shield },
                ].map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                    className="glass card-hover p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff3366]/5 rounded-full blur-2xl group-hover:bg-[#ff3366]/10 transition-colors duration-500" />
                    <item.icon size={28} color="#ff3366" className="mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 3. Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="premium-glass p-10 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#00d4ff]/10 rounded-full blur-[80px]" />
                <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Our Mission</h2>
                <p className="text-slate-400 leading-relaxed relative z-10 text-lg">
                  To provide developers and enterprises with the most robust, accessible, and 
                  secure face liveness and identity verification infrastructure. We believe 
                  that world-class security shouldn't require compromising on user experience 
                  or privacy.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="premium-glass p-10 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-[80px]" />
                <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Our Vision</h2>
                <p className="text-slate-400 leading-relaxed relative z-10 text-lg">
                  A digital ecosystem where identity theft and spoofing are fundamentally 
                  impossible. We are building the foundational layers of a trust-first internet, 
                  powered by cutting-edge neural networks and secure hardware enclaves.
                </p>
              </motion.div>
            </div>

            {/* 4. How MITRA VERIFY Works */}
            <div className="mb-32">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">How Verification Works</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  A seamless pipeline from capture to cryptographic assurance.
                </p>
              </motion.div>

              <div className="flex flex-col md:flex-row justify-between items-center relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#00d4ff]/10 via-[#7c3aed]/10 to-[#00ff88]/10 -z-10 -translate-y-1/2" />
                
                {[
                  { label: 'Face Detection', icon: Eye, color: '#00d4ff' },
                  { label: 'Landmark Mapping', icon: Activity, color: '#00d4ff' },
                  { label: 'Liveness Engine', icon: Zap, color: '#7c3aed' },
                  { label: 'Anti-Spoof', icon: Shield, color: '#7c3aed' },
                  { label: 'Identity Matching', icon: Fingerprint, color: '#00ff88' },
                  { label: 'Secure Access', icon: Lock, color: '#00ff88' }
                ].map((step, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center gap-4 my-4 md:my-0 group">
                    <div className="w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300 bg-[#0a0f1e]"
                      style={{ boxShadow: `0 0 20px ${step.color}20`, borderColor: `${step.color}40` }}>
                      <step.icon size={24} color={step.color} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 tracking-wider uppercase text-center max-w-[100px]">{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 5. Core Verification APIs */}
            <div className="mb-32">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Core Verification APIs</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Adaptable endpoints for every security posture.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {API_PRODUCTS.map((product, i) => (
                  <motion.div key={product.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="card-hover p-6 rounded-2xl flex flex-col h-full"
                    style={{ background: product.gradient, border: `1px solid ${product.border}` }}>
                    <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center" style={{ background: `${product.color}15`, border: `1px solid ${product.color}30` }}>
                      <product.icon size={24} color={product.color} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-grow">{product.useCase}</p>
                    <div className="grid grid-cols-2 gap-4 mt-auto border-t border-white/5 pt-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Accuracy</div>
                        <div className="font-bold" style={{ color: product.color }}>{product.accuracy}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Speed</div>
                        <div className="font-bold text-slate-300">{product.target}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 6. Everything You Need (Migrated) */}
            <div className="mb-32">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">Production-ready platform with zero compromises.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((feature, i) => (
                  <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="glass card-hover p-6 rounded-2xl border border-white/5 h-full">
                    <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center mb-6">
                      <feature.icon size={20} color="#00d4ff" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 7. Technology Stack */}
            <div className="mb-32">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Modern Technology Stack</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">Built on the most powerful and scalable technologies available today.</p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['Next.js', 'TypeScript', 'MediaPipe', 'FastAPI', 'PostgreSQL', 'Vercel'].map((tech, idx) => (
                  <motion.div key={tech} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                    className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:border-[#00d4ff]/30 hover:bg-white/[0.02] transition-colors">
                    <span className="font-bold text-slate-200 tracking-wide">{tech}</span>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

          {/* 8. Built For Enterprise Scale (Migrated) */}
          <EnterpriseArchitecture />

          {/* 9. Security Layers / Enterprise Benefits (Migrated) */}
          <EnterpriseBenefits />

          <div className="section-container mt-32">
            {/* 10. Powered By Next Step Innovators */}
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
              className="premium-glass p-12 rounded-3xl text-center border border-white/10 relative overflow-hidden mb-32 shadow-[0_0_50px_rgba(0,212,255,0.05)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-full bg-gradient-to-b from-[#00d4ff]/10 to-transparent pointer-events-none" />
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#0066ff]/20 border border-[#00d4ff]/30 mb-8 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                <Shield size={36} color="#00d4ff" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Building the Future of Trust and Identity</h2>
              <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
                Powered by Next Step Innovators, a team of security researchers, machine learning engineers, and distributed 
                systems architects dedicated to building the future of authentication. MITRA VERIFY 
                is our flagship platform, designed to bring enterprise-grade biometric security 
                to organizations of all sizes.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-mono text-slate-300 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                Live in Production
              </div>
            </motion.div>

            {/* 11. Future Vision */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">The Next-Generation Biometric Security Platform</h3>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Continuous authentication, zero-knowledge proofs, and decentralized identity. The journey has just begun.
              </p>
            </motion.div>
          </div>

        </main>
      </div>
    </PageTransition>
  );
}
