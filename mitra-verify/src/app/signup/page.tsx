'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, RefreshCw, Building2, Globe, Users, Shield, Server, Activity, ChevronDown } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const FeatureCard = ({ title, desc, delay, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -30 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
    className="p-6 rounded-[24px] border border-white/[0.04] bg-[#0E1628]/40 backdrop-blur-xl flex items-start gap-5 hover:bg-[#0E1628]/60 transition-colors duration-500 group"
  >
    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#3B82F6]/20 to-[#60A5FA]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#60A5FA] shrink-0 group-hover:scale-110 group-hover:text-white transition-all duration-500 shadow-[inset_0_1px_4px_rgba(255,255,255,0.1)]">
      <Icon className="w-[20px] h-[20px]" />
    </div>
    <div>
      <h3 className="text-[#F8FAFC] font-semibold text-[17px] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-[#94A3B8] text-[14.5px] leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const NetworkBackground = ({ windowSize }: any) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[#040915]" />
    
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
    
    <motion.div 
      animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[20%] w-[800px] h-[800px] rounded-full bg-[#3B82F6]/10 blur-[150px]"
    />
    
    {/* Floating network nodes */}
    <svg className="absolute inset-0 w-full h-full opacity-30">
       {[...Array(8)].map((_, i) => (
         <motion.circle
           key={`node-${i}`}
           r="3"
           fill="#60A5FA"
           animate={{
             cx: [Math.random() * (windowSize.w * 0.6), Math.random() * (windowSize.w * 0.6)],
             cy: [Math.random() * windowSize.h, Math.random() * windowSize.h],
             opacity: [0.2, 0.8, 0.2]
           }}
           transition={{ duration: 15 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </svg>

    {/* Floating particles */}
    <div className="absolute inset-0">
       {[...Array(25)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-[2px] h-[2px] rounded-full bg-white/30"
           animate={{
             y: [Math.random() * windowSize.h, Math.random() * windowSize.h - 400],
             x: [Math.random() * (windowSize.w * 0.6), Math.random() * (windowSize.w * 0.6) + 100],
             opacity: [0, Math.random() * 0.8, 0]
           }}
           transition={{ duration: 20 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
         />
       ))}
    </div>
  </div>
);

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [windowSize, setWindowSize] = useState({ w: 1000, h: 1000 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the Terms of Service to continue.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await authAPI.register({ email, password, full_name: fullName });
      const res = await authAPI.login({ email, password });

      login(res.data.access_token, {
        name: fullName,
        email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        provider: 'credentials',
      });

      setSuccess('Workspace created successfully!');
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect') || '/dashboard';
        window.location.href = redirectPath;
      }, 1000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setError(apiErr?.response?.data?.detail || 'Registration failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#040915] text-[#F8FAFC] flex overflow-hidden font-sans selection:bg-[#3B82F6]/30">
      
      {/* Left Side - 60% */}
      <div className="hidden lg:flex w-[60%] relative flex-col justify-center px-20 xl:px-32 py-24 min-h-screen">
        <NetworkBackground windowSize={windowSize} />
        
        <div className="relative z-10 max-w-[700px]">
          <Link href="/" className="inline-flex items-center gap-3.5 mb-20 group">
            <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] flex items-center justify-center shadow-[0_4px_16px_rgba(59,130,246,0.25)] border border-white/10 group-hover:scale-105 transition-transform duration-400">
              <Shield className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[20px] font-bold tracking-[0.2em] text-[#F8FAFC]">
              MITRA<span className="text-[#60A5FA] font-medium ml-1.5">VERIFY</span>
            </span>
          </Link>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[52px] xl:text-[64px] font-bold leading-[1.05] tracking-tight mb-8"
          >
            Start Building Secure <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]">Identity Infrastructure</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[18px] text-[#94A3B8] leading-[1.7] font-medium max-w-[540px] mb-16"
          >
            Create your MITRA VERIFY workspace and access enterprise-grade biometric verification APIs in minutes.
          </motion.p>

          <div className="grid grid-cols-2 gap-6">
            <FeatureCard title="Face Liveness API" desc="Real-time anti-spoof detection." icon={Activity} delay={0.3} />
            <FeatureCard title="Identity Verification" desc="Government-grade identity matching." icon={Shield} delay={0.4} />
            <FeatureCard title="Enterprise Dashboard" desc="Analytics and monitoring." icon={Server} delay={0.5} />
            <FeatureCard title="SDK & API Keys" desc="Ready in under two minutes." icon={Lock} delay={0.6} />
          </div>
        </div>
      </div>

      {/* Right Side - 40% */}
      <div className="w-full lg:w-[40%] relative flex flex-col min-h-screen border-l border-white/[0.04] bg-[#040915] z-20">
        
        {/* Right side ambient effects */}
        <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#3B82F6]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[#60A5FA]/10 blur-[100px] pointer-events-none" />

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-12 lg:py-20 relative z-10 overflow-y-auto custom-scrollbar">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full max-w-[480px] mx-auto"
          >
            
            {/* Progress Indicator */}
            <div className="mb-12">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[11px] font-bold text-[#60A5FA] tracking-[0.2em] uppercase">Step 1 of 3</span>
                <span className="text-[14px] font-semibold text-[#F8FAFC]">Workspace Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <div className="h-1 flex-1 bg-white/[0.06] rounded-full" />
                <div className="h-1 flex-1 bg-white/[0.06] rounded-full" />
              </div>
            </div>

            <div className="p-10 rounded-[32px] relative overflow-hidden"
                 style={{ 
                   background: 'rgba(14, 22, 40, 0.4)', 
                   backdropFilter: 'blur(40px)', 
                   WebkitBackdropFilter: 'blur(40px)',
                   border: '1px solid rgba(255,255,255,0.06)',
                   boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                 }}>
              
              <div className="mb-10">
                <h2 className="text-[32px] font-bold text-[#F8FAFC] tracking-tight mb-2">Create your Workspace</h2>
                <p className="text-[#94A3B8] font-medium">Start free. Upgrade anytime.</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden mb-6">
                    <div className="p-4 rounded-[18px] bg-red-500/10 border border-red-500/20 flex items-start gap-4">
                      <Shield className="w-[18px] h-[18px] text-red-400 mt-0.5 shrink-0" />
                      <p className="text-[14px] text-red-400/90 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, scale: 0.98, height: 0 }} className="overflow-hidden mb-6">
                    <div className="p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                      <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-[14px] text-emerald-400/90 font-medium">{success}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                           className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-4 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Name" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${fullName.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Full Name</label>
                  </div>
                  <div className="relative group">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                    <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                           className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-4 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Company" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${companyName.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Company</label>
                  </div>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                         className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-4 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Email" />
                  <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${email.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Work Email</label>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="relative group">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                    <input type="text" required value={country} onChange={e => setCountry(e.target.value)}
                           className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-4 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Country" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${country.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Country</label>
                  </div>
                  
                  <div className="relative group">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors z-10" />
                    <select required value={companySize} onChange={e => setCompanySize(e.target.value)}
                            className="w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-10 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all appearance-none cursor-pointer">
                      <option value="" disabled hidden></option>
                      <option value="1-10" className="bg-[#0E1628]">1-10 employees</option>
                      <option value="11-50" className="bg-[#0E1628]">11-50 employees</option>
                      <option value="51-200" className="bg-[#0E1628]">51-200 employees</option>
                      <option value="201-1000" className="bg-[#0E1628]">201-1000 employees</option>
                      <option value="1000+" className="bg-[#0E1628]">1000+ employees</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] pointer-events-none" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${companySize.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'}`}>Size</label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                           className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-10 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Password" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${password.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Password</label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8] group-focus-within:text-[#60A5FA] transition-colors" />
                    <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                           className="peer w-full h-[56px] pt-4 pb-1 bg-[rgba(0,0,0,0.15)] shadow-[inset_0_2px_12px_rgba(0,0,0,0.2)] border border-white/[0.04] rounded-[16px] pl-[48px] pr-10 text-[#F8FAFC] text-[15px] font-medium focus:outline-none focus:border-[#3B82F6]/40 focus:bg-[#3B82F6]/[0.02] transition-all placeholder-transparent" placeholder="Confirm" />
                    <label className={`absolute left-[48px] transition-all pointer-events-none font-medium ${confirmPassword.length > 0 ? 'top-3 -translate-y-1/2 text-[10px] text-[#94A3B8] tracking-widest uppercase' : 'top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]'} peer-focus:top-3 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:text-[#60A5FA] peer-focus:tracking-widest peer-focus:uppercase`}>Confirm</label>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-[20px] h-[20px] mt-0.5 shrink-0">
                      <input type="checkbox" required className="peer absolute opacity-0 w-full h-full cursor-pointer z-10" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
                      <div className="w-full h-full rounded-[6px] border border-white/10 bg-white/[0.02] flex items-center justify-center transition-all peer-checked:bg-[#3B82F6] peer-checked:border-[#3B82F6] peer-hover:border-[#3B82F6]/50">
                        <svg className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                    <span className="text-[13.5px] font-medium text-[#94A3B8] leading-relaxed">
                      I agree to the <Link href="/terms" className="text-[#F8FAFC] hover:text-[#3B82F6] transition-colors underline decoration-white/20 underline-offset-2">Terms of Service</Link>, <Link href="/privacy" className="text-[#F8FAFC] hover:text-[#3B82F6] transition-colors underline decoration-white/20 underline-offset-2">Privacy Policy</Link> and <Link href="/dpa" className="text-[#F8FAFC] hover:text-[#3B82F6] transition-colors underline decoration-white/20 underline-offset-2">Data Processing Agreement</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full h-[60px] mt-4 rounded-[16px] bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white font-semibold text-[16px] tracking-wide relative overflow-hidden group shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_16px_40px_rgba(56,189,248,0.4)] transition-all duration-500 hover:-translate-y-[2px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <><RefreshCw className="w-[20px] h-[20px] animate-spin" /> Provisioning Workspace...</>
                    ) : success ? (
                      <><CheckCircle2 className="w-[20px] h-[20px]" /> Success</>
                    ) : (
                      <>Create Workspace <ArrowRight className="w-[20px] h-[20px] group-hover:translate-x-[6px] transition-transform duration-500" /></>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[14.5px] text-[#94A3B8] font-medium">
                  Already have an account?{' '}
                  <Link href={`/signin${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} className="text-[#F8FAFC] font-semibold hover:text-[#60A5FA] transition-colors underline decoration-white/20 underline-offset-4">
                    Sign In
                  </Link>
                </p>
              </div>

            </div>

            {/* Trusted by and What you get below the form */}
            <div className="mt-16 pt-12 border-t border-white/[0.04]">
              <div className="text-center mb-8">
                <span className="text-[12px] font-bold text-[#94A3B8] tracking-[0.2em] uppercase">Trusted by Security Teams</span>
              </div>
              <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale mix-blend-screen">
                {/* Simplified logos using text for demo, ideal would be SVGs */}
                <span className="text-[18px] font-bold font-sans tracking-tighter">Google</span>
                <span className="text-[18px] font-bold font-sans tracking-tight">Microsoft</span>
                <span className="text-[18px] font-bold font-sans tracking-widest uppercase">Cisco</span>
                <span className="text-[18px] font-bold font-sans tracking-wider uppercase">Oracle</span>
                <span className="text-[18px] font-bold font-sans tracking-tight">Cloudflare</span>
                <span className="text-[18px] font-bold font-sans tracking-tighter">AWS</span>
              </div>

              <div className="mt-16 pt-12 border-t border-white/[0.04]">
                <div className="text-center mb-8">
                  <span className="text-[14px] font-semibold text-[#F8FAFC]">What you get on the free tier</span>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {['Unlimited Sandbox Testing', 'API Documentation', 'Free SDKs', 'Dashboard Access', 'Analytics', 'Webhooks'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-[16px] h-[16px] text-[#60A5FA] shrink-0" />
                      <span className="text-[13px] font-medium text-[#94A3B8]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
