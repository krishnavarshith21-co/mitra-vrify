'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';
import Global3DBackground from '@/components/cyber/Global3DBackground';
import { Shield, Eye, Lock, Cpu, Globe, Database } from 'lucide-react';

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0f1e] relative text-slate-300 font-sans selection:bg-[#00d4ff]/30">
        <Navbar />
        
        {/* Abstract Particle / Neural Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <Global3DBackground />
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#00d4ff]/[0.05] to-transparent" />
        </div>

        <main className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          {/* Hero Section */}
          <div className="text-center mb-24 animate-fade-up">
            <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
              ABOUT NEXT STEP INNOVATORS
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Securing the <span className="gradient-text-cyan">Digital Frontier</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              We build military-grade biometric infrastructure for the modern enterprise. 
              Our mission is to eliminate identity fraud through advanced AI, while 
              protecting user privacy with zero-trust architecture.
            </p>
          </div>

          {/* Core Philosophy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32 animate-fade-up animate-delay-1">
            <div className="premium-glass p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-slate-400 leading-relaxed">
                To provide developers and enterprises with the most robust, accessible, and 
                secure face liveness and identity verification infrastructure. We believe 
                that world-class security shouldn't require compromising on user experience 
                or privacy.
              </p>
            </div>
            <div className="premium-glass p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-slate-400 leading-relaxed">
                A digital ecosystem where identity theft and spoofing are fundamentally 
                impossible. We are building the foundational layers of a trust-first internet, 
                powered by cutting-edge neural networks and secure hardware enclaves.
              </p>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="mb-32 animate-fade-up animate-delay-2">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">The Engine Behind MITRA VERIFY</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Our proprietary verification pipeline processes 478 facial landmarks in real-time, 
                backed by an enterprise-grade infrastructure stack.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Eye, title: 'Edge Face Detection', desc: 'MediaPipe-powered client-side models instantly locate faces and eyes without server latency.' },
                { icon: Shield, title: 'Liveness Engine', desc: 'Multi-modal analysis detects micro-movements, texture, and specular reflections to defeat masks and screens.' },
                { icon: Lock, title: 'Anti-Spoof Networks', desc: 'Convolutional neural networks trained on millions of adversarial attack vectors to prevent deepfakes.' },
                { icon: Database, title: 'Identity Verification', desc: 'High-dimensional vector embedding matching for 1:1 and 1:N biometric searches.' },
                { icon: Cpu, title: 'Distributed Inference', desc: 'FastAPI backends deployed across edge nodes utilizing specialized hardware for sub-second responses.' },
                { icon: Globe, title: 'API Infrastructure', desc: 'Next.js edge routing, rate limiting, and highly available architecture designed for 99.99% uptime.' }
              ].map((tech, idx) => (
                <div key={idx} className="premium-glass p-6 rounded-xl border border-white/5">
                  <tech.icon size={28} color="#00d4ff" className="mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{tech.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About the Team */}
          <div className="text-center animate-fade-up animate-delay-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-6">
              <Shield size={32} color="#00ff88" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Powered by Next Step Innovators</h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
              We are a team of security researchers, machine learning engineers, and distributed 
              systems architects dedicated to building the future of authentication. MITRA VERIFY 
              is our flagship platform, designed to bring enterprise-grade biometric security 
              to organizations of all sizes.
            </p>
            <div className="text-sm font-mono text-slate-500 uppercase tracking-widest">
              Building Trust. Securing Identity.
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
