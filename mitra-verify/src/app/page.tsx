'use client';

import { Play, ArrowRight, Star, Plus, Shield, Globe, Zap, Headphones } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Navbar from '@/components/Navbar';
import BiometricCore3D from '@/components/BiometricCore3D';
import StatisticsStrip from '@/components/StatisticsStrip';
import EnterpriseTrust from '@/components/EnterpriseTrust';
import VerificationPipeline from '@/components/VerificationPipeline';
import ApiProducts from '@/components/ApiProducts';
import SecurityArchitecture from '@/components/SecurityArchitecture';
import ComplianceSection from '@/components/ComplianceSection';
import DeveloperExperience from '@/components/DeveloperExperience';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 3D Tilt Effect on Hero Text
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-400, 400], [10, -10]);
  const rotateY = useTransform(smoothX, [-400, 400], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const steps = [
    "Searching for Face",
    "Face Detected",
    "Generating 478 Landmarks",
    "Liveness Verification",
    "Identity Matching",
    "Access Granted"
  ];

  useEffect(() => {
    setMounted(true);
    
    // Cycle through steps every 2 seconds
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev >= steps.length - 1 ? 0 : prev + 1));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [steps.length]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#01081A] font-sans selection:bg-cyan-500/30 text-white overflow-hidden relative">
      <Navbar />

      {/* ─── EXACT SCREENSHOT BACKGROUND ELEMENTS ────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
         {/* Subtle radial glow behind the globe */}
         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.04)_0%,transparent_60%)] rounded-full mix-blend-screen" />
         
         {/* Left ambient glow */}
         <div className="absolute left-[-10%] top-[20%] w-[600px] h-[600px] bg-[#00E5FF] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />
         
         {/* Floating Plus Icons and Lines */}
         <div className="absolute top-[20%] left-[60%] opacity-30 text-[#00E5FF]"><Plus size={20} /></div>
         <div className="absolute top-[80%] left-[40%] opacity-30 text-[#00E5FF]"><Plus size={16} /></div>
         <div className="absolute top-[10%] right-[20%] opacity-30 text-[#00E5FF]"><Plus size={24} /></div>
         <div className="absolute bottom-[20%] right-[10%] opacity-30 text-[#00E5FF]"><Plus size={20} /></div>
         
         {/* Dotted trailing lines (simulated) */}
         <div className="absolute top-[25%] left-[60%] w-px h-32 border-l border-dashed border-[#00E5FF]/20" />
         <div className="absolute top-[10%] right-[19%] w-32 h-px border-t border-dashed border-[#00E5FF]/20" />
      </div>

      <main className="relative z-10 flex items-center min-h-screen pt-10 pb-20">
         <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
            
            {/* ─── LEFT SIDE CONTENT ─────────────────────────────────────── */}
            <motion.div 
               onMouseMove={handleMouseMove}
               onMouseLeave={handleMouseLeave}
               style={{ rotateX, rotateY, transformPerspective: 1000 }}
               className="flex flex-col items-start justify-center text-left pt-10 z-20"
            >
               
               {/* Badge */}
               <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/[0.08] bg-[#020A1F] mb-8 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
                  <div className="flex items-center gap-1.5 text-[#00E5FF] text-[11px] font-bold">
                     <Star size={12} className="fill-[#00E5FF]" /> Open Source
                  </div>
                  <div className="w-px h-3 bg-white/[0.2]" />
                  <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1">
                     Free forever - MIT License <ArrowRight size={12} className="ml-1" />
                  </span>
               </div>
               
               {/* Headline */}
               <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white tracking-tight mb-8 leading-[1.05]">
                 Enterprise<br/>
                 <span className="text-[#00E5FF] drop-shadow-[0_0_35px_rgba(0,229,255,0.8)]">Face Liveness</span><br/>
                 & Identity APIs
               </h1>
               
               {/* Subheadline */}
               <p className="text-[17px] text-slate-300 font-normal mb-10 max-w-[500px] leading-[1.6]">
                 Production-ready biometric verification platform. Face liveness detection, anti-spoof, and continuous identity authentication — all open source.
               </p>

               {/* Buttons */}
               <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-[#00E5FF] hover:bg-[#00c9e0] transition-colors text-[14px] font-bold text-[#020617] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]"
                 >
                   Start Building Free <ArrowRight size={16} />
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                   whileTap={{ scale: 0.95 }}
                   className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-transparent border border-white/[0.1] hover:bg-white/[0.05] transition-colors text-[14px] font-medium text-white flex items-center justify-center gap-2"
                 >
                   <Play size={16} className="opacity-70" /> Try Live Demo
                 </motion.button>
               </div>

               {/* Metrics */}
               <div className="flex items-start gap-12 text-left">
                  <Metric value="99%" label="Max Accuracy" />
                  <Metric value="< 1s" label="Fast Mode" />
                  <Metric value="3 APIs" label="Products" />
                  <Metric value="MIT" label="License" />
               </div>
            </motion.div>

            {/* ─── RIGHT SIDE VISUAL ─────────────────────────────────────── */}
            <div className="relative h-[600px] lg:h-auto w-full flex items-center justify-center z-10 mt-12 lg:mt-24">
               
               {/* Wireframe Globe Background */}
               <div className="absolute inset-[-20%] pointer-events-none">
                  <BiometricCore3D />
               </div>

               {/* Floating Biometric Scan Panel */}
               <div className="absolute right-[0%] lg:right-[-10%] bottom-[0%] lg:bottom-[-10%] w-[280px] bg-[#01081A]/80 backdrop-blur-md border border-[#00E5FF]/20 rounded-xl p-4 shadow-[0_0_50px_rgba(0,229,255,0.05)] pointer-events-auto">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-[9px] tracking-widest font-mono text-slate-500 uppercase">Biometric Scan</span>
                     <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]" />
                        <span className="text-[9px] tracking-widest font-mono text-green-500 uppercase">Live</span>
                     </div>
                  </div>
                  
                  {/* Steps */}
                  <div className="flex flex-col gap-3 mb-5">
                    {steps.map((step, idx) => {
                      const status = idx < currentStep ? 'complete' : idx === currentStep ? 'active' : 'pending';
                      return <Step key={step} label={step} status={status} />;
                    })}
                  </div>

                  {/* Status Bar */}
                  <div className="w-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded py-2 px-3 text-center">
                     <span className="text-[9px] font-mono tracking-wider text-[#00E5FF] uppercase truncate block">
                        Status: {steps[currentStep]}
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </main>

      <StatisticsStrip />
      <EnterpriseTrust />
      <VerificationPipeline />
      <ApiProducts />
      <SecurityArchitecture />
      <DeveloperExperience />
      <ComplianceSection />
    </div>
  );
}

function Metric({ value, label }: { value: string, label: string }) {
   return (
      <div className="flex flex-col gap-1">
         <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
         <span className="text-xs text-slate-500">{label}</span>
      </div>
   );
}

function Step({ label, status }: { label: string, status: 'complete' | 'active' | 'pending' }) {
   return (
      <div className="flex items-center gap-2.5 relative">
         {/* Dot */}
         <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${
            status === 'complete' ? 'bg-green-500' : 
            status === 'active' ? 'bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]' : 'bg-slate-700'
         }`} />
         
         {/* Label */}
         <span className={`text-[10px] font-mono tracking-tight truncate transition-colors duration-300 ${
            status === 'active' ? 'text-[#00E5FF]' : 
            status === 'complete' ? 'text-slate-300' : 'text-slate-600'
         }`}>
            {label}
         </span>

         {/* Trailing Line for Active State */}
         {status === 'active' && (
            <div className="flex-1 ml-2 h-px bg-gradient-to-r from-[#00E5FF]/50 to-transparent" />
         )}
      </div>
   );
}
