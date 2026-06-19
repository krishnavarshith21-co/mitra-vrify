'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Send, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} className="grid-bg">
      <Navbar />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-32 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Info */}
        <motion.div className="lg:col-span-5" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Get in touch
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40, maxWidth: 400 }}>
            Have questions about integration, contributing, or need enterprise support? We&apos;d love to hear from you.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Link href="/docs" style={{ textDecoration: 'none' }}>
              <div className="glass card-hover" style={{ padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} color="#00d4ff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>Documentation</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Find integration guides and API references</p>
                </div>
              </div>
            </Link>

            {/* Card removed */}
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div className="lg:col-span-7" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="glass" style={{ padding: 40, borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: 'linear-gradient(90deg, #00d4ff, #7c3aed, #00ff88)' }} />
            
            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle size={48} color="#00ff88" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Message Sent</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>We&apos;ll get back to you as soon as possible.</p>
                <button onClick={() => setSuccess(false)} className="btn-ghost">Send another message</button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Name</label>
                    <input type="text" required placeholder="John Doe" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Email</label>
                    <input type="email" required placeholder="john@company.com" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Subject</label>
                  <input type="text" required placeholder="How can we help?" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Message</label>
                  <textarea required rows={5} placeholder="Tell us more about your project..." 
                    style={{ ...inputStyle, resize: 'none' }} 
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.4)')} 
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')} 
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending...' : <><span>Send Message</span><Send size={15} /></>}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
