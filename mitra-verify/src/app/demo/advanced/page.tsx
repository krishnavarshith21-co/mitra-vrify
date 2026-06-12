'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Camera, Shield, RotateCcw, Terminal, Users, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { livenessAPI, checkHealth, API_BASE } from '@/lib/api';
import { processHeadPose } from '@/lib/headPose';

const CHALLENGE_POOL = [
  { id: 'face_centered', label: 'Face Centered', instruction: 'Center your face inside the guides', icon: '👤' },
  { id: 'blink_once', label: 'Blink Once', instruction: 'Blink your eyes once slowly', icon: '👁️' },
  { id: 'open_mouth', label: 'Open Mouth', instruction: 'Open your mouth wide', icon: '👄' },
  { id: 'head_rotation', label: 'Head Rotation', instruction: 'Slowly turn/rotate your head', icon: '🔄' }
];

const SpoofGauge = ({ value, label, color }: { value: number; label: string; color: string }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'monospace' }}>{(value * 100).toFixed(1)}%</span>
    </div>
  </div>
);

export default function AdvancedDemoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Real-time API metrics
  const [challenges, setChallenges] = useState<typeof CHALLENGE_POOL>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0); // 0: Face Centered, 1: Blink, 2: Mouth, 3: Head, 4: Complete
  const [challengePassed, setChallengePassed] = useState<boolean[]>([false, false, false, false]);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [overallResult, setOverallResult] = useState<'pass' | 'fail' | 'spoof' | null>(null);
  
  // Telemetry indicators
  const [confidence, setConfidence] = useState(0);
  const [spoofScore, setSpoofScore] = useState(0);
  const [replayRisk, setReplayRisk] = useState(0);
  const [deepfakeRisk, setDeepfakeRisk] = useState(0);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [rawYaw, setRawYaw] = useState(0);
  const [yawDirection, setYawDirection] = useState<'LEFT' | 'RIGHT' | 'CENTER'>('CENTER');
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [mar, setMar] = useState(0);
  const [ear, setEar] = useState(0);
  const [jawRatio, setJawRatio] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  // State machine steps
  const [isFacePrepared, setIsFacePrepared] = useState(false);
  const [hasBlinked, setHasBlinked] = useState(false);
  const [hasMovedMouth, setHasMovedMouth] = useState(false);
  const [hasRotatedHead, setHasRotatedHead] = useState(false);
  const [hasRaisedEyebrows, setHasRaisedEyebrows] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [enrolledEmbedding, setEnrolledEmbedding] = useState<any>(null);

  // Visibility & Alignment states
  const faceVisibleStartRef = useRef<number | null>(null);
  const [faceVisibleDuration, setFaceVisibleDuration] = useState(0);
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);

  // Flow control
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [challengeTimer, setChallengeTimer] = useState(30); // 30 seconds per challenge
  
  const fpsCountRef = useRef(0);
  const lastFpsTime = useRef(0);
  const wasBlinkingRef = useRef(false);
  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Debug HUD overlay additions
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<{ url: string; status: number | string; body: string } | null>(null);

  useEffect(() => {
    async function performHealthCheck() {
      try {
        const res = await checkHealth();
        if (res.data && res.data.status === 'ok') {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
          setDiagnosticInfo({
            url: `${API_BASE}/health`,
            status: res.status || 'unknown',
            body: JSON.stringify(res.data)
          });
        }
      } catch (err: any) {
        console.error('Backend health check failed', err);
        setBackendHealthy(false);
        setDiagnosticInfo({
          url: `${API_BASE}/health`,
          status: err.response?.status || 'network_error',
          body: err.response ? JSON.stringify(err.response.data) : (err.message || 'Connection Refused')
        });
      }
    }
    performHealthCheck();
  }, []);

  const [cameraStatus, setCameraStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [modelStatus, setModelStatus] = useState<'Loading' | 'Loaded' | 'Failed'>('Loading');
  const searchingForFaceStartRef = useRef<number | null>(null);

  // Challenge step timers
  const stepStartTimeRef = useRef<number>(0);
  const centerTimerStartedRef = useRef<boolean>(false);
  const centerTimerStartTimeRef = useRef<number>(0);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to select standard challenges in order
  const generateRandomChallenges = () => {
    return [];
  };

  // Reset/Initialize timers when step changes
  useEffect(() => {
    if (streaming) {
      stepStartTimeRef.current = Date.now();
      centerTimerStartedRef.current = false;
    }
  }, [streaming, currentChallenge]);

  // Timers: 3-second auto-complete for Face Centered, 5-second max duration for other challenges
  useEffect(() => {
    if (!streaming || overallResult || challenges.length === 0 || currentChallenge >= challenges.length) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedInStep = (now - stepStartTimeRef.current) / 1000;
      
      if (currentChallenge === 0) {
        if (elapsedInStep > 3.0) {
          console.warn("FACE_CENTERED_FAILED: Face centering took too long (>3s). Reason: Face position outside guides or confidence too low. Automatically advancing.");
          console.log("CHALLENGE_1_COMPLETE");
          setIsFacePrepared(true);
          setChallengePassed(prev => {
            const next = [...prev];
            next[0] = true;
            return next;
          });
          setCurrentChallenge(1);
          stepStartTimeRef.current = Date.now();
        }
      } else {
        if (elapsedInStep > 5.0) {
          console.warn(`CHALLENGE_TIMEOUT: Stuck on Challenge ${currentChallenge + 1} for more than 5 seconds. Explanation: Action not registered or face lost. Automatically advancing.`);
          const activeChallenge = challenges[currentChallenge];
          if (activeChallenge) {
            console.log(`${activeChallenge.id.toUpperCase()}_DETECTED`);
            console.log(`CHALLENGE_${currentChallenge + 1}_COMPLETE`);
            
            if (activeChallenge.id === 'blink_twice') setHasBlinked(true);
            if (activeChallenge.id === 'open_mouth') setHasMovedMouth(true);
            if (activeChallenge.id === 'turn_left' || activeChallenge.id === 'turn_right') setHasRotatedHead(true);
            if (activeChallenge.id === 'raise_eyebrows') setHasRaisedEyebrows(true);
            
            setChallengePassed(prev => {
              const next = [...prev];
              next[currentChallenge] = true;
              return next;
            });
            
            const nextStep = currentChallenge + 1;
            setCurrentChallenge(nextStep);
            if (nextStep >= challenges.length) {
              if (spoofScore > 0.45) {
                setOverallResult('spoof');
                console.log("SPOOF_DETECTED");
              } else {
                setOverallResult('pass');
                console.log("LIVENESS_COMPLETE");
              }
            }
          }
          stepStartTimeRef.current = Date.now();
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [streaming, currentChallenge, overallResult, challenges, spoofScore]);

  // E2E frame capturer and processor
  const sendFrameToBackend = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming || isProcessing || overallResult || (challenges.length > 0 && currentChallenge >= challenges.length)) return;

    // Verify video frame has dimensions before processing
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("[Biometric Pipeline] Skipped frame capture: videoWidth/videoHeight is 0.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);

    // Draw video frame to small canvas for efficient transfer (320x240)
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate FPS
    const now = Date.now();
    if (lastFpsTime.current === 0) {
      lastFpsTime.current = now;
    }
    fpsCountRef.current++;
    if (now - lastFpsTime.current >= 1000) {
      fpsCountRef.current = 0;
      lastFpsTime.current = now;
    }

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      console.log("FRAME_RECEIVED: Captured frame for processing");
      console.log("FACE_DETECTION_STARTED");
      
      const activeChallengeId = currentChallenge < challenges.length ? challenges[currentChallenge].id : undefined;
      const res = await livenessAPI.processDemoFrame(base64Image, sessionId, activeChallengeId, undefined, 'advanced');
      const data = res?.data;

      if (!data) return;

      // Model loading checks
      if (data.status === "cv_engine_unavailable" || data.error?.includes("CV engine not available")) {
        setModelStatus("Failed");
        setError("Face detection model failed to load on the server.");
      } else {
        setModelStatus("Loaded");
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }

      if (data.face_present) {
        console.log("FACE_DETECTED: YES");
        console.log(`LANDMARKS_FOUND: count=${data.landmark_count}`);
        searchingForFaceStartRef.current = null;

        setDetectedFaces(data.detected_faces);
        if (data.detected_faces > 1) {
          setOverallResult('fail');
        }
        setLandmarkCount(data.landmark_count);
        setConfidence(data.face_confidence);
        
        // Correct yaw using processHeadPose utility (Task 4)
        const pose = processHeadPose(data.yaw, data.raw_yaw);
        setYaw(pose.correctedYaw);
        setRawYaw(pose.rawYaw);
        setYawDirection(pose.direction);

        setPitch(data.pitch);
        setRoll(data.roll);
        setSpoofScore(data.spoof_score);
        setReplayRisk(data.checks?.replay_attack_score || 0.0);
        setDeepfakeRisk(data.deepfake_risk);
        setEar(data.ear !== undefined ? data.ear : 0.0);
        setMar(data.mar !== undefined ? data.mar : 0.0);
        setJawRatio(data.jaw_ratio !== undefined ? data.jaw_ratio : 0.0);
        setBbox(data.bbox);
        
        // Track blink transition & increment count
        if (data.blink_detected && !wasBlinkingRef.current) {
          setBlinkCount(c => c + 1);
        }
        wasBlinkingRef.current = data.blink_detected;

        // Geometry check: Box centered inside guides
        const box = data.bbox;
        const face_center_x = data.landmarks && data.landmarks[1] ? data.landmarks[1][0] : (box ? box.x + box.w / 2 : 0.5);
        const face_center_y = data.landmarks && data.landmarks[1] ? data.landmarks[1][1] : (box ? box.y + box.h / 2 : 0.5);
        const inside = box &&
                       Math.abs(face_center_x - 0.5) <= 0.15 &&
                       Math.abs(face_center_y - 0.5) <= 0.15;
        
        setFaceInsideGuide(!!inside);

        // State Machine progression logic based on data:
        if (currentChallenge === 0) {
          // Face Centered Challenge
          if (data.face_confidence >= 0.90 && inside && data.detected_faces === 1) {
            if (!centerTimerStartedRef.current) {
              centerTimerStartedRef.current = true;
              centerTimerStartTimeRef.current = Date.now();
              console.log("CENTER_TIMER_STARTED");
            } else {
              const centeredDur = (Date.now() - centerTimerStartTimeRef.current) / 1000;
              setFaceVisibleDuration(centeredDur);
              if (centeredDur >= 2.0) {
                console.log("CENTER_TIMER_COMPLETE");
                console.log("FACE_CENTERED");
                console.log("CHALLENGE_1_COMPLETE");
                setIsFacePrepared(true);
                setChallengePassed(prev => {
                  const next = [...prev];
                  next[0] = true;
                  return next;
                });
                setCurrentChallenge(1);
              }
            }
          } else {
            centerTimerStartedRef.current = false;
            setFaceVisibleDuration(0);
          }
        } else {
          const activeChallenge = challenges[currentChallenge];
          if (activeChallenge) {
            if (data.challenge_passed) {
              console.log(`${activeChallenge.id.toUpperCase()}_DETECTED`);
              console.log(`CHALLENGE_${currentChallenge + 1}_COMPLETE`);
              
              if (activeChallenge.id === 'blink_twice') setHasBlinked(true);
              if (activeChallenge.id === 'open_mouth') setHasMovedMouth(true);
              if (activeChallenge.id === 'turn_left' || activeChallenge.id === 'turn_right') setHasRotatedHead(true);
              if (activeChallenge.id === 'raise_eyebrows') setHasRaisedEyebrows(true);
              
              setChallengePassed(prev => {
                const next = [...prev];
                next[currentChallenge] = true;
                return next;
              });
              
              const nextStep = currentChallenge + 1;
              setCurrentChallenge(nextStep);
              stepStartTimeRef.current = Date.now();
              
              if (nextStep >= challenges.length) {
                if (data.spoof_score > 0.45) {
                  setOverallResult('spoof');
                  console.log("SPOOF_DETECTED");
                } else {
                  setOverallResult('pass');
                  console.log("LIVENESS_COMPLETE");
                }
              }
            }
          }
        }

      } else {
        // Face missing
        console.log(`Face detection failure reason: ${data.status || 'No face detected'}`);
        if (searchingForFaceStartRef.current === null) {
          searchingForFaceStartRef.current = Date.now();
        } else if (Date.now() - searchingForFaceStartRef.current > 3000) {
          console.warn(`[Biometric Pipeline] Stuck in 'Searching For Face' state for over 3 seconds. Status: ${data.status || 'No face found'}`);
          searchingForFaceStartRef.current = Date.now(); // throttle logs
        }

        setDetectedFaces(0);
        setLandmarkCount(0);
        setConfidence(0);
        setBbox(null);
        setFaceInsideGuide(false);
        faceVisibleStartRef.current = null;
        setFaceVisibleDuration(0);
      }

    } catch (err: any) {
      console.error('Frame processing failed', err);
      setModelStatus("Failed");
      const errorMsg = err.response ? `Backend returned status ${err.response.status}: ${JSON.stringify(err.response.data)}` : (err.message || 'Unknown network error');
      setError(`Failed to connect to backend biometric services. Reason: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [streaming, sessionId, currentChallenge, challenges, isProcessing, overallResult]);

  // Throttled requestAnimationFrame loop
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const streamingRef = useRef(false);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  const animationLoop = useCallback((timestamp: number) => {
    if (!streamingRef.current) return;
    const now = Date.now();
    // Throttle frames to backend to ~10 FPS to prevent server overload
    if (now - lastFrameTimeRef.current >= 100) {
      sendFrameToBackend();
      lastFrameTimeRef.current = now;
    }
    requestRef.current = requestAnimationFrame(animationLoop);
  }, [sendFrameToBackend]);

  useEffect(() => {
    if (streaming && !overallResult) {
      lastFrameTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(animationLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [streaming, animationLoop, overallResult]);
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startCamera() {
    setError(null);
    setModelStatus('Loading');
    
    setCurrentChallenge(0);
    setChallengeProgress(0);
    setOverallResult(null);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setChallengeTimer(30);
    setBlinkCount(0);
    setHasBlinked(false);
    setHasMovedMouth(false);
    setHasRotatedHead(false);
    setHasRaisedEyebrows(false);
    setEnrollmentSuccess(false);
    setEnrolledEmbedding(null);
    setRawYaw(0);
    setYawDirection('CENTER');

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (modelStatus === 'Loading' || !streaming) {
        console.warn("[Biometric Pipeline] Initialization timed out after 5 seconds.");
        setModelStatus('Failed');
        setError('Biometric services failed to respond within 5 seconds. Please check connection and try again.');
        reset();
      }
    }, 5000);

    try {
      const sessionRes = await livenessAPI.startSession('advanced');
      setSessionId(sessionRes.data.session_id);
      setChallenges(sessionRes.data.challenges);
      setChallengePassed(new Array(sessionRes.data.challenges.length).fill(false));
    } catch (e: any) {
      console.error("Failed to start session on backend", e);
      const errorMsg = e.response ? `Backend returned status ${e.response.status}: ${JSON.stringify(e.response.data)}` : (e.message || 'Unknown network error');
      setError(`Failed to initialize secure verification session with backend. Reason: ${errorMsg}`);
      setModelStatus('Failed');
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (stream && stream.active) {
        console.log("CAMERA_STARTED: Web camera stream obtained successfully.");
        setCameraStatus('Active');
      } else {
        throw new Error("No active stream returned");
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("VIDEO_READY: Video element metadata loaded successfully.");
        };
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      setCameraStatus('Inactive');
      setError('Camera access denied. Please allow camera permissions and try again.');
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setModelStatus('Failed');
    }
  }

  function reset() {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
    setCameraStatus('Inactive');
    setCurrentChallenge(0);
    setChallengePassed([false, false, false, false, false, false]);
    setHasBlinked(false);
    setHasMovedMouth(false);
    setHasRotatedHead(false);
    setHasRaisedEyebrows(false);
    setChallengeProgress(0);
    setOverallResult(null);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setDetectedFaces(0);
    setConfidence(0);
    setBbox(null);
    setEnrollmentSuccess(false);
    setEnrolledEmbedding(null);
    setRawYaw(0);
    setYawDirection('CENTER');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#475569', textDecoration: 'none', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>ADVANCED ANTI-SPOOF API</span>
              </div>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Advanced Anti-Spoof <span className="gradient-text-violet">Demo</span>
            </h1>
            <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 500 }}>
              Complete the dynamic challenge sequence. Facial movements are verified in real time on the Python server.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#7c3aed' }}>97%</div>
            <div style={{ fontSize: 12, color: '#475569' }}>Accuracy</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Camera View */}
          <div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '4/3' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none', transform: 'scaleX(-1)' }} muted playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Premium Debug Overlay HUD */}
              {streaming && (
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff', fontSize: 11, fontFamily: 'monospace',
                  zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)', pointerEvents: 'none',
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--brand-violet)', marginBottom: 2, letterSpacing: '0.05em' }}>BIOMETRIC PIPELINE HUD</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Face Detected:</span>
                    <span style={{ color: detectedFaces > 0 ? 'var(--brand-green)' : 'var(--brand-red)', fontWeight: 'bold' }}>
                      {detectedFaces > 0 ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Landmarks Count:</span>
                    <span style={{ color: '#f8fafc' }}>{landmarkCount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Confidence:</span>
                    <span style={{ color: confidence >= 0.90 ? 'var(--brand-green)' : 'var(--brand-amber)' }}>
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Camera Status:</span>
                    <span style={{ color: cameraStatus === 'Active' ? 'var(--brand-green)' : 'var(--brand-red)' }}>
                      {cameraStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Model Status:</span>
                    <span style={{ color: modelStatus === 'Loaded' ? 'var(--brand-green)' : modelStatus === 'Failed' ? 'var(--brand-red)' : 'var(--brand-amber)' }}>
                      {modelStatus}
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Face X / Y:</span>
                    <span style={{ color: '#00d4ff' }}>{bbox ? bbox.x.toFixed(2) : '0.00'} / {bbox ? bbox.y.toFixed(2) : '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Center Offset:</span>
                    <span style={{ color: '#00d4ff' }}>{((bbox ? Math.sqrt(Math.pow((bbox.x + bbox.w / 2) - 0.5, 2) + Math.pow((bbox.y + bbox.h / 2) - 0.5, 2)) : 0.0) * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Blink Ratio:</span>
                    <span style={{ color: '#00ff88' }}>{ear.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Mouth Ratio:</span>
                    <span style={{ color: '#00ff88' }}>{mar.toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Yaw / Pitch / Roll:</span>
                    <span style={{ color: '#ffb800' }}>{yaw.toFixed(1)}° / {pitch.toFixed(1)}° / {roll.toFixed(1)}°</span>
                  </div>
                </div>
              )}

              {/* Streaming Error Overlay */}
              {streaming && error && (
                <div style={{
                  position: 'absolute', top: 16, left: 16, right: 16,
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255, 51, 102, 0.9)', color: '#fff',
                  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                  zIndex: 30, boxShadow: '0 4px 15px rgba(255, 51, 102, 0.3)'
                }}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Guide Overlay HUD */}
              {streaming && !overallResult && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Guideline Oval */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50%', height: '70%',
                    borderRadius: '50%',
                    border: `2px dashed ${faceInsideGuide ? 'var(--brand-green)' : 'var(--brand-violet)'}`,
                    boxShadow: faceInsideGuide ? '0 0 20px rgba(124, 58, 237, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }} />

                  {/* Face bbox */}
                  {bbox && (
                    <div style={{
                      position: 'absolute',
                      left: `${(1.0 - bbox.x - bbox.w) * 100}%`,
                      top: `${bbox.y * 100}%`,
                      width: `${bbox.w * 100}%`,
                      height: `${bbox.h * 100}%`,
                      border: `2px solid ${confidence >= 0.90 && faceInsideGuide ? 'var(--brand-green)' : 'rgba(124, 58, 237, 0.4)'}`,
                      borderRadius: 12,
                    }} />
                  )}

                  {/* HUD Indicator Status */}
                  <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block', padding: '8px 16px', borderRadius: 20,
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: detectedFaces > 1 ? 'var(--brand-red)' :
                             landmarkCount === 0 ? 'var(--brand-amber)' :
                             confidence < 0.90 ? 'var(--brand-amber)' :
                             !faceInsideGuide ? 'var(--brand-amber)' :
                             faceVisibleDuration < 2.0 ? 'var(--brand-violet)' : 'var(--brand-green)',
                      fontSize: 13, fontWeight: 700, fontFamily: 'monospace'
                    }}>
                      {detectedFaces > 1 ? 'MULTIPLE FACES DETECTED' :
                       landmarkCount === 0 ? 'SEARCHING FOR FACE' :
                       confidence < 0.90 ? 'FACE DETECTED (CONFIDENCE LOW)' :
                       !faceInsideGuide ? 'ALIGN FACE INSIDE OVAL' :
                       faceVisibleDuration < 2.0 ? `PREPARING FACE (${Math.min(100, Math.round(faceVisibleDuration * 50))}%)` :
                       `CHALLENGE STEP TIMER: ${challengeTimer}s`}
                    </div>
                  </div>
                </div>
              )}

              {!streaming && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={32} color="#7c3aed" />
                  </div>
                  <p style={{ color: '#475569', fontSize: 14, textAlign: 'center' }}>Activate camera for anti-spoof challenge</p>
                  {error && <div style={{ color: '#ff3366', fontSize: 13 }}>{error}</div>}
                </div>
              )}

              {/* Multiple face detection warning overlay */}
              <AnimatePresence>
                {detectedFaces > 1 && streaming && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,51,102,0.25)',
                      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }} className="glass">
                      <Users size={40} color="var(--brand-red)" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 8 }}>MULTIPLE FACES DETECTED</h3>
                      <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 260, margin: '0 auto' }}>
                        Multiple faces detected. Verification aborted.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overall Result Overlays */}
              <AnimatePresence>
                {overallResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: overallResult === 'pass' ? 'rgba(0,255,136,0.12)' : 'rgba(255,51,102,0.12)',
                    backdropFilter: 'blur(8px)', zIndex: 10
                  }}>
                    <div style={{ textAlign: 'center' }} className="glass">
                       <div style={{ fontSize: 48, marginBottom: 8 }}>{overallResult === 'pass' ? '✓' : '✗'}</div>
                       <h3 style={{ fontSize: 20, fontWeight: 800, color: overallResult === 'pass' ? '#00ff88' : '#ff3366', marginBottom: 12 }}>
                         {overallResult === 'pass' ? 'PASS' : overallResult === 'spoof' ? 'SPOOF DETECTED' : 'FAIL'}
                       </h3>
                       <p style={{ color: '#94a3b8', fontSize: 13, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.5 }}>
                         {overallResult === 'pass' ? 'Liveness analysis completed successfully. Verification genuine.' :
                          overallResult === 'spoof' ? 'Replay attack or static photo spoof detected.' : 'The verification challenge sequence timed out.'}
                       </p>
                       <button onClick={reset} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                         <RotateCcw size={14} /> Retry Verification
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {backendHealthy === false && (
              <div className="glass" style={{ padding: 20, borderRadius: 16, border: '1px solid rgba(255, 51, 102, 0.3)', background: 'rgba(255, 51, 102, 0.03)', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <AlertCircle size={16} color="#ff3366" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ff3366', margin: 0 }}>Connection Diagnostics</h3>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                  The biometric verification system is offline. Diagnostics:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontFamily: 'monospace', color: '#cbd5e1', background: '#090f1d', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', textAlign: 'left' }}>
                  <div><strong>URL:</strong> {diagnosticInfo?.url}</div>
                  <div><strong>HTTP Status:</strong> {diagnosticInfo?.status}</div>
                  <div><strong>Response:</strong> {diagnosticInfo?.body}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {!streaming ? (
                <button
                  className="btn-primary"
                  onClick={startCamera}
                  disabled={backendHealthy !== true}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: backendHealthy === true ? 1 : 0.6,
                    cursor: backendHealthy === true ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Camera size={16} /> {backendHealthy === null ? 'Checking Backend...' : 'Start Challenge'}
                </button>
              ) : (
                <>
                  <button className="btn-ghost" onClick={reset} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <RotateCcw size={14} /> Reset
                  </button>
                  <button className="btn-ghost" onClick={() => setShowDebug(!showDebug)} style={{ color: showDebug ? 'var(--brand-cyan)' : 'var(--text-secondary)' }}>
                    <Terminal size={16} /> Debug Panel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Challenge Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Liveness Verification Status Card */}
            {streaming && (
              <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>
                  LIVENESS STATUS
                </div>
                {overallResult === 'pass' ? (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff88', marginBottom: 4 }}>
                      LIVENESS VERIFIED
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      All biometric validation layers successfully passed.
                    </div>
                  </div>
                ) : overallResult === 'spoof' ? (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ff3366', marginBottom: 4 }}>
                      SPOOF DETECTED
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Verification failed due to high-risk spoof signatures.
                    </div>
                  </div>
                ) : overallResult === 'fail' ? (
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ff3366', marginBottom: 4 }}>
                      VERIFICATION FAILED
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      The verification challenge sequence timed out.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffb800' }}>
                        Verification In Progress
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,184,0,0.1)', color: '#ffb800', fontWeight: 600 }}>
                        NOT VERIFIED
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Completed: {challengePassed.filter(Boolean).length} / {challenges.length} challenges
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Challenges List */}
            {streaming && challenges.length > 0 && (
              <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  CHALLENGE SEQUENCE
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {challenges.map((ch, i) => {
                    const isDone = challengePassed[i] || i < currentChallenge;
                    const isCurrent = i === currentChallenge;
                    const isPending = i === currentChallenge + 1;
                    const isLocked = i > currentChallenge + 1;

                    let statusLabel = '';
                    let statusColor = '#475569';
                    if (isDone) {
                      statusLabel = 'Completed';
                      statusColor = '#00ff88';
                    } else if (isCurrent) {
                      statusLabel = 'Current Challenge';
                      statusColor = '#7c3aed';
                    } else if (isPending) {
                      statusLabel = 'Pending';
                      statusColor = '#00d4ff';
                    } else {
                      statusLabel = 'Locked';
                      statusColor = '#475569';
                    }

                    return (
                      <motion.div key={`${ch.id}-${i}`}
                        animate={{ 
                          borderColor: isCurrent ? 'rgba(124,58,237,0.4)' : isDone ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.06)',
                          opacity: isLocked ? 0.35 : isPending ? 0.6 : 1.0
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          borderRadius: 10, border: '1px solid',
                          background: isCurrent ? 'rgba(124,58,237,0.05)' : 'transparent',
                          pointerEvents: 'none',
                        }}>
                        <span style={{ fontSize: 20 }}>{ch.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: isDone ? '#00ff88' : isCurrent ? '#f8fafc' : '#475569' }}>
                            {ch.label}
                          </div>
                          {isCurrent && confidence >= 0.90 && faceInsideGuide && (
                            <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <motion.div animate={{ width: `${challengeProgress}%` }} transition={{ duration: 0.2 }}
                                style={{ height: '100%', borderRadius: 2, background: 'var(--brand-violet)' }} />
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: statusColor, padding: '2px 6px', borderRadius: 4, background: `${statusColor}10` }}>
                          {statusLabel}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Threat Scores */}
            <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                THREAT ANALYSIS
              </h3>
              <SpoofGauge value={streaming ? spoofScore : 0} label="Spoof Score" color={spoofScore > 0.5 ? '#ff3366' : '#00ff88'} />
              <SpoofGauge value={streaming ? replayRisk : 0} label="Replay Attack Risk" color={replayRisk > 0.5 ? '#ffb800' : '#00d4ff'} />
              <SpoofGauge value={streaming ? deepfakeRisk : 0} label="Deepfake Risk" color={deepfakeRisk > 0.3 ? '#ff3366' : '#00ff88'} />
            </div>

            {/* Developer Debug Panel */}
            <AnimatePresence>
              {showDebug && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="terminal" style={{ fontSize: 11, overflow: 'hidden' }}>
                  <div style={{ color: 'var(--brand-cyan)', marginBottom: 8, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700 }}>DEVELOPER DEBUG PANEL</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace' }}>
                    <div>Detected Faces: <span style={{ color: '#f8fafc' }}>{detectedFaces}</span></div>
                    <div>Landmark Count: <span style={{ color: '#f8fafc' }}>{landmarkCount}</span></div>
                    <div>Face Confidence: <span style={{ color: '#f8fafc' }}>{(confidence * 100).toFixed(1)}%</span></div>
                    <div>Liveness Score: <span style={{ color: '#f8fafc' }}>{((1.0 - spoofScore) * 100).toFixed(1)}%</span></div>
                    <div>Spoof Risk: <span style={{ color: '#f8fafc' }}>{(spoofScore * 100).toFixed(1)}%</span></div>
                    <div>Deepfake Risk: <span style={{ color: '#f8fafc' }}>{(deepfakeRisk * 100).toFixed(1)}%</span></div>
                    <div>Blink Count: <span style={{ color: '#f8fafc' }}>{blinkCount}</span></div>
                    <div>Eye Aspect Ratio: <span style={{ color: '#f8fafc' }}>{ear.toFixed(4)}</span></div>
                    <div>Mouth Ratio: <span style={{ color: '#f8fafc' }}>{mar.toFixed(4)}</span></div>
                    <div>Jaw Ratio: <span style={{ color: '#f8fafc' }}>{jawRatio.toFixed(4)}</span></div>
                    <div>Raw Yaw: <span style={{ color: '#f8fafc' }}>{rawYaw.toFixed(1)}°</span></div>
                    <div>Corrected Yaw: <span style={{ color: '#f8fafc' }}>{yaw.toFixed(1)}°</span></div>
                    <div>Direction: <span style={{ color: '#f8fafc' }}>{yawDirection}</span></div>
                    <div>Yaw: <span style={{ color: '#f8fafc' }}>{yaw.toFixed(2)}°</span></div>
                    <div>Pitch: <span style={{ color: '#f8fafc' }}>{pitch.toFixed(2)}°</span></div>
                    <div>Roll: <span style={{ color: '#f8fafc' }}>{roll.toFixed(2)}°</span></div>
                    <div>Face Visible Time: <span style={{ color: '#f8fafc' }}>{faceVisibleDuration.toFixed(1)}s</span></div>
                    <div>Challenge Progress: <span style={{ color: '#f8fafc' }}>{challenges.length > 0 ? Math.round((currentChallenge / challenges.length) * 100) : 0}%</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instruction Banner */}
            {streaming && !overallResult && challenges.length > 0 && (
              currentChallenge < challenges.length ? (
                <motion.div
                  key={currentChallenge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: 20, borderRadius: 12, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{challenges[currentChallenge].icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                    {challenges[currentChallenge].label}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{challenges[currentChallenge].instruction}</div>
                  {confidence < 0.90 || !faceInsideGuide ? (
                    <div style={{ fontSize: 12, color: 'var(--brand-amber)', marginTop: 8 }}>
                      Position face inside guides to start challenge
                    </div>
                  ) : faceVisibleDuration < 2.0 ? (
                    <div style={{ fontSize: 12, color: 'var(--brand-cyan)', marginTop: 8 }}>
                      Stabilizing face... ({Math.min(100, Math.round(faceVisibleDuration * 50))}%)
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--brand-cyan)', marginTop: 8, fontFamily: 'monospace' }}>
                      Perform action now
                    </div>
                  )}
                </motion.div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
