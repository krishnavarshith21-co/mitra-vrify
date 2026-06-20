'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Compare APIs', href: '/compare' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Developer Portal', href: '/developer' },
  { label: 'Dashboard', href: '/dashboard' },
];

const TECH_STACK = [
  'Next.js',
  'TypeScript',
  'MediaPipe',
  'Python',
  'FastAPI',
  'PostgreSQL',
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden mt-12 md:mt-24">
      {/* Top Border Glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)',
        boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)',
      }} />

      {/* Subtle Background Glow */}
      <div style={{
        position: 'absolute', bottom: -100, left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: 200, background: 'radial-gradient(ellipse at bottom, rgba(0,212,255,0.08), transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            borderRadius: '50%',
            background: 'rgba(0, 212, 255, 0.4)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            zIndex: 0,
            pointerEvents: 'none',
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="section-container relative z-10 pt-16 pb-8 md:pt-20 md:pb-12">
        {/* Built By Badge */}
        <div className="flex justify-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 30,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 0 12px rgba(0,212,255,0.05)',
              cursor: 'default',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: '#f8fafc', letterSpacing: '0.02em' }}>
              🚀 Built by <span className="gradient-text-cyan glow-cyan" style={{ fontWeight: 700, marginLeft: 4 }}>NEXT STEP INNOVATORS</span>
            </span>
          </motion.div>
        </div>

        {/* Main Footer Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Left: Branding & Description */}
          <motion.div 
            className="md:col-span-12 lg:col-span-5 flex flex-col items-center md:items-start text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em', marginBottom: 8 }}>
              NEXT STEP <span className="gradient-text-cyan glow-cyan">INNOVATORS</span>
            </h2>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
              Building the future of secure biometric identity verification.
            </p>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 380 }}>
              We are a team focused on creating advanced face liveness, anti-spoofing, and identity verification solutions for modern applications.
            </p>
          </motion.div>

          {/* Center: Quick Links */}
          <motion.div 
            className="md:col-span-6 lg:col-span-3 flex flex-col items-center md:items-start text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              Quick Links
            </h3>
            <div className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <motion.span
                    style={{ fontSize: 14, color: '#94a3b8', transition: 'color 0.2s ease' }}
                    whileHover={{ color: '#00d4ff', x: 2 }}
                  >
                    {link.label}
                  </motion.span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Right: Technology Stack */}
          <motion.div 
            className="md:col-span-6 lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
              Technology Stack
            </h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {TECH_STACK.map((tech) => (
                <div key={tech} style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13,
                  color: '#94a3b8',
                }}>
                  {tech}
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Bottom Copyright */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/50 gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            © 2026 NEXT STEP INNOVATORS. All Rights Reserved.
          </div>
          <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            Powered by <span style={{ fontWeight: 600, color: '#cbd5e1' }}>MITRA VERIFY</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
