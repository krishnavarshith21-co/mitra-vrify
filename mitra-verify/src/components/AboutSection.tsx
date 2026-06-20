'use client';

import { motion } from 'framer-motion';
import { 
  Zap, Shield, Building2, CheckCircle2, GraduationCap, HeartPulse, 
  Landmark, Briefcase, Server, Database, Code, Globe, Play, ScanFace, 
  Lock, Eye, Activity
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

export default function AboutSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden border-t border-slate-800/50">
      
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '10%', left: '-10%', width: '40%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.04), transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '-10%', width: '40%', height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.04), transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <div className="section-container relative z-10 space-y-32">
        
        {/* 1. INTRODUCTION HEADER */}
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-6"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md mb-4">
            <ScanFace size={16} className="text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">About MITRA VERIFY</span>
          </motion.div>
          <motion.h2 variants={itemVariants} style={{ fontSize: 'clamp(2rem, 3vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#f8fafc' }}>
            Enterprise Face Liveness & Identity Verification Platform
          </motion.h2>
          <motion.p variants={itemVariants} style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', color: '#94a3b8', lineHeight: 1.6, maxWidth: 800, margin: '0 auto' }}>
            MITRA VERIFY is an advanced biometric security platform designed to provide real-time face liveness detection, anti-spoof protection, and identity verification through powerful APIs.
          </motion.p>
          <motion.p variants={itemVariants} style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)', color: '#64748b', lineHeight: 1.6, maxWidth: 800, margin: '0 auto' }}>
            The platform helps organizations prevent impersonation, replay attacks, deepfake attempts, and unauthorized access by ensuring that a real human is present during verification.
          </motion.p>
        </motion.div>

        {/* 2. VERIFICATION LEVELS */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="space-y-12">
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-bold text-slate-200 mb-2">Three Levels of Verification</h3>
            <p className="text-slate-400">Scalable security for any use case.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Fast Liveness API', icon: Zap, color: '#00d4ff', features: ['Lightweight verification', 'Face presence detection', 'Blink detection', 'Mouth movement verification', 'Ultra-fast response time'] },
              { title: 'Advanced Anti-Spoof API', icon: Shield, color: '#7c3aed', features: ['Challenge-response verification', 'Texture analysis', 'Replay attack detection', 'Risk scoring', 'Enhanced fraud prevention'] },
              { title: 'Enterprise Identity API', icon: Building2, color: '#ffb800', features: ['Face enrollment', 'Identity matching', 'Continuous session monitoring', 'Gaze tracking', 'Multi-face detection', 'Enterprise-grade authentication'] }
            ].map((level, i) => (
              <motion.div key={level.title} variants={itemVariants} className="glass card-hover flex flex-col p-8 rounded-2xl relative overflow-hidden group">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: `linear-gradient(90deg, transparent, ${level.color}, transparent)`, opacity: 0.5 }} className="group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center" style={{ background: `${level.color}15`, border: `1px solid ${level.color}30` }}>
                  <level.icon size={24} color={level.color} />
                </div>
                <h4 className="text-xl font-bold text-slate-100 mb-6">{level.title}</h4>
                <ul className="space-y-4 flex-1">
                  {level.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5" color={level.color} />
                      <span className="text-sm font-medium text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 3. KEY FEATURES */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="space-y-12">
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-bold text-slate-200 mb-2">Key Features</h3>
            <p className="text-slate-400">Everything you need to secure your platform.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Real-Time Face Detection', 'Face Landmark Tracking', 'Blink Detection', 'Mouth Movement Analysis',
              'Head Rotation Verification', 'Anti-Spoof Protection', 'Deepfake Risk Analysis', 'Identity Matching',
              'Continuous Authentication', 'Multiple Face Detection', 'Enterprise Security'
            ].map((feat, i) => (
              <motion.div key={feat} variants={itemVariants} className="glass card-hover flex items-center gap-3 p-4 rounded-xl border border-slate-800/60 bg-slate-900/40">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-cyan-400" />
                </div>
                <span className="text-sm font-semibold text-slate-200">{feat}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 4. USE CASES */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="space-y-12">
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-bold text-slate-200 mb-2">Use Cases</h3>
            <p className="text-slate-400">Built for high-security industries.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Online Examinations', desc: 'Prevent impersonation during remote assessments.', icon: GraduationCap },
              { title: 'Workplace Authentication', desc: 'Secure employee access and attendance systems.', icon: Briefcase },
              { title: 'Banking & Fintech', desc: 'Protect digital onboarding and KYC verification.', icon: Landmark },
              { title: 'Healthcare', desc: 'Verify patient identity for secure healthcare services.', icon: HeartPulse },
              { title: 'E-Learning Platforms', desc: 'Ensure authentic student participation.', icon: Globe },
              { title: 'Government Services', desc: 'Secure digital identity verification workflows.', icon: Shield },
            ].map((uc, i) => (
              <motion.div key={uc.title} variants={itemVariants} className="glass card-hover p-6 rounded-2xl flex flex-col gap-4 border border-slate-800/50 bg-slate-900/20">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <uc.icon size={20} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-100 mb-2">{uc.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{uc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 5. PROJECT STATISTICS */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-y border-slate-800/50 py-12 bg-slate-900/20">
          {[
            { v: '99%', l: 'Accuracy' }, { v: '<1s', l: 'Verification' }, { v: '3', l: 'APIs' },
            { v: 'Real-Time', l: 'Monitoring' }, { v: 'Enterprise', l: 'Security' }, { v: 'Open', l: 'Source' }
          ].map((s, i) => (
            <motion.div key={s.l} variants={itemVariants} className="flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl lg:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 mb-1">{s.v}</span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">{s.l}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* 6. HOW IT WORKS */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="space-y-16">
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-bold text-slate-200 mb-2">How It Works</h3>
            <p className="text-slate-400">A seamless, 5-step automated workflow.</p>
          </motion.div>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            <div className="hidden md:block absolute top-1/2 left-0 w-1/2 h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500 to-blue-500/0 -translate-y-1/2 z-0 opacity-50 blur-sm" />
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                { step: 'Step 1', title: 'Face Detection', icon: ScanFace },
                { step: 'Step 2', title: 'Liveness Verification', icon: Activity },
                { step: 'Step 3', title: 'Anti-Spoof Analysis', icon: Shield },
                { step: 'Step 4', title: 'Identity Verification', icon: Eye },
                { step: 'Step 5', title: 'Secure Authentication Result', icon: Lock },
              ].map((step, i) => (
                <motion.div key={step.step} variants={itemVariants} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center mb-6 relative group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300">
                    <step.icon size={24} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white border-2 border-slate-950">
                      {i + 1}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-200 mb-1">{step.step}</span>
                  <p className="text-xs text-slate-400 px-2">{step.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 7. VISION SECTION */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="max-w-4xl mx-auto text-center glass p-8 md:p-16 rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
          
          <motion.h3 variants={itemVariants} className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-8 relative z-10">
            Our Vision
          </motion.h3>
          <motion.p variants={itemVariants} className="text-base md:text-xl text-slate-300 leading-relaxed font-medium relative z-10">
            Our vision is to make biometric verification secure, accessible, and reliable for organizations of all sizes. MITRA VERIFY aims to provide enterprise-grade security through modern computer vision technologies while maintaining a seamless user experience.
          </motion.p>
        </motion.div>

        {/* 8. TECHNOLOGY STACK */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={containerVariants} className="space-y-12">
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-bold text-slate-200 mb-2">Technology Stack</h3>
            <p className="text-slate-400">Powered by cutting-edge, open-source technology.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { category: 'Frontend', icon: Code, items: ['Next.js', 'TypeScript', 'Tailwind CSS'] },
              { category: 'Backend', icon: Server, items: ['FastAPI', 'Python'] },
              { category: 'AI & Vision', icon: ScanFace, items: ['MediaPipe', 'Face Landmark Detection', 'Liveness Analysis'] },
              { category: 'Database', icon: Database, items: ['PostgreSQL'] },
              { category: 'Deployment', icon: Globe, items: ['Vercel', 'Railway'] },
            ].map((stack, i) => (
              <motion.div key={stack.category} variants={itemVariants} className="glass card-hover p-6 rounded-2xl border border-slate-800/50 bg-slate-900/30 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                  <stack.icon size={18} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">{stack.category}</h4>
                <div className="flex flex-col gap-2 w-full">
                  {stack.items.map(item => (
                    <div key={item} className="w-full py-2 px-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs font-semibold text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
