import React from 'react';
import { Building2, HeartPulse, ShieldCheck, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EnterpriseTrust() {
  return (
    <section className="relative z-10 py-24 bg-[#01081A]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-[1400px] w-full mx-auto px-6 md:px-12"
      >
        <p className="text-center text-[12px] font-bold tracking-widest text-slate-500 uppercase mb-12">
          Built for high-security infrastructure across critical sectors
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
            <ShieldCheck size={24} className="text-[#00E5FF] opacity-80 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <span className="text-[15px] font-bold tracking-tight uppercase">Government</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
            <Building2 size={24} className="text-[#00E5FF] opacity-80 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <span className="text-[15px] font-bold tracking-tight uppercase">Banking</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
            <HeartPulse size={24} className="text-[#00E5FF] opacity-80 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <span className="text-[15px] font-bold tracking-tight uppercase">Healthcare</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
            <Globe2 size={24} className="text-[#00E5FF] opacity-80 drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <span className="text-[15px] font-bold tracking-tight uppercase">Enterprise</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
