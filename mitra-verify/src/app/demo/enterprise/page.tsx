'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Fingerprint, AlertTriangle, Users, Brain, Activity, RotateCcw, CheckCircle, Terminal, Lock, XCircle, Shield, AlertCircle, RefreshCw, Eye, Scan, Zap, ShieldCheck, ShieldAlert, FileText, Clock, ChevronRight, Cpu, Radio, Target } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { livenessAPI, checkHealth, API_BASE, parseNetworkError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { processHeadPose } from '@/lib/headPose';
import dynamic from 'next/dynamic';
import PageTransition from '@/components/cyber/PageTransition';
import BiometricScannerOverlay from '@/components/cyber/BiometricScannerOverlay';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useDiagnosticLogger } from '@/components/developer/useDiagnosticLogger';
import { AdvancedDebugPanel } from '@/components/developer/AdvancedDebugPanel';
import { CameraCanvasOverlay } from '@/components/developer/CameraCanvasOverlay';
import { TestModeMatrix } from '@/components/developer/TestModeMatrix';

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
  gaze_direction: { x: number; y: number } | null;
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
  raw_yaw?: number;
  blink_detected?: boolean;
  error?: string;
  reason?: string;
  enrolled_matched?: boolean;
  checks?: {
    replay_attack_score?: number;
  };
  // Enterprise-exclusive fields
  enterprise_report?: {
    identity_status: string;
    identity_match_pct: number;
    confidence_pct: number;
    liveness_pct: number;
    spoof_probability_pct: number;
    fraud_score: number;
    risk_score: number;
    threat_level: string;
    quality_score: number;
    landmark_consistency: number;
    passive_liveness: {
      score: number;
      blink_detected: boolean;
      head_motion: boolean;
      depth_valid: boolean;
    };
    fraud_detection: {
      printed_photo: boolean;
      replay_attack: boolean;
      deepfake: boolean;
      ai_generated: boolean;
      screen_reflection: boolean;
      mask_attack: boolean;
    };
  };
  face_quality?: number;
  pose_quality?: number;
  lighting_quality?: number;
  landmark_geometry?: {
    valid: boolean;
    score: number;
    regions: {
      eye_geometry: number;
      nose_geometry: number;
      jaw_shape: number;
      mouth_geometry: number;
      face_proportions: number;
    };
  };
  passive_liveness?: {
    score: number;
    blink_analysis: { detected: boolean; count: number; natural: boolean };
    eye_movement: { detected: boolean; score: number };
    head_motion: { detected: boolean; amplitude: number };
    muscle_movement: { detected: boolean; score: number };
    expression_variance: { detected: boolean; score: number };
    depth_valid: boolean;
  };
  fraud_detection?: {
    printed_photo: { detected: boolean; confidence: number };
    replay_attack: { detected: boolean; confidence: number };
    deepfake: { detected: boolean; confidence: number };
    ai_generated: { detected: boolean; confidence: number };
    screen_reflection: { detected: boolean; confidence: number };
    multiple_faces: { detected: boolean; confidence: number };
    cropped_face: { detected: boolean; confidence: number };
    mask_attack: { detected: boolean; confidence: number };
    overall_fraud_score: number;
    threat_level: string;
  };
  pose_validation?: {
    coverage: number;
    angles_seen: string[];
    angles_count: number;
    valid: boolean;
    score: number;
  };
}

// ─────────────────────────────────────────────────────────────
// PREMIUM UI COMPONENTS
// ─────────────────────────────────────────────────────────────

function IdentityScoreRing({ score, label, size = 120, color = '#00ff88' }: { score: number; label: string; size?: number; color?: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const displayColor = score >= 85 ? '#00ff88' : score >= 60 ? '#ffb800' : '#ff3366';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={displayColor} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {score >= 85 && (
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.08, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${displayColor}`, pointerEvents: 'none' }} />
      )}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: Math.max(18, size / 5), fontWeight: 800, color: displayColor, fontFamily: 'monospace' }}>{score.toFixed(1)}%</div>
        <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max = 100, color = '#00ff88', suffix = '%' }: { label: string; value: number; max?: number; color?: string; suffix?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = pct >= 80 ? '#00ff88' : pct >= 50 ? '#ffb800' : '#ff3366';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: barColor, fontWeight: 700, fontFamily: 'monospace' }}>{value.toFixed(1)}{suffix}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }} />
      </div>
    </div>
  );
}

function FraudCheckItem({ label, detected, icon }: { label: string; detected: boolean; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: detected ? 'rgba(255,51,102,0.08)' : 'rgba(0,255,136,0.04)', border: `1px solid ${detected ? 'rgba(255,51,102,0.2)' : 'rgba(0,255,136,0.1)'}` }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 10, color: detected ? '#ff3366' : '#64748b', fontWeight: 600, flex: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <motion.div animate={detected ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
        {detected ? <XCircle size={12} color="#ff3366" /> : <CheckCircle size={12} color="#00ff88" />}
      </motion.div>
    </div>
  );
}

function VerificationTimeline({ stages }: { stages: { label: string; active: boolean; complete: boolean; time?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {stages.map((stage, i) => (
        <div key={stage.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <motion.div
              animate={stage.active ? { boxShadow: ['0 0 0px #00d4ff', '0 0 8px #00d4ff', '0 0 0px #00d4ff'] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${stage.complete ? '#00ff88' : stage.active ? '#00d4ff' : '#334155'}`,
                background: stage.complete ? '#00ff88' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {stage.complete && <CheckCircle size={8} color="#000" />}
              {stage.active && !stage.complete && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff' }} />}
            </motion.div>
            {i < stages.length - 1 && (
              <div style={{ width: 2, height: 20, background: stage.complete ? '#00ff88' : 'rgba(255,255,255,0.06)' }} />
            )}
          </div>
          <div style={{ paddingBottom: i < stages.length - 1 ? 8 : 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: stage.complete ? '#e2e8f0' : stage.active ? '#00d4ff' : '#475569' }}>{stage.label}</div>
            {stage.time && <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>{stage.time}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreatRadarWidget({ spoofScore, color }: { spoofScore: number; color: string }) {
  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${color}22, transparent 50%)`,
          border: `1px dashed ${color}33`,
        }}
      />
      <div style={{ position: 'absolute', width: '75%', height: '75%', borderRadius: '50%', border: `1px dotted ${color}22` }} />
      <div style={{ position: 'absolute', width: '45%', height: '45%', borderRadius: '50%', border: `1px solid ${color}11` }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${color}11` }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${color}11` }} />
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <div style={{ fontSize: 8, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Threat Radar</div>
        <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'monospace' }}>
          {(spoofScore * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function SessionShield({ authenticated, invalidated, color }: { authenticated: boolean; invalidated: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
      <div style={{ position: 'relative' }}>
        {(authenticated || invalidated) && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${color}`, boxShadow: `0 0 15px ${color}`, pointerEvents: 'none' }}
          />
        )}
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `rgba(0,0,0,0.6)`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 15px ${color}33` }}>
          {invalidated ? <XCircle size={22} color={color} /> : authenticated ? <Lock size={22} color={color} /> : <Shield size={22} color={color} />}
        </div>
      </div>
    </div>
  );
}

function CheckBadge({ label, passed, checking }: { label: string; passed: boolean; checking: boolean }) {
  const color = checking ? '#00d4ff' : passed ? '#00ff88' : '#475569';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}22` }}>
      <motion.div animate={{ scale: passed ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}>
        <CheckCircle size={14} color={color} />
      </motion.div>
      <span style={{ fontSize: 11, color: checking ? '#00d4ff' : passed ? '#94a3b8' : '#475569', fontWeight: passed ? 500 : 400 }}>{label}</span>
      {checking && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#00d4ff' }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN ENTERPRISE DEMO PAGE
// ─────────────────────────────────────────────────────────────

export default function EnterpriseDemoPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout, user, refreshUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Developer Ecosystem Hooks
  const { logs, logEvent, downloadLogs, interpretSpoof } = useDiagnosticLogger();
  const [rawLandmarks, setRawLandmarks] = useState<any[]>([]);
  const [processingTime, setProcessingTime] = useState(0);

  // Debug HUD overlay additions
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<{ url: string; status: number | string; body: string; reason?: string } | null>(null);

  useEffect(() => {
    console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
    async function performHealthCheck() {
      try {
        const res = await checkHealth();
        if (res.data && res.data.status === 'ok') {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
          setDiagnosticInfo({ url: `${API_BASE}/health`, status: res.status || 'unknown', body: JSON.stringify(res.data), reason: 'Health endpoint returned non-ok status' });
        }
      } catch (err: any) {
        console.warn('Backend health check failed', err);
        setBackendHealthy(false);
        setDiagnosticInfo({ url: `${API_BASE}/health`, status: err.response?.status || 'network_error', body: err.response ? JSON.stringify(err.response.data) : (err.message || 'Connection Refused'), reason: parseNetworkError(err, `${API_BASE}/health`) });
      }
    }
    performHealthCheck();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/signin?reason=unauthenticated');
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
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ear, setEar] = useState(0);
  const [mar, setMar] = useState(0);

  // Enterprise analytics state
  const [enterpriseReport, setEnterpriseReport] = useState<BiometricResponse['enterprise_report'] | null>(null);
  const [faceQuality, setFaceQuality] = useState(0);
  const [poseQuality, setPoseQuality] = useState(0);
  const [lightingQuality, setLightingQuality] = useState(0);
  const [landmarkGeometry, setLandmarkGeometry] = useState<BiometricResponse['landmark_geometry'] | null>(null);
  const [passiveLiveness, setPassiveLiveness] = useState<BiometricResponse['passive_liveness'] | null>(null);
  const [fraudDetection, setFraudDetection] = useState<BiometricResponse['fraud_detection'] | null>(null);
  const [poseValidation, setPoseValidation] = useState<BiometricResponse['pose_validation'] | null>(null);

  // Enrollment states
  const [enrolledEmbedding, setEnrolledEmbedding] = useState<number[] | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [enrollmentSnapshot, setEnrollmentSnapshot] = useState<string | null>(null);

  const hasFaceEnrolled = useMemo(() => !!enrolledEmbedding, [enrolledEmbedding]);
  
  const enrollmentTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (hasFaceEnrolled && !enrollmentTimeRef.current) {
      enrollmentTimeRef.current = Date.now();
    } else if (!hasFaceEnrolled) {
      enrollmentTimeRef.current = null;
    }
  }, [hasFaceEnrolled]);

  // Track face mismatches
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
  const [challenges, setChallenges] = useState<{ id: string; label: string; instruction: string; icon: string }[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengePassed, setChallengePassed] = useState<boolean[]>([]);
  const challengeProgress = challenges.length > 0 ? Math.round((currentChallenge / challenges.length) * 100) : 0;
  const [overallResult, setOverallResult] = useState<'pass' | 'fail' | null>(null);

  // State machine steps
  const [isFacePrepared, setIsFacePrepared] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  const consecutiveValidFramesRef = useRef(0);
  const currentChallengeRef = useRef(0);

  // Visibility & Alignment states
  const faceVisibleStartRef = useRef<number | null>(null);
  const [faceVisibleDuration, setFaceVisibleDuration] = useState(0);
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);

  // Flow control
  const [isProcessing, setIsProcessing] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(30);
  const [apiResponse, setApiResponse] = useState<BiometricResponse | null>(null);
  const [showReport, setShowReport] = useState(false);

  const fpsCountRef = useRef(0);
  const lastFpsTime = useRef(0);
  const sessionTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasBlinkingRef = useRef(false);
  const transitioningRef = useRef(false);

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

  const [faceTrackingState, setFaceTrackingState] = useState<'FACE_PRESENT' | 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' | 'SESSION_TERMINATED'>('FACE_PRESENT');
  const prevTrackingStateRef = useRef<'FACE_PRESENT' | 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' | 'SESSION_TERMINATED'>('FACE_PRESENT');

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

  // Timers: auto-advance stuck challenges
  useEffect(() => {
    if (!streaming || overallResult || challenges.length === 0 || currentChallenge >= challenges.length) return;
    const interval = setInterval(() => {
      const now = Date.now();
      // Removed local challenge timeout logic. Backend handles challenge timeout / face lost states.
    }, 100);
    return () => clearInterval(interval);
  }, [streaming, overallResult, challenges.length, currentChallenge]);
  useEffect(() => { const t = setTimeout(() => setIsMounted(true), 0); return () => clearTimeout(t); }, []);

  const triggerSessionTermination = useCallback((reason: string, shouldRedirect: boolean = false) => {
    setSessionTerminated(true);
    setTerminationReason(reason);
    setOverallResult('fail');
    
    let eventType = 'SESSION_TERMINATED';
    const normReason = reason.toLowerCase();
    if (normReason.includes('face lost') || normReason.includes('no face') || normReason.includes('searching_for_face')) eventType = 'NO_FACE_DETECTED';
    else if (normReason.includes('multiple faces')) eventType = 'MULTIPLE_FACE';
    else if (normReason.includes('spoof') || normReason.includes('replay') || normReason.includes('deepfake')) eventType = 'SPOOF_DETECTED';
    else if (normReason.includes('unauthorized') || normReason.includes('identity changed') || normReason.includes('mismatch')) eventType = 'IDENTITY_MISMATCH';
    else if (normReason.includes('frozen') || normReason.includes('camera lost') || normReason.includes('camera feed frozen')) eventType = 'CAMERA_LOST';
    
    livenessAPI.logEvent(sessionId, eventType, 'enterprise').catch(console.error);

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);

    if (shouldRedirect) {
      setTimeout(() => { logout('/signin?reason=verification_lost'); }, 3000);
    }
  }, [logout, sessionId]);

  // Load enrollment
  useEffect(() => {
    const loadEnrolled = async () => {
      try {
        const res = await livenessAPI.getEnrolledFace();
        if (res.data && res.data.enrolled && res.data.embedding_vector) {
          setEnrolledEmbedding(res.data.embedding_vector);
          localStorage.setItem('enrolledEmbedding', JSON.stringify(res.data.embedding_vector));
          return;
        }
      } catch (e) { console.warn('Failed to fetch enrolled face from backend', e); }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('enrolledEmbedding') || localStorage.getItem('mv_enrolled_signature');
        if (stored) {
          try { setEnrolledEmbedding(JSON.parse(stored)); } catch (e) { console.warn('Failed to parse', e); }
        }
      }
    };
    loadEnrolled();
  }, []);

  // Frame processor
  const sendFrameToBackend = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming || isProcessing || overallResult) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsProcessing(true);

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    fpsCountRef.current++;
    if (now - lastFpsTime.current >= 1000) { fpsCountRef.current = 0; lastFpsTime.current = now; }

    const handleFrameInvalid = (data: BiometricResponse | null) => {
      const currentFaceDetected = !!(data && data.face_present && data.face_confidence > 0.50 && data.landmark_count > 0 && Math.abs(data.yaw || 0) <= 45 && Math.abs(data.pitch || 0) <= 30 && Math.abs(data.roll || 0) <= 30);
      faceDetectionHistoryRef.current.push(currentFaceDetected);
      if (faceDetectionHistoryRef.current.length > 15) faceDetectionHistoryRef.current.shift();
      const smoothFaceDetected = faceDetectionHistoryRef.current.filter(Boolean).length >= 8;

      if (smoothFaceDetected) { faceLostStartRef.current = null; setFaceMissingDuration(0); }
      else { if (faceLostStartRef.current === null) faceLostStartRef.current = Date.now(); }

      const faceLostDuration = faceLostStartRef.current ? (Date.now() - faceLostStartRef.current) / 1000 : 0;

      if (!hasFaceEnrolled) {
        setFaceTrackingState('FACE_LOST');
        prevTrackingStateRef.current = 'FACE_LOST';
        setDetectedFaces(0); setLandmarkCount(0); setConfidence(0);
        setGazeDirection(null); setGazeAvailable(false); setFaceInsideGuide(false);
        faceVisibleStartRef.current = null; setFaceVisibleDuration(0); setSimilarity(0);
        setConsecutiveValidFrames(0); noseHistoryRef.current = []; setDetectionStability(0.0);
        return;
      }

      const timeSinceEnrollment = enrollmentTimeRef.current ? Date.now() - enrollmentTimeRef.current : 0;
      if (hasFaceEnrolled && timeSinceEnrollment < 3000) return;

      recoveredFramesRef.current = 0; setRecoveredFrames(0);
      lostFramesRef.current += 1; setLostFrames(lostFramesRef.current);
      setFaceConfidenceMetric(0); setTrackingConfidence(0.0); setTimeSinceFaceSeen(faceLostDuration);

      const state: 'FACE_WARNING' | 'FACE_RECOVERY' | 'FACE_LOST' = faceLostDuration < 2.0 ? 'FACE_WARNING' : faceLostDuration < 5.0 ? 'FACE_RECOVERY' : 'FACE_LOST';
      setFaceTrackingState(state); prevTrackingStateRef.current = state;
    };

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      const activeChallengeId = currentChallenge < challenges.length ? challenges[currentChallenge].id : undefined;
      const res = await livenessAPI.processDemoFrame(base64Image, sessionId, activeChallengeId, hasFaceEnrolled ? (enrolledEmbedding || undefined) : undefined, 'enterprise');
      const data = res?.data;
      setApiResponse(data);
      if (!data) return;

      if (data.status === "cv_engine_unavailable" || data.error?.includes("CV engine not available")) {
        setModelStatus("Failed"); setError("Face detection model failed to load on the server.");
      } else {
        setModelStatus("Loaded");
        if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
      }

      if (data.result === 'pass') {
        setOverallResult('pass');
      } else if (data.result === 'fail') {
        triggerSessionTermination(data.status || 'VERIFICATION FAILED', false);
        return;
      }

      // Enterprise terminal alerts exclusively from backend
      const terminalStatuses: Record<string, string> = {
        "MULTIPLE_FACES_DETECTED": "MULTIPLE FACES DETECTED",
        "REPLAY_ATTACK_DETECTED": "REPLAY ATTACK DETECTED",
        "DEEPFAKE_SUSPECTED": "DEEPFAKE SUSPECTED",
        "CAMERA_FEED_FROZEN": "SESSION TERMINATED",
        "UNAUTHORIZED_PERSON": "UNAUTHORIZED PERSON",
        "IDENTITY_CHANGED": "UNAUTHORIZED PERSON",
        "SPOOF_DETECTED": "SPOOF DETECTED",
        "FACE_LOST": "FACE LOST"
      };

      if (data.status && data.status in terminalStatuses) {
        triggerSessionTermination(terminalStatuses[data.status], false);
        return;
      }

      // Update enterprise analytics
      if (data.enterprise_report) setEnterpriseReport(data.enterprise_report);
      if (data.face_quality !== undefined) setFaceQuality(data.face_quality * 100);
      if (data.pose_quality !== undefined) setPoseQuality(data.pose_quality * 100);
      if (data.lighting_quality !== undefined) setLightingQuality(data.lighting_quality * 100);
      if (data.landmark_geometry) setLandmarkGeometry(data.landmark_geometry);
      if (data.passive_liveness) setPassiveLiveness(data.passive_liveness);
      if (data.fraud_detection) setFraudDetection(data.fraud_detection);
      if (data.pose_validation) setPoseValidation(data.pose_validation);

      const isFacePresentAndValid = data.face_present && data.face_confidence > 0.50;
      const box = data.bbox;
      setBbox(box || null);
      if (data.ear !== undefined) setEar(data.ear);
      if (data.mar !== undefined) setMar(data.mar);
      const face_center_x = data.landmarks && data.landmarks[1] ? data.landmarks[1][0] : (box ? box.x + box.w / 2 : 0.5);
      const face_center_y = data.landmarks && data.landmarks[1] ? data.landmarks[1][1] : (box ? box.y + box.h / 2 : 0.5);
      const inside = box && Math.abs(face_center_x - 0.5) <= 0.15 && Math.abs(face_center_y - 0.5) <= 0.15;

      const isFrameValid = isFacePresentAndValid && data.detected_faces === 1 && inside &&
        (!hasFaceEnrolled || isStabilizing || (data.spoof_score < 0.45 && data.deepfake_risk < 0.30 && (data.similarity_score ?? 0) >= 0.75));

      if (isFrameValid) {
        setFaceConfidenceMetric(data.face_confidence);
        setTrackingConfidence(Math.min(1.0, data.face_confidence + 0.1));
        lostFramesRef.current = 0; setLostFrames(0);
        recoveredFramesRef.current += 1; setRecoveredFrames(recoveredFramesRef.current);
        lastFaceSeenTimeRef.current = Date.now(); setTimeSinceFaceSeen(0);

        if (data.landmarks && data.landmarks.length > 0) {
          const liveEmb = calculateFaceEmbedding(data.landmarks);
          if (liveEmb && liveEmb.length > 0) {
            setLiveEmbedding(liveEmb);
            if (enrolledEmbedding) {
              const sim = cosineSimilarity(enrolledEmbedding, liveEmb);
              similarityHistoryRef.current.push(sim);
              if (similarityHistoryRef.current.length > 15) similarityHistoryRef.current.shift();
              const smoothedSim = similarityHistoryRef.current.reduce((a, b) => a + b, 0) / similarityHistoryRef.current.length;
              setSimilarity(smoothedSim);
              setLastMatchTime(Date.now());
            }
          }
        }

        if (recoveredFramesRef.current >= 5) {
          setFaceTrackingState('FACE_PRESENT'); prevTrackingStateRef.current = 'FACE_PRESENT';
        }
        searchingForFaceStartRef.current = null;
        faceLostStartRef.current = null; setFaceMissingDuration(0); setMismatchCount(0);
        setDetectedFaces(data.detected_faces); setLandmarkCount(data.landmark_count); setConfidence(data.face_confidence);
        
        const pose = processHeadPose(data.yaw, data.raw_yaw);
        setYaw(pose.correctedYaw); setRawYaw(pose.rawYaw); setYawDirection(pose.direction);
        setPitch(data.pitch); setRoll(data.roll);
        setSpoofScore(data.spoof_score); setDeepfakeRisk(data.deepfake_risk);
        setGazeDirection(data.gaze_direction); setGazeAvailable(data.gaze_available); setFaceInsideGuide(true);
        
        setFraudDetection(data.fraud_detection);
        setRawLandmarks(data.landmarks || []);
        
        if (data.detected_faces > 1 && detectedFaces <= 1) {
          logEvent('MULTIPLE_FACES_DETECTED', { faces: data.detected_faces }, 'WARNING');
        }

        if (data.landmarks && data.landmarks[1]) {
          const nose = data.landmarks[1];
          const hist = noseHistoryRef.current;
          hist.push([nose[0], nose[1]]);
          if (hist.length > 10) hist.shift();
          if (hist.length >= 2) {
            let totalDist = 0;
            for (let i = 1; i < hist.length; i++) {
              const dx = hist[i][0] - hist[i-1][0]; const dy = hist[i][1] - hist[i-1][1];
              totalDist += Math.sqrt(dx * dx + dy * dy);
            }
            const avgDist = totalDist / (hist.length - 1);
            setDetectionStability(Math.max(0.0, Math.min(100.0, 100.0 - avgDist * 500.0)));
          }
        }

        wasBlinkingRef.current = data.blink_detected ?? false;
        if (hasFaceEnrolled) { consecutiveValidFramesRef.current += 1; setConsecutiveValidFrames(consecutiveValidFramesRef.current); }

        if (faceVisibleStartRef.current === null) { faceVisibleStartRef.current = Date.now(); setFaceVisibleDuration(0); }
        else { setFaceVisibleDuration((Date.now() - faceVisibleStartRef.current) / 1000); }

        // State machine progression
        if (currentChallenge === 0) {
          if (data.face_confidence > 0.50 && inside && data.detected_faces === 1) {
            if (!centerTimerStartedRef.current) {
              centerTimerStartedRef.current = true; centerTimerStartTimeRef.current = Date.now();
            } else {
              const centeredDur = (Date.now() - centerTimerStartTimeRef.current) / 1000;
              setFaceVisibleDuration(centeredDur);
              if (centeredDur >= 2.0) {
                setIsFacePrepared(true);
                setChallengePassed(prev => { const next = [...prev]; next[0] = true; return next; });
                currentChallengeRef.current = 1; setCurrentChallenge(1);
              }
            }
          } else { centerTimerStartedRef.current = false; setFaceVisibleDuration(0); }
        } else {
          const activeChallenge = challenges[currentChallenge];
          if (activeChallenge && data.challenge_passed) {
            setChallengePassed(prev => { const next = [...prev]; next[currentChallenge] = true; return next; });
            const nextStep = currentChallenge + 1;
            currentChallengeRef.current = nextStep; setCurrentChallenge(nextStep);
            stepStartTimeRef.current = Date.now();
            if (nextStep >= challenges.length) console.log("LIVENESS_COMPLETE");
          }
        }
      } else {
        if (searchingForFaceStartRef.current === null) searchingForFaceStartRef.current = Date.now();
        else if (Date.now() - searchingForFaceStartRef.current > 3000) searchingForFaceStartRef.current = Date.now();
        handleFrameInvalid(data);
      }
    } catch (err: any) {
      console.warn('Frame processing failed', err);
      setModelStatus("Failed");
      setError(`Failed to connect to backend biometric services.`);
      handleFrameInvalid(null);
    } finally {
      setIsProcessing(false);
    }
  }, [streaming, sessionId, hasFaceEnrolled, enrolledEmbedding, currentChallenge, challenges, isProcessing, overallResult, triggerSessionTermination, mismatchCount, isStabilizing]);

  // Animation loop
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const streamingRef = useRef(false);
  useEffect(() => { streamingRef.current = streaming; }, [streaming]);

  // Stable closure for sendFrameToBackend
  const sendFrameToBackendRef = useRef(sendFrameToBackend);
  useEffect(() => {
    sendFrameToBackendRef.current = sendFrameToBackend;
  }, [sendFrameToBackend]);

  const animationLoop = useCallback((_timestamp: number) => {
    if (!streamingRef.current) return;
    const now = Date.now();
    if (now - lastFrameTimeRef.current >= 100) { sendFrameToBackendRef.current(); lastFrameTimeRef.current = now; }
    requestRef.current = requestAnimationFrame(animationLoop);
  }, []);

  useEffect(() => {
    if (streaming) { lastFrameTimeRef.current = Date.now(); requestRef.current = requestAnimationFrame(animationLoop); }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [streaming]);

  useEffect(() => {
    if (!streaming) return;
    sessionTimeRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => { if (sessionTimeRef.current) clearInterval(sessionTimeRef.current); };
  }, [streaming]);

  useEffect(() => {
    if (!streaming || overallResult || !hasFaceEnrolled || currentChallenge >= challenges.length) return;
    timerRef.current = setInterval(() => {
      setChallengeTimer(t => { if (t <= 1) return 30; return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [streaming, currentChallenge, challenges, hasFaceEnrolled, overallResult]);

  // Removed frontend face and spoof logic. Backend enforces MULTIPLE_FACES_DETECTED and SPOOF_DETECTED

  // Analytics logging
  useEffect(() => {
    if (overallResult) {
      import('@/lib/api').then(({ analyticsAPI }) => {
        let status = overallResult === 'pass' ? 'VERIFIED' : 'FAILED';
        if (terminationReason?.includes('Timeout') || terminationReason?.includes('Lost') || terminationReason === 'No face detected') status = 'NO FACE DETECTED';
        else if (spoofScore > 0.45) status = 'SPOOF ATTEMPT';
        else if (terminationReason?.includes('Mismatch')) status = 'FAILED';

        analyticsAPI.logVerificationEvent({
          apiType: 'Enterprise', status,
          confidence: confidence || 0.95, processingTimeMs: sessionTime ? sessionTime * 1000 : 2500,
          spoofFlag: spoofScore > 0.45, faceDetectedFlag: faceTrackingState !== 'FACE_LOST',
          identityMatchedFlag: overallResult === 'pass',
          attentionScore: gazeAvailable ? 0.95 : (overallResult === 'pass' ? 0.9 : 0.4),
          user: user?.name || 'Unknown User',
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : /Tablet|iPad/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop'
        }).catch(console.error);
      });
    }
  }, [overallResult]);

  async function startCamera() {
    setError(null); faceVisibleStartRef.current = null; setFaceVisibleDuration(0);
    setSessionTime(0); setOverallResult(null); setSessionTerminated(false); setTerminationReason('');
    setModelStatus('Loading'); faceDetectionHistoryRef.current = []; similarityHistoryRef.current = [];
    setMismatchCount(0); setShowReport(false);
    if (typeof window !== 'undefined') sessionStorage.removeItem('mv_mismatch_count');
    consecutiveValidFramesRef.current = 0; currentChallengeRef.current = 0; setConsecutiveValidFrames(0);
    setFaceTrackingState('FACE_PRESENT'); prevTrackingStateRef.current = 'FACE_PRESENT';
    setLostFrames(0); setRecoveredFrames(0); setTimeSinceFaceSeen(0);
    setLiveEmbedding([]); setLastMatchTime(null);
    lastFaceSeenTimeRef.current = null; lostFramesRef.current = 0; recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0); setTrackingConfidence(1.0);
    setEnterpriseReport(null); setFaceQuality(0); setPoseQuality(0); setLightingQuality(0);
    setLandmarkGeometry(null); setPassiveLiveness(null); setFraudDetection(null); setPoseValidation(null);

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => {
      if (modelStatus === 'Loading' || !streaming) {
        setModelStatus('Failed'); setError('Biometric services failed to respond within 5 seconds.'); stopCamera();
      }
    }, 5000);

    try {
      const sessionRes = await livenessAPI.startSession('enterprise');
      setSessionId(sessionRes.data.session_id);
      setChallenges(sessionRes.data.challenges);
      setChallengePassed(new Array(sessionRes.data.challenges.length).fill(false));
      setCurrentChallenge(0); setChallengeTimer(30);
    } catch (e: any) {
      setError(`Failed to initialize secure verification session with backend.`);
      setModelStatus('Failed');
      if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      if (stream && stream.active) { setCameraStatus('Active'); } else throw new Error("No active stream");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (err) {
      setCameraStatus('Inactive'); setError('Camera access denied.');
      if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
      setModelStatus('Failed');
    }
  }

  function stopCamera() {
    if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setStreaming(false); setCameraStatus('Inactive'); setOverallResult(null); setConfidence(0); setSimilarity(0);
    faceDetectionHistoryRef.current = []; similarityHistoryRef.current = [];
    setGazeDirection(null); setGazeAvailable(false); setFaceInsideGuide(false);
    faceVisibleStartRef.current = null; setFaceVisibleDuration(0); setChallenges([]); setChallengePassed([]);
    setSessionTerminated(false); setTerminationReason(''); setShowReport(false);
    setFaceTrackingState('FACE_PRESENT'); prevTrackingStateRef.current = 'FACE_PRESENT';
    setLostFrames(0); setRecoveredFrames(0); setTimeSinceFaceSeen(0);
    setLiveEmbedding([]); setLastMatchTime(null); setRawYaw(0); setYawDirection('CENTER');
    setYaw(0); setPitch(0); setRoll(0);
    lastFaceSeenTimeRef.current = null; lostFramesRef.current = 0; recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0); setTrackingConfidence(1.0);
    setEnterpriseReport(null); setFaceQuality(0); setPoseQuality(0); setLightingQuality(0);
    setLandmarkGeometry(null); setPassiveLiveness(null); setFraudDetection(null); setPoseValidation(null);
  }

  const enrollFace = async () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setEnrolling(true);
    try {
      canvas.width = 320; canvas.height = 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.80);
      setEnrollmentSnapshot(base64Image);
      const res = await livenessAPI.enrollFace(base64Image, undefined, sessionId);
      if (res.data && res.data.embedding_vector) {
        setIsStabilizing(true);
        setEnrolledEmbedding(res.data.embedding_vector);
        localStorage.setItem('enrolledEmbedding', JSON.stringify(res.data.embedding_vector));
        localStorage.setItem('mv_enrolled_signature', JSON.stringify(res.data.embedding_vector));
        await refreshUser();
        setTimeout(() => { setIsStabilizing(false); }, 1000);
      } else {
        alert("Failed to enroll face: Invalid response from backend");
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      alert(apiErr.response?.data?.detail || "Failed to enroll face");
    } finally { setEnrolling(false); }
  };

  const clearEnrollment = async () => {
    setEnrolledEmbedding(null);
    localStorage.removeItem('enrolledEmbedding'); localStorage.removeItem('mv_enrolled_signature');
    setSimilarity(0); similarityHistoryRef.current = []; setConsecutiveValidFrames(0);
    await refreshUser();
  };

  type EnterpriseState = 'FACE_DETECTED' | 'FACE_ENROLLED' | 'IDENTITY_MATCHED' | 'CHALLENGES_COMPLETED' | 'AUTHENTICATED';
  const enterpriseState = useMemo<EnterpriseState | null>(() => {
    if (!streaming || sessionTerminated) return null;
    const isFaceDetected = confidence > 0.50 && detectedFaces === 1 && faceInsideGuide;
    if (!isFaceDetected) return null;
    if (!hasFaceEnrolled) return 'FACE_DETECTED';
    if (similarity < 0.75) return 'FACE_ENROLLED';
    const isChallengesCompleted = challengePassed.length > 0 && challengePassed.every(Boolean);
    if (!isChallengesCompleted) return 'IDENTITY_MATCHED';
    const isAuthenticated = isChallengesCompleted && confidence > 0.50 && detectedFaces === 1 && faceInsideGuide && spoofScore < 0.45 && deepfakeRisk < 0.30 && similarity >= 0.75;
    if (isAuthenticated) return 'AUTHENTICATED';
    return 'CHALLENGES_COMPLETED';
  }, [streaming, sessionTerminated, confidence, detectedFaces, faceInsideGuide, hasFaceEnrolled, similarity, challengePassed, spoofScore, deepfakeRisk]);

  const isVerified = overallResult === 'pass';

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const accentColor = sessionTerminated ? '#ff3366' : isVerified ? '#00ff88' : '#00d4ff';

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Navbar />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(0, 212, 255, 0.1)', borderTopColor: '#00d4ff' }} />
        <p style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>Verifying session...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <PageTransition>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '128px 20px 60px' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 600, letterSpacing: '0.08em' }}>ENTERPRISE IDENTITY API</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>POST /api/v1/identity/verify</div>
            </div>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
              Enterprise Identity <span className="gradient-text-green">Engine</span>
            </h1>
            <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 500 }}>
              Multi-layer biometric verification with advanced embeddings, fraud detection, passive liveness, and continuous identity monitoring.
            </p>
          </div>
          <div className="text-left sm:text-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                onClick={() => setIsDeveloperMode(!isDeveloperMode)} 
                style={{ 
                  background: isDeveloperMode ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)', 
                  color: isDeveloperMode ? '#00ff88' : '#94a3b8', 
                  border: `1px solid ${isDeveloperMode ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.1)'}`, 
                  padding: '6px 12px', 
                  borderRadius: 20, 
                  fontSize: 11, 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Developer Mode: {isDeveloperMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#00ff88' }}>99.9%</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Enterprise Accuracy</div>
            </div>
          </div>
        </div>

        {/* Enrollment Alert */}
        {!hasFaceEnrolled && (
          <div className="glass" style={{ padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} color="#ffb800" />
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffb800', marginBottom: 3 }}>Biometric Enrollment Required</h3>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                Start the camera, align your face inside the oval, and click <strong>Enroll Current Face</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid: Full Width Camera, Metrics Below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* CENTER — Camera Feed */}
          <div className="lg:col-span-12">
            <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#0a0a0a', border: `1px solid ${accentColor}22`, aspectRatio: '4/3' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: streaming ? 'block' : 'none', transform: 'scaleX(-1)' }} muted playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Developer Ecosystem Components */}
              {streaming &&  (
                <>
                  <CameraCanvasOverlay
                    landmarks={rawLandmarks}
                    bbox={bbox}
                    yaw={yaw}
                    pitch={pitch}
                    roll={roll}
                    trackingState={faceTrackingState}
                    videoWidth={videoRef.current?.videoWidth || 640}
                    videoHeight={videoRef.current?.videoHeight || 480}
                  />
                  <AdvancedDebugPanel
                    telemetry={{
                      cameraStatus: cameraStatus || 'Active', detectedFaces, trackingState: faceTrackingState, landmarkCount,
                      ear, blinkDetected: wasBlinkingRef.current, mar, mouthOpen: mar > 0.3,
                      yaw, pitch, roll, confidence, identityScore: similarity, cosineSimilarity: similarity,
                      livenessScore: 1 - spoofScore, spoofScore, deepfakeRisk: fraudDetection?.deepfake?.confidence || 0,
                      currentChallenge: challenges[currentChallenge]?.label || 'Complete',
                      challengeProgress: 0, challengeTimeout: challengeTimer,
                      processingTime, apiVersion: 'API 3 (Enterprise)', verificationState: overallResult || 'processing',
                      fraudDetection, bbox
                    }}
                    onDownloadReport={() => downloadLogs({ overallResult })}
                  />
                  <TestModeMatrix telemetry={{ detectedFaces, bbox, fraudDetection, confidence, identityScore: similarity }} />
                </>
              )}

              {/* Error overlay */}
              {streaming && error && (
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,51,102,0.9)', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 30 }}>
                  <AlertCircle size={14} /><span>{error}</span>
                </div>
              )}

              {/* 3D landmark overlay */}
              {streaming && isMounted && apiResponse?.landmarks && (
                <Biometric3DOverlay landmarks={apiResponse.landmarks} isVerified={isVerified} sessionTerminated={sessionTerminated} />
              )}

              {/* Scanner overlay */}
              {streaming && !overallResult && (
                <BiometricScannerOverlay
                  faceInside={faceInsideGuide} confidence={confidence} detectedFaces={detectedFaces} bbox={bbox} ear={ear} mar={mar}
                  challengeLabel={
                    detectedFaces > 1 ? 'MULTIPLE FACES' :
                    faceTrackingState === 'FACE_WARNING' ? 'TEMPORARILY LOST' :
                    faceTrackingState === 'FACE_RECOVERY' ? 'SEARCHING FOR FACE' :
                    landmarkCount === 0 ? 'SEARCHING FOR FACE' :
                    confidence < 0.50 ? 'CONFIDENCE LOW' :
                    !faceInsideGuide ? 'ALIGN FACE INSIDE OVAL' :
                    faceVisibleDuration < 2.0 ? `ACQUIRING SIGNAL (${Math.min(100, Math.round(faceVisibleDuration * 50))}%)` :
                    !hasFaceEnrolled ? 'READY TO ENROLL' :
                    `ENTERPRISE SCAN: CHALLENGE ${challengeTimer}s`
                  }
                  themeColor="#00ff88"
                />
              )}

              {/* Gaze crosshair */}
              {streaming && !overallResult && gazeAvailable && gazeDirection && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
                  <motion.div animate={{ left: `${(1.0 - gazeDirection.x) * 100}%`, top: `${gazeDirection.y * 100}%` }}
                    style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#00ff8844', border: '1px solid #00ff88', transform: 'translate(-50%, -50%)' }} />
                </div>
              )}

              {/* Idle state */}
              {!streaming && !overallResult && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}>
                    <Fingerprint size={64} color="#00ff88" strokeWidth={1} />
                  </motion.div>
                  <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', maxWidth: 260 }}>Enterprise Advanced Identity Verification Engine</p>
                  <button onClick={startCamera} style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #00ff88, #00cc66)', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={16} /> Initialize Biometric Scan
                  </button>
                </div>
              )}

              {/* Verification Complete overlay */}
              {overallResult && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 30 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    {overallResult === 'pass' ? (
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,255,136,0.15)', border: '3px solid #00ff88', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={40} color="#00ff88" />
                      </div>
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,51,102,0.15)', border: '3px solid #ff3366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={40} color="#ff3366" />
                      </div>
                    )}
                  </motion.div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: overallResult === 'pass' ? '#00ff88' : '#ff3366', marginTop: 16 }}>
                    {overallResult === 'pass' ? 'IDENTITY VERIFIED' : sessionTerminated ? terminationReason.toUpperCase() : 'VERIFICATION FAILED'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Session: {formatTime(sessionTime)}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    {overallResult === 'pass' && (
                      <button onClick={() => setShowReport(true)} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} /> View Report
                      </button>
                    )}
                    <button onClick={() => { stopCamera(); startCamera(); }} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={14} /> New Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enrollment Controls */}
            {streaming && !overallResult && (
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                {!hasFaceEnrolled ? (
                  <button onClick={enrollFace} disabled={enrolling || confidence < 0.5 || !faceInsideGuide}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: enrolling ? 'rgba(100,100,100,0.3)' : 'linear-gradient(135deg, #00ff88, #00cc66)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: enrolling || confidence < 0.5 ? 'not-allowed' : 'pointer', opacity: confidence < 0.5 ? 0.5 : 1 }}>
                    {enrolling ? 'Enrolling...' : 'Enroll Current Face'}
                  </button>
                ) : (
                  <>
                    <button onClick={clearEnrollment} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Clear Enrollment
                    </button>
                    <button onClick={stopCamera} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(100,100,100,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* LEFT SIDEBAR — Security Metrics */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Identity Score */}
              <div className="glass" style={{ padding: 16, borderRadius: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>IDENTITY MATCH</div>
                <IdentityScoreRing score={similarity * 100} label="Match" size={120} />
              </div>

              {/* Threat Radar */}
              { (
                <div className="glass" style={{ padding: 14, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThreatRadarWidget spoofScore={spoofScore} color={spoofScore > 0.3 ? '#ff3366' : '#00ff88'} />
                </div>
              )}
            </div>

            {/* Security Metrics */}
            { (
              <div className="glass" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>ENTERPRISE SECURITY</div>
              <MetricBar label="Confidence" value={confidence * 100} />
              <MetricBar label="Face Quality" value={faceQuality} />
              <MetricBar label="Pose Quality" value={poseQuality} />
              <MetricBar label="Lighting" value={lightingQuality * 100} />
              <MetricBar label="Liveness" value={(passiveLiveness?.score ?? 0) * 100} />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>RISK SCORE</span>
                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: spoofScore < 0.2 ? '#00ff88' : spoofScore < 0.4 ? '#ffb800' : '#ff3366' }}>
                  {(spoofScore * 100).toFixed(1)}%
                </span>
              </div>
              </div>
            )}

            {/* Session Shield */}
            { (
              <div className="glass" style={{ padding: 14, borderRadius: 14, textAlign: 'center' }}>
                <SessionShield authenticated={isVerified} invalidated={sessionTerminated} color={accentColor} />
                <div style={{ fontSize: 10, color: accentColor, fontWeight: 600, marginTop: 4 }}>
                  {sessionTerminated ? 'SESSION INVALIDATED' : isVerified ? 'AUTHENTICATED' : streaming ? 'VERIFYING' : 'STANDBY'}
                </div>
                <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 4 }}>
                  {formatTime(sessionTime)}
                </div>
              </div>
            )}
          
            
            {/* Challenge Progress */}
            <div className="glass" style={{ padding: 16, borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>CHALLENGE SEQUENCE</div>
                <div style={{ fontSize: 11, color: '#00d4ff', fontWeight: 700, fontFamily: 'monospace' }}>{challengeProgress}%</div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
                <motion.div animate={{ width: `${challengeProgress}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00d4ff, #00ff88)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {challenges.map((ch, i) => (
                  <CheckBadge key={ch.id} label={`${ch.icon} ${ch.label}`} passed={challengePassed[i]} checking={i === currentChallenge && streaming && !overallResult} />
                ))}
              </div>
            </div>

            {/* Fraud Detection Panel */}
            { (
              <div className="glass" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>FRAUD DETECTION</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FraudCheckItem label="Printed Photo" detected={fraudDetection?.printed_photo?.detected ?? false} icon="🖼️" />
                <FraudCheckItem label="Replay Attack" detected={fraudDetection?.replay_attack?.detected ?? false} icon="📱" />
                <FraudCheckItem label="Deepfake" detected={fraudDetection?.deepfake?.detected ?? false} icon="🤖" />
                <FraudCheckItem label="AI Generated" detected={fraudDetection?.ai_generated?.detected ?? false} icon="🧠" />
                <FraudCheckItem label="Screen Reflect" detected={fraudDetection?.screen_reflection?.detected ?? false} icon="💡" />
                <FraudCheckItem label="Mask Attack" detected={fraudDetection?.mask_attack?.detected ?? false} icon="🎭" />
                <FraudCheckItem label="Cropped Face" detected={fraudDetection?.cropped_face?.detected ?? false} icon="✂️" />
                <FraudCheckItem label="Multi-Face" detected={(detectedFaces > 1)} icon="👥" />
              </div>
              {fraudDetection && (
                <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>THREAT LEVEL</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: fraudDetection.threat_level === 'CRITICAL' ? '#ff3366' : fraudDetection.threat_level === 'HIGH' ? '#ff6633' : fraudDetection.threat_level === 'MEDIUM' ? '#ffb800' : '#00ff88' }}>
                    {fraudDetection.threat_level}
                  </span>
                </div>
              )}
              </div>
            )}

            {/* Verification Timeline */}
            { (
              <div className="glass" style={{ padding: 16, borderRadius: 14 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>VERIFICATION TIMELINE</div>
              <VerificationTimeline stages={[
                { label: 'Face Detection', complete: detectedFaces > 0 && confidence > 0.5, active: streaming && detectedFaces === 0 },
                { label: 'Biometric Enrollment', complete: hasFaceEnrolled, active: streaming && !hasFaceEnrolled && detectedFaces > 0 },
                { label: 'Identity Matching', complete: similarity >= 0.75, active: hasFaceEnrolled && similarity < 0.75 },
                { label: 'Challenge Verification', complete: challengePassed.length > 0 && challengePassed.every(Boolean), active: similarity >= 0.75 && !challengePassed.every(Boolean) },
                { label: 'Authenticated', complete: isVerified, active: challengePassed.every(Boolean) && !isVerified },
              ]} />
              </div>
            )}

            {/* Landmark Geometry */}
            { landmarkGeometry && landmarkGeometry.regions && (
              <div className="glass" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>LANDMARK GEOMETRY</div>
                <MetricBar label="Eye Geometry" value={landmarkGeometry.regions.eye_geometry * 100} />
                <MetricBar label="Nose Geometry" value={landmarkGeometry.regions.nose_geometry * 100} />
                <MetricBar label="Jaw Shape" value={landmarkGeometry.regions.jaw_shape * 100} />
                <MetricBar label="Mouth Geometry" value={landmarkGeometry.regions.mouth_geometry * 100} />
                <MetricBar label="Proportions" value={landmarkGeometry.regions.face_proportions * 100} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Report Modal */}
      <AnimatePresence>
        {showReport && enterpriseReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowReport(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto', background: 'rgba(15,15,25,0.95)', borderRadius: 20, border: '1px solid rgba(0,255,136,0.2)', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>SECURE VERIFICATION REPORT</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>{enterpriseReport.identity_status}</div>
                </div>
                <button onClick={() => setShowReport(false)} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Identity Match', value: `${enterpriseReport.identity_match_pct.toFixed(2)}%`, color: '#00ff88' },
                  { label: 'Confidence', value: `${enterpriseReport.confidence_pct.toFixed(2)}%`, color: '#00d4ff' },
                  { label: 'Liveness', value: `${enterpriseReport.liveness_pct.toFixed(2)}%`, color: '#00ff88' },
                  { label: 'Spoof Probability', value: `${enterpriseReport.spoof_probability_pct.toFixed(2)}%`, color: enterpriseReport.spoof_probability_pct > 20 ? '#ff3366' : '#00ff88' },
                  { label: 'Fraud Score', value: `${enterpriseReport.fraud_score.toFixed(2)}%`, color: enterpriseReport.fraud_score > 20 ? '#ff3366' : '#00ff88' },
                  { label: 'Risk Score', value: `${enterpriseReport.risk_score.toFixed(2)}%`, color: enterpriseReport.risk_score > 30 ? '#ffb800' : '#00ff88' },
                  { label: 'Quality Score', value: `${enterpriseReport.quality_score.toFixed(2)}%`, color: '#00d4ff' },
                  { label: 'Verification Time', value: `${(sessionTime)}s`, color: '#94a3b8' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Fraud Detection Summary */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>FRAUD DETECTION SUMMARY</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {Object.entries(enterpriseReport.fraud_detection).map(([key, detected]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: detected ? '#ff3366' : '#475569' }}>
                      {detected ? <XCircle size={10} color="#ff3366" /> : <CheckCircle size={10} color="#00ff88" />}
                      {key.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Passive Liveness */}
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>PASSIVE LIVENESS</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Blink', ok: enterpriseReport.passive_liveness.blink_detected },
                    { label: 'Head Motion', ok: enterpriseReport.passive_liveness.head_motion },
                    { label: 'Depth Valid', ok: enterpriseReport.passive_liveness.depth_valid },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: item.ok ? '#00ff88' : '#475569' }}>
                      {item.ok ? <CheckCircle size={10} color="#00ff88" /> : <XCircle size={10} color="#475569" />}
                      {item.label}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#00d4ff', fontFamily: 'monospace' }}>
                  Score: {enterpriseReport.passive_liveness.score.toFixed(1)}%
                </div>
              </div>

              <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', textAlign: 'center', marginTop: 8 }}>
                Session: {sessionId.slice(0, 8)}... | Threat Level: {enterpriseReport.threat_level} | {new Date().toISOString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </PageTransition>
    </ProtectedRoute>
  );
}
