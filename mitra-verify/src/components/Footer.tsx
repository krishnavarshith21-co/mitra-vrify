import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#01081A] border-t border-white/[0.05] pt-12 md:pt-20 lg:pt-24 pb-8 md:pb-12">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-10 lg:gap-12 mb-12 md:mb-20">
          
          {/* Brand Col */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#00E5FF] to-[#00B2FF] flex items-center justify-center">
                <Eye size={18} className="text-white fill-transparent" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold tracking-wide text-[15px]">MITRA <span className="text-[#00E5FF]">VERIFY</span></span>
            </Link>
            <p className="text-slate-500 text-[13px] leading-relaxed mb-6 max-w-[300px]">
              Enterprise-grade biometric identity infrastructure. Deterministic verification, zero-knowledge architecture.
            </p>
            <div className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-[13px] font-bold">X</span>
              <span className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-[13px] font-bold">In</span>
              <span className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-[13px] font-bold">GH</span>
            </div>
          </div>
          
          {/* Links Cols */}
          <div>
            <h4 className="text-white font-bold text-[14px] mb-4 md:mb-6">Products</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Face Liveness</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Identity Match</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Voice Verify</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-[14px] mb-4 md:mb-6">Developers</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">SDKs</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors flex items-center gap-2">Status <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-[14px] mb-4 md:mb-6">Company</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Contact Sales</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-[14px] mb-4 md:mb-6">Legal</h4>
            <ul className="space-y-3 md:space-y-4">
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="text-slate-400 hover:text-[#00E5FF] text-[13px] transition-colors">Trust Center</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 md:pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-[13px] text-center md:text-left">
            &copy; {new Date().getFullYear()} Mitra Verify Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 opacity-50">
            <span className="text-slate-500 text-[11px] font-mono border border-white/[0.1] px-2 py-1 rounded">SOC2 Type II</span>
            <span className="text-slate-500 text-[11px] font-mono border border-white/[0.1] px-2 py-1 rounded">ISO27001</span>
            <span className="text-slate-500 text-[11px] font-mono border border-white/[0.1] px-2 py-1 rounded">GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
