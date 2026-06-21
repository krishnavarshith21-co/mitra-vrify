'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Zap, BarChart3, CheckCircle } from 'lucide-react';

export default function EnterpriseBenefits() {
  const benefits = [
    {
      title: 'Zero-Day Spoof Prevention',
      icon: ShieldAlert,
      color: '#ff3366',
      points: [
        'Advanced AI models trained on millions of spoof attempts',
        'Detects hi-res screens, printed masks, and deepfakes',
        'Continuous adversarial training pipeline'
      ]
    },
    {
      title: 'Sub-Second Verification',
      icon: Zap,
      color: '#00d4ff',
      points: [
        'Global edge network with < 50ms routing latency',
        'Optimized WebAssembly inference on client devices',
        'Parallel processing of identity and liveness checks'
      ]
    },
    {
      title: 'Actionable Telemetry',
      icon: BarChart3,
      color: '#00ff88',
      points: [
        'Real-time Security Operations Center (SOC) dashboard',
        'Granular API usage tracking and threat modeling',
        'Automated webhook alerts for suspicious activity spikes'
      ]
    }
  ];

  return (
    <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffb800', fontWeight: 600, display: 'block', marginBottom: 16 }}>
              ENTERPRISE BENEFITS
            </span>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>
              Protecting Your Platform at <span className="gradient-text-cyan">Scale</span>
            </h2>
            <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>
              MITRA VERIFY isn't just an API—it's a comprehensive security layer for your applications. We handle the complexity of biometric authentication so you can focus on building your product.
            </p>

            <div className="flex flex-col gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${benefit.color}15`,
                    border: `1px solid ${benefit.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <benefit.icon size={24} color={benefit.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
                      {benefit.title}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {benefit.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle size={14} color="#94a3b8" className="mt-1 flex-shrink-0" />
                          <span style={{ fontSize: 14, color: '#94a3b8' }}>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="premium-glass p-8 rounded-2xl border border-white/10 relative overflow-hidden"
          >
            {/* Abstract Background for the graphic */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00d4ff]/10 via-[#0a0f1e]/80 to-[#0a0f1e]" />
            
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white mb-6">Security Layers</h3>
              
              <div className="flex flex-col gap-3">
                {[
                  { name: 'Layer 4: Continuous Identity Match', status: 'ACTIVE', color: '#00ff88' },
                  { name: 'Layer 3: Behavioral Biometrics', status: 'ACTIVE', color: '#00ff88' },
                  { name: 'Layer 2: 3D Texture Analysis', status: 'ACTIVE', color: '#00ff88' },
                  { name: 'Layer 1: Edge Face Detection', status: 'ACTIVE', color: '#00ff88' }
                ].map((layer, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/5 backdrop-blur-sm">
                    <span className="text-sm font-medium text-slate-300">{layer.name}</span>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
                      {layer.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
