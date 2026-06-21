'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Terminal, Copy, CheckCircle, Cpu, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface CodeBlockProps {
  code: string;
  language: string;
  id: string;
  copiedId: string | null;
  onCopy: (code: string, id: string) => void;
}

const CodeBlock = ({ code, language, id, copiedId, onCopy }: CodeBlockProps) => (
  <div className="terminal" style={{ position: 'relative', marginTop: 16, marginBottom: 24 }}>
    <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', zIndex: 10 }}>
      <span style={{ fontSize: 11, color: '#475569', padding: '8px 12px', textTransform: 'uppercase', fontFamily: 'monospace' }}>{language}</span>
      <button 
        onClick={() => onCopy(code, id)}
        style={{ background: 'none', border: 'none', padding: '12px', cursor: 'pointer', color: copiedId === id ? '#00ff88' : '#475569' }}
      >
        {copiedId === id ? <CheckCircle size={14} /> : <Copy size={14} />}
      </button>
    </div>
    <pre style={{ margin: 0, paddingTop: 16, overflowX: 'auto', background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
      <code>{code}</code>
    </pre>
  </div>
);

export default function PrivateDocsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/signin?reason=unauthenticated');
    }
  }, [router, isAuthenticated, authLoading]);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Navbar />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }}
        />
        <p style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <Navbar />

      {/* Background neon lights */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', top: '10%', right: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', bottom: '15%', left: '-10%', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 80px', position: 'relative', zIndex: 10 }}>
        {/* Breadcrumbs / Back button */}
        <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#00d4ff', textDecoration: 'none', fontSize: 14, fontWeight: 500, marginBottom: 32 }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          <ArrowLeft size={16} /> Back to Public Documentation
        </Link>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.2)' }}>
            <Lock size={18} color="#c084fc" />
          </div>
          <span style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c084fc', fontWeight: 700 }}>Enterprise Secure Area</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, color: '#f8fafc' }}>
          Enterprise Private Docs
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 48, maxWidth: 800 }}>
          Welcome to the MITRA VERIFY protected enterprise developer catalog. Here you will find direct configurations for high-throughput liveness deployments, custom biometric matching thresholds, and on-premise service integrations.
        </p>

        {/* Content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          {/* Section 1: Biometric Verification Architectures */}
          <section className="glass" style={{ padding: 32, borderRadius: 20, border: '1px solid rgba(0,212,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Cpu size={20} color="#00d4ff" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>1. Custom Biometric Rules & Weighting</h2>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Enterprise deployments permit configuration of precise weights for eye-blinks, mouth aspect ratio (MAR), yaw/pitch/roll boundaries, and deepfake verification metrics. Use the following headers when requesting custom evaluations.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#94a3b8', textAlign: 'left', marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 8px', color: '#f8fafc', fontWeight: 600 }}>Parameter</th>
                  <th style={{ padding: '12px 8px', color: '#f8fafc', fontWeight: 600 }}>Default Threshold</th>
                  <th style={{ padding: '12px 8px', color: '#f8fafc', fontWeight: 600 }}>Strict Threshold</th>
                  <th style={{ padding: '12px 8px', color: '#f8fafc', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#00d4ff' }}>min_eye_blink_ear</td>
                  <td style={{ padding: '12px 8px' }}>0.22</td>
                  <td style={{ padding: '12px 8px' }}>0.18</td>
                  <td style={{ padding: '12px 8px' }}>Eye Aspect Ratio threshold to register a valid blink event</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#00d4ff' }}>eyebrow_raise_ratio</td>
                  <td style={{ padding: '12px 8px' }}>1.20</td>
                  <td style={{ padding: '12px 8px' }}>1.25</td>
                  <td style={{ padding: '12px 8px' }}>Baseline scaling factor required to detect sustained eyebrow raise</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: '#00d4ff' }}>cosine_similarity_threshold</td>
                  <td style={{ padding: '12px 8px' }}>0.95</td>
                  <td style={{ padding: '12px 8px' }}>0.97</td>
                  <td style={{ padding: '12px 8px' }}>Required cosine matching similarity for Strong Identity Match status</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 2: On-Premise SDK Setup */}
          <section className="glass" style={{ padding: 32, borderRadius: 20, border: '1px solid rgba(124,58,237,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Server size={20} color="#c084fc" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>2. On-Premise Docker Deployment</h2>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Run the MITRA VERIFY verification engine inside your own air-gapped infrastructure. Use the official enterprise container with your API subscription token.
            </p>
            <CodeBlock 
              id="docker-run" 
              language="bash" 
              copiedId={copied}
              onCopy={copy}
              code={`docker run -d -p 8080:8080 \\
  -e MITRA_LICENSE_KEY="your_enterprise_license_key" \\
  -e DEEPFAKE_MODEL_WEIGHTS="s3://mitra-weights-us-east-1/latest.pt" \\
  -e NUM_WORKERS=4 \\
  us-docker.pkg.dev/mitra-verify-prod/engine/server:latest`} 
            />
          </section>

          {/* Section 3: Premium SDK API Reference */}
          <section className="glass" style={{ padding: 32, borderRadius: 20, border: '1px solid rgba(0,212,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Terminal size={20} color="#00d4ff" />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>3. Advanced Anti-Spoof API payload</h2>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Direct programmatic validation request to verify high-accuracy spatial landmarks alongside depth and active spoof challenges.
            </p>
            <CodeBlock 
              id="private-payload" 
              language="json" 
              copiedId={copied}
              onCopy={copy}
              code={`{
  "session_id": "sess_81f29d27ca3a4b92b604",
  "challenge_type": "raise_eyebrows",
  "payload": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...",
    "eyebrow_distance_ratio": 1.23,
    "landmarks_count": 478,
    "gaze_coordinates": { "x": 0.45, "y": 0.52 }
  }
}`} 
            />
          </section>

        </div>
      </div>
    </div>
  );
}
