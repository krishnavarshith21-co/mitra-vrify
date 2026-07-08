"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, RefreshCw, Building2, Globe, Users, ArrowRight, ShieldQuestion, HelpCircle, HeartHandshake } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" className="grayscale group-hover:grayscale-0 transition-all duration-300">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" fill="currentColor" className="opacity-70 group-hover:opacity-100 transition-all duration-300" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get("redirect") || "/dashboard";
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
      setError("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the Terms of Service to continue.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            country: country,
            company_size: companySize
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setSuccess("Workspace created successfully! Please check your email to verify.");
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect") || "/dashboard";
        window.location.href = redirectPath;
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: "google" | "github") {
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
      setError(err.message.includes("not configured") ? "Provider not configured." : "Authentication failed.");
      setOauthLoading(null);
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        paddingTop: 80,
        position: "relative",
        overflow: "hidden",
      }}
      className="grid-bg noise"
    >
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)", top: "10%", left: "-10%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.06) 0%, transparent 70%)", bottom: "10%", right: "-10%", pointerEvents: "none" }} />

      <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ width: "100%", maxWidth: 460, zIndex: 10 }}>
        <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "center" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #00d4ff, #0066ff)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(0,212,255,0.3)" }}>
            <Eye size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>
            MITRA <span className="gradient-text-cyan">VERIFY</span>
          </span>
        </Link>
        </motion.div>

        <div className="glass px-6 sm:px-10 py-9 sm:py-10" style={{ borderRadius: 24, border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 30px rgba(0,212,255,0.05)" }}>
          <motion.h1 variants={itemVariants} style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, textAlign: "center", color: "#f8fafc" }}>Create Account</motion.h1>
          <motion.p variants={itemVariants} style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", marginBottom: 28 }}>Start your MITRA VERIFY workspace</motion.p>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={15} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Doe"
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Company</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Acme Corp"
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Work Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                  style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Country</label>
                <div style={{ position: "relative" }}>
                  <Globe size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <select
                    value={country} onChange={e => setCountry(e.target.value)} required
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box", appearance: "none", cursor: "pointer" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <option value="" disabled hidden>Select...</option>
                    <option value="United States" style={{ background: "#0f172a" }}>United States</option>
                    <option value="United Kingdom" style={{ background: "#0f172a" }}>United Kingdom</option>
                    <option value="Canada" style={{ background: "#0f172a" }}>Canada</option>
                    <option value="Australia" style={{ background: "#0f172a" }}>Australia</option>
                    <option value="India" style={{ background: "#0f172a" }}>India</option>
                    <option value="Germany" style={{ background: "#0f172a" }}>Germany</option>
                    <option value="France" style={{ background: "#0f172a" }}>France</option>
                    <option value="Japan" style={{ background: "#0f172a" }}>Japan</option>
                    <option value="Brazil" style={{ background: "#0f172a" }}>Brazil</option>
                    <option value="Other" style={{ background: "#0f172a" }}>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Size</label>
                <div style={{ position: "relative" }}>
                  <Users size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <select
                    value={companySize} onChange={e => setCompanySize(e.target.value)} required
                    style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box", appearance: "none", cursor: "pointer" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <option value="" disabled hidden>Select...</option>
                    <option value="1-10" style={{ background: "#0f172a" }}>1-10</option>
                    <option value="11-50" style={{ background: "#0f172a" }}>11-50</option>
                    <option value="51-200" style={{ background: "#0f172a" }}>51-200</option>
                    <option value="201-1000" style={{ background: "#0f172a" }}>201-1000</option>
                    <option value="1000+" style={{ background: "#0f172a" }}>1000+</option>
                  </select>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                    style={{ width: "100%", padding: "12px 30px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00d4ff"} onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Confirm</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} color="#475569" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••"
                    style={{ width: "100%", padding: "12px 30px 12px 40px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,212,255,0.4)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button
                    type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00d4ff"} onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ accentColor: "#00d4ff", width: 15, height: 15 }} required />
                <span>I agree to the <Link href="/terms" style={{ color: "#00d4ff", textDecoration: "none" }}>Terms</Link> and <Link href="/privacy" style={{ color: "#00d4ff", textDecoration: "none" }}>Privacy</Link>.</span>
              </label>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading} className="btn-primary"
              style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCw size={14} />
                  </motion.div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </form>

          <motion.div variants={itemVariants} style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0", opacity: 0.6 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Or continue with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <motion.button
              className="group"
              whileHover={{ scale: 1.03, backgroundColor: "rgba(66, 133, 244, 0.10)", borderColor: "rgba(66, 133, 244, 0.4)", transition: { duration: 0.3, ease: "easeOut" } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              type="button"
              onClick={() => handleOAuthLogin("google")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
              disabled={oauthLoading === "google"}
            >
              {oauthLoading === "google" ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} color="#94a3b8" /> : <GoogleIcon />}
              Google
            </motion.button>
            <motion.button
              className="group"
              whileHover={{ scale: 1.03, backgroundColor: "#ffffff", borderColor: "#ffffff", color: "#000000", transition: { duration: 0.3, ease: "easeOut" } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
              type="button"
              onClick={() => handleOAuthLogin("github")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
              disabled={oauthLoading === "github"}
            >
              {oauthLoading === "github" ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} color="#94a3b8" /> : <GithubIcon />}
              GitHub
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link href="/contact" style={{ fontSize: 12, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"} onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
              <ShieldQuestion size={12} /> Contact Sales
            </Link>
            <Link href="/contact" style={{ fontSize: 12, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"} onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
              <HelpCircle size={12} /> Need Help?
            </Link>
            <Link href="/contact" style={{ fontSize: 12, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"} onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
              <HeartHandshake size={12} /> Support
            </Link>
          </motion.div>
        </div>

        <motion.p variants={itemVariants} style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#475569" }}>
          Already have an account?{" "}
          <Link href={`/signin${typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirect") ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get("redirect")!)}` : ""}`} style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}>
            Sign In
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
