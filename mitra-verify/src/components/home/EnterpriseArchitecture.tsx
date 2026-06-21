'use client';

import { motion } from 'framer-motion';
import { Network, Server, ShieldCheck, Database, Cpu, Lock } from 'lucide-react';

export default function EnterpriseArchitecture() {
  const steps = [
    {
      icon: Cpu,
      title: 'Edge Pre-Processing',
      desc: 'Local face detection and landmark extraction reduces latency and payload size before transmission.',
      color: '#00d4ff'
    },
    {
      icon: Network,
      title: 'Encrypted Transit',
      desc: 'TLS 1.3 encryption with perfect forward secrecy ensures biometric vectors are never intercepted.',
      color: '#7c3aed'
    },
    {
      icon: Server,
      title: 'Liveness Engine',
      desc: 'Deep neural networks analyze micro-expressions and texture to detect screen replays and masks.',
      color: '#ffb800'
    },
    {
      icon: Database,
      title: 'Vector Matching',
      desc: 'High-dimensional embedding comparison against secure databases for sub-second identity verification.',
      color: '#00ff88'
    }
  ];

  return (
    <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
      <div className="section-container">
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#00d4ff', fontWeight: 600, display: 'block', marginBottom: 16 }}>
            SYSTEM ARCHITECTURE
          </span>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Built for Enterprise Scale
          </h2>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
            A distributed, high-availability architecture designed to process thousands of biometric verification requests per second with zero-trust security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent z-0" />

          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative z-10"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: `${step.color}15`,
                border: `1px solid ${step.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
                boxShadow: `0 0 20px ${step.color}10`,
              }}>
                <step.icon size={28} color={step.color} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 12 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
