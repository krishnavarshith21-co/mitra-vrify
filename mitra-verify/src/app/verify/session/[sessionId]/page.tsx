'use client';
import { useEffect, useRef, useState, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Camera, Shield, Zap, Fingerprint, Lock, Loader2, Activity } from 'lucide-react';
import { verificationAPI } from '@/lib/api';
import PageTransition from '@/components/cyber/PageTransition';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const BiometricScannerOverlay = dynamic(() => import('@/components/cyber/BiometricScannerOverlay'), { ssr: false });

export default function VerificationSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();
  
  // Session State
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'Inactive' | 'Active'>('Inactive');
  const [started, setStarted] = useState(false);
  
  // Challenge State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  
  // Live Metrics
  const [trackingState, setTrackingState] = useState<'TRACKING' | 'LOST' | 'NO_FACE'>('NO_FACE');
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);
  const [bbox, setBbox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [mar, setMar] = useState(0);
  
  // Results
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const [failReason, setFailReason] = useState<string>('');
  const [redirecting, setRedirecting] = useState(false);

  // Processing loop refs
  const frameCountRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await verificationAPI.getSession(sessionId);
        setSessionData(res.data);
        
        if (res.data.status === 'EXPIRED') {
          setError('This verification session has expired.');
        } else if (res.data.status === 'VERIFIED') {
          setResult('pass');
        } else if (res.data.status === 'FAILED') {
          setResult('fail');
          setFailReason('Previous attempt failed.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Invalid or expired session');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  const startVerification = async () => {
    try {
      setLoading(true);
      const res = await verificationAPI.startSession(sessionId);
      setChallenges(res.data.challenges);
      setStarted(true);
      await startCamera();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to start verification');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStreaming(true);
          setCameraStatus('Active');
        };
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setCameraStatus('Inactive');
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const sendFrameToBackend = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !streaming || !started || result) return;
    if (isProcessingRef.current) return;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isProcessingRef.current = true;
    frameCountRef.current += 1;
    const currentFrameId = frameCountRef.current;

    const videoRatio = video.videoWidth / video.videoHeight;
    canvas.width = 320;
    canvas.height = 320 / videoRatio;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      const currentChallenge = challenges[currentChallengeIdx]?.id;
      
      const res = await verificationAPI.processFrame(sessionId, {
        image: base64Image,
        frame_id: currentFrameId.toString(),
        challenge_type: currentChallenge
      });
      
      const data = res.data;
      
      if (data.face_present) {
        setTrackingState('TRACKING');
        setBbox(data.bbox);
        setConfidence(data.face_confidence || 0);
        setYaw(data.yaw || 0);
        setPitch(data.pitch || 0);
        setRoll(data.roll || 0);
        setMar(data.mar || 0);
        
        // Geometry check
        const box = data.bbox;
        const face_center_x = box ? box.x + box.w / 2 : 0.5;
        const face_center_y = box ? box.y + box.h / 2 : 0.5;
        const inside = box && Math.abs(face_center_x - 0.5) <= 0.25 && Math.abs(face_center_y - 0.5) <= 0.25;
        setFaceInsideGuide(!!inside);
      } else {
        setTrackingState('NO_FACE');
        setFaceInsideGuide(false);
      }

      // Check challenge progression
      if (data.challenge_passed) {
        if (currentChallengeIdx < challenges.length - 1) {
          setCurrentChallengeIdx(prev => prev + 1);
        }
      }

      // Check terminal state
      if (data.verification_complete) {
        if (data.verification_passed) {
          setResult('pass');
        } else {
          setResult('fail');
          setFailReason(data.reason || data.status || 'Verification Failed');
        }
        stopCamera();
        
        // Redirect back to app after 3 seconds
        if (data.redirect_uri) {
          setRedirecting(true);
          setTimeout(() => {
            window.location.href = data.redirect_uri;
          }, 3000);
        }
      }

    } catch (err: any) {
      console.error("Frame processing error:", err);
    } finally {
      isProcessingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, started, currentChallengeIdx, challenges, sessionId, result]);

  useEffect(() => {
    if (!streaming || !started || result) return;
    const intervalId = setInterval(sendFrameToBackend, 150); // 6-7 fps
    return () => clearInterval(intervalId);
  }, [sendFrameToBackend, streaming, started, result]);


  if (loading && !started) {
    return (
      <div style={{ minHeight: '100vh', background: '#01081a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-[#00d4ff]" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#01081a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass p-10 rounded-2xl text-center max-w-md w-full border border-red-500/20">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  const getApiIcon = () => {
    switch (sessionData?.api_level) {
      case 'api2': return <Shield size={16} className="text-[#7c3aed]" />;
      case 'api3': return <Fingerprint size={16} className="text-[#00ff88]" />;
      default: return <Zap size={16} className="text-[#00d4ff]" />;
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', background: '#01081a', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header className="p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-[#00d4ff]" />
            <div>
              <div className="text-sm font-bold text-white tracking-wide">MITRA <span className="text-[#00d4ff]">VERIFY</span></div>
              <div className="text-xs text-slate-500">Secure Identity Verification</div>
            </div>
          </div>
          
          {sessionData && (
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-sm font-medium text-white">{sessionData.application_name}</span>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {getApiIcon()}
                <span className="text-slate-300">Level {sessionData.api_level.replace('api', '')}</span>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          
          {!started && !result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
              <div className="glass p-8 rounded-3xl border border-[#00d4ff]/30 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent" />
                
                <Camera size={48} className="text-[#00d4ff] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]" />
                <h1 className="text-2xl font-bold text-white mb-3">Identity Verification</h1>
                <p className="text-slate-400 text-sm mb-8">
                  {sessionData?.application_name} is requesting to verify your identity. 
                  You will need to allow camera access and complete a short liveness check.
                </p>
                
                <button onClick={startVerification} className="btn-primary w-full py-4 text-base font-bold shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                  Start Verification
                </button>
              </div>
              <div className="text-center mt-6 text-xs text-slate-600 flex items-center justify-center gap-2">
                <Shield size={12} /> Protected by MITRA VERIFY AI
              </div>
            </motion.div>
          )}

          {started && !result && (
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
              
              {/* Camera View */}
              <div className="relative aspect-video md:aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                
                {/* Overlay Scanner */}
                <BiometricScannerOverlay 
                  faceInside={faceInsideGuide}
                  confidence={confidence}
                  detectedFaces={trackingState === 'TRACKING' ? 1 : 0}
                  bbox={bbox}
                  mar={mar}
                  challengeLabel={challenges[currentChallengeIdx]?.label || 'VERIFICATION COMPLETE'}
                />
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              {/* Sidebar Checklist */}
              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col">
                <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-[#00d4ff]" /> Live Challenges
                </h3>
                
                <div className="flex flex-col gap-3 flex-1">
                  {challenges.map((challenge, idx) => {
                    const isPassed = idx < currentChallengeIdx;
                    const isCurrent = idx === currentChallengeIdx;
                    
                    return (
                      <div key={challenge.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                        isPassed ? 'bg-[#00ff88]/10 border-[#00ff88]/30' :
                        isCurrent ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.15)]' :
                        'bg-white/5 border-white/5 opacity-50'
                      }`}>
                        <div className="mt-0.5">
                          {isPassed ? <CheckCircle size={18} className="text-[#00ff88]" /> :
                           isCurrent ? <Loader2 size={18} className="text-[#00d4ff] animate-spin" /> :
                           <div className="w-4 h-4 rounded-full border border-slate-600" />}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isPassed ? 'text-[#00ff88]' : isCurrent ? 'text-[#00d4ff]' : 'text-slate-400'}`}>
                            {challenge.label}
                          </div>
                          {isCurrent && (
                            <div className="text-xs text-slate-300 mt-1">{challenge.instruction}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <div className="text-[10px] text-slate-500 font-mono">SESSION ID</div>
                  <div className="text-xs text-slate-400 font-mono truncate">{sessionId}</div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
              <div className={`glass p-10 rounded-3xl text-center border shadow-2xl relative overflow-hidden ${
                result === 'pass' ? 'border-[#00ff88]/40 bg-[#00ff88]/5 shadow-[0_0_50px_rgba(0,255,136,0.1)]' 
                                  : 'border-[#ff3366]/40 bg-[#ff3366]/5 shadow-[0_0_50px_rgba(255,51,102,0.1)]'
              }`}>
                {result === 'pass' ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 bg-[#00ff88]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
                      <CheckCircle size={40} className="text-[#00ff88]" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">Verified</h2>
                    <p className="text-[#00ff88] mb-8 font-medium">Your identity has been confirmed.</p>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 bg-[#ff3366]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,51,102,0.3)]">
                      <AlertCircle size={40} className="text-[#ff3366]" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-2">Verification Failed</h2>
                    <div className="inline-block bg-black/40 px-4 py-2 rounded-lg border border-[#ff3366]/30 mb-8 mt-2">
                      <span className="text-[#ff3366] text-sm font-bold uppercase tracking-wider">{failReason}</span>
                    </div>
                  </>
                )}

                {redirecting ? (
                  <div className="flex items-center justify-center gap-3 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Redirecting back to application...
                  </div>
                ) : (
                  <button onClick={() => { window.location.href = sessionData?.redirect_uri || '/' }} className="btn-ghost w-full">
                    Return to Application
                  </button>
                )}
              </div>
            </motion.div>
          )}
          
        </main>
      </div>
    </PageTransition>
  );
}
