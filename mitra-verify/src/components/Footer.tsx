'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Compare APIs', href: '/compare' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Developer Portal', href: '/developer' },
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
    <footer className="relative w-full overflow-hidden border-t border-white/5 bg-[#030712]">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-t from-[#00d4ff]/5 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Left: Branding & Description */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-xl font-bold tracking-widest text-white mb-2 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
              Next Step <span className="text-[#00d4ff]">Innovators</span>
            </h2>
            <p className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              Enterprise Biometric Security Division
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Architecting the future of secure identity verification. MITRA VERIFY provides military-grade face liveness, anti-spoofing, and continuous authentication infrastructure.
            </p>
          </div>

          {/* Center: Quick Links */}
          <div className="md:col-span-6 lg:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              Infrastructure
            </h3>
            <div className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-[#00d4ff] transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-slate-700 group-hover:bg-[#00d4ff] rounded-full transition-colors" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Technology Stack */}
          <div className="md:col-span-6 lg:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              Core Technologies
            </h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {TECH_STACK.map((tech) => (
                <div key={tech} className="px-3 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.05] text-xs font-mono text-slate-400 hover:text-[#00ff88] hover:border-[#00ff88]/30 transition-colors cursor-default">
                  {tech}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/5 gap-4">
          <div className="text-xs font-mono text-slate-600">
            © {new Date().getFullYear()} NEXT STEP INNOVATORS. SECURE DEPLOYMENT.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-400 tracking-wider">
              POWERED BY MITRA VERIFY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
