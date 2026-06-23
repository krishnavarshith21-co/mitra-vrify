import React from 'react';
import { FileBadge, ShieldAlert, LockKeyhole, GlobeLock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ComplianceSection() {
  const certs = [
    { icon: <FileBadge size={28} />, title: "SOC 2 Type II", desc: "Audited security, availability, and confidentiality." },
    { icon: <GlobeLock size={28} />, title: "ISO 27001", desc: "Certified information security management systems." },
    { icon: <LockKeyhole size={28} />, title: "HIPAA Ready", desc: "Compliant infrastructure for healthcare identity." },
    { icon: <ShieldAlert size={28} />, title: "GDPR & CCPA", desc: "Built for global data privacy and sovereignty." },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const } }
  };

  return (
    <section className="relative z-10 py-32 bg-[#01081A] border-t border-white/[0.05] overflow-hidden">
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/3"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Compliance & Privacy</h2>
            <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
              We engineer our systems to meet the most stringent global regulatory requirements. Your biometric data never becomes a liability.
            </p>
            <button className="text-[#00E5FF] font-semibold text-[14px] flex items-center gap-2 hover:underline">
              Download Trust Center Report &rarr;
            </button>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {certs.map((c, i) => (
              <motion.div variants={itemVariants} key={i} className="flex gap-5 p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 group">
                <div className="text-[#00E5FF] opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] transition-all">{c.icon}</div>
                <div>
                  <h4 className="text-white font-bold mb-2 text-[16px]">{c.title}</h4>
                  <p className="text-slate-400 text-[13px] leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
