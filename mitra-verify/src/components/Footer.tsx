'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { label: 'Face Liveness', href: '/demo/basic' },
    { label: 'Anti-Spoofing', href: '/demo/advanced' },
    { label: 'Identity Matching', href: '/demo/enterprise' },
    { label: 'Pricing', href: '/compare' },
  ],
  Developers: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/developer' },
    { label: 'Developer Portal', href: '/developer' },
    { label: 'GitHub', href: 'https://github.com' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Security Architecture', href: '/security' },
    { label: 'System Status', href: '/status' },
    { label: 'Support', href: '/support' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Data Processing', href: '/dpa' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/5 bg-[#030712] overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-px bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent" />
      
      <div className="max-w-[1400px] mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
          
          <div className="col-span-2 lg:col-span-2 flex flex-col items-start text-left">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#0066ff]/20 border border-[#00d4ff]/30 flex items-center justify-center group-hover:border-[#00d4ff] transition-colors shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                <Shield size={20} color="#00d4ff" />
              </div>
              <span className="font-extrabold tracking-tight text-white text-lg">MITRA VERIFY</span>
            </Link>
            <p className="text-[14px] text-slate-500 leading-relaxed mb-6 max-w-[300px]">
              The enterprise biometric security standard. Architecting the future of secure, zero-friction identity verification for mission-critical applications.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="col-span-1 flex flex-col items-start">
              <h3 className="text-[13px] font-bold text-white mb-6 tracking-wide">
                {category}
              </h3>
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link key={link.label} href={link.href} className="text-[14px] text-slate-400 hover:text-[#00d4ff] transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 gap-4">
          <div className="flex items-center gap-6">
            <div className="text-[13px] font-medium text-slate-500">
              © {new Date().getFullYear()} Nxt Step Innovators. All rights reserved.
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_8px_#00ff88]" />
            <span className="text-[12px] font-mono font-semibold text-slate-300">
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
