'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, RefreshCw,
  Check, Shield, Activity, Zap
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const StatCard = ({ icon, title, subtitle, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="p-5 rounded-2xl border border-white/5 relative overflow-hidden group"
    style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="flex items-center gap-4 relative z-10">
       <div className="w-12 h-12 rounded-xl bg-[#050812]/50 border border-white/5 flex items-center justify-center text-cyan-500 group-hover:text-cyan-300 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300">
          {icon}
       </div>
       <div>
         <div className="text-2xl font-bold text-white tracking-tight">{title}</div>
         <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>
       </div>
    </div>
  </motion.div>
);

const BiometricGlobe = ({ mousePos, windowSize }: { mousePos: any, windowSize: any }) => {
  return (
    <motion.div 
       animate={{ 
         x: (mousePos.x - windowSize.w/2) * 0.02, 
         y: (mousePos.y - windowSize.h/2) * 0.02,
         rotateX: (mousePos.y - windowSize.h/2) * -0.01,
         rotateY: (mousePos.x - windowSize.w/2) * 0.01,
       }}
       className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-30 z-0 hidden lg:block"
       style={{ transformStyle: 'preserve-3d' }}
    >
      <style>{`
        @keyframes slowSpin { from { transform: rotateY(0deg) rotateX(20deg); } to { transform: rotateY(360deg) rotateX(20deg); } }
        @keyframes scanSweep { 0% { top: -10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
      `}</style>
      
      <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', animation: 'slowSpin 30s linear infinite' }}>
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 shadow-[inset_0_0_100px_rgba(0,212,255,0.15)]" />
        
        {[0, 45, 90, 135].map(deg => (
          <div key={deg} className="absolute inset-0 rounded-full border border-blue-400/10" style={{ transform: `rotateY(${deg}deg)` }} />
        ))}
        {[-60, -30, 0, 30, 60].map(deg => (
          <div key={`lat${deg}`} className="absolute inset-0 rounded-full border border-cyan-400/10" style={{ transform: `rotateX(${deg}deg) scale(${Math.cos(deg * Math.PI / 180)})` }} />
        ))}
        
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#00d4ff] animate-pulse" style={{ transform: 'translateZ(250px)' }} />
        <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_#0066ff] animate-pulse" style={{ transform: 'translateZ(-200px)' }} />
      </div>

      <div className="absolute -inset-4 border-t-2 border-cyan-400 rounded-full blur-[1px] shadow-[0_-10px_30px_rgba(0,212,255,0.4)]" style={{ animation: 'scanSweep 4s ease-in-out infinite' }} />
    </motion.div>
  )
};

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

  // Auto-redirect if already authenticated
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

  // Read redirect reason from query string
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

  const stats = [
    { title: "99.99%", subtitle: "Platform Uptime", icon: <Activity className="w-6 h-6" /> },
    { title: "<300ms", subtitle: "Verification Time", icon: <Zap className="w-6 h-6" /> },
    { title: "97–99%", subtitle: "Detection Accuracy", icon: <Eye className="w-6 h-6" /> },
    { title: "AES-256", subtitle: "Encrypted", icon: <Shield className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-[#02050A] text-white flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')] opacity-50 mix-blend-overlay" />
        
        <motion.div 
          animate={{ x: (mousePos.x - windowSize.w/2) * 0.05, y: (mousePos.y - windowSize.h/2) * 0.05 }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-600/10 blur-[150px]"
        />
        <motion.div 
          animate={{ x: (mousePos.x - windowSize.w/2) * -0.05, y: (mousePos.y - windowSize.h/2) * -0.05 }}
          transition={{ type: "spring", damping: 50, stiffness: 100 }}
          className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px]"
        />
      </div>
      
      <div className="w-full max-w-[1500px] min-h-screen lg:min-h-[800px] flex flex-col lg:flex-row relative z-10 mx-auto px-6 py-12 lg:p-12">
        
        {/* Left Side */}
        <div className="flex-1 hidden lg:flex flex-col justify-center relative w-full lg:w-[55%] pr-16 z-10">
          <BiometricGlobe mousePos={mousePos} windowSize={windowSize} />
          
          <div className="relative z-10 pl-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.15] tracking-tight mb-6">
                Enterprise <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Identity Verification</span> <br />
                Platform
              </h1>
              <p className="text-lg text-slate-400 max-w-[480px] leading-relaxed mb-12">
                Secure authentication powered by AI liveness detection, anti-spoof intelligence, and enterprise identity verification.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-5 max-w-[500px]">
              {stats.map((s, i) => (
                <StatCard key={i} {...s} delay={0.4 + (i * 0.1)} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-[45%] flex items-center justify-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-[480px] p-8 sm:p-12 rounded-[28px] relative overflow-hidden"
            style={{ 
              background: 'rgba(5, 8, 16, 0.65)', 
              backdropFilter: 'blur(40px)', 
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(0,212,255,0.05)'
            }}
          >
            {/* Inner border glow */}
            <div className="absolute inset-0 rounded-[28px] border border-white/5 pointer-events-none" />
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <Link href="/" className="flex items-center gap-3 group">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] relative shadow-[0_0_20px_rgba(0,212,255,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-shadow">
                   <div className="absolute inset-0 bg-cyan-400 blur-md opacity-40 animate-pulse" />
                   <div className="w-full h-full bg-[#050812] rounded-xl flex items-center justify-center relative z-10">
                      <Eye className="w-5 h-5 text-cyan-400" />
                   </div>
                 </div>
                 <span className="text-xl font-bold text-white tracking-wide">MITRA <span className="text-cyan-400">VERIFY</span></span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Enterprise Secure</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Welcome Back</h2>
            <p className="text-slate-400 text-sm mb-8 relative z-10">Continue to your enterprise dashboard.</p>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-red-500/20 text-red-400 mt-0.5"><Shield className="w-4 h-4" /></div>
                    <p className="text-sm text-red-400 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-green-500/20 text-green-400 mt-0.5"><Check className="w-4 h-4" /></div>
                    <p className="text-sm text-green-400 leading-relaxed">{success}</p>
                  </div>
                </motion.div>
              )}
              {notification && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }} className="overflow-hidden">
                  <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                    <div className="p-1 rounded-full bg-blue-500/20 text-blue-400 mt-0.5"><Activity className="w-4 h-4" /></div>
                    <p className="text-sm text-blue-400 leading-relaxed">{notification}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full h-[60px] pt-5 pb-1 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                />
                <label className={`absolute left-12 transition-all pointer-events-none text-sm font-medium ${email.length > 0 ? 'top-4 -translate-y-1/2 text-[11px] text-slate-400' : 'top-1/2 -translate-y-1/2 text-slate-400'} peer-focus:top-4 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-cyan-400`}>
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full h-[60px] pt-5 pb-1 bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 text-white focus:outline-none focus:border-cyan-400 focus:bg-cyan-400/5 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                />
                <label className={`absolute left-12 transition-all pointer-events-none text-sm font-medium ${password.length > 0 ? 'top-4 -translate-y-1/2 text-[11px] text-slate-400' : 'top-1/2 -translate-y-1/2 text-slate-400'} peer-focus:top-4 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-cyan-400`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input 
                      type="checkbox" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)} 
                    />
                    <div className="w-full h-full rounded-[6px] border border-slate-600 bg-white/5 flex items-center justify-center transition-all peer-checked:bg-cyan-400 peer-checked:border-cyan-400 peer-hover:border-cyan-400 peer-checked:shadow-[0_0_12px_rgba(0,212,255,0.4)]">
                      <Check className="w-3.5 h-3.5 text-[#050812] scale-0 peer-checked:scale-100 transition-transform duration-200 stroke-[3]" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember Me</span>
                </label>

                <Link href="/contact" className="text-sm text-cyan-400 font-medium relative group">
                  Forgot Password?
                  <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-cyan-400 group-hover:w-full transition-all duration-300" />
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-[15px] relative overflow-hidden group shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-4 my-8 relative z-10">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Or continue with</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
              <button className="h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button className="h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
              </button>
              <button className="h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group">
                <svg className="w-5 h-5 text-slate-300 group-hover:text-white group-hover:scale-110 transition-all fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium relative z-10 bg-black/20 py-2.5 rounded-lg border border-white/5">
              <Lock className="w-3.5 h-3.5" />
              Protected with enterprise-grade encryption
            </div>

            <p className="text-center mt-8 text-sm text-slate-400 font-medium relative z-10">
              Don&apos;t have an account?{' '}
              <Link href={`/signup${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-cyan-400 font-bold relative group inline-block ml-1">
                Create Account
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
