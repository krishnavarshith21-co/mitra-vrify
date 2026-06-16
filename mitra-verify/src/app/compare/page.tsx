'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, Shield, Fingerprint, CheckCircle, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import PageTransition from '@/components/cyber/PageTransition';
import TiltCard from '@/components/cyber/TiltCard';

const radarData = [
  { subject: 'Speed', basic: 95, advanced: 75, enterprise: 60, fullMark: 100 },
  { subject: 'Accuracy', basic: 90, advanced: 97, enterprise: 99, fullMark: 100 },
  { subject: 'Security Level', basic: 60, advanced: 85, enterprise: 100, fullMark: 100 },
  { subject: 'Deepfake Res.', basic: 50, advanced: 85, enterprise: 99, fullMark: 100 },
  { subject: 'Spoof Res.', basic: 70, advanced: 95, enterprise: 99, fullMark: 100 },
  { subject: 'Integration', basic: 95, advanced: 75, enterprise: 60, fullMark: 100 },
];

export default function ComparePage() {
  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}
          >
            Compare API Products
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}
          >
            Choose the right level of verification for your application&apos;s security requirements.
          </motion.p>
        </div>

        {/* Product Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 60 }}>
          {/* Fast Liveness (Basic) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass card-hover" 
            style={{ padding: 32, borderRadius: 24, borderTop: '4px solid #00ff88', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} color="#00ff88" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>Fast Liveness</h2>
                <div style={{ fontSize: 13, color: '#00ff88', fontFamily: 'monospace' }}>/api/v1/liveness/basic</div>
              </div>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, minHeight: 60 }}>
              Ultra-fast passive liveness detection. Perfect for low-friction user experiences like quick logins.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speed Target</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff88' }}>&lt; 1s</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accuracy</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff88' }}>90%</div>
              </div>
            </div>
 
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Face Presence</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Face Centered (2s)</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Blink Once</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Open Mouth</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}><X size={16} color="#ff3366" /> No Identity Storage</li>
            </ul>
 
            <Link href="/demo/basic" className="btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              View Demo
            </Link>
          </motion.div>
 
          {/* Advanced Anti-Spoof */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass card-hover" 
            style={{ padding: 32, borderRadius: 24, borderTop: '4px solid #7c3aed', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#7c3aed" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>Anti-Spoof</h2>
                <div style={{ fontSize: 13, color: '#7c3aed', fontFamily: 'monospace' }}>/api/v1/liveness/advanced</div>
              </div>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, minHeight: 60 }}>
              Active challenge-response system with texture analysis to prevent replay and presentation attacks.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speed Target</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>2-4s</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accuracy</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#7c3aed' }}>97%</div>
              </div>
            </div>
 
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Shuffled Challenges</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Replay Detection</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Texture Analysis</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Risk Scoring</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}><X size={16} color="#ff3366" /> No Identity Storage</li>
            </ul>
 
            <Link href="/demo/advanced" className="btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              View Demo
            </Link>
          </motion.div>
 
          {/* Enterprise Identity */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass card-hover" 
            style={{ padding: 32, borderRadius: 24, borderTop: '4px solid #00d4ff', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Fingerprint size={24} color="#00d4ff" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>Enterprise</h2>
                <div style={{ fontSize: 13, color: '#00d4ff', fontFamily: 'monospace' }}>/api/v1/identity/verify</div>
              </div>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, minHeight: 60 }}>
              Full identity verification with continuous monitoring, gaze tracking, and multiple face detection.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speed Target</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff' }}>3-6s</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accuracy</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff' }}>99%</div>
              </div>
            </div>
 
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> All Advanced Features</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Face Enrollment & Match</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Gaze & Attention Track</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Continuous Session Auth</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}><CheckCircle size={16} color="#00ff88" /> Multiple Face Protection</li>
            </ul>
 
            <Link href="/demo/enterprise" className="btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
              View Demo
            </Link>
          </motion.div>
        </div>

        {/* Radar Chart */}
        <div className="glass" style={{ padding: 40, borderRadius: 24, marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Capabilities Comparison</h3>
          <div style={{ height: 500, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Fast Liveness" dataKey="basic" stroke="#00ff88" fill="#00ff88" fillOpacity={0.2} />
                <Radar name="Anti-Spoof" dataKey="advanced" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                <Radar name="Enterprise" dataKey="enterprise" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Feature Matrix */}
        <div className="glass" style={{ padding: 40, borderRadius: 24 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Feature Matrix</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: '16px', color: '#00ff88', fontWeight: 600 }}>Fast Liveness</th>
                  <th style={{ padding: '16px', color: '#7c3aed', fontWeight: 600 }}>Anti-Spoof</th>
                  <th style={{ padding: '16px', color: '#00d4ff', fontWeight: 600 }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Face Presence Detection', b: true, a: true, e: true },
                  { name: 'Blink & Motion Detection', b: true, a: true, e: true },
                  { name: 'Active Challenge-Response', b: false, a: true, e: true },
                  { name: 'Texture & Lighting Analysis', b: false, a: true, e: true },
                  { name: 'Screen/Photo Replay Detection', b: false, a: true, e: true },
                  { name: 'Deepfake & Swap Detection', b: false, a: true, e: true },
                  { name: 'Identity Matching', b: false, a: false, e: true },
                  { name: 'Continuous Session Auth', b: false, a: false, e: true },
                  { name: 'Multiple Face Detection', b: false, a: false, e: true },
                  { name: 'Gaze & Attention Tracking', b: false, a: false, e: true },
                ].map((row, i) => (
                  <tr key={row.name} style={{ borderBottom: i === 9 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: 14 }}>{row.name}</td>
                    <td style={{ padding: '16px' }}>{row.b ? <CheckCircle size={18} color="#00ff88" /> : <X size={18} color="#ff3366" opacity={0.5} />}</td>
                    <td style={{ padding: '16px' }}>{row.a ? <CheckCircle size={18} color="#7c3aed" /> : <X size={18} color="#ff3366" opacity={0.5} />}</td>
                    <td style={{ padding: '16px' }}>{row.e ? <CheckCircle size={18} color="#00d4ff" /> : <X size={18} color="#ff3366" opacity={0.5} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
