import React from 'react';

export default function StatisticsStrip() {
  return (
    <section className="relative z-10 py-10 md:py-16 bg-[#01081A] border-y border-white/[0.05]">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 md:divide-x divide-white/[0.05]">
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">100%</span>
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Open Source</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl md:text-5xl font-bold text-[#00E5FF] tracking-tight mb-2 drop-shadow-[0_0_25px_rgba(0,229,255,0.6)]">&lt; 1s</span>
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Verification Time</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">478</span>
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Facial Landmarks</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Zero</span>
            <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Knowledge Privacy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
