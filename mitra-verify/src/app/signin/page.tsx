'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Activity, Zap, Server, Shield, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
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

const CustomLogo = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 mr-3">
    <path d="M16 3 L3 10 L16 17 L29 10 Z" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 22 L16 29 L29 22" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M16 17 L16 29" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 10 L3 22" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4" />
    <path d="M29 10 L29 22" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4" />
    <circle cx="16" cy="17" r="2" fill="#38BDF8" />
    <circle cx="3" cy="10" r="1.5" fill="#2563EB" />
    <circle cx="29" cy="10" r="1.5" fill="#2563EB" />
    <circle cx="16" cy="3" r="1.5" fill="#2563EB" />
    <circle cx="16" cy="29" r="1.5" fill="#38BDF8" />
    <circle cx="3" cy="22" r="1" fill="#1E40AF" />
    <circle cx="29" cy="22" r="1" fill="#1E40AF" />
  </svg>
);

const StatCard = ({ icon, end, prefix, suffix, decimals, subtitle, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -3 }}
    className="p-5 rounded-2xl border border-[rgba(255,255,255,0.06)] relative group transition-all duration-300 flex flex-col justify-between h-[120px]"
    style={{ background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
    <div className="text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors duration-300 relative z-10">
      {icon}
    </div>
    <div className="relative z-10">
      <div className="text-[22px] font-semibold text-[#F8FAFC] tracking-tight font-mono leading-none">
        <CountUp end={end} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div className="text-[12px] text-[#94A3B8] mt-1.5 font-medium tracking-wide">{subtitle}</div>
    </div>
  </motion.div>
);

const ElegantBackground = ({ mousePos, windowSize }: any) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-[#050816] to-[#0A1020]">
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
    
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * 0.03, y: (mousePos.y - windowSize.h/2) * 0.03 }}
      transition={{ type: "tween", ease: "linear", duration: 0.2 }}
      className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] rounded-full bg-[#1E40AF]/10 blur-[150px]"
    />
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * -0.02, y: (mousePos.y - windowSize.h/2) * -0.02 }}
      transition={{ type: "tween", ease: "linear", duration: 0.2 }}
      className="absolute bottom-[10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-[#38BDF8]/5 blur-[120px]"
    />

    <div className="absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 hidden lg:block">
      <style>{`
         @keyframes spinSlow { 100% { transform: rotate(360deg); } }
         @keyframes spinSlowReverse { 100% { transform: rotate(-360deg); } }
         @keyframes pulseRing { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.02); } }
      `}</style>
      <div className="absolute inset-0 rounded-full border border-dashed border-[#38BDF8]/30" style={{ animation: 'spinSlow 60s linear infinite' }} />
      <div className="absolute inset-[100px] rounded-full border border-[rgba(255,255,255,0.05)]" style={{ animation: 'pulseRing 8s ease-in-out infinite' }} />
      <div className="absolute inset-[200px] rounded-full border border-dashed border-[#38BDF8]/20" style={{ animation: 'spinSlowReverse 45s linear infinite' }} />
      <div className="absolute inset-[300px] rounded-full border border-[#2563EB]/10" />
    </div>

    <div className="absolute inset-0">
       {[...Array(15)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-1 h-1 rounded-full bg-[#38BDF8]/30"
           animate={{
             y: [Math.random() * windowSize.h, Math.random() * windowSize.h - 100],
             x: [Math.random() * windowSize.w, Math.random() * windowSize.w + 50],
             opacity: [0, 0.5, 0]
           }}
           transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </div>
  </div>
);

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-110 transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-110 transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" />
    <rect x="1" y="11" width="9" height="9" />
    <rect x="11" y="1" width="9" height="9" />
    <rect x="11" y="11" width="9" height="9" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-[18px] h-[18px] group-hover:scale-110 transition-transform fill-current text-[#94A3B8] group-hover:text-[#F8FAFC]" viewBox="0 0 24 24">
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

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans">
      <ElegantBackground mousePos={mousePos} windowSize={windowSize} />
      
      <div className="w-full max-w-[1440px] min-h-screen lg:min-h-[800px] flex flex-col lg:flex-row items-center relative z-10 mx-auto px-6 py-12 lg:p-16 gap-12">
        
        {/* Left Hero */}
        <div className="flex-1 hidden lg:flex flex-col justify-center relative w-full lg:w-[55%] z-10">
          <div className="relative z-10 max-w-[520px]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="text-[52px] xl:text-[64px] font-bold text-[#F8FAFC] leading-[1.05] tracking-[-0.02em] mb-6">
                Enterprise Identity.<br />
                Built on <span className="text-[#38BDF8]">Zero Trust.</span>
              </h1>
              <p className="text-[17px] text-[#94A3B8] leading-[1.6] mb-12 font-medium">
                Protect users with enterprise-grade liveness detection, anti-spoof intelligence, and biometric identity verification powered by AI.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={<Server className="w-[18px] h-[18px]" />} end={99.99} decimals={2} suffix="%" subtitle="Platform Uptime" delay={0.3} />
              <StatCard icon={<Zap className="w-[18px] h-[18px]" />} end={250} prefix="<" suffix="ms" subtitle="Average Verification" delay={0.4} />
              <StatCard icon={<CheckCircle2 className="w-[18px] h-[18px]" />} end={97.8} decimals={1} suffix="%" subtitle="Detection Accuracy" delay={0.5} />
              <StatCard icon={<Lock className="w-[18px] h-[18px]" />} end={256} prefix="AES-" subtitle="Enterprise Encryption" delay={0.6} />
            </div>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full max-w-[480px] p-10 md:p-12 rounded-[28px] relative overflow-hidden"
            style={{ 
              background: 'rgba(13, 19, 35, 0.5)', 
              backdropFilter: 'blur(28px)', 
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(37,99,235,0.05)',
              animation: 'floatCard 8s ease-in-out infinite'
            }}
          >
            <style>{`
              @keyframes floatCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
            `}</style>
            
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/20 to-transparent" />
            
            <div className="flex flex-col items-center justify-center text-center mb-10 relative z-10">
               <div className="flex items-center justify-center mb-6">
                  <CustomLogo />
                  <span className="text-[22px] font-bold text-[#F8FAFC] tracking-wide">MITRA <span className="text-[#38BDF8]">VERIFY</span></span>
               </div>
               <h2 className="text-[26px] font-semibold text-[#F8FAFC] mb-2 tracking-tight">Welcome Back</h2>
               <p className="text-[#94A3B8] text-[14.5px] font-medium">Continue to your enterprise dashboard.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-red-500/20 text-red-400 mt-0.5"><Shield className="w-4 h-4" /></div>
                    <p className="text-[13.5px] text-red-400 leading-relaxed font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5"><CheckCircle2 className="w-4 h-4" /></div>
                    <p className="text-[13.5px] text-emerald-400 leading-relaxed font-medium">{success}</p>
                  </div>
                </motion.div>
              )}
              {notification && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-[#2563EB]/20 text-[#38BDF8] mt-0.5"><Activity className="w-4 h-4" /></div>
                    <p className="text-[13.5px] text-[#38BDF8] leading-relaxed font-medium">{notification}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#38BDF8] transition-colors duration-300 z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] pl-[44px] pr-4 text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]/50 focus:bg-[#38BDF8]/5 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)] transition-all duration-300"
                />
                <label className={`absolute left-[44px] transition-all pointer-events-none font-medium ${email.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-wider uppercase' : 'top-1/2 -translate-y-1/2 text-[14.5px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#38BDF8] peer-focus:tracking-wider peer-focus:uppercase`}>
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#38BDF8] transition-colors duration-300 z-10" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] pl-[44px] pr-[44px] text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]/50 focus:bg-[#38BDF8]/5 focus:shadow-[0_0_15px_rgba(56,189,248,0.1)] transition-all duration-300"
                />
                <label className={`absolute left-[44px] transition-all pointer-events-none font-medium ${password.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-wider uppercase' : 'top-1/2 -translate-y-1/2 text-[14.5px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#38BDF8] peer-focus:tracking-wider peer-focus:uppercase`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 mb-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-[18px] h-[18px]">
                    <input 
                      type="checkbox" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)} 
                    />
                    <div className="w-full h-full rounded-[6px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.02)] flex items-center justify-center transition-all peer-checked:bg-[#38BDF8] peer-checked:border-[#38BDF8] peer-hover:border-[#38BDF8]/50">
                      <svg className="w-3 h-3 text-[#050816] scale-0 peer-checked:scale-100 transition-transform duration-200 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  </div>
                  <span className="text-[13.5px] font-medium text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">Remember Me</span>
                </label>

                <Link href="/contact" className="text-[13.5px] text-[#94A3B8] hover:text-[#F8FAFC] font-medium transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] mt-4 rounded-[16px] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold text-[16px] relative overflow-hidden group shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgba(56,189,248,0.4)] transition-all duration-300 hover:-translate-y-[3px] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-[4px] transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-4 my-8 relative z-10">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-[11px] text-[#94A3B8] uppercase tracking-[0.15em] font-semibold">Or continue with</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
              <button type="button" className="h-[48px] rounded-[14px] bg-transparent border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all duration-300 group">
                <GoogleIcon />
              </button>
              <button type="button" className="h-[48px] rounded-[14px] bg-transparent border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all duration-300 group">
                <MicrosoftIcon />
              </button>
              <button type="button" className="h-[48px] rounded-[14px] bg-transparent border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all duration-300 group">
                <GithubIcon />
              </button>
            </div>

            <div className="text-center mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-[#94A3B8] tracking-widest uppercase relative z-10">
              <Shield className="w-3.5 h-3.5" /> Protected by Enterprise Security
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 relative z-10">
              {['SOC 2 Type II', 'ISO 27001', 'AES-256', 'GDPR'].map(badge => (
                <div key={badge} className="px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] flex items-center gap-1.5 text-[9.5px] font-bold text-[#94A3B8] tracking-widest uppercase">
                  <ShieldCheck className="w-[11px] h-[11px] text-[#38BDF8]" />
                  {badge}
                </div>
              ))}
            </div>

            <p className="text-center mt-8 text-[13.5px] text-[#94A3B8] font-medium relative z-10">
              Don&apos;t have an account?{' '}
              <Link href={`/signup${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-[#F8FAFC] font-semibold relative group inline-block ml-1 hover:text-[#38BDF8] transition-colors">
                Create Account
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#38BDF8] group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
