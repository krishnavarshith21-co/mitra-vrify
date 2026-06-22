'use client';

import { motion } from 'framer-motion';
import { Shield, ChevronRight, AlertCircle, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-[#020617] overflow-hidden selection:bg-[#00d4ff]/30 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 relative px-6">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(0,212,255,0.05),transparent)] z-0 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d4ff]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[800px] w-full relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#3b82f6]/20 border border-[#00d4ff]/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,212,255,0.15)] mb-8">
              <FileText size={32} className="text-[#00d4ff]" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Terms of Service
            </h1>
            
            <p className="text-lg text-slate-400 font-light leading-relaxed max-w-2xl mx-auto mb-12">
              Legal agreements and terms of use for the MITRA VERIFY enterprise platform and APIs.
            </p>

            <div className="p-6 rounded-2xl bg-[#050b14]/50 border border-[#00d4ff]/20 backdrop-blur-md flex items-start gap-4 text-left max-w-xl mx-auto mb-12">
              <AlertCircle className="text-[#00d4ff] shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-white font-semibold mb-2">Content Under Enterprise Review</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  This documentation is currently undergoing security clearance and compliance review. Full access will be granted to verified enterprise accounts shortly.
                </p>
              </div>
            </div>

            <Link href="/" className="inline-flex items-center justify-center px-8 py-3 font-semibold text-[#020617] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,212,255,0.1)] hover:shadow-[0_8px_30px_rgba(0,212,255,0.3)] transition-all bg-gradient-to-r from-[#00D4FF] to-[#00FFB2] hover:scale-105">
              Return to Platform <ChevronRight size={18} className="ml-2" />
            </Link>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 border-t border-white/5 bg-[#01040a] relative z-10 text-center">
        <div className="text-[11px] text-slate-600 font-medium tracking-wide uppercase">
          © {new Date().getFullYear()} NXT STEP INNOVATORS
        </div>
      </footer>
    </div>
  );
}
