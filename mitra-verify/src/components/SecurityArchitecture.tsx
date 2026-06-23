import React from 'react';
import { Lock, Server, Database, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityArchitecture() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 100, damping: 20 } 
    }
  };

  return (
    <section className="relative z-10 py-32 bg-[#01081A] border-t border-white/[0.05]">
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Zero-Knowledge Architecture</h2>
          <p className="text-slate-400 text-[16px] max-w-[600px] mx-auto">
            Our infrastructure guarantees privacy. Biometric templates are irreversibly hashed and never stored in raw format.
          </p>
        </div>
        
        <div className="relative max-w-[900px] mx-auto bg-[#020A1F] rounded-3xl border border-white/[0.05] p-8 md:p-16 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <motion.div 
            className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 text-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Edge */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.1] flex items-center justify-center mb-5 text-white shadow-lg">
                <Shield size={24} />
              </div>
              <h4 className="text-white font-bold mb-2">1. Edge Capture</h4>
              <p className="text-slate-500 text-[13px] leading-relaxed max-w-[200px]">Encrypted payload generated on device. No raw images transmit.</p>
            </motion.div>
            
            {/* Processing */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center mb-5 text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.15)] relative">
                <Server size={24} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00E5FF]"></span>
                </span>
              </div>
              <h4 className="text-white font-bold mb-2">2. Neural Processing</h4>
              <p className="text-slate-500 text-[13px] leading-relaxed max-w-[200px]">Liveness evaluation and feature extraction in stateless memory.</p>
            </motion.div>
            
            {/* Storage */}
            <motion.div variants={itemVariants} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.1] flex items-center justify-center mb-5 text-white shadow-lg">
                <Database size={24} />
              </div>
              <h4 className="text-white font-bold mb-2">3. Cold Storage</h4>
              <p className="text-slate-500 text-[13px] leading-relaxed max-w-[200px]">Irreversible biometric hashing. AES-256 encryption at rest.</p>
            </motion.div>
          </motion.div>
          
          {/* Animated Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[108px] left-[20%] w-[60%] h-px bg-white/[0.05] overflow-hidden">
             <motion.div 
               className="absolute top-0 bottom-0 w-[150px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_15px_#00E5FF]"
               animate={{ left: ['-150px', '100%'] }}
               transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
             />
          </div>
        </div>
      </div>
    </section>
  );
}
