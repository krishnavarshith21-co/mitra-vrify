'use client';

import { 
  Shield, Activity, Server, CheckCircle2, ShieldAlert, Fingerprint, 
  Eye, Key, Code, Database, Globe, ChevronRight, Layers, Users, Building, Scale,
  Camera, Lock, HardDrive, Smartphone, FileText, HeartPulse, Zap, Download, Box, MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BiometricSphere3D from '@/components/BiometricSphere3D';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── FRAMER VARIANTS ────────────────────────────────────────────────────────
const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [simStep, setSimStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const simInterval = setInterval(() => {
       setSimStep(prev => (prev + 1) % 7); // 7 steps: Face, Blink, Head, Mouth, Anti-Spoof, Identity, Reset
    }, 1800);
    return () => clearInterval(simInterval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#02050D] font-sans selection:bg-[#00d4ff]/30 text-slate-300 overflow-x-hidden relative">
      <Navbar />

      {/* Global Backgrounds (Apple/Stripe Polish) */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#00d4ff]/10 blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#0066ff]/10 blur-[150px] rounded-full mix-blend-screen" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-screen" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,#000_20%,transparent_100%)]" />
      </div>

      <main className="relative z-10">
         
         {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
         <section className="pt-40 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto min-h-[90vh] flex flex-col justify-center border-b border-[rgba(255,255,255,0.05)]">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
               
               {/* LEFT SIDE: Typography & Actions */}
               <motion.div variants={itemVariants} className="flex flex-col items-start text-left z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-8">
                     <span className="px-3 py-1.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,212,255,0.2)]">Enterprise Edition</span>
                     <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">World-Class Biometric Authentication</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.05]">
                    Secure Identity<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#0066ff] filter drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]">Verification</span><br />
                    Infrastructure
                  </h1>
                  
                  <p className="text-lg md:text-xl text-slate-400 font-light mb-12 max-w-xl leading-relaxed">
                    Military-grade liveness detection, anti-spoofing, and continuous authentication for mission-critical applications.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
                    <Link href="/developer" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#02050D] hover:bg-slate-200 transition-all text-sm font-bold tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group">
                      Start Building Free <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/demo/enterprise" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[rgba(10,20,40,0.6)] border border-[rgba(0,255,255,0.1)] hover:bg-[rgba(10,20,40,0.9)] hover:border-[#00d4ff]/40 transition-all text-sm font-bold text-white tracking-wide flex items-center justify-center gap-2 backdrop-blur-md">
                      <Activity size={16} className="text-[#00d4ff]" /> Try Live Demo
                    </Link>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex flex-wrap items-center gap-8 md:gap-12 pt-10 border-t border-white/[0.08] w-full">
                     <MetricBlock value="478" label="Facial Landmarks" />
                     <MetricBlock value="<1s" label="Verification" />
                     <MetricBlock value="3" label="Verification APIs" />
                     <div className="flex flex-col gap-1.5">
                        <span className="text-white font-bold text-2xl flex items-center gap-2 tracking-tight"><span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]" /> 24/7</span>
                        <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">Monitoring</span>
                     </div>
                  </div>
               </motion.div>

               {/* RIGHT SIDE: Extensively Upgraded 3D Biometric Sphere */}
               <motion.div variants={itemVariants} className="relative w-full aspect-square max-w-[550px] mx-auto lg:ml-auto flex items-center justify-center mt-10 lg:mt-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.15)_0%,transparent_60%)] mix-blend-screen" />
                  
                  {/* Holographic Sphere Container */}
                  <div className="relative w-full h-full rounded-full flex items-center justify-center">
                     
                     {/* The new WebGL Three.js Sphere */}
                     <BiometricSphere3D />

                     {/* Floating Verification Engine Card */}
                     <motion.div 
                       animate={{ y: [0, -12, 0] }} 
                       transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                       className="absolute top-[20%] -right-4 md:-right-12 bg-[#02050D]/80 backdrop-blur-xl border border-[rgba(0,255,255,0.2)] rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-20 w-56"
                     >
                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                           <div className="w-8 h-8 rounded bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20">
                             <Shield size={16} className="text-[#00d4ff]" />
                           </div>
                           <span className="text-xs font-bold text-white tracking-wide">Verification Engine</span>
                        </div>
                        <div className="space-y-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                           <div className="flex items-center justify-between">
                              <span>Liveness</span>
                              <span className="text-[#00ff88] font-bold shadow-[0_0_10px_rgba(0,255,136,0.3)]">PASS</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span>Landmarks</span>
                              <span className="text-white font-bold">478</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span>Confidence</span>
                              <span className="text-[#00d4ff] font-bold animate-pulse">99.8%</span>
                           </div>
                        </div>
                     </motion.div>

                     {/* Bottom Floating Badge */}
                     <motion.div 
                       animate={{ y: [0, 12, 0] }} 
                       transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                       className="absolute bottom-[20%] -left-4 md:-left-10 bg-[#02050D]/80 backdrop-blur-xl border border-[rgba(0,255,136,0.2)] rounded-full px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-20 flex items-center gap-3"
                     >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_15px_#00ff88]" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest">Live Feed Active</span>
                     </motion.div>
                  </div>
               </motion.div>

            </motion.div>
         </section>

         {/* ─── 1. LIVE VERIFICATION DEMO ──────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-32 max-w-[1400px] mx-auto border-b border-[rgba(255,255,255,0.05)]">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Live Biometric Simulation</h2>
               <p className="text-slate-400 text-lg font-light max-w-2xl mx-auto">Witness the multi-step verification pipeline process 478 data points in real-time to guarantee authentic user presence.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
               {/* Camera Feed Simulation */}
               <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[#050A14] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] relative flex flex-col h-full min-h-[400px]">
                  <div className="bg-[#02050D] px-6 py-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff3366] opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-[#ffb800] opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-[#00ff88] opacity-80" />
                     </div>
                     <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Camera size={12} /> Edge Camera Interface
                     </span>
                  </div>
                  
                  <div className="relative flex-1 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0%,transparent_80%)] flex items-center justify-center">
                     {/* Cyber Scanner Reticle */}
                     <div className="absolute inset-10 border-2 border-[#00d4ff]/10 rounded-2xl flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00d4ff]/60 rounded-tl-2xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00d4ff]/60 rounded-tr-2xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00d4ff]/60 rounded-bl-2xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00d4ff]/60 rounded-br-2xl" />
                        
                        <div className="text-center z-10 flex flex-col items-center">
                           <Fingerprint size={56} className="text-[#00d4ff]/30 mb-6" />
                           <span className="text-[#00ff88] font-mono text-xs uppercase tracking-widest bg-[#00ff88]/10 px-4 py-1.5 rounded-full border border-[#00ff88]/20 animate-pulse">Analysis In Progress</span>
                        </div>
                     </div>

                     {/* Scanning laser effect */}
                     <motion.div 
                        animate={{ y: ['0%', '100%', '0%'] }} 
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent shadow-[0_0_20px_#00d4ff] opacity-60 z-20"
                     />
                  </div>
               </motion.div>

               {/* Data Readout Loop */}
               <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[rgba(10,20,40,0.4)] backdrop-blur-2xl border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                       <Activity size={18} className="text-[#00d4ff]" /> AI Processing Stream
                     </h3>
                  </div>

                  <div className="space-y-1 w-full">
                     <SimRow label="Face Detection" stepLimit={1} simStep={simStep} value="Mesh Generated" color="text-[#00d4ff]" icon={Eye} />
                     <SimRow label="Blink Detection" stepLimit={2} simStep={simStep} value="Verified" color="text-[#00ff88]" icon={Activity} />
                     <SimRow label="Head Rotation" stepLimit={3} simStep={simStep} value="Yaw: 0.12, Pitch: -0.05" color="text-slate-300" icon={Globe} />
                     <SimRow label="Mouth Movement" stepLimit={4} simStep={simStep} value="Verified" color="text-[#00ff88]" icon={MessageSquare} />
                     <SimRow label="Anti-Spoof Detection" stepLimit={5} simStep={simStep} value="No Presentation Attack" color="text-[#7c3aed]" icon={ShieldAlert} />
                     <SimRow label="Identity Match" stepLimit={6} simStep={simStep} value="Authentication Passed" color="text-[#00ff88]" icon={CheckCircle2} />
                  </div>
               </motion.div>
            </div>
         </section>

         {/* ─── 2. API COMPARISON ─────────────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-32 max-w-[1400px] mx-auto border-b border-[rgba(255,255,255,0.05)]">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Select Your Security Tier</h2>
               <p className="text-slate-400 text-lg font-light max-w-2xl mx-auto">Three purpose-built APIs. Seamless integration. Choose the exact level of security your application demands.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <PricingCard 
                 title="API 1: Basic" 
                 icon={Zap}
                 description="The fastest verification workflow for standard onboarding."
                 features={['Fastest verification', '1 second response time', 'Lightweight payload', 'Basic spoof filtering']}
                 color="text-white"
               />
               <PricingCard 
                 title="API 2: Advanced" 
                 icon={Shield}
                 description="Enterprise-grade security with multi-step liveness challenges."
                 features={['Multi-step liveness', 'Better security', 'Enterprise ready', 'Advanced 3D mask detection']}
                 color="text-[#00d4ff]"
                 highlight={true}
               />
               <PricingCard 
                 title="API 3: Maximum" 
                 icon={Lock}
                 description="Unbreakable continuous authentication for critical systems."
                 features={['Banking grade security', 'Examination grade', 'Continuous authentication', 'Zero-trust architecture']}
                 color="text-[#7c3aed]"
               />
            </div>
         </section>

         {/* ─── 3. ENTERPRISE USE CASES ───────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-32 max-w-[1400px] mx-auto border-b border-[rgba(255,255,255,0.05)]">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Enterprise Use Cases</h2>
               <p className="text-slate-400 text-lg font-light max-w-2xl mx-auto">MITRA VERIFY secures the most sensitive applications across industries.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <UseCaseCard icon={Building} title="Banking & KYC" description="Automate Know Your Customer onboarding with unbreakable face liveness detection to prevent deepfake account creation." />
               <UseCaseCard icon={Scale} title="Government Identity" description="Secure citizen portals and benefit distribution systems with enterprise-grade 1:1 facial matching and spoof protection." />
               <UseCaseCard icon={FileText} title="Remote Examinations" description="Ensure academic integrity with continuous background authentication to verify the enrolled student is taking the test." />
               <UseCaseCard icon={HeartPulse} title="Healthcare Access" description="Ensure HIPAA compliance by verifying physician identity before granting access to sensitive patient records." />
               <UseCaseCard icon={Users} title="Workforce Authentication" description="Deploy Zero Trust access for corporate VPNs and internal tooling with continuous identity verification." />
               <UseCaseCard icon={HardDrive} title="Secure Facilities" description="Integrate with physical hardware and access control systems for seamless, keyless entry." />
            </div>
         </section>

         {/* ─── 4. DEVELOPER PLATFORM ─────────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-32 max-w-[1400px] mx-auto border-b border-[rgba(255,255,255,0.05)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Developer Platform</h2>
                  <p className="text-slate-400 text-lg font-light mb-10 leading-relaxed">
                     Built by developers, for developers. Integrate world-class biometric security into your iOS, Android, or Web applications in under 10 minutes.
                  </p>
                  <div className="space-y-6 mb-12">
                     <DevFeature icon={FileText} title="API Documentation" desc="Comprehensive guides, endpoint references, and Postman collections." />
                     <DevFeature icon={Download} title="SDK Downloads" desc="Drop-in UI components for React, Swift, and Kotlin." />
                     <DevFeature icon={Code} title="Code Examples" desc="Copy-paste ready implementations for common authentication flows." />
                     <DevFeature icon={Globe} title="Webhook Support" desc="Real-time event streaming for verification state changes." />
                  </div>
                  <Link href="/developer" className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold text-white flex items-center w-fit gap-2">
                     Explore Developer Docs <ChevronRight size={16} />
                  </Link>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[#050A14] border border-[rgba(255,255,255,0.08)] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                  <div className="bg-[#02050D] px-6 py-4 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#ff3366] opacity-80" />
                     <div className="w-3 h-3 rounded-full bg-[#ffb800] opacity-80" />
                     <div className="w-3 h-3 rounded-full bg-[#00ff88] opacity-80" />
                     <span className="ml-4 text-[11px] font-mono text-slate-500 uppercase tracking-widest">verify.ts</span>
                  </div>
                  <div className="p-6 text-sm font-mono text-[#00d4ff] overflow-x-auto leading-relaxed">
                     <span className="text-[#ff3366]">import</span> {`{ MitraClient }`} <span className="text-[#ff3366]">from</span> <span className="text-[#00ff88]">'@mitra/sdk'</span>;<br/><br/>
                     <span className="text-slate-500">// Initialize Enterprise Client</span><br/>
                     <span className="text-[#ff3366]">const</span> mitra = <span className="text-[#ff3366]">new</span> <span className="text-[#7c3aed]">MitraClient</span>('sk_live_12345');<br/><br/>
                     <span className="text-slate-500">// Process Liveness Video Payload</span><br/>
                     <span className="text-[#ff3366]">const</span> result = <span className="text-[#ff3366]">await</span> mitra.verify.<span className="text-[#7c3aed]">liveness</span>({"{"})<br/>
                     &nbsp;&nbsp;videoBuffer: blob,<br/>
                     &nbsp;&nbsp;strictMode: <span className="text-[#ffb800]">true</span><br/>
                     {"});"}<br/><br/>
                     <span className="text-[#ff3366]">if</span> (result.spoofDetected) {"{"}<br/>
                     &nbsp;&nbsp;<span className="text-[#ff3366]">throw new</span> <span className="text-[#7c3aed]">Error</span>(<span className="text-[#00ff88]">'Presentation attack detected.'</span>);<br/>
                     {"}"}
                  </div>
               </motion.div>
            </div>
         </section>

         {/* ─── 5. TRUST CENTER ───────────────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-32 max-w-[1400px] mx-auto border-b border-[rgba(255,255,255,0.05)]">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Global Trust Center</h2>
               <p className="text-slate-400 text-lg font-light max-w-2xl mx-auto">Independently audited and certified to meet the most stringent global security requirements.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
               <TrustBadge icon={Shield} title="SOC2 Type II" />
               <TrustBadge icon={Globe} title="GDPR Compliant" />
               <TrustBadge icon={Database} title="AES-256 Encryption" />
               <TrustBadge icon={Lock} title="Zero Trust Architecture" />
            </div>
         </section>

         {/* ─── 6. CTA & FOOTER ───────────────────────────────────────────────── */}
         <section className="px-6 md:px-12 py-40 max-w-[1400px] mx-auto text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d4ff]/10 blur-[200px] rounded-full pointer-events-none" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative z-10">
               <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Ready To Secure Your Platform?</h2>
               <p className="text-xl text-slate-400 font-light mb-12 max-w-2xl mx-auto">Start Building With MITRA VERIFY today and deploy military-grade biometric infrastructure in minutes.</p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Link href="/developer" className="px-10 py-5 rounded-xl bg-white text-[#02050D] hover:bg-slate-200 transition-all text-sm font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                     Get API Key
                  </Link>
                  <Link href="/developer" className="px-10 py-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-bold text-white uppercase tracking-widest">
                     View Documentation
                  </Link>
               </div>
            </motion.div>
         </section>

         <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[#010205] pt-16 pb-8 px-6 md:px-12 relative z-10">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
               <div className="flex items-center gap-2">
                  <Shield size={16} className="text-[#00d4ff]" />
                  <span className="text-white font-bold tracking-tight text-sm">MITRA VERIFY</span>
               </div>
               <p>© 2026 MITRA SECURITY INFRASTRUCTURE. ALL RIGHTS RESERVED.</p>
               <div className="flex items-center gap-6">
                  <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                  <Link href="#" className="hover:text-white transition-colors">Status</Link>
               </div>
            </div>
         </footer>

      </main>
    </div>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

function MetricBlock({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
       <span className="text-white font-bold text-2xl tracking-tight">{value}</span>
       <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">{label}</span>
    </div>
  );
}

function SimRow({ label, stepLimit, simStep, value, color, icon: Icon }: { label: string, stepLimit: number, simStep: number, value: string, color: string, icon: any }) {
   const isActive = simStep >= stepLimit && simStep !== 0; // step 0 is reset
   return (
      <div className="flex items-center justify-between py-5 border-b border-white/[0.03] last:border-0">
         <span className="text-sm text-slate-300 font-medium flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isActive ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent'}`}>
               <Icon size={16} className={isActive ? color : 'text-slate-600'} />
            </div>
            {label}
         </span>
         <span className={`text-xs font-mono uppercase tracking-widest ${isActive ? color : 'text-slate-600'}`}>
            {isActive ? value : 'PENDING'}
         </span>
      </div>
   );
}

function PricingCard({ title, icon: Icon, description, features, color, highlight = false }: { title: string, icon: any, description: string, features: string[], color: string, highlight?: boolean }) {
   return (
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`rounded-3xl p-8 flex flex-col h-full relative overflow-hidden ${highlight ? 'bg-[rgba(10,20,40,0.8)] border border-[#00d4ff]/30 shadow-[0_20px_50px_rgba(0,212,255,0.1)]' : 'bg-[rgba(10,20,40,0.3)] border border-[rgba(255,255,255,0.05)]'}`}>
         {highlight && <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#00d4ff] text-[#02050D] text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Recommended</div>}
         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-white/10 bg-white/5 ${color}`}>
            <Icon size={24} />
         </div>
         <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
         <p className="text-slate-400 text-sm font-light leading-relaxed mb-8 border-b border-white/5 pb-8">{description}</p>
         <ul className="space-y-4 mb-10 flex-1">
            {features.map((feat, i) => (
               <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className={color} /> {feat}
               </li>
            ))}
         </ul>
      </motion.div>
   );
}

function UseCaseCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] hover:border-white/10 transition-colors group">
       <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#00d4ff]/30 group-hover:bg-[#00d4ff]/10 transition-colors">
          <Icon className="text-slate-400 group-hover:text-[#00d4ff] transition-colors" />
       </div>
       <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
       <p className="text-slate-400 text-sm font-light leading-relaxed">{description}</p>
    </motion.div>
  );
}

function DevFeature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
   return (
      <div className="flex items-start gap-4">
         <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-[#00d4ff]" />
         </div>
         <div>
            <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
         </div>
      </div>
   );
}

function TrustBadge({ icon: Icon, title }: { icon: any, title: string }) {
   return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-white/10 transition-colors">
         <Icon size={32} className="text-[#00ff88]" />
         <span className="text-sm font-bold text-white">{title}</span>
      </div>
   );
}
