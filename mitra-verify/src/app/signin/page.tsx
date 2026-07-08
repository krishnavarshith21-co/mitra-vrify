'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, RefreshCw, CheckCircle2, Shield, Eye, EyeOff, ShieldCheck, Activity, Key, Database, Fingerprint } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-[18px] h-[18px] fill-current text-[#CBD5E1] group-hover:text-white transition-colors duration-500" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-[18px] h-[18px] fill-current text-[#CBD5E1] group-hover:text-white transition-colors duration-500" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" />
    <rect x="1" y="11" width="9" height="9" />
    <rect x="11" y="1" width="9" height="9" />
    <rect x="11" y="11" width="9" height="9" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-[18px] h-[18px] fill-current text-[#CBD5E1] group-hover:text-white transition-colors duration-500" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const CinematicBackground = ({ mousePos, windowSize }: any) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#050814]">
    {/* Layer 2: Huge blurred radial glow behind hero */}
    <motion.div 
      animate={{ x: (mousePos.x - windowSize.w/2) * 0.02, y: (mousePos.y - windowSize.h/2) * 0.02 }}
      transition={{ type: "tween", ease: "linear", duration: 1.5 }}
      className="absolute top-[-20%] left-[-10%] w-[1200px] h-[1200px] rounded-full bg-[#6EA8FE]/[0.025] blur-[160px]"
    />
    
    {/* Layer 6: Slow moving light beams */}
    <div className="absolute inset-0 opacity-20 hidden lg:block">
      <motion.div 
        animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/4 w-[200vw] h-[200px] bg-gradient-to-r from-transparent via-[#7DD3FC]/[0.015] to-transparent origin-left blur-[60px] -translate-y-1/2"
      />
    </div>

    {/* Layer 3: Faint animated constellation lines */}
    <svg className="absolute inset-0 w-full h-full opacity-10">
       <motion.path 
         d="M 100 200 L 400 150 L 700 300 L 900 100 L 1200 400" 
         fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"
         initial={{ pathLength: 0 }}
         animate={{ pathLength: 1 }}
         transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse', ease: "linear" }}
       />
       <motion.path 
         d="M 200 600 L 500 500 L 800 700 L 1100 400" 
         fill="none" stroke="rgba(110,168,254,0.15)" strokeWidth="0.5"
         initial={{ pathLength: 0 }}
         animate={{ pathLength: 1 }}
         transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: "linear" }}
       />
    </svg>

    {/* Layer 4: Small floating particles */}
    <div className="absolute inset-0">
       {[...Array(15)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-[1px] h-[1px] rounded-full bg-[#E2E8F0]/40"
           animate={{
             y: [Math.random() * windowSize.h, Math.random() * windowSize.h - 200],
             x: [Math.random() * windowSize.w, Math.random() * windowSize.w + 100],
             opacity: [0, Math.random() * 0.4 + 0.1, 0]
           }}
           transition={{ duration: 30 + Math.random() * 40, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </div>

    {/* Layer 5: Soft film grain */}
    <div className="absolute inset-0 z-40 opacity-[0.025] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
  </div>
);

const DiagramNode = ({ title, active, icon: Icon }: any) => (
  <div className="flex flex-col items-center gap-3">
    <div className={`w-[48px] h-[48px] rounded-[14px] border ${active ? 'border-[#6EA8FE]/40 bg-[#6EA8FE]/10 shadow-[0_0_20px_rgba(110,168,254,0.2)]' : 'border-white/[0.04] bg-[rgba(255,255,255,0.01)]'} flex items-center justify-center transition-all duration-700 relative`}>
      {active && (
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[14px] bg-[#6EA8FE]/20"
        />
      )}
      <Icon className={`w-[18px] h-[18px] ${active ? 'text-[#7DD3FC]' : 'text-[#94A3B8]'}`} />
    </div>
    <span className={`text-[11px] font-medium tracking-wide uppercase ${active ? 'text-[#E2E8F0]' : 'text-[#94A3B8]'}`}>{title}</span>
  </div>
);

const SecurityArchitectureDiagram = () => {
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode(prev => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const nodes = [
    { title: 'API Gateway', icon: Server },
    { title: 'Liveness', icon: Activity },
    { title: 'AI Verify', icon: Fingerprint },
    { title: 'Identity', icon: ShieldCheck },
    { title: 'Webhook', icon: Database }
  ];

  return (
    <div className="w-full max-w-[480px] p-8 rounded-[36px] border border-white/[0.03] bg-[rgba(10,15,25,0.3)] backdrop-blur-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent" />
      <div className="relative flex items-center justify-between">
        
        {/* Animated connection line */}
        <div className="absolute top-[24px] left-[24px] right-[24px] h-[1px] bg-white/[0.04] z-0" />
        
        {/* Glowing pulse along the line */}
        <div className="absolute top-[24px] left-[24px] right-[24px] h-[1px] z-0 overflow-hidden">
          <motion.div 
            animate={{ x: ['-100%', '100%'] }} 
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#6EA8FE]/40 to-transparent"
          />
        </div>

        {nodes.map((node, idx) => (
          <div key={idx} className="relative z-10">
            <DiagramNode title={node.title} icon={node.icon} active={activeNode === idx} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email.split('@')[0])}`,
        provider: 'credentials',
      };
      login(token, userDetails);
      setSuccess('Redirecting...');
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/dashboard';
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr?.response?.data?.detail || 'Authentication failed.');
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
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message.includes('not configured') ? 'Provider not configured.' : 'Authentication failed.');
      setOauthLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050814] text-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans font-light selection:bg-[#6EA8FE]/20">
      <CinematicBackground mousePos={mousePos} windowSize={windowSize} />
      
      <div className="w-full max-w-[1600px] min-h-screen flex flex-col lg:flex-row items-center relative z-10 mx-auto px-8 py-16 lg:px-24 gap-16 lg:gap-32">
        
        {/* Left Side */}
        <div className="flex-1 hidden lg:flex flex-col justify-center relative w-full lg:w-[55%] z-10 pl-4 xl:pl-8">
          <div className="relative z-10 max-w-[560px]">
            <motion.h1 
              initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[64px] xl:text-[84px] font-thin text-[#F8FAFC] leading-[1.1] tracking-tight mb-10"
            >
              Enterprise<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F8FAFC] via-[#7DD3FC] to-[#6EA8FE] font-normal" style={{ backgroundSize: '200% auto', animation: 'shine 6s linear infinite' }}>
                Identity
              </span><br />
              Infrastructure
            </motion.h1>
            <style>{`@keyframes shine { to { background-position: 200% center; } }`}</style>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[17px] text-[#94A3B8] leading-[1.8] font-light max-w-[460px] mb-14"
            >
              Authenticate with zero trust. Our biometric engines and Liveness API provide government-grade verification in milliseconds.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-20"
            >
              {[
                { label: '99.99%', sub: 'Uptime' },
                { label: 'AES-256', sub: 'Encryption' },
                { label: '<250ms', sub: 'Latency' },
                { label: 'ISO27001', sub: 'Certified' }
              ].map((stat, i) => (
                <div key={i} className="px-5 py-3 rounded-full border border-white/[0.03] bg-[rgba(255,255,255,0.015)] backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center group cursor-default hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-500">
                  <span className="text-[13px] font-medium text-[#E2E8F0] tracking-wide">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <SecurityArchitectureDiagram />
            </motion.div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-[45%] flex items-center justify-center relative z-10 pr-0 xl:pr-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full max-w-[460px] p-10 md:p-14 rounded-[36px] relative overflow-hidden"
            style={{ 
              background: 'rgba(10, 15, 30, 0.45)', 
              backdropFilter: 'blur(48px)', 
              WebkitBackdropFilter: 'blur(48px)',
              border: '1px solid rgba(255,255,255,0.04)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
              animation: 'floatAppleCard 14s ease-in-out infinite'
            }}
          >
            <style>{`@keyframes floatAppleCard { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }`}</style>
            
            <div className="absolute -bottom-[100px] left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[#6EA8FE]/10 blur-[80px] pointer-events-none" />

            <div className="flex flex-col items-center justify-center mb-14">
              <div className="flex items-center gap-3 mb-1 opacity-90">
                <Shield className="w-[18px] h-[18px] text-[#94A3B8]" strokeWidth={1.5} />
                <span className="text-[17px] font-medium tracking-[0.25em] text-[#CBD5E1] uppercase">
                  Mitra Verify
                </span>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
                  <p className="text-[13px] text-red-400 text-center font-normal">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="peer w-full h-[54px] pt-[20px] pb-2 bg-[rgba(255,255,255,0.02)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-transparent rounded-[16px] pl-[54px] pr-5 text-[#F8FAFC] text-[15px] font-light focus:outline-none focus:border-white/[0.08] focus:bg-[rgba(255,255,255,0.03)] transition-all duration-500 placeholder-transparent"
                  placeholder="Email"
                />
                <label className={`absolute left-[54px] transition-all duration-500 pointer-events-none ${email.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase font-medium' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8] font-light'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#CBD5E1] peer-focus:tracking-widest peer-focus:uppercase peer-focus:font-medium`}>
                  Work Email
                </label>
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#CBD5E1] transition-all duration-500" strokeWidth={1.5} />
              </div>

              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="peer w-full h-[54px] pt-[20px] pb-2 bg-[rgba(255,255,255,0.02)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] border border-transparent rounded-[16px] pl-[54px] pr-12 text-[#F8FAFC] text-[15px] font-light focus:outline-none focus:border-white/[0.08] focus:bg-[rgba(255,255,255,0.03)] transition-all duration-500 placeholder-transparent"
                  placeholder="Password"
                />
                <label className={`absolute left-[54px] transition-all duration-500 pointer-events-none ${password.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase font-medium' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8] font-light'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#CBD5E1] peer-focus:tracking-widest peer-focus:uppercase peer-focus:font-medium`}>
                  Password
                </label>
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#CBD5E1] transition-all duration-500" strokeWidth={1.5} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#CBD5E1] transition-colors">
                  {showPassword ? <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.5} /> : <Eye className="w-[16px] h-[16px]" strokeWidth={1.5} />}
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full h-[58px] mt-8 rounded-[16px] bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white font-medium text-[15px] tracking-wide relative overflow-hidden group shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition-all duration-500 hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none border border-white/[0.05]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? <RefreshCw className="w-[18px] h-[18px] animate-spin" /> : <>Sign In <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-[4px] transition-transform duration-500" strokeWidth={1.5} /></>}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-6 my-10 relative z-10 opacity-40">
              <div className="h-[1px] bg-white/20 flex-1" />
              <span className="text-[10px] text-[#CBD5E1] uppercase tracking-[0.25em] font-medium">Or</span>
              <div className="h-[1px] bg-white/20 flex-1" />
            </div>

            <div className="flex justify-center gap-6 mb-12 relative z-10">
              {([
                { id: 'google', icon: GoogleIcon },
                { id: 'azure', icon: MicrosoftIcon },
                { id: 'github', icon: GithubIcon }
              ] as const).map(provider => (
                <button 
                  key={provider.id} type="button" disabled={oauthLoading !== null}
                  onClick={() => handleOAuthLogin(provider.id)}
                  className="w-[52px] h-[52px] rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:rotate-[4deg] active:scale-95 transition-all duration-500 group relative disabled:opacity-50"
                >
                  {oauthLoading === provider.id ? <RefreshCw className="w-[16px] h-[16px] animate-spin text-[#94A3B8]" /> : <provider.icon />}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {[
                { icon: ShieldCheck, title: 'SOC2', desc: 'Compliant' },
                { icon: Key, title: 'AES-256', desc: 'Encrypted' },
                { icon: Globe, title: 'GDPR', desc: 'Ready' },
                { icon: Activity, title: 'ISO', desc: 'Certified' }
              ].map(badge => (
                <div key={badge.title} className="p-3 rounded-[12px] border border-white/[0.02] bg-[rgba(255,255,255,0.01)] flex items-center gap-3 group hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-500">
                  <badge.icon className="w-[14px] h-[14px] text-[#94A3B8]" strokeWidth={1.5} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-[#E2E8F0] tracking-wide leading-none">{badge.title}</span>
                    <span className="text-[9px] text-[#94A3B8] mt-1 tracking-wider uppercase opacity-70">{badge.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center mt-12 text-[13px] text-[#94A3B8] font-light relative z-10">
              <Link href={`/signup${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-[#CBD5E1] font-normal hover:text-white transition-colors duration-500">
                Create new workspace
              </Link>
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
