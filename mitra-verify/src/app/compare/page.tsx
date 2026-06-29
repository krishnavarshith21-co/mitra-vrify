'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Zap, Fingerprint, CheckCircle, 
  Camera, Scan, Activity, ShieldAlert,
  Copy, Server, Building2,
  Key, Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/cyber/PageTransition';

// Reusable animated progress bar
const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`h-full ${colorClass}`}
    />
  </div>
);

// Performance Chart Row
const PerfChartRow = ({ label, basic, advanced, enterprise }: any) => (
  <div className="grid grid-cols-12 gap-4 py-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors">
    <div className="col-span-3 text-sm text-slate-300 font-medium pl-4">{label}</div>
    <div className="col-span-3 px-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-cyan-400">{basic.val}</span>
      </div>
      <ProgressBar value={basic.pct} colorClass="bg-cyan-400" />
    </div>
    <div className="col-span-3 px-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-violet-400">{advanced.val}</span>
      </div>
      <ProgressBar value={advanced.pct} colorClass="bg-violet-400" />
    </div>
    <div className="col-span-3 px-4 pr-6">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-emerald-400">{enterprise.val}</span>
      </div>
      <ProgressBar value={enterprise.pct} colorClass="bg-emerald-400" />
    </div>
  </div>
);

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState('Node');
  const [copied, setCopied] = useState(false);

  const codeExamples: Record<string, string> = {
    Node: `import { MitraClient } from '@mitra/verify';

const client = new MitraClient(process.env.MITRA_API_KEY);

const result = await client.identity.verify({
  image: base64Image,
  requireLiveness: true,
  strictMode: true
});

console.log(result.verified); // true`,
    Python: `from mitra import MitraClient
import os

client = MitraClient(api_key=os.getenv("MITRA_API_KEY"))

result = client.identity.verify(
    image=base64_image,
    require_liveness=True,
    strict_mode=True
)

print(result.verified) # True`,
    Java: `import com.mitra.MitraClient;
import com.mitra.models.VerifyRequest;

MitraClient client = new MitraClient(System.getenv("MITRA_API_KEY"));

VerifyRequest request = VerifyRequest.builder()
    .image(base64Image)
    .requireLiveness(true)
    .strictMode(true)
    .build();

var result = client.identity().verify(request);
System.out.println(result.isVerified()); // true`,
    React: `import { useMitraVerify } from '@mitra/react';

function VerificationFlow() {
  const { verify, isLoading } = useMitraVerify();

  const handleCapture = async (frame) => {
    const result = await verify(frame, { strict: true });
    if (result.verified) {
      // Proceed to secure area
    }
  };

  return <Camera onCapture={handleCapture} loading={isLoading} />;
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#060B14] text-slate-200 font-sans selection:bg-cyan-500/30">
        <Navbar />

        <main className="pt-28 pb-24 max-w-[1400px] mx-auto px-6">
          
          {/* COMPACT HEADER */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16 border-b border-white/10 pb-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Compare Verification APIs</h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Choose the right verification pipeline for your application's security, speed and identity requirements.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity }} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Enterprise Ready
              </motion.div>
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <Server className="w-3.5 h-3.5" /> 99.99% Uptime
              </motion.div>
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="px-3 py-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs font-mono text-violet-400 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> 97-99% Accuracy
              </motion.div>
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1.5 }} className="px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> &lt;300ms Avg Response
              </motion.div>
            </div>
          </header>

          {/* API CARDS (Premium grid) */}
          <section className="grid lg:grid-cols-3 gap-6 mb-24">
            {/* API 1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} whileHover={{ y: -4 }} className="group relative rounded-2xl bg-[#0a101d] border border-white/5 hover:border-cyan-500/30 transition-all overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 flex-1">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-6">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Fast Liveness</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Ultra-fast passive detection. Best for frictionless logins.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Speed</span><span className="text-cyan-400 font-medium">Fastest</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Accuracy</span><span className="text-white">92%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Processing</span><span className="text-white">&lt; 1.2s</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Endpoint</span><code className="text-xs text-cyan-400 font-mono">/v1/basic</code></div>
                </div>
                
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Features</div>
                <ul className="text-sm text-slate-300 space-y-2 mb-8">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-400" /> Face Presence</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-400" /> Motion Detection</li>
                </ul>
              </div>
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex gap-3">
                <Link href="/demo/basic" className="flex-1 py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#060B14] font-medium text-sm text-center transition-colors">View Demo</Link>
                <Link href="/docs" className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm text-center border border-white/10 transition-colors">API Docs</Link>
              </div>
            </motion.div>

            {/* API 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} whileHover={{ y: -4 }} className="group relative rounded-2xl bg-[#0a101d] border border-white/5 hover:border-violet-500/30 transition-all overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 flex-1">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 mb-6">
                  <ShieldAlert className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Advanced Anti-Spoof</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Active challenge-response to prevent presentation attacks.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Speed</span><span className="text-violet-400 font-medium">Balanced</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Accuracy</span><span className="text-white">98.5%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Processing</span><span className="text-white">2.5s</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Endpoint</span><code className="text-xs text-violet-400 font-mono">/v1/advanced</code></div>
                </div>
                
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Features</div>
                <ul className="text-sm text-slate-300 space-y-2 mb-8">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-violet-400" /> All Basic Features</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-violet-400" /> Replay Detection</li>
                </ul>
              </div>
              <div className="p-4 border-t border-white/5 bg-white/[0.01] flex gap-3">
                <Link href="/demo/advanced" className="flex-1 py-2 px-4 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-medium text-sm text-center transition-colors">View Demo</Link>
                <Link href="/docs" className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm text-center border border-white/10 transition-colors">API Docs</Link>
              </div>
            </motion.div>

            {/* API 3 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} whileHover={{ y: -4 }} className="group relative rounded-2xl bg-[#0a101d] border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all overflow-hidden flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-100" />
              <div className="p-8 flex-1 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 mb-6">
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">Full verification with continuous session monitoring.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Speed</span><span className="text-emerald-400 font-medium">Thorough</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Accuracy</span><span className="text-white">99.9%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Processing</span><span className="text-white">3.8s</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Endpoint</span><code className="text-xs text-emerald-400 font-mono">/v1/identity</code></div>
                </div>
                
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Features</div>
                <ul className="text-sm text-slate-300 space-y-2 mb-8">
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" /> All Advanced Features</li>
                  <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-400" /> Identity Matching</li>
                </ul>
              </div>
              <div className="p-4 border-t border-emerald-500/20 bg-emerald-950/20 flex gap-3 relative z-10">
                <Link href="/demo/enterprise" className="flex-1 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#060B14] font-medium text-sm text-center transition-colors">View Demo</Link>
                <Link href="/docs" className="flex-1 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm text-center border border-white/10 transition-colors">API Docs</Link>
              </div>
            </motion.div>
          </section>

          {/* QUICK COMPARISON */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Quick Comparison</h2>
            <div className="bg-[#0a101d] rounded-2xl border border-white/5 p-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Metric</div>
                <div className="col-span-3">Fast Liveness</div>
                <div className="col-span-3">Advanced Anti-Spoof</div>
                <div className="col-span-3">Enterprise</div>
              </div>
              <PerfChartRow label="Speed" basic={{pct: 95, val: 'Fastest'}} advanced={{pct: 60, val: 'Balanced'}} enterprise={{pct: 40, val: 'Thorough'}} />
              <PerfChartRow label="Security" basic={{pct: 40, val: 'Standard'}} advanced={{pct: 85, val: 'High'}} enterprise={{pct: 100, val: 'Maximum'}} />
              <PerfChartRow label="Accuracy" basic={{pct: 92, val: '92%'}} advanced={{pct: 98, val: '98.5%'}} enterprise={{pct: 100, val: '99.9%'}} />
              <PerfChartRow label="Identity Match" basic={{pct: 5, val: 'None'}} advanced={{pct: 5, val: 'None'}} enterprise={{pct: 100, val: 'Included'}} />
              <PerfChartRow label="Anti-Spoof" basic={{pct: 30, val: 'Basic'}} advanced={{pct: 90, val: 'Advanced'}} enterprise={{pct: 100, val: 'Deep'}} />
              <PerfChartRow label="Deepfake Det." basic={{pct: 10, val: 'Low'}} advanced={{pct: 80, val: 'High'}} enterprise={{pct: 100, val: 'Maximum'}} />
              <PerfChartRow label="Replay Det." basic={{pct: 20, val: 'Low'}} advanced={{pct: 95, val: 'High'}} enterprise={{pct: 100, val: 'Maximum'}} />
              <PerfChartRow label="Scalability" basic={{pct: 100, val: 'High'}} advanced={{pct: 90, val: 'High'}} enterprise={{pct: 70, val: 'Medium'}} />
              <PerfChartRow label="Latency" basic={{pct: 10, val: '<1s'}} advanced={{pct: 50, val: '2s'}} enterprise={{pct: 90, val: '4s'}} />
            </div>
          </motion.section>

          {/* FEATURE MATRIX */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Feature Matrix</h2>
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0a101d]">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-[#0d1424] sticky top-0 z-10">
                  <tr>
                    <th className="p-5 font-medium text-slate-300 w-1/3 border-b border-white/10">Feature</th>
                    <th className="p-5 font-medium text-cyan-400 border-b border-white/10">Fast Liveness</th>
                    <th className="p-5 font-medium text-violet-400 border-b border-white/10">Adv. Anti-Spoof</th>
                    <th className="p-5 font-medium text-emerald-400 border-b border-white/10">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {[
                    { name: 'Face Presence Detection', b: '✓ Included', a: '✓ Included', e: '✓ Included' },
                    { name: 'Blink & Motion Detection', b: '✓ Included', a: '✓ Included', e: '✓ Included' },
                    { name: 'Active Challenge-Response', b: '-', a: 'Premium', e: 'Premium' },
                    { name: 'Texture & Lighting Analysis', b: '-', a: 'Premium', e: 'Premium' },
                    { name: 'Screen/Photo Replay Detection', b: '-', a: 'Premium', e: 'Premium' },
                    { name: 'Deepfake & Swap Detection', b: '-', a: 'Premium', e: 'Premium' },
                    { name: 'Identity Matching', b: '-', a: '-', e: 'Enterprise' },
                    { name: 'Continuous Session Auth', b: '-', a: '-', e: 'Enterprise' },
                    { name: 'Multiple Face Detection', b: '-', a: '-', e: 'Enterprise' },
                    { name: 'Gaze & Attention Tracking', b: '-', a: '-', e: 'Enterprise' },
                  ].map((row, i) => (
                    <tr key={row.name} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-5 text-slate-300 font-medium border-r border-white/5">{row.name}</td>
                      <td className="p-5 border-r border-white/5">
                        {row.b === '-' ? <span className="text-slate-600">Unavailable</span> : <span className="text-cyan-400 font-medium">{row.b}</span>}
                      </td>
                      <td className="p-5 border-r border-white/5">
                        {row.a === '-' ? <span className="text-slate-600">Unavailable</span> : row.a === 'Premium' ? <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 text-xs">Premium</span> : <span className="text-violet-400 font-medium">{row.a}</span>}
                      </td>
                      <td className="p-5">
                        {row.e === '-' ? <span className="text-slate-600">Unavailable</span> : row.e === 'Enterprise' ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs">Enterprise</span> : row.e === 'Premium' ? <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs">Premium</span> : <span className="text-emerald-400 font-medium">{row.e}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* VERIFICATION PIPELINE */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Verification Pipeline</h2>
            <div className="relative bg-[#0a101d] rounded-2xl border border-white/5 p-12 overflow-x-auto hide-scrollbar">
              <div className="min-w-[900px] flex justify-between items-center relative">
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2" />
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="absolute top-1/2 left-8 h-0.5 bg-cyan-500 -translate-y-1/2 shadow-[0_0_10px_#06b6d4]"
                />
                
                {[
                  { icon: Camera, label: "Camera" },
                  { icon: Scan, label: "Face Detection" },
                  { icon: Activity, label: "Liveness" },
                  { icon: ShieldAlert, label: "Spoof Det." },
                  { icon: Fingerprint, label: "Enrollment" },
                  { icon: Users, label: "Identity Match" },
                  { icon: CheckCircle, label: "Verified", isLast: true }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="relative z-10 group cursor-pointer flex flex-col items-center bg-[#0a101d] px-2"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300
                      ${step.isLast ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0d1424] border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/50'} 
                      border`}
                    >
                      <step.icon className={`w-5 h-5 ${step.isLast ? 'text-emerald-400' : 'text-slate-400 group-hover:text-cyan-400'}`} />
                    </div>
                    <div className="text-slate-300 font-medium text-xs whitespace-nowrap">{step.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* API COMPARISON CARDS */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
             <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Detailed Breakdown</h2>
             <div className="grid lg:grid-cols-3 gap-6">
                {[
                  { name: "Fast Liveness", subtitle: "Passive Detection", textClass: "text-cyan-400", borderClass: "border-cyan-500/30", hoverClass: "hover:bg-cyan-500/10", feats: "Passive Detection", time: "< 1.2s", acc: "92.0%", use: "Basic Auth", ind: "Social, Forums", tier: "Basic" },
                  { name: "Adv. Anti-Spoof", subtitle: "Active Challenge, Replay Det.", textClass: "text-violet-400", borderClass: "border-violet-500/30", hoverClass: "hover:bg-violet-500/10", feats: "Active Challenge, Replay Det.", time: "2.5s", acc: "98.5%", use: "Financial KYC", ind: "FinTech, Crypto", tier: "Premium" },
                  { name: "Enterprise", subtitle: "Identity Match, Gaze Track", textClass: "text-emerald-400", borderClass: "border-emerald-500/30", hoverClass: "hover:bg-emerald-500/10", feats: "Identity Match, Gaze Track", time: "3.8s", acc: "99.9%", use: "High-Risk Auth", ind: "Gov, Healthcare", tier: "Enterprise" }
                ].map((api, i) => (
                  <div key={i} className="bg-[#0a101d] rounded-2xl border border-white/5 p-6 flex flex-col">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                      <div>
                        <div className="text-sm text-slate-400">{api.name}</div>
                        <div className={`text-lg font-bold ${api.textClass}`}>{api.subtitle}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">{api.tier}</div>
                    </div>
                    <div className="space-y-4 flex-1 text-sm">
                      <div><span className="text-slate-500 block text-xs mb-1">Supported Features</span><span className="text-slate-200">{api.feats}</span></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-slate-500 block text-xs mb-1">Avg Time</span><span className="text-slate-200">{api.time}</span></div>
                        <div><span className="text-slate-500 block text-xs mb-1">Accuracy</span><span className="text-slate-200">{api.acc}</span></div>
                      </div>
                      <div><span className="text-slate-500 block text-xs mb-1">Use Cases</span><span className="text-slate-200">{api.use}</span></div>
                      <div><span className="text-slate-500 block text-xs mb-1">Industries</span><span className="text-slate-200">{api.ind}</span></div>
                    </div>
                    <button className={`mt-6 w-full py-2.5 rounded-lg border ${api.borderClass} ${api.textClass} ${api.hoverClass} text-sm font-medium transition-colors`}>
                      Select {api.name}
                    </button>
                  </div>
                ))}
             </div>
          </motion.section>

          {/* BEST FOR */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
             <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Recommendations</h2>
             <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Fast Login", desc: "Best for authentication", icon: Key },
                  { title: "Fraud Prevention", desc: "Best for banking", icon: ShieldAlert },
                  { title: "Identity Verification", desc: "Best for KYC and government", icon: Building2 },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0a101d] rounded-2xl border border-white/5 p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <div className="text-slate-200 font-medium mb-1">{item.title}</div>
                      <div className="text-slate-500 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
             </div>
          </motion.section>

          {/* CODE INTEGRATION */}
          <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-24">
            <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Code Integration</h2>
            <div className="rounded-2xl border border-white/5 bg-[#0a101d] overflow-hidden">
              <div className="flex border-b border-white/5 bg-[#0d1424]">
                {['Node', 'Python', 'Java', 'React'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-cyan-400 text-cyan-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative p-6">
                <button 
                  onClick={handleCopy}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                  <code>{codeExamples[activeTab]}</code>
                </pre>
              </div>
            </div>
          </motion.section>

          {/* CTA CARD */}
          <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
            <div className="bg-gradient-to-r from-[#0a101d] to-[#0d1424] rounded-2xl border border-white/10 p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to integrate MITRA VERIFY?</h2>
                <p className="text-slate-400">Get your API keys in seconds and start verifying identities.</p>
              </div>
              <div className="flex gap-4 shrink-0 relative z-10 w-full md:w-auto">
                <Link href="/developer" className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#060B14] font-medium text-center transition-colors">
                  Generate API Key
                </Link>
                <Link href="/docs" className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-center border border-white/10 transition-colors">
                  Read Documentation
                </Link>
              </div>
            </div>
          </motion.section>

        </main>

        {/* MINIMAL FOOTER */}
        <footer className="border-t border-white/5 bg-[#03060a]">
          <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex gap-6">
              <Link href="/products" className="hover:text-white transition-colors">Products</Link>
              <Link href="/developer" className="hover:text-white transition-colors">Developers</Link>
              <Link href="/company" className="hover:text-white transition-colors">Company</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
            </div>
            <div className="text-slate-600">&copy; {new Date().getFullYear()} MITRA VERIFY</div>
          </div>
        </footer>

      </div>
    </PageTransition>
  );
}
