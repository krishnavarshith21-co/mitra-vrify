'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Activity, Zap, Server, Shield, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const CountUp = ({ end, suffix = "", prefix = "", decimals = 0 }: any) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else {
        setVal(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{val.toFixed(decimals)}{suffix}</span>;
};

const OriginalLogo = () => (
  <div className="flex items-center justify-center mb-12">
    <div className="flex items-center gap-4">
      <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.3)] border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
        <Shield className="w-[20px] h-[20px] text-white relative z-10" strokeWidth={2.5} />
      </div>
      <span className="text-[24px] font-bold tracking-[0.2em] text-[#F8FAFC]">
        MITRA<span className="text-[#60A5FA] font-medium ml-2">VERIFY</span>
      </span>
    </div>
  </div>
);

const StatCard = ({ icon, end, prefix, suffix, decimals, subtitle, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="p-7 rounded-[22px] border border-[rgba(255,255,255,0.04)] relative group transition-all duration-500 flex flex-col justify-between h-[150px] overflow-hidden"
    style={{ background: 'rgba(14,22,40,0.4)', backdropFilter: 'blur(30px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#3B82F6]/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="flex flex-col gap-4 relative z-10">
      <div className="w-[42px] h-[42px] rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[#94A3B8] group-hover:text-[#60A5FA] group-hover:border-[#60A5FA]/30 group-hover:bg-[#60A5FA]/10 transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[28px] font-semibold text-[#F8FAFC] tracking-tight font-sans leading-none mb-2">
          <CountUp end={end} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        <div className="text-[14px] text-[#94A3B8] font-medium tracking-wide">{subtitle}</div>
      </div>
    </div>
  </motion.div>
);

const PremiumBackground = ({ mousePos, windowSize }: any) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#050814]">
    
    {/* Extremely subtle blueprint grid */}
    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
    
    {/* Large blurred gradient orbs */}
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * 0.015, y: (mousePos.y - windowSize.h/2) * 0.015 }}
      transition={{ type: "tween", ease: "linear", duration: 0.8 }}
      className="absolute top-[-20%] left-[-15%] w-[1400px] h-[1400px] rounded-full bg-[#3B82F6]/5 blur-[200px]"
    />
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * -0.01, y: (mousePos.y - windowSize.h/2) * -0.01 }}
      transition={{ type: "tween", ease: "linear", duration: 0.8 }}
      className="absolute bottom-[-20%] right-[-10%] w-[1200px] h-[1200px] rounded-full bg-[#60A5FA]/[0.03] blur-[180px]"
    />

    {/* Thin animated orbital circles */}
    <div className="absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] opacity-[0.06] hidden lg:block">
      <style>{`
         @keyframes orbitUltraSlow { 100% { transform: rotate(360deg); } }
         @keyframes orbitUltraSlowReverse { 100% { transform: rotate(-360deg); } }
      `}</style>
      <div className="absolute inset-0 rounded-full border border-white/20" style={{ animation: 'orbitUltraSlow 180s linear infinite' }} />
      <div className="absolute inset-[180px] rounded-full border border-dashed border-white/30" style={{ animation: 'orbitUltraSlowReverse 240s linear infinite' }} />
      <div className="absolute inset-[360px] rounded-full border border-white/10" style={{ animation: 'orbitUltraSlow 140s linear infinite' }} />
      <div className="absolute inset-[500px] rounded-full border border-[#60A5FA]/20" style={{ animation: 'orbitUltraSlowReverse 300s linear infinite' }} />
    </div>

    {/* Tiny floating particles */}
    <div className="absolute inset-0">
       {[...Array(20)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-[3px] h-[3px] rounded-full bg-white/15 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
           animate={{
             y: [Math.random() * windowSize.h, Math.random() * windowSize.h - 300],
             x: [Math.random() * windowSize.w, Math.random() * windowSize.w + 150],
             opacity: [0, Math.random() * 0.6 + 0.2, 0]
           }}
           transition={{ duration: 25 + Math.random() * 30, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </div>

    {/* Premium film grain texture */}
    <div className="absolute inset-0 z-40 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
    
    {/* Soft vignette around screen edges */}
    <div className="absolute inset-0 z-50 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,8,20,0.7)_100%)]" />
  </div>
);

const GoogleIcon = () => (
  <svg className="w-[20px] h-[20px] group-hover:scale-105 transition-transform duration-500 fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-[20px] h-[20px] group-hover:scale-105 transition-transform duration-500 fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" />
    <rect x="1" y="11" width="9" height="9" />
    <rect x="11" y="1" width="9" height="9" />
    <rect x="11" y="11" width="9" height="9" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-[20px] h-[20px] group-hover:scale-105 transition-transform duration-500 fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 1000 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect') || '/dashboard';
      try {
        router.replace(redirectPath);
      } catch (err) {
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason') || params.get('message') || params.get('error');
      if (reason) {
        const timer = setTimeout(() => {
          if (reason === 'verification_lost' || reason.includes('lost') || reason.includes('session')) {
            setNotification('Authentication session ended. Face verification lost.');
          } else if (reason === 'unauthenticated' || reason.includes('auth')) {
            setNotification('Please sign in to access this protected route.');
          } else {
            setNotification(reason);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authAPI.login({ email, password });
      const token = res.data.access_token;

      const userDetails = {
        name: res.data.full_name || email.split('@')[0] || 'Developer',
        email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0] || 'Dev')}`,
        provider: 'credentials',
      };

      login(token, userDetails);
      setSuccess('Sign in successful! Redirecting...');

      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect') || '/dashboard';
      window.location.href = redirectPath;
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr?.response?.data?.detail || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github' | 'azure') {
    if (oauthLoading) return;
    setOauthLoading(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('not configured')) {
          setError(`${provider === 'azure' ? 'Microsoft' : provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is not configured.`);
        } else if (error.message.toLowerCase().includes('popup')) {
          setError('Sign-in popup was blocked. Please allow popups.');
        } else {
          setError(`Authentication failed: ${error.message}`);
        }
        setOauthLoading(null);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
      setOauthLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#3B82F6]/30">
      <PremiumBackground mousePos={mousePos} windowSize={windowSize} />
      
      <div className="w-full max-w-[1600px] min-h-screen flex flex-col lg:flex-row items-center relative z-10 mx-auto px-8 py-16 lg:px-24 lg:py-20 gap-16 lg:gap-32">
        
        {/* Left Hero */}
        <div className="flex-1 hidden lg:flex flex-col justify-center relative w-full lg:w-[50%] z-10 pl-8 xl:pl-16">
          <div className="relative z-10 max-w-[600px]">
            <h1 className="text-[64px] xl:text-[76px] font-bold leading-[1.05] tracking-[-0.03em] mb-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                <span className="text-[#F8FAFC]">Enterprise </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F8FAFC] to-[#60A5FA]">Identity.</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                <span className="text-[#F8FAFC]">Built on </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]">Zero Trust.</span>
              </motion.div>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-[19px] text-[#94A3B8] leading-[1.7] mb-16 font-medium max-w-[500px]"
            >
              Protect users with enterprise-grade liveness detection, anti-spoof intelligence, and biometric identity verification powered by AI.
            </motion.p>

            <div className="grid grid-cols-2 gap-6">
              <StatCard icon={<Server className="w-[22px] h-[22px]" />} end={99.99} decimals={2} suffix="%" subtitle="Platform Uptime" delay={0.5} />
              <StatCard icon={<Zap className="w-[22px] h-[22px]" />} end={250} prefix="<" suffix="ms" subtitle="Average Verification" delay={0.6} />
              <StatCard icon={<CheckCircle2 className="w-[22px] h-[22px]" />} end={97.8} decimals={1} suffix="%" subtitle="Detection Accuracy" delay={0.7} />
              <StatCard icon={<Lock className="w-[22px] h-[22px]" />} end={256} prefix="AES-" subtitle="Enterprise Encryption" delay={0.8} />
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="w-full lg:w-[50%] flex items-center justify-center lg:justify-end relative z-10 pr-0 xl:pr-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full max-w-[520px] p-10 md:p-14 rounded-[34px] relative overflow-hidden"
            style={{ 
              background: 'rgba(10, 16, 30, 0.52)', 
              backdropFilter: 'blur(40px)', 
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
              animation: 'floatCard 12s ease-in-out infinite'
            }}
          >
            <style>{`
              @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
            `}</style>
            
            <OriginalLogo />

            <div className="text-center mb-12">
               <h2 className="text-[30px] font-semibold text-[#F8FAFC] mb-4 tracking-tight leading-tight">Welcome Back</h2>
               <p className="text-[#94A3B8] text-[16px] font-medium tracking-wide">Continue to your enterprise dashboard.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden">
                  <div className="mb-8 p-4 rounded-[18px] bg-red-500/10 border border-red-500/20 flex items-start gap-4 shadow-sm">
                    <div className="text-red-400 mt-0.5"><Shield className="w-[20px] h-[20px]" /></div>
                    <p className="text-[14px] text-red-400/90 leading-relaxed font-medium tracking-wide">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden">
                  <div className="mb-8 p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4 shadow-sm">
                    <div className="text-emerald-400 mt-0.5"><CheckCircle2 className="w-[20px] h-[20px]" /></div>
                    <p className="text-[14px] text-emerald-400/90 leading-relaxed font-medium tracking-wide">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-[#94A3B8] group-focus-within:text-[#60A5FA] group-focus-within:scale-110 transition-all duration-500 z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full h-[64px] pt-[22px] pb-2 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.04)] rounded-[20px] pl-[60px] pr-6 text-[#F8FAFC] text-[16px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[rgba(59,130,246,0.02)] transition-all duration-500 placeholder-transparent"
                  placeholder="Email Address"
                />
                <label className={`absolute left-[60px] transition-all duration-400 pointer-events-none font-medium ${email.length > 0 ? 'top-3.5 -translate-y-1/2 text-[11px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[16px] text-[#94A3B8]'} peer-focus:top-3.5 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>
                  Work Email
                </label>
              </div>

              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-[#94A3B8] group-focus-within:text-[#60A5FA] group-focus-within:scale-110 transition-all duration-500 z-10" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full h-[64px] pt-[22px] pb-2 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.04)] rounded-[20px] pl-[60px] pr-[60px] text-[#F8FAFC] text-[16px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[rgba(59,130,246,0.02)] transition-all duration-500 placeholder-transparent"
                  placeholder="Password"
                />
                <label className={`absolute left-[60px] transition-all duration-400 pointer-events-none font-medium ${password.length > 0 ? 'top-3.5 -translate-y-1/2 text-[11px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[16px] text-[#94A3B8]'} peer-focus:top-3.5 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-6 mb-4 pt-2">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-[22px] h-[22px]">
                    <input 
                      type="checkbox" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)} 
                    />
                    <div className="w-full h-full rounded-[6px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center transition-all duration-400 peer-checked:bg-[#3B82F6] peer-checked:border-[#3B82F6] peer-hover:border-[#3B82F6]/50">
                      <svg className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-400 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                  <span className="text-[14.5px] font-medium text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors duration-300">Remember Me</span>
                </label>

                <Link href="/contact" className="text-[14.5px] text-[#94A3B8] hover:text-[#F8FAFC] font-medium transition-colors duration-300">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[64px] mt-8 rounded-[20px] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold text-[17px] tracking-wide relative overflow-hidden group shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_16px_40px_rgba(56,189,248,0.4)] transition-all duration-500 hover:-translate-y-[2px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <RefreshCw className="w-[22px] h-[22px] animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-[22px] h-[22px] group-hover:translate-x-[6px] transition-transform duration-500" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-6 my-10 relative z-10 opacity-60">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[12px] text-[#94A3B8] uppercase tracking-[0.25em] font-semibold">Or continue with</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-5 mb-10 relative z-10">
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('google')}
                className="h-[56px] rounded-[18px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-400 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
              >
                {oauthLoading === 'google' ? (
                  <RefreshCw className="w-[20px] h-[20px] animate-spin text-[#94A3B8]" />
                ) : (
                  <GoogleIcon />
                )}
              </button>
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('azure')}
                className="h-[56px] rounded-[18px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-400 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
              >
                {oauthLoading === 'azure' ? (
                  <RefreshCw className="w-[20px] h-[20px] animate-spin text-[#94A3B8]" />
                ) : (
                  <MicrosoftIcon />
                )}
              </button>
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('github')}
                className="h-[56px] rounded-[18px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-400 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
              >
                {oauthLoading === 'github' ? (
                  <RefreshCw className="w-[20px] h-[20px] animate-spin text-[#94A3B8]" />
                ) : (
                  <GithubIcon />
                )}
              </button>
            </div>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 relative z-10">
              {['SOC2', 'ISO27001', 'AES-256', 'GDPR'].map(badge => (
                <div key={badge} className="px-4 py-2 rounded-full border border-white/5 bg-[rgba(255,255,255,0.02)] flex items-center gap-2 text-[11px] font-bold text-[#94A3B8] tracking-[0.15em] uppercase hover:bg-[rgba(255,255,255,0.05)] hover:border-white/10 hover:text-[#F8FAFC] hover:shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all duration-500 cursor-default group">
                  <ShieldCheck className="w-[14px] h-[14px] opacity-70 group-hover:opacity-100 transition-opacity" />
                  {badge}
                </div>
              ))}
            </div>

            <p className="text-center mt-12 text-[15px] text-[#94A3B8] font-medium relative z-10 tracking-wide">
              Don&apos;t have an account?{' '}
              <Link href={`/signup${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-[#F8FAFC] font-semibold relative group inline-block ml-1.5 hover:text-[#60A5FA] transition-colors duration-400">
                Create Account
                <span className="absolute -bottom-1.5 left-0 w-0 h-[1px] bg-[#60A5FA] group-hover:w-full transition-all duration-500" />
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
