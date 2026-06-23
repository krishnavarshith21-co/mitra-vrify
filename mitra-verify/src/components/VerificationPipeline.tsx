import React from 'react';
import { Camera, ScanFace, Activity, ShieldCheck, Fingerprint, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VerificationPipeline() {
  const steps = [
    { icon: <Camera size={24} />, label: "Camera", desc: "RGB & IR capture" },
    { icon: <ScanFace size={24} />, label: "Face Mesh", desc: "478 points" },
    { icon: <Activity size={24} />, label: "Liveness", desc: "3D depth analysis" },
    { icon: <ShieldCheck size={24} />, label: "Anti-Spoof", desc: "AI threat detection" },
    { icon: <Fingerprint size={24} />, label: "Identity Match", desc: "1:N database search" },
    { icon: <CheckCircle size={24} />, label: "Decision", desc: "Deterministic outcome" },
  ];

  return (
    <section className="relative z-10 py-32 bg-[#01081A]">
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Deterministic Verification Pipeline</h2>
          <p className="text-slate-400 text-[16px] max-w-[600px] mx-auto">
            Our proprietary pipeline ensures sub-second processing from initial capture to final cryptographic decision.
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting line with flow animation */}
          <div className="absolute top-8 left-[10%] w-[80%] h-px bg-white/[0.05] hidden md:block overflow-hidden">
             <motion.div 
               className="absolute top-0 bottom-0 w-[200px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_20px_#00E5FF]"
               animate={{ left: ['-200px', '100%'] }}
               transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
             />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#020A1F] border border-white/[0.08] flex items-center justify-center text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.05)] mb-6 group-hover:scale-110 group-hover:border-[#00E5FF]/50 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all duration-300 relative bg-clip-padding backdrop-filter backdrop-blur-xl">
                  {step.icon}
                </div>
                <h3 className="text-white font-bold text-[14px] mb-1">{step.label}</h3>
                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
