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
  <div className="flex items-center justify-center mb-10">
    <div className="flex items-center gap-3.5">
      <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.25)] border border-white/10">
        <Shield className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
      </div>
      <span className="text-[22px] font-bold tracking-[0.18em] text-[#F8FAFC]">
        MITRA <span className="text-[#60A5FA] font-medium">VERIFY</span>
      </span>
    </div>
  </div>
);

const StatCard = ({ icon, end, prefix, suffix, decimals, subtitle, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="p-6 rounded-[16px] border border-[rgba(255,255,255,0.06)] relative group transition-all duration-400 flex flex-col justify-between h-[132px] overflow-hidden"
    style={{ background: 'rgba(16,24,39,0.4)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="text-[#94A3B8] group-hover:text-[#60A5FA] transition-colors duration-400 relative z-10">
      {icon}
    </div>
    <div className="relative z-10">
      <div className="text-[26px] font-semibold text-[#F8FAFC] tracking-tight font-sans leading-none mb-1.5">
        <CountUp end={end} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div className="text-[13px] text-[#94A3B8] font-medium tracking-wide">{subtitle}</div>
    </div>
  </motion.div>
);

const PremiumBackground = ({ mousePos, windowSize }: any) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-[#040812] to-[#0A1020]">
    {/* Noise Texture */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
    
    {/* Subtle Blueprint Grid */}
    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
    
    {/* Soft Radial Lighting */}
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * 0.01, y: (mousePos.y - windowSize.h/2) * 0.01 }}
      transition={{ type: "tween", ease: "linear", duration: 0.5 }}
      className="absolute top-[-20%] left-[-10%] w-[1200px] h-[1200px] rounded-full bg-[#3B82F6]/5 blur-[160px]"
    />
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * -0.015, y: (mousePos.y - windowSize.h/2) * -0.015 }}
      transition={{ type: "tween", ease: "linear", duration: 0.5 }}
      className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] rounded-full bg-[#60A5FA]/[0.03] blur-[140px]"
    />

    {/* Thin Orbital Lines */}
    <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] opacity-[0.08] hidden lg:block">
      <style>{`
         @keyframes orbitSlow { 100% { transform: rotate(360deg); } }
         @keyframes orbitReverse { 100% { transform: rotate(-360deg); } }
      `}</style>
      <div className="absolute inset-0 rounded-full border border-white/20" style={{ animation: 'orbitSlow 120s linear infinite' }} />
      <div className="absolute inset-[160px] rounded-full border border-dashed border-white/30" style={{ animation: 'orbitReverse 180s linear infinite' }} />
      <div className="absolute inset-[320px] rounded-full border border-white/10" style={{ animation: 'orbitSlow 90s linear infinite' }} />
    </div>

    {/* Floating Particles */}
    <div className="absolute inset-0">
       {[...Array(12)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-1 h-1 rounded-full bg-white/10"
           animate={{
             y: [Math.random() * windowSize.h, Math.random() * windowSize.h - 200],
             x: [Math.random() * windowSize.w, Math.random() * windowSize.w + 100],
             opacity: [0, 0.4, 0]
           }}
           transition={{ duration: 20 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-[1.03] transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-[1.03] transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" />
    <rect x="1" y="11" width="9" height="9" />
    <rect x="11" y="1" width="9" height="9" />
    <rect x="11" y="11" width="9" height="9" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-[1.03] transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-[#040812] text-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans">
      <PremiumBackground mousePos={mousePos} windowSize={windowSize} />
      
      <div className="w-full max-w-[1500px] min-h-screen lg:min-h-[860px] flex flex-col lg:flex-row items-center relative z-10 mx-auto px-8 py-16 lg:p-24 gap-16 lg:gap-24">
        
        {/* Left Hero */}
        <div className="flex-1 hidden lg:flex flex-col justify-center relative w-full lg:w-[55%] z-10">
          <div className="relative z-10 max-w-[560px]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="text-[56px] xl:text-[72px] font-bold text-[#F8FAFC] leading-[1.08] tracking-[-0.02em] mb-8">
                Enterprise Identity.<br />
                Built on <span className="text-[#60A5FA]">Zero Trust.</span>
              </h1>
              <p className="text-[18px] text-[#94A3B8] leading-[1.7] mb-16 font-medium max-w-[480px]">
                Protect users with enterprise-grade liveness detection, anti-spoof intelligence, and biometric identity verification powered by AI.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-5">
              <StatCard icon={<Server className="w-[20px] h-[20px]" />} end={99.99} decimals={2} suffix="%" subtitle="Platform Uptime" delay={0.3} />
              <StatCard icon={<Zap className="w-[20px] h-[20px]" />} end={250} prefix="<" suffix="ms" subtitle="Average Verification" delay={0.4} />
              <StatCard icon={<CheckCircle2 className="w-[20px] h-[20px]" />} end={97.8} decimals={1} suffix="%" subtitle="Detection Accuracy" delay={0.5} />
              <StatCard icon={<Lock className="w-[20px] h-[20px]" />} end={256} prefix="AES-" subtitle="Enterprise Encryption" delay={0.6} />
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full max-w-[500px] p-10 md:p-14 rounded-[32px] relative overflow-hidden"
            style={{ 
              background: 'rgba(10, 15, 30, 0.55)', 
              backdropFilter: 'blur(32px)', 
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.4), 0 0 100px rgba(0,0,0,0.1)',
              animation: 'floatCard 8s ease-in-out infinite'
            }}
          >
            <style>{`
              @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
            `}</style>
            
            <OriginalLogo />

            <div className="text-center mb-10">
               <h2 className="text-[28px] font-semibold text-[#F8FAFC] mb-3 tracking-tight leading-tight">Welcome Back</h2>
               <p className="text-[#94A3B8] text-[15px] font-medium tracking-wide">Continue to your enterprise dashboard.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden">
                  <div className="mb-8 p-4 rounded-[16px] bg-red-500/5 border border-red-500/10 flex items-start gap-3.5">
                    <div className="text-red-400 mt-0.5"><Shield className="w-[18px] h-[18px]" /></div>
                    <p className="text-[14px] text-red-400/90 leading-relaxed font-medium tracking-wide">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden">
                  <div className="mb-8 p-4 rounded-[16px] bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3.5">
                    <div className="text-emerald-400 mt-0.5"><CheckCircle2 className="w-[18px] h-[18px]" /></div>
                    <p className="text-[14px] text-emerald-400/90 leading-relaxed font-medium tracking-wide">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors duration-400 z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full h-[60px] pt-[18px] pb-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[18px] pl-[52px] pr-5 text-[#F8FAFC] text-[15px] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#3B82F6]/[0.02] transition-all duration-400 placeholder-transparent"
                  placeholder="Email Address"
                />
                <label className={`absolute left-[52px] transition-all duration-300 pointer-events-none font-medium ${email.length > 0 ? 'top-3 -translate-y-1/2 text-[11px] text-[#94A3B8] tracking-wider uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-[#60A5FA] peer-focus:tracking-wider peer-focus:uppercase`}>
                  Work Email
                </label>
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors duration-400 z-10" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full h-[60px] pt-[18px] pb-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-[18px] pl-[52px] pr-[52px] text-[#F8FAFC] text-[15px] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#3B82F6]/[0.02] transition-all duration-400 placeholder-transparent"
                  placeholder="Password"
                />
                <label className={`absolute left-[52px] transition-all duration-300 pointer-events-none font-medium ${password.length > 0 ? 'top-3 -translate-y-1/2 text-[11px] text-[#94A3B8] tracking-wider uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-[#60A5FA] peer-focus:tracking-wider peer-focus:uppercase`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-5 mb-3 pt-2">
                <label className="flex items-center gap-3.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-[20px] h-[20px]">
                    <input 
                      type="checkbox" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)} 
                    />
                    <div className="w-full h-full rounded-[6px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.01)] flex items-center justify-center transition-all duration-300 peer-checked:bg-[#3B82F6] peer-checked:border-[#3B82F6] peer-hover:border-[#3B82F6]/40">
                      <svg className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-300 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                  <span className="text-[14px] font-medium text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors duration-300">Remember Me</span>
                </label>

                <Link href="/contact" className="text-[14px] text-[#94A3B8] hover:text-[#F8FAFC] font-medium transition-colors duration-300">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[60px] mt-6 rounded-[18px] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold text-[16px] tracking-wide relative overflow-hidden group shadow-[0_4px_24px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_40px_rgba(56,189,248,0.35)] transition-all duration-500 hover:-translate-y-[2px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <RefreshCw className="w-[20px] h-[20px] animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-[20px] h-[20px] group-hover:translate-x-[6px] transition-transform duration-400" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-5 my-10 relative z-10 opacity-70">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[12px] text-[#94A3B8] uppercase tracking-[0.2em] font-semibold">Or continue with</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('google')}
                className="h-[52px] rounded-[16px] bg-[rgba(255,255,255,0.01)] border border-white/5 flex items-center justify-center hover:bg-[rgba(255,255,255,0.03)] hover:border-white/10 hover:-translate-y-[1px] transition-all duration-400 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm"
              >
                {oauthLoading === 'google' ? (
                  <div className="flex items-center gap-2"><RefreshCw className="w-[16px] h-[16px] animate-spin text-[#94A3B8]" /></div>
                ) : (
                  <GoogleIcon />
                )}
              </button>
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('azure')}
                className="h-[52px] rounded-[16px] bg-[rgba(255,255,255,0.01)] border border-white/5 flex items-center justify-center hover:bg-[rgba(255,255,255,0.03)] hover:border-white/10 hover:-translate-y-[1px] transition-all duration-400 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm"
              >
                {oauthLoading === 'azure' ? (
                  <div className="flex items-center gap-2"><RefreshCw className="w-[16px] h-[16px] animate-spin text-[#94A3B8]" /></div>
                ) : (
                  <MicrosoftIcon />
                )}
              </button>
              <button 
                type="button" 
                disabled={oauthLoading !== null}
                onClick={() => handleOAuthLogin('github')}
                className="h-[52px] rounded-[16px] bg-[rgba(255,255,255,0.01)] border border-white/5 flex items-center justify-center hover:bg-[rgba(255,255,255,0.03)] hover:border-white/10 hover:-translate-y-[1px] transition-all duration-400 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm"
              >
                {oauthLoading === 'github' ? (
                  <div className="flex items-center gap-2"><RefreshCw className="w-[16px] h-[16px] animate-spin text-[#94A3B8]" /></div>
                ) : (
                  <GithubIcon />
                )}
              </button>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 relative z-10">
              {['SOC 2 Type II', 'ISO 27001', 'AES-256', 'GDPR'].map(badge => (
                <div key={badge} className="px-4 py-2 rounded-full border border-white/5 bg-[rgba(255,255,255,0.01)] flex items-center gap-2 text-[10px] font-bold text-[#94A3B8] tracking-[0.15em] uppercase hover:bg-[rgba(255,255,255,0.03)] hover:text-[#F8FAFC] transition-colors duration-400 cursor-default">
                  <ShieldCheck className="w-[12px] h-[12px] opacity-70" />
                  {badge}
                </div>
              ))}
            </div>

            <p className="text-center mt-10 text-[14px] text-[#94A3B8] font-medium relative z-10 tracking-wide">
              Don&apos;t have an account?{' '}
              <Link href={`/signup${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-[#F8FAFC] font-semibold relative group inline-block ml-1.5 hover:text-[#60A5FA] transition-colors duration-300">
                Create Account
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#60A5FA] group-hover:w-full transition-all duration-400" />
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
