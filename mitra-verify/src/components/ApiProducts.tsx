import React from 'react';
import { CheckCircle2, X, Zap, Shield, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiProducts() {
  const products = [
    {
      name: "Fast Liveness",
      endpoint: "/api/v1/liveness/basic",
      icon: <Zap size={20} />,
      colorTheme: "#00FF66",
      desc: "Ultra-fast passive liveness detection. Perfect for low-friction user experiences like quick logins.",
      speed: "< 1s",
      accuracy: "90%",
      features: [
        { name: "Face Presence", included: true },
        { name: "Face Centered (2s)", included: true },
        { name: "Blink Once", included: true },
        { name: "Open Mouth", included: true },
        { name: "No Identity Storage", included: false }
      ]
    },
    {
      name: "Anti-Spoof",
      endpoint: "/api/v1/liveness/advanced",
      icon: <Shield size={20} />,
      colorTheme: "#B026FF",
      desc: "Active challenge-response system with texture analysis to prevent replay and presentation attacks.",
      speed: "2-4s",
      accuracy: "97%",
      features: [
        { name: "Shuffled Challenges", included: true },
        { name: "Replay Detection", included: true },
        { name: "Texture Analysis", included: true },
        { name: "Risk Scoring", included: true },
        { name: "No Identity Storage", included: false }
      ]
    },
    {
      name: "Enterprise",
      endpoint: "/api/v1/identity/verify",
      icon: <Fingerprint size={20} />,
      colorTheme: "#00E5FF",
      desc: "Full identity verification with continuous monitoring, gaze tracking, and multiple face detection.",
      speed: "3-6s",
      accuracy: "99%",
      features: [
        { name: "All Advanced Features", included: true },
        { name: "Face Enrollment & Match", included: true },
        { name: "Gaze & Attention Track", included: true },
        { name: "Continuous Session Auth", included: true },
        { name: "Multiple Face Protection", included: true }
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">API Products</h2>
          <p className="text-slate-400 text-[16px] max-w-[600px] mx-auto">
            Flexible, scalable APIs designed to meet the exact security requirements of your infrastructure.
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.map((p, idx) => (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative rounded-2xl bg-[#020A1F] border border-white/[0.05] overflow-hidden flex flex-col h-full group"
            >
              {/* Colored Top Border with Sweeping Glow Animation */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/[0.02] overflow-hidden">
                <div className="absolute inset-0 opacity-40" style={{ backgroundColor: p.colorTheme }} />
                <motion.div 
                  className="absolute top-0 bottom-0 w-[150px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${p.colorTheme}, transparent)` }}
                  animate={{ left: ['-150px', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear', delay: idx * 0.4 }}
                />
              </div>

              {/* Top Background Glow (intensifies on hover) */}
              <div 
                className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 blur-[60px] opacity-10 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" 
                style={{ backgroundColor: p.colorTheme }} 
              />
              
              <div className="p-8 flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.1] flex items-center justify-center shrink-0 shadow-lg" 
                    style={{ color: p.colorTheme }}
                  >
                    {p.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{p.name}</h3>
                    <div className="font-mono text-[11px] font-medium" style={{ color: p.colorTheme }}>
                      {p.endpoint}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-slate-400 text-[13px] leading-relaxed mb-8">
                  {p.desc}
                </p>
                
                {/* Metrics */}
                <div className="flex justify-between items-center py-4 border-t border-b border-white/[0.05] mb-8">
                  <div>
                    <span className="block text-slate-500 text-[11px] uppercase tracking-wider mb-1">Speed Target</span>
                    <span className="text-lg font-bold" style={{ color: p.colorTheme }}>{p.speed}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500 text-[11px] uppercase tracking-wider mb-1">Accuracy</span>
                    <span className="text-lg font-bold" style={{ color: p.colorTheme }}>{p.accuracy}</span>
                  </div>
                </div>
                
                {/* Features */}
                <ul className="space-y-4 mb-10 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {f.included ? (
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      ) : (
                        <X size={16} className="text-red-500 shrink-0" />
                      )}
                      <span className={`text-[13px] font-medium ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>
                        {f.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {/* Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#00A3FF] text-white font-bold text-[14px] shadow-[0_0_15px_rgba(0,122,255,0.2)] hover:shadow-[0_0_25px_rgba(0,122,255,0.4)] transition-all"
                >
                  View Demo
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
