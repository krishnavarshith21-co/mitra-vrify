'use client';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import { 
  Zap, Shield, Fingerprint, CheckCircle, X, 
  Camera, Eye, Lock, Activity, Scan, 
  Users, Globe, Server, FileText, ArrowRight,
  Network, ShieldAlert,
  Twitter, Github, Linkedin
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';
import AnimatedCounter from '@/components/cyber/AnimatedCounter';

const BiometricSphere = () => {
  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[100px]" />
      
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-cyan-500/20"
        style={{ borderStyle: 'dashed' }}
      />
      
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 rounded-full border border-cyan-400/30"
      />
      
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute inset-16 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 border-b-cyan-400"
      />
      
      {/* Scanning Ring */}
      <motion.div
        animate={{ y: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-1 bg-cyan-400/50 shadow-[0_0_20px_4px_rgba(34,211,238,0.4)] z-10"
      />
      
      <div className="absolute z-20 flex flex-col items-center justify-center">
        <Scan className="w-24 h-24 text-cyan-400 opacity-80" strokeWidth={1} />
        <div className="mt-4 font-mono text-xs text-cyan-400/80 uppercase tracking-[0.2em] bg-cyan-950/50 px-3 py-1 rounded-full backdrop-blur-sm border border-cyan-500/20">
          Analyzing Matrix
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

const ComparisonBar = ({ label, basic, advanced, enterprise, color }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="mb-6 last:mb-0">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      </div>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={isInView ? { width: `${basic}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-cyan-500/40 relative group"
        >
          <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <motion.div 
          initial={{ width: 0 }}
          animate={isInView ? { width: `${advanced - basic}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="h-full bg-violet-500/60 relative group border-l border-black/20"
        >
          <div className="absolute inset-0 bg-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <motion.div 
          initial={{ width: 0 }}
          animate={isInView ? { width: `${enterprise - advanced}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="h-full bg-emerald-500/80 relative group border-l border-black/20"
        >
          <div className="absolute inset-0 bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>
      <div className="flex justify-between text-[10px] mt-1 text-slate-500 uppercase font-mono tracking-wider">
        <span>Basic</span>
        <span>Advanced</span>
        <span>Enterprise</span>
      </div>
    </div>
  );
};

export default function ComparePage() {
  return (
    <PageTransition>
      {/* Global Wrapper forcing dark mode aesthetic */}
      <div className="min-h-screen bg-[#060B14] text-slate-200 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-900/20 blur-[120px]" />
        </div>

        <Navbar />

        <main className="relative z-10 pt-32 pb-24">
          
          {/* HERO SECTION */}
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-8 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  API VERSION 2.0 LIVE
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                  Enterprise <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">
                    Verification APIs
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                  Enterprise-grade face liveness, anti-spoofing and identity verification APIs designed for banking, healthcare, government, and AI platforms.
                </p>

                <div className="flex flex-wrap gap-4">
                  {['ISO 27001', 'SOC2 Type II', '99.99% Uptime', '<300ms Latency'].map((chip, i) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      key={chip} 
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium text-slate-300"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      {chip}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="hidden lg:block"
              >
                <BiometricSphere />
              </motion.div>
            </div>
          </section>

          {/* API CARDS SECTION */}
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Basic Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-cyan-500/30 to-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full bg-[#0a101d]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Zap className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase border border-cyan-500/20">
                        Fast
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Fast Liveness</h3>
                    <p className="text-slate-400 text-sm mb-4 min-h-[40px]">Ultra-fast passive detection for frictionless onboarding.</p>
                    <code className="text-xs text-cyan-400/80 font-mono bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/10 block mb-8">
                      /api/v1/liveness/basic
                    </code>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Avg. Response</span>
                        <span className="text-white font-medium">&lt; 1.2s</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Accuracy</span>
                        <span className="text-white font-medium">92%</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Security Level</span>
                        <span className="text-white font-medium">Standard</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/demo/basic" className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#060B14] font-semibold text-sm text-center transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
                      Launch Demo
                    </Link>
                    <Link href="/docs" className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm text-center transition-colors">
                      Documentation
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-violet-500/40 to-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                
                <div className="relative h-full bg-[#0a101d]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                        <Shield className="w-6 h-6 text-violet-400" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-mono tracking-widest uppercase border border-violet-500/20">
                        Secure
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Anti-Spoof</h3>
                    <p className="text-slate-400 text-sm mb-4 min-h-[40px]">Active challenge-response to prevent presentation attacks.</p>
                    <code className="text-xs text-violet-400/80 font-mono bg-violet-950/50 px-2 py-1 rounded border border-violet-500/10 block mb-8">
                      /api/v1/liveness/advanced
                    </code>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Avg. Response</span>
                        <span className="text-white font-medium">2.5s</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Accuracy</span>
                        <span className="text-white font-medium">98.5%</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Security Level</span>
                        <span className="text-white font-medium">High</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/demo/advanced" className="flex-1 py-3 px-4 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm text-center transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                      Launch Demo
                    </Link>
                    <Link href="/docs" className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm text-center transition-colors">
                      Documentation
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Enterprise Card */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-emerald-500/40 to-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                
                <div className="relative h-full bg-[#0a101d]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Fingerprint className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono tracking-widest uppercase border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        Enterprise
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Enterprise Identity</h3>
                    <p className="text-slate-400 text-sm mb-4 min-h-[40px]">Full verification with continuous session monitoring.</p>
                    <code className="text-xs text-emerald-400/80 font-mono bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/10 block mb-8">
                      /api/v1/identity/verify
                    </code>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Avg. Response</span>
                        <span className="text-white font-medium">3.8s</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Accuracy</span>
                        <span className="text-white font-medium">99.9%</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500 text-sm">Security Level</span>
                        <span className="text-emerald-400 font-medium">Maximum</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href="/demo/enterprise" className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#060B14] font-semibold text-sm text-center transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                      Launch Demo
                    </Link>
                    <Link href="/docs" className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm text-center transition-colors">
                      Documentation
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* VISUAL COMPARISON */}
          <section className="max-w-4xl mx-auto px-6 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Performance Metrics</h2>
              <p className="text-slate-400">Benchmark comparison across our API tiers.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <ComparisonBar label="Speed & Low Latency" basic={90} advanced={60} enterprise={40} />
              <ComparisonBar label="Overall Security" basic={40} advanced={80} enterprise={100} />
              <ComparisonBar label="AI Deepfake Detection" basic={30} advanced={85} enterprise={100} />
              <ComparisonBar label="Identity Match Accuracy" basic={10} advanced={50} enterprise={100} />
              <ComparisonBar label="Spoof Resistance" basic={50} advanced={90} enterprise={100} />
            </div>
          </section>

          {/* INTERACTIVE TIMELINE */}
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Verification Pipeline</h2>
              <p className="text-slate-400">The end-to-end flow of an enterprise identity request.</p>
            </div>

            <div className="relative pt-10 pb-20 overflow-x-auto hide-scrollbar">
              <div className="min-w-[800px] flex justify-between items-center relative px-10">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-white/10 -translate-y-1/2" />
                
                {[
                  { icon: Camera, label: "Capture", desc: "Hi-res frame extraction" },
                  { icon: Scan, label: "Detection", desc: "Face box localization" },
                  { icon: Activity, label: "Liveness", desc: "Passive/Active checks" },
                  { icon: ShieldAlert, label: "Anti-Spoof", desc: "Texture & depth analysis" },
                  { icon: Fingerprint, label: "Enrollment", desc: "Template generation" },
                  { icon: CheckCircle, label: "Verified", desc: "Signed JWT response", isLast: true }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, y: -10 }}
                    className="relative z-10 group cursor-pointer flex flex-col items-center"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300
                      ${step.isLast ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-[#0a101d] border-cyan-500/30 group-hover:bg-cyan-500/20 group-hover:border-cyan-400'} 
                      border`}
                    >
                      <step.icon className={`w-7 h-7 ${step.isLast ? 'text-emerald-400' : 'text-cyan-400'}`} />
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{step.label}</div>
                    <div className="absolute top-full mt-2 w-32 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 pointer-events-none">
                      {step.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURE MATRIX */}
          <section className="max-w-5xl mx-auto px-6 mb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Feature Matrix</h2>
              <p className="text-slate-400">Detailed capability breakdown per tier.</p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-6 font-medium text-slate-300 w-2/5">Capability</th>
                    <th className="p-6 font-medium text-cyan-400">Fast Liveness</th>
                    <th className="p-6 font-medium text-violet-400">Anti-Spoof</th>
                    <th className="p-6 font-medium text-emerald-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {[
                    { name: 'Face Presence Detection', b: true, a: true, e: true },
                    { name: 'Blink & Motion Detection', b: true, a: true, e: true },
                    { name: 'Active Challenge-Response', b: false, a: true, e: true },
                    { name: 'Texture & Lighting Analysis', b: false, a: true, e: true },
                    { name: 'Screen/Photo Replay Detection', b: false, a: true, e: true },
                    { name: 'Deepfake & Swap Detection', b: false, a: true, e: true },
                    { name: 'Identity Matching', b: false, a: false, e: true },
                    { name: 'Continuous Session Auth', b: false, a: false, e: true },
                    { name: 'Multiple Face Detection', b: false, a: false, e: true },
                    { name: 'Gaze & Attention Tracking', b: false, a: false, e: true },
                  ].map((row, i) => (
                    <tr key={row.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-6 text-slate-300 font-medium">{row.name}</td>
                      <td className="p-6">
                        {row.b ? <CheckCircle className="w-5 h-5 text-cyan-400" /> : <span className="text-slate-600 text-xs">Unavailable</span>}
                      </td>
                      <td className="p-6">
                        {row.a ? <CheckCircle className="w-5 h-5 text-violet-400" /> : <span className="text-slate-600 text-xs">Unavailable</span>}
                      </td>
                      <td className="p-6">
                        {row.e ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <span className="text-slate-600 text-xs">Unavailable</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ENTERPRISE FEATURES */}
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="text-center mb-16">
              <span className="text-emerald-400 font-mono text-xs tracking-widest uppercase mb-4 block">Exclusive to Enterprise</span>
              <h2 className="text-3xl font-bold text-white mb-4">Advanced Security Modules</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: "Identity Matching", desc: "Compare verified faces against your secure 1:N database instantly." },
                { icon: ShieldAlert, title: "Deepfake Detection", desc: "AI models trained specifically to detect generative adversarial network artifacts." },
                { icon: Network, title: "Replay Detection", desc: "Identify screens, printed photos, and 3D masks with infrared-like software analysis." },
                { icon: Camera, title: "Multiple Faces", desc: "Detect background spoofing attempts or shoulder surfing in real-time." },
                { icon: Eye, title: "Attention Tracking", desc: "Ensure user gaze is focused on the prompt to confirm active participation." },
                { icon: Lock, title: "Continuous Auth", desc: "Maintain session security by silently verifying identity in the background." },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* WHY ENTERPRISE (STATS) */}
          <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="p-12 md:p-20 rounded-[3rem] bg-gradient-to-b from-emerald-950/40 to-transparent border border-emerald-500/10">
              <div className="grid md:grid-cols-3 gap-12 text-center">
                <div>
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2 font-mono tracking-tighter">
                    <AnimatedCounter value="99.99%" />
                  </div>
                  <p className="text-emerald-400/80 font-medium">Platform Availability</p>
                </div>
                <div>
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2 font-mono tracking-tighter">
                    <AnimatedCounter value="300ms" />
                  </div>
                  <p className="text-emerald-400/80 font-medium">Average Verification</p>
                </div>
                <div>
                  <div className="text-5xl md:text-6xl font-bold text-white mb-2 font-mono tracking-tighter">
                    <AnimatedCounter value="99%" />
                  </div>
                  <p className="text-emerald-400/80 font-medium">Top Tier Accuracy</p>
                </div>
              </div>
            </div>
          </section>

          {/* CUSTOMERS */}
          <section className="max-w-7xl mx-auto px-6 mb-32 text-center opacity-60">
            <p className="text-sm font-mono tracking-widest text-slate-500 uppercase mb-8">Trusted by global enterprise innovators</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale">
              {['FinTech Global', 'HealthSecure', 'GovVerify', 'EduTech', 'AI Systems'].map(name => (
                <div key={name} className="text-xl md:text-2xl font-bold text-slate-400 opacity-50 hover:opacity-100 transition-opacity cursor-default">
                  {name}
                </div>
              ))}
            </div>
          </section>

          {/* SECURITY CARD */}
          <section className="max-w-5xl mx-auto px-6 mb-32">
            <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-b from-white/10 to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay" />
              <div className="relative bg-[#060B14] rounded-[calc(3rem-1px)] p-12 md:p-20 text-center flex flex-col items-center">
                <div className="w-24 h-24 mb-8 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                  <Shield className="w-16 h-16 text-blue-400 relative z-10" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Military-Grade Security</h2>
                <p className="text-lg text-slate-400 max-w-2xl mb-12">
                  Built from the ground up to handle sensitive biometric data with zero-knowledge architecture and end-to-end encryption.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  {['SOC2 Type II', 'ISO 27001', 'GDPR Compliant', 'AES-256 Encryption', 'Zero Knowledge', 'HIPAA Ready'].map(badge => (
                    <div key={badge} className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* BOTTOM CTA */}
          <section className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to integrate MITRA VERIFY?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/developer" className="px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-[#060B14] font-bold text-lg transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105 inline-flex items-center justify-center gap-2">
                Get API Keys <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/docs" className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all hover:scale-105 inline-flex items-center justify-center">
                View Documentation
              </Link>
            </div>
          </section>

        </main>

        {/* CUSTOM MINIMAL FOOTER FOR THIS PAGE */}
        <footer className="relative z-10 border-t border-white/5 bg-[#03060a]">
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-50">
              <Scan className="w-5 h-5 text-white" />
              <span className="text-white font-bold tracking-tight">MITRA VERIFY</span>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <Link href="/products" className="hover:text-white transition-colors">Products</Link>
              <Link href="/developer" className="hover:text-white transition-colors">Developers</Link>
              <Link href="/company" className="hover:text-white transition-colors">Company</Link>
              <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
            </div>

            <div className="flex gap-4 text-slate-600">
              <Twitter className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              <Github className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </footer>

      </div>
    </PageTransition>
  );
}
