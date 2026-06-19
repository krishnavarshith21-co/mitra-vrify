'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Terminal, Code2, Shield, Zap, Fingerprint, ChevronRight, Copy, CheckCircle, Lock, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

const SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'authentication', title: 'Authentication', icon: Shield },
  { id: 'fast-liveness', title: 'Fast Liveness API', icon: Zap },
  { id: 'anti-spoof', title: 'Anti-Spoof API', icon: Shield },
  { id: 'enterprise', title: 'Enterprise Identity API', icon: Fingerprint },
  { id: 'sdks', title: 'SDKs & Libraries', icon: Code2 },
  { id: 'errors', title: 'Error Codes', icon: Terminal },
  { id: 'private-docs', title: 'Enterprise Private Docs', icon: Lock },
];

const SkeletonLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <motion.div 
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      style={{ height: 42, width: '45%', borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}
    />
    <motion.div 
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.1 }}
      style={{ height: 20, width: '100%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}
    />
    <motion.div 
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
      style={{ height: 20, width: '85%', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}
    />
    <motion.div 
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
      style={{ height: 160, width: '100%', borderRadius: 14, background: 'rgba(255,255,255,0.03)', marginTop: 16 }}
    />
    <motion.div 
      animate={{ opacity: [0.35, 0.7, 0.35] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.4 }}
      style={{ height: 24, width: '30%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginTop: 24 }}
    />
  </div>
);

const CodeBlock = ({ code, language }: { code: string, language: string, id?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal" style={{ position: 'relative', marginTop: 16, marginBottom: 24 }}>
      <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <span style={{ fontSize: 11, color: '#475569', padding: '8px 12px', textTransform: 'uppercase', fontFamily: 'monospace' }}>{language}</span>
        <button 
          onClick={handleCopy}
          style={{ background: 'none', border: 'none', padding: '12px', cursor: 'pointer', color: copied ? '#00ff88' : '#475569' }}
        >
          {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre style={{ margin: 0, paddingTop: 16, overflowX: 'auto', background: 'rgba(0,0,0,0.5)', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSectionChange = (sectionId: string) => {
    setLoadingDocs(true);
    setActiveSection(sectionId);
    const t = setTimeout(() => {
      setLoadingDocs(false);
    }, 400);
    return () => clearTimeout(t);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 w-full max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-20 md:pt-32 md:pb-24">
        {/* Mobile Sidebar Trigger */}
        <div className="lg:hidden flex items-center justify-between border-b border-slate-800/40 pb-4 mb-4">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="btn-ghost flex items-center gap-2 px-4 py-2"
            style={{ fontSize: 13, border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <BookOpen size={16} color="#00d4ff" /> View Sections
          </button>
          <span style={{ fontSize: 12, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
            {SECTIONS.find(s => s.id === activeSection)?.title}
          </span>
        </div>

        {/* Mobile Drawer Sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-[280px] h-full bg-[#030712] border-r border-slate-800/80 p-6 flex flex-col gap-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 style={{ fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Documentation
                  </h3>
                  <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SECTIONS.map(section => {
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          handleSectionChange(section.id);
                          setMobileSidebarOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                          borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                          background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                          color: isActive ? '#00d4ff' : 'var(--text-secondary)',
                          fontWeight: isActive ? 600 : 500,
                          transition: 'all 0.2s'
                        }}
                      >
                        <section.icon size={16} color={isActive ? '#00d4ff' : '#475569'} />
                        <span style={{ flex: 1 }}>{section.title}</span>
                        {isActive && <ChevronRight size={14} />}
                      </button>
                    );
                  })}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <div style={{ position: 'sticky', top: 100 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, paddingLeft: 16 }}>
              Documentation
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SECTIONS.map(section => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                      borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                      color: isActive ? '#00d4ff' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    <section.icon size={16} color={isActive ? '#00d4ff' : '#475569'} />
                    <span style={{ flex: 1 }}>{section.title}</span>
                    {isActive && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {loadingDocs ? (
              <SkeletonLoader key="skeleton" />
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'getting-started' && (
                  <div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Getting Started</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                      Welcome to the MITRA VERIFY API documentation. Our platform provides state-of-the-art computer vision liveness and identity verification services. 
                      You can integrate our real-time biometric analysis endpoints into web, native mobile, or backend pipelines using our developer tools.
                    </p>

                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#f8fafc' }}>Base URL</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      All API requests should be sent to the local development gateway or our production cloud endpoint:
                    </p>
                    <CodeBlock id="base-url" language="text" code="http://localhost:8005/api/v1" />

                    <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 16, color: '#f8fafc' }}>Quick Start Steps</h2>
                    <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <li><strong style={{ color: '#f8fafc' }}>Register a developer account</strong> on the portal.</li>
                      <li><strong style={{ color: '#f8fafc' }}>Generate an API Key</strong> scoped to your preferred tier (Basic, Advanced, or Enterprise).</li>
                      <li><strong style={{ color: '#f8fafc' }}>Send your base64 frame stream</strong> to the liveness verification backend gateway.</li>
                    </ol>
                  </div>
                )}

                {activeSection === 'authentication' && (
                  <div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Authentication</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                      All REST API endpoints are protected and require a header-based API key validation. Authenticate requests by passing your key in the <code className="mono" style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>X-API-Key</code> header.
                    </p>

                    <div className="glass" style={{ padding: 24, borderRadius: 12, marginBottom: 32, borderLeft: '4px solid #00d4ff' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>API Key Prefix Conventions</h3>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>MITRA VERIFY API keys use strict prefix constraints to denote their tier capabilities:</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                        <li><code className="mono" style={{ color: '#00d4ff' }}>mv_basic_xxxx...</code> — Authorized for Fast Liveness API</li>
                        <li><code className="mono" style={{ color: '#7c3aed' }}>mv_adv_xxxx...</code> — Authorized for Fast & Advanced Anti-Spoof APIs</li>
                        <li><code className="mono" style={{ color: '#00ff88' }}>mv_ent_xxxx...</code> — Authorized for all tiers including Enterprise Identity APIs</li>
                      </ul>
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#f8fafc' }}>Example Request</h2>
                    <CodeBlock id="auth-example" language="curl" code={`curl -X POST http://localhost:8005/api/v1/liveness/basic \\
  -H "X-API-Key: mv_basic_4d13e9a7e6c0c80b561" \\
  -H "Content-Type: application/json" \\
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'`} />
                  </div>
                )}

                {activeSection === 'fast-liveness' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontSize: 12, fontWeight: 600 }}>POST</div>
                      <code className="mono" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>/liveness/basic</code>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Fast Liveness API</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                      The Fast Liveness API performs passive checks to verify the presence of a live user without requiring interactive challenges. It validates basic facial landmarks, eye blinking state, and head movement.
                    </p>

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Features</h3>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8, marginBottom: 28 }}>
                      <li>Passive detection with zero user friction.</li>
                      <li>High processing performance (<span style={{ color: '#00d4ff' }}>&lt; 50ms</span> inference latency).</li>
                      <li>Extracts basic coordinates, Eye Aspect Ratio (EAR), and Mouth Aspect Ratio (MAR).</li>
                    </ul>

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Request Payload</h3>
                    <CodeBlock id="req-basic" language="json" code={`{
  "image": "data:image/jpeg;base64,/9j/4AAQSk..." // Base64 data URI string
}`} />

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Response Payload</h3>
                    <CodeBlock id="res-basic" language="json" code={`{
  "session_id": "9a38f828-e5cc-44aa-9c59-bf8e4113e1f0",
  "result": "pass", 
  "confidence": 0.9650, 
  "liveness_score": 0.9200, 
  "processing_time": 32.4, 
  "checks": {
    "face_present": true,
    "blink_detected": false,
    "mouth_movement": false,
    "head_rotation": false,
    "smile_detected": true
  }
}`} />

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 16, color: '#f8fafc' }}>Code Samples</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00d4ff', marginBottom: 8 }}>Python Integration</h4>
                        <CodeBlock id="code-py-basic" language="python" code={`import requests

payload = {"image": "data:image/jpeg;base64,/9j/4AAQ..."}
headers = {"X-API-Key": "mv_basic_your_key"}

response = requests.post("http://localhost:8005/api/v1/liveness/basic", json=payload, headers=headers)
print(response.json())`} />
                      </div>

                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00d4ff', marginBottom: 8 }}>Node.js / Javascript</h4>
                        <CodeBlock id="code-node-basic" language="javascript" code={`const axios = require('axios');

async function checkLiveness(base64Image) {
  const response = await axios.post(
    'http://localhost:8005/api/v1/liveness/basic',
    { image: base64Image },
    { headers: { 'X-API-Key': 'mv_basic_your_key' } }
  );
  return response.data;
}`} />
                      </div>

                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00d4ff', marginBottom: 8 }}>React Context Hook</h4>
                        <CodeBlock id="code-react-basic" language="javascript" code={`import React, { useState } from 'react';

export function LivenessChecker() {
  const [status, setStatus] = useState('idle');

  const verify = async (imgB64) => {
    setStatus('processing');
    const res = await fetch('http://localhost:8005/api/v1/liveness/basic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mv_basic_key'
      },
      body: JSON.stringify({ image: imgB64 })
    });
    const data = await res.json();
    setStatus(data.result === 'pass' ? 'PASSED' : 'FAILED');
  };

  return <div>Status: {status}</div>;
}`} />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'anti-spoof' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 12, fontWeight: 600 }}>POST</div>
                      <code className="mono" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>/liveness/advanced</code>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Advanced Anti-Spoof API</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                      The Advanced Anti-Spoof API utilizes deep texture frequency checks and active challenge-response protocols to defend against paper prints, screen replays, and deepfakes.
                    </p>

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Core Biometric Safeguards</h3>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <li><strong>Challenge System</strong>: Prompts user to perform a dynamic sequence of facial movements. Verification passes only when the correct gesture matches the active session challenge.</li>
                      <li><strong>Replay Detection</strong>: Runs 2D Fourier Transforms (FFT) on the face bounding box to analyze high-frequency patterns indicative of secondary digital display reflections (moiré waves).</li>
                      <li><strong>Deepfake Detection</strong>: Checks pixel consistency and skin lighting depth vectors to flag AI-synthesized masks and virtual camera injectors.</li>
                    </ul>

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Request Payload</h3>
                    <CodeBlock id="req-adv" language="json" code={`{
  "image": "data:image/jpeg;base64,...",
  "challenge_type": "blink_twice", // e.g. open_mouth, turn_left, smile
  "session_id": "b1827fa1-923f-42e1" // Preserves liveness sequence cache state
}`} />

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Response Payload</h3>
                    <CodeBlock id="res-adv" language="json" code={`{
  "session_id": "b1827fa1-923f-42e1",
  "result": "pass", 
  "confidence": 0.9820,
  "spoof_score": 0.0820, // 0.0 to 1.0 (Higher means high spoof risk)
  "deepfake_risk": 0.1240, 
  "checks": {
    "face_present": true,
    "texture_analysis": 0.892,
    "replay_attack_score": 0.115,
    "challenge_passed": true
  }
}`} />

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 16, color: '#f8fafc' }}>Python Anti-Spoof Loop Example</h3>
                    <CodeBlock id="code-py-adv" language="python" code={`import requests
import json

session_id = None
challenges = ["blink_twice", "open_mouth", "turn_right"]

for step in challenges:
    # 1. Capture camera frame (dummy bytes used here)
    frame_b64 = "data:image/jpeg;base64,..." 
    
    # 2. POST to Advanced endpoint
    res = requests.post(
        "http://localhost:8005/api/v1/liveness/advanced",
        json={"image": frame_b64, "challenge_type": step, "session_id": session_id},
        headers={"X-API-Key": "mv_adv_secret_key"}
    )
    
    data = res.json()
    session_id = data["session_id"]
    
    if data["checks"]["challenge_passed"]:
        print(f"Step {step} verified successfully!")
    else:
        print(f"Liveness failed at step {step}.")
        break`} />
                  </div>
                )}

                {activeSection === 'enterprise' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,136,0.1)', color: '#00ff88', fontSize: 12, fontWeight: 600 }}>POST / GET</div>
                      <code className="mono" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>/identity/verify & /identity/enroll</code>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Enterprise Identity API</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                      The high-security Enterprise suite binds active anti-spoof checks with biometric enrollment templates to continuously audit, authorize, and verify user sessions.
                    </p>

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Key Components</h3>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <li><strong>Face Enrollment</strong>: Encodes 16 key nodes into a scale-normalized 120-dimensional mathematical coordinate signature vector. The vector is persisted to the database.</li>
                      <li><strong>Identity Matching</strong>: Computes live cosine similarity scores on base64 frame arrays compared against the user&apos;s template. Values $\ge 75\%$ denote an identity match.</li>
                      <li><strong>Sequential Challenges</strong>: Enforces a strict sequence of 9 active challenges to prevent replay injection during authentication.</li>
                      <li><strong>Continuous Monitoring & Session Revocation</strong>: An active session is immediately terminated (revoking JWT access tokens and pushing redirect parameters) if a face is lost for &gt; 3.0 seconds, if multiple faces enter the frame, or if similarity drops below the $75\%$ baseline.</li>
                    </ul>

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Enrollment Endpoint (`POST /identity/enroll`)</h3>
                    <CodeBlock id="req-enroll" language="json" code={`{
  "image": "data:image/jpeg;base64,...",
  "subject_id": "optional_user_identifier"
}`} />

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Verification Endpoint (`POST /identity/verify`)</h3>
                    <CodeBlock id="req-verify" language="json" code={`{
  "image": "data:image/jpeg;base64,...",
  "subject_id": "user_id_to_compare"
}`} />

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>Identity Verification Response</h3>
                    <CodeBlock id="res-verify" language="json" code={`{
  "session_id": "31bfa2a9-c0c8-47a2-9852-c8a7b6a12df5",
  "result": "pass", // "pass" represents State 5: AUTHENTICATED
  "confidence": 0.9850,
  "identity": {
    "matched": true,
    "subject_id": "demo_user",
    "similarity_score": 0.9234
  },
  "checks": {
    "face_present": true,
    "face_authenticated": true,
    "eye_tracking": true,
    "multiple_faces_detected": false,
    "deepfake_detected": false
  }
}`} />
                  </div>
                )}

                {activeSection === 'sdks' && (
                  <div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>SDKs & Libraries</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                      Accelerate your integration workflows with our official open-source software development packages. We distribute modules for client browsers, mobile OS platforms, and backend runtime environments.
                    </p>

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f8fafc' }}>Installation Commands</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div className="glass" style={{ padding: 16, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>NPM / YARN</div>
                        <code style={{ fontSize: 13, color: '#00d4ff', fontFamily: 'monospace' }}>npm install @mitraverify/sdk</code>
                      </div>
                      <div className="glass" style={{ padding: 16, borderRadius: 10 }}>
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>PIP (Python)</div>
                        <code style={{ fontSize: 13, color: '#7c3aed', fontFamily: 'monospace' }}>pip install mitraverify-sdk</code>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#f8fafc' }}>SDK Code Examples</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00ff88', marginBottom: 8 }}>JavaScript / TypeScript Client SDK</h4>
                        <CodeBlock id="sdk-js" language="javascript" code={`import { MitraVerifyClient } from '@mitraverify/sdk';

// Initialize the verified client session
const client = new MitraVerifyClient({
  apiKey: 'mv_ent_your_live_key',
  gatewayUrl: 'http://localhost:8005'
});

// Enroll a face embedding vector
const enrollment = await client.identity.enroll({
  image: "data:image/jpeg;base64,...",
  userId: "user_10293"
});
console.log("Enrollment status:", enrollment.status);`} />
                      </div>

                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00ff88', marginBottom: 8 }}>Python SDK (Backend Validation)</h4>
                        <CodeBlock id="sdk-py" language="python" code={`from mitraverify import MitraVerify

# Configure credentials
client = MitraVerify(api_key="mv_ent_your_live_key")

# Verify base64 face snapshot similarity
match_result = client.identity.verify(
    image="data:image/jpeg;base64,...",
    subject_id="user_10293"
)

if match_result.is_matched:
    print(f"Welcome back! Similarity is {match_result.similarity}%")`} />
                      </div>

                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#00ff88', marginBottom: 8 }}>React Native Biometric Camera Wrap</h4>
                        <CodeBlock id="sdk-react" language="javascript" code={`import React from 'react';
import { BiometricCamera } from '@mitraverify/react-native';

export function AuthScreen() {
  const handleSuccess = (result) => {
    console.log("Biometric session authenticated successfully:", result.sessionId);
  };

  return (
    <BiometricCamera
      apiKey="mv_ent_secret"
      onSuccess={handleSuccess}
      onFailure={(error) => console.log(error)}
    />
  );
}`} />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'errors' && (
                  <div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Error Codes</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                      MITRA VERIFY returns standard HTTP response status codes. The response bodies are JSON objects containing descriptive detail blocks to help you troubleshoot API requests.
                    </p>

                    <div className="overflow-x-auto w-full border border-slate-800/40 rounded-xl mb-8">
                      <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>HTTP Status</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Error Code Name</th>
                            <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Description and Remedy</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', color: '#ffb800', fontWeight: 600 }}>400</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>invalid_request</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Invalid Request</strong>. The base64 file string is malformed, has invalid padding, or is empty. Confirm image file conversion parameters.
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', color: '#ff3366', fontWeight: 600 }}>401</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>unauthorized</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Unauthorized</strong>. The API key in the request header is missing, is revoked, or has expired. Make sure the X-API-Key value matches the portal string.
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', color: '#ff3366', fontWeight: 600 }}>403</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>forbidden</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Forbidden</strong>. The API key is valid but lack access scopes to perform the requested endpoint action (e.g. calling /identity with basic keys).
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', color: '#ffb800', fontWeight: 600 }}>404</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>not_found</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Not Found</strong>. The specified subject_id or user record could not be located in the backend database.
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '16px', color: '#ffb800', fontWeight: 600 }}>429</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>rate_limit_exceeded</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Rate Limited</strong>. The monthly volume quota allocated to this key organization plan has been exceeded. Upgrade plan in developer settings.
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '16px', color: '#ff3366', fontWeight: 600 }}>500</td>
                            <td style={{ padding: '16px' }}><code className="mono" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 4 }}>internal_error</code></td>
                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: 14 }}>
                              <strong>Internal Server Error</strong>. An unexpected server runtime error occurred, such as model inference crashes. Contact technical support.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSection === 'private-docs' && (
                  <div>
                    <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Enterprise Private Docs</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                      Access secure developer resources, custom liveness mathematical weighting matrices, Docker deployment configurations, and premium compliance logs.
                    </p>

                    <div className="glass" style={{ padding: 40, borderRadius: 20, border: '1px solid rgba(124, 58, 237, 0.2)', background: 'rgba(124, 58, 237, 0.02)', textAlign: 'center', marginTop: 16 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Lock size={24} color="#c084fc" />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>Restricted Developer Console</h3>
                      <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 450, margin: '0 auto 24px', lineHeight: 1.6 }}>
                        This content is restricted to verified enterprise partners. Authorized users can log in to view configurations.
                      </p>
                      <Link href="/docs/private" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #00d4ff)' }}>
                        Access Private Documentation <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
