import React from 'react';
import { Terminal, Code, TerminalSquare } from 'lucide-react';

export default function DeveloperExperience() {
  const codeString = `import { MitraClient } from '@mitra/verify';

const client = new MitraClient({ apiKey: 'mv_prod_...' });

// 1. Initialize secure session
const session = await client.sessions.create({
  type: 'LIVENESS_AND_MATCH',
  userId: 'usr_892348',
  strictMode: true
});

// 2. Verify identity deterministically
const result = await client.verify(session.id, facePayload);

if (result.status === 'VERIFIED') {
  console.log('Confidence:', result.confidence); // 0.9998
}`;

  return (
    <section className="relative z-10 py-32 bg-[#01081A] border-t border-white/[0.05]">
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="lg:w-1/2 order-2 lg:order-1 w-full">
            <div className="rounded-2xl border border-white/[0.1] bg-[#020A1F] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center px-4 py-3 border-b border-white/[0.1] bg-white/[0.02]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-[11px] font-mono text-slate-500">verify.ts</div>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-[13px] font-mono leading-relaxed text-slate-300">
                  <code dangerouslySetInnerHTML={{ __html: codeString.replace(/MitraClient/g, '<span class="text-emerald-400">MitraClient</span>').replace(/client/g, '<span class="text-blue-400">client</span>').replace(/await/g, '<span class="text-purple-400">await</span>').replace(/const/g, '<span class="text-purple-400">const</span>').replace(/if/g, '<span class="text-purple-400">if</span>').replace(/'mv_prod_...'/g, '<span class="text-orange-300">\'mv_prod_...\'</span>').replace(/'LIVENESS_AND_MATCH'/g, '<span class="text-orange-300">\'LIVENESS_AND_MATCH\'</span>').replace(/'usr_892348'/g, '<span class="text-orange-300">\'usr_892348\'</span>').replace(/'VERIFIED'/g, '<span class="text-orange-300">\'VERIFIED\'</span>').replace(/true/g, '<span class="text-blue-300">true</span>').replace(/new/g, '<span class="text-purple-400">new</span>').replace(/console/g, '<span class="text-blue-400">console</span>') }} />
                </pre>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-[#020A1F] mb-6">
              <TerminalSquare size={14} className="text-[#00E5FF]" />
              <span className="text-slate-300 text-[11px] font-medium tracking-wide uppercase">Developer First</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Integrate in Minutes</h2>
            <p className="text-slate-400 text-[16px] leading-relaxed mb-8">
              Our SDKs and APIs are designed for modern engineering teams. Typed interfaces, comprehensive error handling, and drop-in UI components for React, iOS, and Android.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center"><Code size={18} className="text-slate-300" /></div>
                <div>
                  <span className="text-white font-bold text-[14px] block mb-1">Client SDKs</span>
                  <span className="text-slate-500 text-[12px] block">React, React Native, iOS, Android</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center"><Terminal size={18} className="text-slate-300" /></div>
                <div>
                  <span className="text-white font-bold text-[14px] block mb-1">Server Libraries</span>
                  <span className="text-slate-500 text-[12px] block">Node.js, Python, Go, Java</span>
                </div>
              </div>
            </div>
            
            <button className="mt-8 text-[#00E5FF] font-semibold text-[14px] flex items-center gap-2 hover:underline">
              Explore Documentation &rarr;
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
