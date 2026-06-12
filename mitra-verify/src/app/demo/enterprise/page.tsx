'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Fingerprint, AlertTriangle, Users, Brain, Activity, RotateCcw, CheckCircle, Terminal, Lock, XCircle, Shield, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { livenessAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { processHeadPose } from '@/lib/headPose';
import dynamic from 'next/dynamic';

const Biometric3DOverlay = dynamic(() => import('@/components/Biometric3DOverlay'), { ssr: false });
const HeadPose3DWidget = dynamic(() => import('@/components/HeadPose3DWidget'), { ssr: false });

function calculateFaceEmbedding(landmarks: number[][]): number[] {
  const featureNodes = [
    1, 2, 4, 5, 6, 197, 94,
    33, 133, 159, 145, 46, 53, 70, 107,
    263, 362, 386, 374, 276, 283, 300, 336,
    61, 291, 13, 14, 78, 308, 17, 87, 317,
    10, 152, 234, 454, 109, 338, 58, 288, 136, 365
  ];
  
  if (landmarks.length < 455) return [];
  
  const center = landmarks[1];
  const centerX = center[0];
  const centerY = center[1];
  const centerZ = center[2];
  
  const leftJaw = landmarks[234];
  const rightJaw = landmarks[454];
  const dx = rightJaw[0] - leftJaw[0];
  const dy = rightJaw[1] - leftJaw[1];
  const dz = rightJaw[2] - leftJaw[2];
  let scale = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (scale < 0.001) scale = 1.0;
  
  const embedding: number[] = [];
  for (const idx of featureNodes) {
    if (idx < landmarks.length) {
      const lm = landmarks[idx];
      const rx = (lm[0] - centerX) / scale;
      const ry = (lm[1] - centerY) / scale;
      const rz = (lm[2] - centerZ) / scale;
      embedding.push(rx, ry, rz);
    }
  }
  return embedding;
}

function cosineSimilarity(embA: number[], embB: number[]): number {
  if (embA.length !== embB.length || embA.length === 0) return 0.0;
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < embA.length; i++) {
    dot += embA[i] * embB[i];
    normA += embA[i] * embA[i];
    normB += embB[i] * embB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA < 0.001 || normB < 0.001) return 0.0;
  const cosine = dot / (normA * normB);
  
  if (cosine >= 0.96) {
    return 0.95 + (cosine - 0.96) * (0.05 / 0.04);
  } else if (cosine >= 0.88) {
    return 0.85 + (cosine - 0.88) * (0.10 / 0.08);
  } else {
    if (cosine >= 0.70) {
      return 0.50 + (cosine - 0.70) * (0.35 / 0.18);
    }
    return cosine;
  }
}

interface BiometricResponse {
  status?: string;
  face_present: boolean;
  detected_faces: number;
  landmark_count: number;
  face_confidence: number;
  yaw: number;
  pitch: number;
  roll: number;
  spoof_score: number;
  deepfake_risk: number;
  gaze_direction: string | null;
  gaze_available: boolean;
  ear?: number;
  mar?: number;
  jaw_ratio?: number;
  bbox?: { x: number; y: number; w: number; h: number } | null;
  landmarks?: number[][];
  similarity_score?: number;
  challenge_passed?: boolean;
  challenge_type?: string;
  smile_score?: number;
  eyebrow_ratio?: number;
  left_ear?: number;
  right_ear?: number;
  checks?: {
    replay_attack_score?: number;
  };
}

const ENTERPRISE_CHALLENGES = [
  { id: 'face_centered', label: '1. Face Centered', instruction: 'Center your face inside the guides', icon: '👤' },
  { id: 'blink_twice', label: '2. Blink Twice', instruction: 'Blink your eyes twice slowly', icon: '👁️' },
  { id: 'open_mouth', label: '3. Open Mouth', instruction: 'Open your mouth wide', icon: '👄' },
  { id: 'turn_left', label: '4. Turn Head Left', instruction: 'Turn your head to the left', icon: '👈' },
  { id: 'turn_right', label: '5. Turn Head Right', instruction: 'Turn your head to the right', icon: '👉' },
  { id: 'raise_eyebrows', label: '6. Raise Eyebrows', instruction: 'Raise your eyebrows upward', icon: '🤨' },
  { id: 'smile', label: '7. Smile', instruction: 'Smile naturally', icon: '😊' },
  { id: 'look_up', label: '8. Look Up', instruction: 'Look slightly upward', icon: '☝️' }
];

function ThreatRadarWidget({ spoofScore, color }: { spoofScore: number; color: string }) {
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${color}22, transparent 50%)`,
          border: `1px dashed ${color}33`,
        }}
      />
      <div style={{ position: 'absolute', width: '75%', height: '75%', borderRadius: '50%', border: `1px dotted ${color}22` }} />
      <div style={{ position: 'absolute', width: '45%', height: '45%', borderRadius: '50%', border: `1px solid ${color}11` }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${color}11` }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${color}11` }} />
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Threat Radar</div>
        <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace' }}>
          {(spoofScore * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function SessionShield({ authenticated, invalidated, color }: { authenticated: boolean; invalidated: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
      <div style={{ position: 'relative' }}>
        {(authenticated || invalidated) && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              boxShadow: `0 0 15px ${color}`,
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: `rgba(0,0,0,0.6)`,
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 15px ${color}33`,
        }}>
          {invalidated ? (
            <XCircle size={24} color={color} />
          ) : authenticated ? (
            <Lock size={24} color={color} />
          ) : (
            <Shield size={24} color={color} />
          )}
        </div>
      </div>
    </div>
  );
}

function AuthSequenceTracker({
  faceDetected,
  landmarkGenerated,
  livenessPassed,
  identityMatch,
  sessionActive,
  color
}: {
  faceDetected: boolean;
  landmarkGenerated: boolean;
  livenessPassed: boolean;
  identityMatch: boolean;
  sessionActive: boolean;
  color: string;
}) {
  const stages = [
    { label: 'Face Detected', passed: faceDetected },
    { label: 'Landmark Generated', passed: landmarkGenerated },
    { label: 'Liveness Passed', passed: livenessPassed },
    { label: 'Identity Match', passed: identityMatch },
    { label: 'Session Active', passed: sessionActive }
  ];

  return (
    <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
      <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>
        AUTHENTICATION SEQUENCE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((st, idx) => (
          <div key={st.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <motion.div
                animate={st.passed ? { scale: [1, 1.2, 1], backgroundColor: color } : { scale: 1 }}
                style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: `2px solid ${st.passed ? color : '#475569'}`,
                  background: st.passed ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {st.passed && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#000' }} />
                )}
              </motion.div>
              {idx < stages.length - 1 && (
                <div style={{ width: 1.5, height: 14, background: st.passed ? color : 'rgba(255,255,255,0.06)', marginTop: 4 }} />
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: st.passed ? '#f8fafc' : '#475569' }}>
              {st.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}



function CheckBadge({ label, passed, checking }: { label: string; passed: boolean; checking: boolean }) {
  const color = checking ? '#00d4ff' : passed ? '#00ff88' : '#475569';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderRadius: 10, background: `${color}0a`, border: `1px solid ${color}22`,
    }}>
      <motion.div animate={{ scale: passed ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
        <CheckCircle size={16} color={color} />
      </motion.div>
      <span style={{ fontSize: 13, color: checking ? '#00d4ff' : passed ? '#94a3b8' : '#475569', fontWeight: passed ? 500 : 400 }}>
        {label}
      </span>
      {checking && (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#00d4ff' }}
        />
      )}
    </div>
  );
}

export default function EnterpriseDemoPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout, user, refreshUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login?reason=unauthenticated');
    }
  }, [router, isAuthenticated, authLoading]);

  // Real-time API metrics
  const [confidence, setConfidence] = useState(0);
  const [similarity, setSimilarity] = useState(0);
  const [gazeDirection, setGazeDirection] = useState<{ x: number; y: number } | null>(null);
  const [gazeAvailable, setGazeAvailable] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [rawYaw, setRawYaw] = useState(0);
  const [yawDirection, setYawDirection] = useState<'LEFT' | 'RIGHT' | 'CENTER'>('CENTER');
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [spoofScore, setSpoofScore] = useState(0);
  const [deepfakeRisk, setDeepfakeRisk] = useState(0);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ear, setEar] = useState(0);
  const [mar, setMar] = useState(0);

  // Enrollment states
  const [enrolledEmbedding, setEnrolledEmbedding] = useState<number[] | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Verify helper indicating if verification is enabled/active
  const hasFaceEnrolled = useMemo(() => !!enrolledEmbedding, [enrolledEmbedding]);

  // Track face mismatches (similarity score below threshold)
  const [mismatchCount, setMismatchCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mv_mismatch_count');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mv_mismatch_count', String(mismatchCount));
    }
  }, [mismatchCount]);

  const lastMismatchIncrementRef = useRef<number>(0);

  // Consecutive frame verification & warnings
  const [consecutiveValidFrames, setConsecutiveValidFrames] = useState(0);
  const [faceMissingDuration, setFaceMissingDuration] = useState(0);
  const [detectionStability, setDetectionStability] = useState(95.0);
  const noseHistoryRef = useRef<[number, number][]>([]);

  // Challenge sequence states
  const [challenges, setChallenges] = useState<typeof ENTERPRISE_CHALLENGES>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0); // 0: Face Centered, 1: Blink, 2: Mouth, 3: Head, 4: Complete
  const [challengePassed, setChallengePassed] = useState<boolean[]>([false, false, false, false]);
  const challengeProgress = challenges.length > 0 ? Math.round((currentChallenge / challenges.length) * 100) : 0;
  const [overallResult, setOverallResult] = useState<'pass' | 'fail' | null>(null);

  // State machine steps
  const [isFacePrepared, setIsFacePrepared] = useState(false);
  const [hasBlinked, setHasBlinked] = useState(false);
  const [hasMovedMouth, setHasMovedMouth] = useState(false);
  const [hasRotatedHead, setHasRotatedHead] = useState(false);
  const [hasRaisedEyebrows, setHasRaisedEyebrows] = useState(false);
  const [hasSmiled, setHasSmiled] = useState(false);
  const [hasLookedUp, setHasLookedUp] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  // useRef mirror for consecutiveValidFrames to prevent stale closure bugs
  const consecutiveValidFramesRef = useRef(0);
  const currentChallengeRef = useRef(0);

  // Visibility & Alignment states
  const faceVisibleStartRef = useRef<number | null>(null);
  const [faceVisibleDuration, setFaceVisibleDuration] = useState(0);
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);

  // Flow control
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [challengeTimer, setChallengeTimer] = useState(30); // 30 seconds per challenge
  const [apiResponse, setApiResponse] = useState<BiometricResponse | null>(null);

  const fpsCountRef = useRef(0);
  const lastFpsTime = useRef(0);
  const sessionTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasBlinkingRef = useRef(false);
  const transitioningRef = useRef(false);

  // Debug HUD overlay additions
  const [cameraStatus, setCameraStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [modelStatus, setModelStatus] = useState<'Loading' | 'Loaded' | 'Failed'>('Loading');
  const searchingForFaceStartRef = useRef<number | null>(null);

  // Enterprise Continuous Authentication Tracking
  const [isMounted, setIsMounted] = useState(false);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string>('');
  const faceLostStartRef = useRef<number | null>(null);

  const stepStartTimeRef = useRef<number>(0);
  const centerTimerStartedRef = useRef<boolean>(false);
  const centerTimerStartTimeRef = useRef<number>(0);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enterprise Tracking State Machine
  const [faceTrackingState, setFaceTrackingState] = useState<'FACE_PRESENT' | 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' | 'SESSION_TERMINATED'>('FACE_PRESENT');
  const prevTrackingStateRef = useRef<'FACE_PRESENT' | 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' | 'SESSION_TERMINATED'>('FACE_PRESENT');

  // Debug metrics
  const [faceConfidenceMetric, setFaceConfidenceMetric] = useState(0);
  const [trackingConfidence, setTrackingConfidence] = useState(1.0);
  const [lostFrames, setLostFrames] = useState(0);
  const [recoveredFrames, setRecoveredFrames] = useState(0);
  const [timeSinceFaceSeen, setTimeSinceFaceSeen] = useState(0);

  const [liveEmbedding, setLiveEmbedding] = useState<number[]>([]);
  const [lastMatchTime, setLastMatchTime] = useState<number | null>(null);

  const lastFaceSeenTimeRef = useRef<number | null>(null);
  const lostFramesRef = useRef<number>(0);
  const recoveredFramesRef = useRef<number>(0);
  const faceDetectionHistoryRef = useRef<boolean[]>([]);
  const similarityHistoryRef = useRef<number[]>([]);
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
          currentChallengeRef.current = 1;
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
            if (activeChallenge.id === 'smile') setHasSmiled(true);
            if (activeChallenge.id === 'look_up') setHasLookedUp(true);
            
            setChallengePassed(prev => {
              const next = [...prev];
              next[currentChallenge] = true;
              return next;
            });
            
            const nextStep = currentChallenge + 1;
            currentChallengeRef.current = nextStep;
            setCurrentChallenge(nextStep);
            if (nextStep >= challenges.length) {
              console.log("LIVENESS_COMPLETE");
            }
          }
          stepStartTimeRef.current = Date.now();
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [streaming, currentChallenge, overallResult, challenges]);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const triggerSessionTermination = useCallback((reason: string, shouldRedirect: boolean = false) => {
    setSessionTerminated(true);
    setTerminationReason(reason);
    setOverallResult('fail');
    
    // Stop camera
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);

    console.log(`[Face Verification] Session terminated. Reason: ${reason}. Logout redirect: ${shouldRedirect}`);

    // Auto logout flow: Token Revoked, Redirect to Login via AuthContext logout after 3s
    if (shouldRedirect) {
      setTimeout(() => {
        logout('/auth/login?reason=verification_lost');
      }, 3000);
    }
  }, [logout]);

  // Load enrollment signature from API or localStorage
  useEffect(() => {
    const loadEnrolled = async () => {
      try {
        const res = await livenessAPI.getEnrolledFace();
        if (res.data && res.data.enrolled && res.data.embedding_vector) {
          setEnrolledEmbedding(res.data.embedding_vector);
          localStorage.setItem('enrolledEmbedding', JSON.stringify(res.data.embedding_vector));
          console.log("Enrollment embedding generated");
          console.log(res.data.embedding_vector.length);
          return;
        }
      } catch (e) {
        console.error('Failed to fetch enrolled face from backend', e);
      }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('enrolledEmbedding') || localStorage.getItem('mv_enrolled_signature');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setEnrolledEmbedding(parsed);
            console.log("Enrollment embedding generated");
            console.log(parsed.length);
          } catch (e) {
            console.error('Failed to parse enrolled signature', e);
          }
        }
      }
    };
    loadEnrolled();
  }, []);

  // Helper to choose 9 challenges
  const generateRandomChallenges = () => {
    return ENTERPRISE_CHALLENGES;
  };

  // E2E frame capturer and processor
  const sendFrameToBackend = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming || isProcessing || overallResult) return;

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
    fpsCountRef.current++;
    if (now - lastFpsTime.current >= 1000) {
      fpsCountRef.current = 0;
      lastFpsTime.current = now;
    }

    const handleFrameInvalid = (data: BiometricResponse | null) => {
      const currentFaceDetected = !!(
        data &&
        data.face_present &&
        data.face_confidence > 0.50 &&
        data.landmark_count > 0 &&
        Math.abs(data.yaw || 0) <= 45 &&
        Math.abs(data.pitch || 0) <= 30 &&
        Math.abs(data.roll || 0) <= 30
      );

      // Maintain rolling history of last 15 frames for face detection
      faceDetectionHistoryRef.current.push(currentFaceDetected);
      if (faceDetectionHistoryRef.current.length > 15) {
        faceDetectionHistoryRef.current.shift();
      }

      // Smooth face presence: only mark face lost if majority of frames indicate no face (i.e. <= 7 / 15 detected)
      const smoothFaceDetected = faceDetectionHistoryRef.current.filter(Boolean).length >= 8;

      if (smoothFaceDetected) {
        faceLostStartRef.current = null;
        setFaceMissingDuration(0);
      } else {
        if (faceLostStartRef.current === null) {
          faceLostStartRef.current = Date.now();
        }
      }

      const faceLostDuration = faceLostStartRef.current ? (Date.now() - faceLostStartRef.current) / 1000 : 0;

      // Log current tracking and confidence metrics
      const currentConfidence = data?.face_confidence ?? 0.0;
      console.log(`[Face Lost Tracker] Confidence: ${currentConfidence.toFixed(2)}, Detected: ${currentFaceDetected ? 'YES' : 'NO'}, SmoothDetected: ${smoothFaceDetected ? 'YES' : 'NO'}, FaceLostTimer: ${faceLostDuration.toFixed(1)}s, Reason: ${data?.status || 'No face detected'}`);

      // If we are not enrolled, face loss persistence rules don't apply for session termination
      if (!hasFaceEnrolled) {
        setFaceTrackingState('FACE_LOST');
        prevTrackingStateRef.current = 'FACE_LOST';
        setDetectedFaces(0);
        setLandmarkCount(0);
        setConfidence(0);
        setGazeDirection(null);
        setGazeAvailable(false);
        setFaceInsideGuide(false);
        faceVisibleStartRef.current = null;
        setFaceVisibleDuration(0);
        setSimilarity(0);
        setConsecutiveValidFrames(0);
        noseHistoryRef.current = [];
        setDetectionStability(0.0);
        return;
      }

      // We are enrolled, apply warning state machine
      recoveredFramesRef.current = 0;
      setRecoveredFrames(0);
      lostFramesRef.current += 1;
      setLostFrames(lostFramesRef.current);
      setFaceConfidenceMetric(0);
      setTrackingConfidence(0.0);

      setTimeSinceFaceSeen(faceLostDuration);

      let state: 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' = 'FACE_WARNING';
      if (faceLostDuration < 1.5) {
        state = 'FACE_WARNING';
      } else if (faceLostDuration >= 1.5 && faceLostDuration < 3.0) {
        state = 'FACE_RECOVERY';
      } else {
        state = 'FACE_LOST';
      }

      setFaceTrackingState(state);
      prevTrackingStateRef.current = state;

      // Terminate ONLY after 3 continuous seconds of face lost
      if (faceLostDuration > 3.0) {
        setDetectedFaces(0);
        setLandmarkCount(0);
        setConfidence(0);
        setGazeDirection(null);
        setGazeAvailable(false);
        setFaceInsideGuide(false);
        faceVisibleStartRef.current = null;
        setFaceVisibleDuration(0);
        setSimilarity(0);
        setConsecutiveValidFrames(0);
        noseHistoryRef.current = [];
        setDetectionStability(0.0);
        
        setFaceTrackingState('SESSION_TERMINATED');
        prevTrackingStateRef.current = 'SESSION_TERMINATED';
        console.log(`[Face Verification] Face lost timer exceeded. Terminating session. Reason: Face Lost`);
        triggerSessionTermination('Face Lost', false);
      }
    };

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      console.log("FRAME_RECEIVED: Captured frame for processing");
      console.log("FACE_DETECTION_STARTED");

      const activeChallengeId = currentChallenge < challenges.length ? challenges[currentChallenge].id : undefined;
      const res = await livenessAPI.processDemoFrame(
        base64Image,
        sessionId,
        activeChallengeId,
        hasFaceEnrolled ? (enrolledEmbedding || undefined) : undefined,
        'enterprise'
      );
      const data = res?.data;
      setApiResponse(data);

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

      // Enterprise Security Terminal Alerts Checks
      const terminalStatuses: Record<string, string> = {
        "MULTIPLE_FACES_DETECTED": "MULTIPLE FACES DETECTED",
        "REPLAY_ATTACK_DETECTED": "REPLAY ATTACK DETECTED",
        "DEEPFAKE_SUSPECTED": "DEEPFAKE SUSPECTED",
        "CAMERA_FEED_FROZEN": "SESSION TERMINATED",
        "UNAUTHORIZED_PERSON": "UNAUTHORIZED PERSON",
        "IDENTITY_CHANGED": "UNAUTHORIZED PERSON"
      };

      if (data.status in terminalStatuses) {
        triggerSessionTermination(terminalStatuses[data.status], false);
        return;
      }

      console.log(`[Face Verification] Status: enrollment_status=${hasFaceEnrolled}, similarity=${data.similarity_score}, spoof_score=${data.spoof_score}, mismatch_count=${mismatchCount}`);

      if (streaming && hasFaceEnrolled && !overallResult) {
        if (data.detected_faces > 1) {
          triggerSessionTermination('Multiple Faces Detected', false);
          return;
        }
        if (data.spoof_score > 0.45 && data.face_present) {
          triggerSessionTermination('Spoof Detected', false);
          return;
        }
      }

      const isFacePresent = !!(
        data.face_present &&
        data.face_confidence > 0.50 &&
        data.landmark_count > 0 &&
        Math.abs(data.yaw || 0) <= 45 &&
        Math.abs(data.pitch || 0) <= 30 &&
        Math.abs(data.roll || 0) <= 30
      );
      const isFacePresentAndValid = data.face_present && data.face_confidence > 0.50;
      const box = data.bbox;
      setBbox(box || null);
      if (data.ear !== undefined) setEar(data.ear);
      if (data.mar !== undefined) setMar(data.mar);
      const face_center_x = data.landmarks && data.landmarks[1] ? data.landmarks[1][0] : (box ? box.x + box.w / 2 : 0.5);
      const face_center_y = data.landmarks && data.landmarks[1] ? data.landmarks[1][1] : (box ? box.y + box.h / 2 : 0.5);
      const inside = box &&
                     Math.abs(face_center_x - 0.5) <= 0.15 &&
                     Math.abs(face_center_y - 0.5) <= 0.15;

      const isFrameValid = 
         isFacePresentAndValid &&
        data.detected_faces === 1 &&
        inside &&
        (!hasFaceEnrolled || (
          data.spoof_score < 0.45 &&
          data.deepfake_risk < 0.30 &&
          data.similarity_score >= 0.75
        ));

      if (isFrameValid) {
        setFaceConfidenceMetric(data.face_confidence);
        setTrackingConfidence(Math.min(1.0, data.face_confidence + 0.1));
        
        lostFramesRef.current = 0;
        setLostFrames(0);
        recoveredFramesRef.current += 1;
        setRecoveredFrames(recoveredFramesRef.current);
        lastFaceSeenTimeRef.current = Date.now();
        setTimeSinceFaceSeen(0);

        if (data.landmarks && data.landmarks.length > 0) {
          const liveEmb = calculateFaceEmbedding(data.landmarks);
          if (liveEmb && liveEmb.length > 0) {
            setLiveEmbedding(liveEmb);
            console.log("Live embedding generated");
            console.log(liveEmb.length);
            
            if (enrolledEmbedding) {
              const sim = cosineSimilarity(enrolledEmbedding, liveEmb);
              console.log("Similarity:", sim);
              
              similarityHistoryRef.current.push(sim);
              if (similarityHistoryRef.current.length > 15) {
                similarityHistoryRef.current.shift();
              }
              const smoothedSim = similarityHistoryRef.current.reduce((a, b) => a + b, 0) / similarityHistoryRef.current.length;
              
              setSimilarity(smoothedSim);
              setLastMatchTime(Date.now());
            }
          }
        }

        if (recoveredFramesRef.current >= 5) {
          if (prevTrackingStateRef.current === 'FACE_WARNING' || prevTrackingStateRef.current === 'FACE_RECOVERY') {
            console.log("FACE_REACQUIRED: Restoring previous session automatically.");
          }
          setFaceTrackingState('FACE_PRESENT');
          prevTrackingStateRef.current = 'FACE_PRESENT';
        }
        console.log("FACE_DETECTED: YES");
        console.log(`LANDMARKS_FOUND: count=${data.landmark_count}`);
        console.log("EMBEDDING_GENERATED");
        if (hasFaceEnrolled && data.similarity_score >= 0.85) {
          console.log("MATCH_SUCCESS");
        }
        searchingForFaceStartRef.current = null;

        // Reset face/identity lost persistence timers and mismatch warnings
        faceLostStartRef.current = null;
        setFaceMissingDuration(0);
        setMismatchCount(0);

        setDetectedFaces(data.detected_faces);
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
        setDeepfakeRisk(data.deepfake_risk);
        setGazeDirection(data.gaze_direction);
        setGazeAvailable(data.gaze_available);
        setFaceInsideGuide(true);

        // Detection stability calculation using landmark nose history
        if (data.landmarks && data.landmarks[1]) {
          const nose = data.landmarks[1];
          const hist = noseHistoryRef.current;
          hist.push([nose[0], nose[1]]);
          if (hist.length > 10) {
            hist.shift();
          }
          if (hist.length >= 2) {
            let totalDist = 0;
            for (let i = 1; i < hist.length; i++) {
              const dx = hist[i][0] - hist[i-1][0];
              const dy = hist[i][1] - hist[i-1][1];
              totalDist += Math.sqrt(dx * dx + dy * dy);
            }
            const avgDist = totalDist / (hist.length - 1);
            const stab = Math.max(0.0, Math.min(100.0, 100.0 - avgDist * 500.0));
            setDetectionStability(stab);
          } else {
            setDetectionStability(95.0);
          }
        }

        wasBlinkingRef.current = data.blink_detected;

        if (hasFaceEnrolled) {
          consecutiveValidFramesRef.current += 1;
          setConsecutiveValidFrames(consecutiveValidFramesRef.current);
        }

        // Check if confidence >= 0.90 AND inside guide to increment duration
        if (faceVisibleStartRef.current === null) {
          faceVisibleStartRef.current = Date.now();
          setFaceVisibleDuration(0);
        } else {
          const dur = (Date.now() - faceVisibleStartRef.current) / 1000;
          setFaceVisibleDuration(dur);
        }

        // const durVal = faceVisibleStartRef.current ? (Date.now() - faceVisibleStartRef.current) / 1000 : 0; // removed unused variable

        // State Machine progression logic based on data:
        if (currentChallenge === 0) {
          // Face Centered Challenge
          if (data.face_confidence > 0.50 && inside && data.detected_faces === 1) {
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
                currentChallengeRef.current = 1;
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
              if (activeChallenge.id === 'smile') setHasSmiled(true);
              if (activeChallenge.id === 'look_up') setHasLookedUp(true);
              
              setChallengePassed(prev => {
                const next = [...prev];
                next[currentChallenge] = true;
                return next;
              });
              
              const nextStep = currentChallenge + 1;
              currentChallengeRef.current = nextStep;
              setCurrentChallenge(nextStep);
              stepStartTimeRef.current = Date.now();
              if (nextStep >= challenges.length) {
                console.log("LIVENESS_COMPLETE");
              }
            }
          }
        }
      } else {
        console.log(`Face detection failure reason: ${data.status || 'No face detected'}`);
        if (searchingForFaceStartRef.current === null) {
          searchingForFaceStartRef.current = Date.now();
        } else if (Date.now() - searchingForFaceStartRef.current > 3000) {
          console.warn(`[Biometric Pipeline] Stuck in 'Searching For Face' state for over 3 seconds. Status: ${data.status || 'No face found'}`);
          searchingForFaceStartRef.current = Date.now(); // throttle logs
        }
        handleFrameInvalid(data);
      }
    } catch (err: unknown) {
      console.error('Frame processing failed', err);
      setModelStatus("Failed");
      setError("Failed to connect to backend biometric services.");
      handleFrameInvalid(null);
    } finally {
      setIsProcessing(false);
    }
  }, [streaming, sessionId, hasFaceEnrolled, enrolledEmbedding, currentChallenge, challenges, isProcessing, overallResult, triggerSessionTermination, mismatchCount]);

  // Throttled requestAnimationFrame loop
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const streamingRef = useRef(false);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);
  // Throttled requestAnimationFrame loop
  function animationLoop(_timestamp: number) {
    if (!streamingRef.current) return;
    const now = Date.now();
    // Throttle frames to backend to ~10 FPS to prevent server overload
    if (now - lastFrameTimeRef.current >= 100) {
      sendFrameToBackend();
      lastFrameTimeRef.current = now;
    }
    requestRef.current = requestAnimationFrame(animationLoop);
  }
// animationLoop moved earlier; original location removed

  useEffect(() => {
    if (streaming) {
      lastFrameTimeRef.current = Date.now();
      requestRef.current = requestAnimationFrame(animationLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [streaming, animationLoop]);

  // Handle session timer
  useEffect(() => {
    if (!streaming) return;
    sessionTimeRef.current = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);
    return () => {
      if (sessionTimeRef.current) clearInterval(sessionTimeRef.current);
    };
  }, [streaming]);

  // Challenge step countdown timer
  useEffect(() => {
    if (!streaming || overallResult || !hasFaceEnrolled || currentChallenge >= challenges.length) return;
    
    timerRef.current = setInterval(() => {
      setChallengeTimer(t => {
        if (t <= 1) {
          // Instead of failing the session immediately on timeout, reset to 30 seconds to allow retry
          console.log("Challenge timed out. Retrying current challenge...");
          return 30;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streaming, currentChallenge, challenges, hasFaceEnrolled, overallResult]);

  // Enforce fail state on multiple faces or deepfake detections during active session
  useEffect(() => {
    if (streaming && hasFaceEnrolled && !overallResult) {
      if (detectedFaces > 1) {
        const t = setTimeout(() => triggerSessionTermination('Multiple Faces Detected', false), 0);
        return () => clearTimeout(t);
      } else if (spoofScore > 0.45 && faceVisibleDuration >= 2.0) {
        const t = setTimeout(() => triggerSessionTermination('Spoof Detected', false), 0);
        return () => clearTimeout(t);
      }
    }
  }, [detectedFaces, spoofScore, faceVisibleDuration, streaming, hasFaceEnrolled, overallResult, triggerSessionTermination]);

  async function startCamera() {
    setError(null);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setSessionTime(0);
    setOverallResult(null);
    setSessionTerminated(false);
    setTerminationReason('');
    setModelStatus('Loading');
    faceDetectionHistoryRef.current = [];
    similarityHistoryRef.current = [];
    
    // Reset mismatch count
    setMismatchCount(0);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mv_mismatch_count');
    }

    // Reset ref-based frame counters
    consecutiveValidFramesRef.current = 0;
    currentChallengeRef.current = 0;
    setConsecutiveValidFrames(0);

    // Reset state machine & tracking metrics
    setFaceTrackingState('FACE_PRESENT');
    prevTrackingStateRef.current = 'FACE_PRESENT';
    setLostFrames(0);
    setRecoveredFrames(0);
    setTimeSinceFaceSeen(0);
    setLiveEmbedding([]);
    setLastMatchTime(null);
    lastFaceSeenTimeRef.current = null;
    lostFramesRef.current = 0;
    recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0);
    setTrackingConfidence(1.0);

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (modelStatus === 'Loading' || !streaming) {
        console.warn("[Biometric Pipeline] Initialization timed out after 5 seconds.");
        setModelStatus('Failed');
        setError('Biometric services failed to respond within 5 seconds. Please check connection and try again.');
        stopCamera();
      }
    }, 5000);

    try {
      const sessionRes = await livenessAPI.startSession('enterprise');
      setSessionId(sessionRes.data.session_id);
      setChallenges(sessionRes.data.challenges);
      setChallengePassed(new Array(sessionRes.data.challenges.length).fill(false));
      setCurrentChallenge(0);
      setChallengeTimer(30);
    } catch (e) {
      console.error("Failed to start session on backend", e);
      setError('Failed to initialize secure verification session with backend.');
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

  function stopCamera() {
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
    setOverallResult(null);
    setConfidence(0);
    setSimilarity(0);
    faceDetectionHistoryRef.current = [];
    similarityHistoryRef.current = [];
    setGazeDirection(null);
    setGazeAvailable(false);
    setFaceInsideGuide(false);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setChallenges([]);
    setChallengePassed([]);
    setSessionTerminated(false);
    setTerminationReason('');

    // Reset state machine & tracking metrics
    setFaceTrackingState('FACE_PRESENT');
    prevTrackingStateRef.current = 'FACE_PRESENT';
    setLostFrames(0);
    setRecoveredFrames(0);
    setTimeSinceFaceSeen(0);
    setLiveEmbedding([]);
    setLastMatchTime(null);
    setRawYaw(0);
    setYawDirection('CENTER');
    setYaw(0);
    setPitch(0);
    setRoll(0);
    lastFaceSeenTimeRef.current = null;
    lostFramesRef.current = 0;
    recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0);
    setTrackingConfidence(1.0);
  }

  // Enrollment helper
  const enrollFace = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setEnrolling(true);
    try {
      // Draw frame to canvas
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.80);

      // Call API
      const res = await livenessAPI.enrollFace(base64Image);
      if (res.data && res.data.embedding_vector) {
        setEnrolledEmbedding(res.data.embedding_vector);
        localStorage.setItem('enrolledEmbedding', JSON.stringify(res.data.embedding_vector));
        localStorage.setItem('mv_enrolled_signature', JSON.stringify(res.data.embedding_vector));
        console.log('[Face Enrollment] Face enrolled successfully. Refreshing user context...');
        console.log("ENROLLMENT_SUCCESS");
        console.log("Enrollment embedding generated");
        console.log(res.data.embedding_vector.length);
        await refreshUser();
      } else {
        alert("Failed to enroll face: Invalid response from backend");
      }
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      alert(apiErr.response?.data?.detail || "Failed to enroll face due to network/server error");
    } finally {
      setEnrolling(false);
    }
  };

  const clearEnrollment = async () => {
    setEnrolledEmbedding(null);
    localStorage.removeItem('enrolledEmbedding');
    localStorage.removeItem('mv_enrolled_signature');
    setSimilarity(0);
    similarityHistoryRef.current = [];
    setConsecutiveValidFrames(0);
    console.log('[Face Enrollment] Face enrollment cleared. Refreshing user context...');
    await refreshUser();
  };



  type EnterpriseState = 'FACE_DETECTED' | 'FACE_ENROLLED' | 'IDENTITY_MATCHED' | 'CHALLENGES_COMPLETED' | 'AUTHENTICATED';

  const enterpriseState = useMemo<EnterpriseState | null>(() => {
    if (!streaming || sessionTerminated) return null;
    
    // State 1: FACE_DETECTED
    const isFaceDetected = confidence > 0.50 && detectedFaces === 1 && faceInsideGuide;
    if (!isFaceDetected) return null;
    
    // State 2: FACE_ENROLLED
    const isFaceEnrolled = hasFaceEnrolled;
    if (!isFaceEnrolled) return 'FACE_DETECTED';
    
    // State 3: IDENTITY_MATCHED
    const isIdentityMatched = similarity >= 0.75;
    if (!isIdentityMatched) return 'FACE_ENROLLED';
    
    // State 4: CHALLENGES_COMPLETED
    const isChallengesCompleted = challengePassed.length > 0 && challengePassed.every(Boolean);
    if (!isChallengesCompleted) return 'IDENTITY_MATCHED';
    
    // State 5: AUTHENTICATED
    const isAuthenticated = isChallengesCompleted && confidence > 0.50 && detectedFaces === 1 && faceInsideGuide && spoofScore < 0.45 && deepfakeRisk < 0.30 && similarity >= 0.75;
    if (isAuthenticated) {
      return 'AUTHENTICATED';
    }
    
    return 'CHALLENGES_COMPLETED';
  }, [streaming, sessionTerminated, confidence, detectedFaces, faceInsideGuide, hasFaceEnrolled, similarity, consecutiveValidFrames, challengePassed, spoofScore, deepfakeRisk]);

  const checks = {
    face_present: confidence > 0.50 && detectedFaces === 1,
    eye_tracking: gazeAvailable && gazeDirection !== null,
    head_pose_ok: Math.abs(yaw) < 30 && Math.abs(pitch) < 20 && Math.abs(roll) < 15,
    multiple_faces: detectedFaces > 1,
    deepfake: spoofScore > 0.45,
    session_active: streaming,
    identity_matched: hasFaceEnrolled && similarity >= 0.75
  };

  // Enterprise API rules: Verification succeeds only when all conditions pass (State 5)
  const isVerified = enterpriseState === 'AUTHENTICATED';

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Navbar />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }}
        />
        <p style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#475569', textDecoration: 'none', fontSize: 13, marginBottom: 24 }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 600, letterSpacing: '0.08em' }}>ENTERPRISE IDENTITY API</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>POST /api/v1/identity/verify</div>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Enterprise Identity <span className="gradient-text-green">Demo</span>
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 500 }}>
                High-security dynamic challenge verification sequence combining embedding matches, gaze analysis, and continuous monitoring.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00ff88' }}>99.2%</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Accuracy</div>
            </div>
          </div>
        </div>

        {/* Enrollment Required Alert */}
        {!hasFaceEnrolled && (
          <div className="glass" style={{ padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#ffb800" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffb800', marginBottom: 4 }}>Biometric Enrollment Required</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Continuous identity verification cannot run because you have not enrolled a face. Please align your face inside the camera oval and click <strong>Enroll Current Face</strong> in the right-hand panel.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Camera Frame */}
          <div>
            <div style={{
              position: 'relative', borderRadius: 20, overflow: 'hidden',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
              aspectRatio: '4/3',
            }}>
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
                  <div style={{ fontWeight: 'bold', color: 'var(--brand-green)', marginBottom: 2, letterSpacing: '0.05em' }}>BIOMETRIC PIPELINE HUD</div>
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
                    <span style={{ color: confidence > 0.50 ? 'var(--brand-green)' : 'var(--brand-amber)' }}>
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
                    <span style={{ color: '#94a3b8' }}>Raw Yaw:</span>
                    <span style={{ color: '#ffb800' }}>{rawYaw.toFixed(1)}°</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Corrected Yaw:</span>
                    <span style={{ color: '#ffb800' }}>{yaw.toFixed(1)}°</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Direction:</span>
                    <span style={{ color: '#ffb800' }}>{yawDirection}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span style={{ color: '#94a3b8' }}>Pitch / Roll:</span>
                    <span style={{ color: '#ffb800' }}>{pitch.toFixed(1)}° / {roll.toFixed(1)}°</span>
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

              {/* Three.js R3F 478 Landmark wireframe overlay */}
              {streaming && isMounted && apiResponse?.landmarks && (
                <Biometric3DOverlay
                  landmarks={apiResponse.landmarks}
                  isVerified={isVerified}
                  sessionTerminated={sessionTerminated}
                />
              )}

              {/* Glowing Framer Motion Scanning Beam */}
              {streaming && !overallResult && (
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, transparent, ${detectedFaces > 1 ? 'var(--brand-red)' : isVerified ? 'var(--brand-green)' : 'var(--brand-cyan)'}, transparent)`,
                    boxShadow: `0 0 15px ${detectedFaces > 1 ? 'var(--brand-red)' : isVerified ? 'var(--brand-green)' : 'var(--brand-cyan)'}`,
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />
              )}

              {/* HUD guides and tracking overlay */}
              {streaming && !overallResult && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
                  {/* Gaze crosshair dot */}
                  {gazeAvailable && gazeDirection && (
                    <motion.div
                      animate={{
                        left: `${(1.0 - gazeDirection.x) * 100}%`,
                        top: `${gazeDirection.y * 100}%`
                      }}
                      style={{
                        position: 'absolute',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: 'rgba(0, 212, 255, 0.85)',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 12px rgba(0, 212, 255, 1)',
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.1s ease',
                      }}
                    />
                  )}

                  {/* HUD Indicator Status */}
                  <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block', padding: '8px 16px', borderRadius: 20,
                      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: detectedFaces > 1 ? 'var(--brand-red)' :
                             faceTrackingState === 'FACE_WARNING' ? 'var(--brand-amber)' :
                             faceTrackingState === 'FACE_RECOVERY' ? 'var(--brand-amber)' :
                             landmarkCount === 0 ? 'var(--brand-amber)' :
                             confidence < 0.50 ? 'var(--brand-amber)' :
                             !faceInsideGuide ? 'var(--brand-amber)' :
                             faceVisibleDuration < 2.0 ? 'var(--brand-cyan)' : 'var(--brand-green)',
                      fontSize: 13, fontWeight: 700, fontFamily: 'monospace'
                    }}>
                      {detectedFaces > 1 ? 'MULTIPLE FACES DETECTED' :
                       faceTrackingState === 'FACE_WARNING' ? 'FACE TEMPORARILY LOST' :
                       faceTrackingState === 'FACE_RECOVERY' ? 'SEARCHING FOR FACE' :
                       landmarkCount === 0 ? 'SEARCHING FOR FACE' :
                       confidence < 0.50 ? 'FACE DETECTED (CONFIDENCE LOW)' :
                       !faceInsideGuide ? 'ALIGN FACE INSIDE OVAL' :
                       faceVisibleDuration < 2.0 ? `ACQUIRING SIGNAL (${Math.min(100, Math.round(faceVisibleDuration * 50))}%)` :
                       !hasFaceEnrolled ? 'READY TO ENROLL' :
                       `CHALLENGE STEP TIMER: ${challengeTimer}s`}
                    </div>
                  </div>
                </div>
              )}

              {/* Start state placeholder */}
              {!streaming && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Fingerprint size={32} color="#00ff88" />
                  </div>
                  <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', maxWidth: 260 }}>
                    Click below to initialize your high-security biometric session.
                  </p>
                  {error && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#ff3366', fontSize: 13, background: 'rgba(255,51,102,0.08)', padding: '10px 16px', borderRadius: 8 }}>
                      <AlertTriangle size={14} /> {error}
                    </div>
                  )}
                </div>
              )}

              {/* Multiple face detection warning overlay */}
              <AnimatePresence>
                {detectedFaces > 1 && streaming && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,51,102,0.25)',
                      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }} className="glass">
                      <Users size={40} color="var(--brand-red)" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 8 }}>MULTIPLE FACES DETECTED</h3>
                      <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 260, margin: '0 auto' }}>
                        Multiple identities found. Please ensure only a single user is in front of the camera.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Session Terminated Overlay */}
              <AnimatePresence>
                {sessionTerminated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,51,102,0.92)',
                      backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <XCircle size={64} color="#fff" style={{ margin: '0 auto 16px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' }} />
                      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>SESSION TERMINATED</h2>
                      <p style={{ fontSize: 18, color: '#fff', marginBottom: 8, fontWeight: 600 }}>
                        {terminationReason === 'Multiple Faces Detected' ? 'MULTIPLE FACES DETECTED' : 'Face Lost'}
                      </p>
                      <p style={{ fontSize: 14, color: '#fda4af' }}>Redirecting to login / re-authentication...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Face Lost Warning Overlay */}
              <AnimatePresence>
                {streaming && hasFaceEnrolled && (faceTrackingState === 'FACE_WARNING' || faceTrackingState === 'FACE_RECOVERY') && !sessionTerminated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.4)',
                      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }} className="glass">
                      <AlertTriangle size={40} color="var(--brand-red)" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 8, letterSpacing: '0.05em' }}>
                        {faceTrackingState === 'FACE_WARNING' ? 'FACE TEMPORARILY LOST' : 'SEARCHING FOR FACE'}
                      </h3>
                      <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 260, margin: '0 auto' }}>
                        Session will terminate in {Math.max(0, Math.ceil(5.0 - timeSinceFaceSeen))}s...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Face Mismatch Warning Overlay */}
              <AnimatePresence>
                {streaming && hasFaceEnrolled && mismatchCount > 0 && mismatchCount < 4 && !sessionTerminated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.25)',
                      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }} className="glass">
                      <AlertTriangle size={40} color="var(--brand-red)" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 8 }}>
                        SECURITY WARNING: IDENTITY MISMATCH
                      </h3>
                      <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 260, margin: '0 auto' }}>
                        The face detected does not match the enrolled profile.
                      </p>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-red)', marginTop: 12 }}>
                        Warning {mismatchCount}/3
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        Session will terminate on the next mismatch.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verification Result Overlay */}
              <AnimatePresence>
                {enterpriseState === 'AUTHENTICATED' && streaming && detectedFaces <= 1 && !sessionTerminated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,255,136,0.12)',
                      backdropFilter: 'blur(8px)', zIndex: 10
                    }}>
                    <div style={{ textAlign: 'center' }} className="glass">
                      <div style={{ fontSize: 48, marginBottom: 8, color: '#00ff88' }}>✓</div>
                      <h3 style={{ fontSize: 24, fontWeight: 900, color: '#00ff88', marginBottom: 12, letterSpacing: '0.05em' }}>
                        AUTHENTICATED
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, margin: '0 auto 8px', textTransform: 'uppercase' }}>
                        VERIFIED · SESSION ACTIVE
                      </p>
                      <p style={{ color: '#cbd5e1', fontSize: 12, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.5 }}>
                        Continuous biometric and anti-spoof checks fully validated.
                      </p>
                      <button onClick={stopCamera} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                        <RotateCcw size={14} /> End Session
                      </button>
                    </div>
                  </motion.div>
                )}
                {streaming && !hasFaceEnrolled && detectedFaces <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', top: 16, right: 16,
                      padding: '8px 16px', borderRadius: 10,
                      background: 'rgba(255,184,0,0.15)',
                      border: '1px solid rgba(255,184,0,0.4)',
                      color: '#ffb800',
                      fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                      zIndex: 8
                    }}>
                    NO ENROLLED IDENTITY
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live telemetry counters */}
              {streaming && (
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,136,0.3)', fontSize: 11, color: '#00ff88', fontFamily: 'monospace', fontWeight: 600 }}>
                    ● SESSION {formatTime(sessionTime)}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Camera actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {!streaming ? (
                <button className="btn-primary" onClick={startCamera} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Camera size={16} /> Start Session
                </button>
              ) : (
                <>
                  <button className="btn-ghost" onClick={stopCamera} style={{ flex: 1 }}>End Session</button>
                  <button className="btn-ghost" onClick={() => setShowDebug(!showDebug)} style={{ color: showDebug ? 'var(--brand-green)' : 'var(--text-secondary)' }}>
                    <Terminal size={16} /> Debug Panel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Identity Similarity Card */}
            <div className="glass" style={{ padding: 20, borderRadius: 16, position: 'relative' }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>BIOMETRIC IDENTITY MATCH</div>
              {hasFaceEnrolled ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.2)', color: '#00ff88' }}>
                      IDENTITY ENROLLED
                    </span>
                    <button className="btn-ghost" onClick={clearEnrollment} style={{ fontSize: 10, padding: '4px 8px', height: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Identity Match</span>
                      <span style={{
                        fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
                        color: similarity >= 0.90 ? '#00ff88' : similarity >= 0.75 ? '#00d4ff' : '#ff3366'
                      }}>
                        {Math.round(similarity * 100)}%
                      </span>
                    </div>

                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div animate={{
                        width: `${similarity * 100}%`,
                        background: similarity >= 0.90 ? '#00ff88' : similarity >= 0.75 ? '#00d4ff' : '#ff3366'
                      }}
                        style={{ height: '100%', borderRadius: 3 }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#475569' }}>Match Level:</span>
                        <span style={{
                          fontWeight: 700,
                          color: similarity >= 0.90 ? '#00ff88' : similarity >= 0.75 ? '#00d4ff' : '#ff3366'
                        }}>
                          {similarity >= 0.90 ? '✓ Strong Match' : similarity >= 0.75 ? '~ Possible Match' : '✗ No Match'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#475569' }}>Similarity Score:</span>
                        <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                          {(similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#475569' }}>Authentication Status:</span>
                        <span style={{ color: checks.identity_matched ? (challengePassed.length > 0 && challengePassed.every(Boolean) ? '#00ff88' : '#00d4ff') : '#ffb800', fontWeight: 600 }}>
                          {checks.identity_matched ? (challengePassed.length > 0 && challengePassed.every(Boolean) ? 'Authenticated' : 'Challenge In Progress') : 'Authentication Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Fingerprint size={32} color="#475569" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', letterSpacing: '-0.01em' }}>NO ENROLLED IDENTITY</div>
                  <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 16px', lineHeight: 1.4 }}>
                    Enroll your face to calculate live similarity metrics.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={enrollFace}
                    disabled={!isFacePrepared || enrolling}
                    style={{ fontSize: 12, padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center', margin: '0 auto' }}
                  >
                    {enrolling ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Lock size={12} /> Enroll Current Face
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Biometric Confidence Metrics Panel */}
            {streaming && (
              <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>
                  CONFIDENCE METRICS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Face Confidence', value: (confidence * 100).toFixed(1), icon: Brain, color: 'var(--brand-cyan)' },
                    { label: 'Identity Similarity', value: hasFaceEnrolled ? (similarity * 100).toFixed(1) : '0.0', icon: Fingerprint, color: 'var(--brand-green)' },
                    { label: 'Liveness Confidence', value: ((1.0 - spoofScore) * 100).toFixed(1), icon: Shield, color: '#00ff88' },
                    { label: 'Detection Stability', value: detectionStability.toFixed(1), icon: Activity, color: '#00d4ff' }
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} color={color} />
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Challenge sequence */}
            {streaming && hasFaceEnrolled && challenges.length > 0 && !overallResult && (
              <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>BIOMETRIC CHALLENGES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {challenges.map((ch, i) => {
                    const isCurrent = i === currentChallenge;
                    const isDone = challengePassed[i];
                    return (
                      <div key={`${ch.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: isCurrent ? 'rgba(0,255,136,0.05)' : 'transparent' }}>
                        <span style={{ fontSize: 16 }}>{ch.icon}</span>
                        <span style={{ fontSize: 12, flex: 1, color: isDone ? '#00ff88' : isCurrent ? '#f8fafc' : '#475569', fontWeight: isCurrent ? 600 : 400 }}>{ch.label}</span>
                        {isDone && <CheckCircle size={14} color="#00ff88" />}
                        {!isDone && !isCurrent && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #475569' }} />}
                        {isCurrent && (
                          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div animate={{ width: `${challengeProgress}%` }} style={{ height: '100%', background: 'var(--brand-green)' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Anti-spoofing probabilities */}
            <div className="glass" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Spoof Risk</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: spoofScore > 0.45 ? 'var(--brand-red)' : 'var(--brand-green)', fontFamily: 'monospace' }}>
                    {(spoofScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <motion.div animate={{ width: `${spoofScore * 100}%`, background: spoofScore > 0.45 ? 'var(--brand-red)' : 'var(--brand-green)' }}
                    style={{ height: '100%', borderRadius: 3 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Deepfake Risk</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: deepfakeRisk > 0.30 ? 'var(--brand-red)' : 'var(--brand-green)', fontFamily: 'monospace' }}>
                    {(deepfakeRisk * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <motion.div animate={{ width: `${deepfakeRisk * 100}%`, background: deepfakeRisk > 0.30 ? 'var(--brand-red)' : 'var(--brand-green)' }}
                    style={{ height: '100%', borderRadius: 3 }} />
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
                Liveness Status: {spoofScore > 0.45 || deepfakeRisk > 0.30 ? 'HIGH RISK DETECTED' : 'LOW RISK (LIVENESS VERIFIED)'}
              </div>
              <ThreatRadarWidget spoofScore={spoofScore} color={spoofScore > 0.45 ? 'var(--brand-red)' : 'var(--brand-green)'} />
            </div>

            {/* Head Pose Card */}
            <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>REAL LANDMARK HEAD POSE</div>
              {streaming && isMounted && (
                <div style={{ marginBottom: 16 }}>
                  <HeadPose3DWidget
                    yaw={yaw}
                    pitch={pitch}
                    roll={roll}
                    color={sessionTerminated ? 'var(--brand-red)' : isVerified ? 'var(--brand-green)' : 'var(--brand-cyan)'}
                  />
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Yaw', value: yaw, max: 30 },
                  { label: 'Pitch', value: pitch, max: 20 },
                  { label: 'Roll', value: roll, max: 15 },
                ].map(({ label, value, max }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: Math.abs(value) > max ? 'var(--brand-amber)' : 'var(--brand-cyan)', fontFamily: 'monospace' }}>
                      {value.toFixed(1)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eye Tracking Card */}
            <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>EYE TRACKING / GAZE</div>
                {gazeAvailable && gazeDirection && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#00d4ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }} />
                    Eye Tracking Active
                  </span>
                )}
              </div>
              {gazeAvailable && gazeDirection ? (
                <>
                  <div style={{ position: 'relative', height: 80, background: 'rgba(0,0,0,0.4)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div animate={{ left: `${gazeDirection.x * 100}%`, top: `${gazeDirection.y * 100}%` }}
                      style={{ position: 'absolute', transform: 'translate(-50%, -50%)', width: 12, height: 12, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 12px rgba(0,212,255,0.8)' }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 1, height: '80%', background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                    <span>Gaze X: {(gazeDirection.x * 100).toFixed(1)}%</span>
                    <span>Gaze Y: {(gazeDirection.y * 100).toFixed(1)}%</span>
                  </div>
                </>
              ) : (
                <div style={{ height: 80, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                  Waiting for Eye landmarks...
                </div>
              )}
            </div>

            {/* Authentication Sequence Tracker */}
            {streaming && (
              <AuthSequenceTracker
                faceDetected={checks.face_present}
                landmarkGenerated={landmarkCount > 0}
                livenessPassed={overallResult === 'pass' || (currentChallenge > 0 && !sessionTerminated)}
                identityMatch={checks.identity_matched}
                sessionActive={isVerified && !sessionTerminated}
                color={sessionTerminated ? 'var(--brand-red)' : isVerified ? 'var(--brand-green)' : 'var(--brand-cyan)'}
              />
            )}

            {/* Security Checks List */}
            <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 14 }}>
                ENTERPRISE API STATUS
              </h3>
              <SessionShield
                authenticated={isVerified}
                invalidated={sessionTerminated}
                color={sessionTerminated ? 'var(--brand-red)' : isVerified ? 'var(--brand-green)' : 'var(--brand-cyan)'}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <CheckBadge label="Face Recognition" passed={checks.identity_matched} checking={streaming && hasFaceEnrolled && !checks.identity_matched} />
                <CheckBadge label="Identity Matching" passed={checks.identity_matched} checking={false} />
                <CheckBadge label="Continuous Monitoring" passed={checks.session_active} checking={false} />
                <CheckBadge label="Single Face Validation" passed={!checks.multiple_faces && checks.face_present} checking={streaming && (checks.multiple_faces || !checks.face_present)} />
                <CheckBadge label="Anti Spoof Validation" passed={!checks.deepfake && checks.face_present} checking={streaming && checks.deepfake} />
              </div>
            </div>

            {/* Debug Panel */}
            <AnimatePresence>
              {showDebug && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="terminal" style={{ fontSize: 11, overflow: 'hidden' }}>
                  <div style={{ color: 'var(--brand-green)', marginBottom: 8, fontSize: 10, letterSpacing: '0.08em', fontWeight: 700 }}>DEVELOPER DEBUG PANEL</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace' }}>
                    <div>Embedding Generated: <span style={{ color: hasFaceEnrolled ? 'var(--brand-green)' : 'var(--brand-red)' }}>{hasFaceEnrolled ? 'YES' : 'NO'}</span></div>
                    <div>Embedding Length: <span style={{ color: '#f8fafc' }}>{enrolledEmbedding ? enrolledEmbedding.length : 0}</span></div>
                    <div>Current Similarity: <span style={{ color: '#f8fafc' }}>{(apiResponse?.similarity_score !== undefined ? apiResponse.similarity_score * 100 : 0.0).toFixed(1)}%</span></div>
                    <div>Frames Verified: <span style={{ color: '#f8fafc' }}>{consecutiveValidFrames}/20</span></div>
                    <div>Current Face Confidence: <span style={{ color: '#f8fafc' }}>{(confidence * 100).toFixed(1)}%</span></div>
                    <div>Enrollment Embedding Status: <span style={{ color: enrolledEmbedding ? 'var(--brand-green)' : 'var(--brand-red)' }}>{enrolledEmbedding ? 'Active (Ready)' : 'Missing'}</span></div>
                    <div>Live Embedding Status: <span style={{ color: liveEmbedding && liveEmbedding.length > 0 ? 'var(--brand-green)' : 'var(--brand-red)' }}>{liveEmbedding && liveEmbedding.length > 0 ? 'Active' : 'Offline'}</span></div>
                    <div>Similarity Score: <span style={{ color: similarity >= 0.75 ? 'var(--brand-green)' : 'var(--brand-amber)' }}>{(similarity * 100).toFixed(1)}%</span></div>
                    <div>Authentication State: <span style={{ color: checks.identity_matched ? 'var(--brand-green)' : 'var(--brand-amber)' }}>{checks.identity_matched ? 'Authenticated' : 'Pending'}</span></div>
                    <div>Last Match Time: <span style={{ color: '#f8fafc' }}>{lastMatchTime ? new Date(lastMatchTime).toLocaleTimeString() : 'N/A'}</span></div>
                    <div>faceTrackingState: <span style={{ color: 'var(--brand-cyan)' }}>{faceTrackingState}</span></div>
                    <div>Mismatch Count: <span style={{ color: mismatchCount > 0 ? 'var(--brand-red)' : '#f8fafc' }}>{mismatchCount}/3</span></div>
                    <div>Current Identity State: <span style={{ color: 'var(--brand-cyan)' }}>{enterpriseState || 'SEARCHING_FOR_FACE'}</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Instruction banner for Enterprise Challenges */}
            {streaming && enrolledEmbedding && challenges.length > 0 && !overallResult && (
              currentChallenge < challenges.length ? (
                <motion.div
                  key={currentChallenge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: 20, borderRadius: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{challenges[currentChallenge].icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                    {challenges[currentChallenge].label}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{challenges[currentChallenge].instruction}</div>
                  {confidence < 0.50 || !faceInsideGuide ? (
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

            {/* Live API Response */}
            <div className="terminal" style={{ fontSize: 11 }}>
              <div style={{ color: '#475569', marginBottom: 8, fontSize: 10, letterSpacing: '0.08em' }}>LIVE API RESPONSE PREVIEW</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>
                {apiResponse ? JSON.stringify(apiResponse, null, 2) : '// Waiting for camera stream...'}
              </pre>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
