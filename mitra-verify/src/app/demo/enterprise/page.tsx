'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Fingerprint, AlertTriangle, CheckCircle, Lock, XCircle, Shield, AlertCircle, RefreshCw, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { livenessAPI, checkHealth, getApiBaseUrl, parseNetworkError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { processHeadPose } from '@/lib/headPose';
import dynamic from 'next/dynamic';
import PageTransition from '@/components/cyber/PageTransition';
import BiometricScannerOverlay from '@/components/cyber/BiometricScannerOverlay';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useDiagnosticLogger } from '@/components/developer/useDiagnosticLogger';
const AdvancedDebugPanel = dynamic(() => import('@/components/developer/AdvancedDebugPanel').then(mod => mod.AdvancedDebugPanel), { ssr: false });
const CameraCanvasOverlay = dynamic(() => import('@/components/developer/CameraCanvasOverlay').then(mod => mod.CameraCanvasOverlay), { ssr: false });
const TestModeMatrix = dynamic(() => import('@/components/developer/TestModeMatrix').then(mod => mod.TestModeMatrix), { ssr: false });
const TelemetryPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.TelemetryPanel), { ssr: false });
const FaceTrackingPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.FaceTrackingPanel), { ssr: false });
const EyeTrackingPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.EyeTrackingPanel), { ssr: false });
const IdentityPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.IdentityPanel), { ssr: false });
const AntiSpoofPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.AntiSpoofPanel), { ssr: false });
const SecurityEventsLog = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.SecurityEventsLog), { ssr: false });
const HexThreatRadar = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.HexThreatRadar), { ssr: false });
const FaceQualityPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.FaceQualityPanel), { ssr: false });
const AuthTimeline = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.AuthTimeline), { ssr: false });
const HeadMovementPanel = dynamic(() => import('@/components/enterprise/panels').then(mod => mod.HeadMovementPanel), { ssr: false });
const Biometric3DOverlay = dynamic(() => import('@/components/Biometric3DOverlay'), { ssr: false });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const HeadPose3DWidget = dynamic(() => import('@/components/HeadPose3DWidget'), { ssr: false });


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
  // New enterprise telemetry fields
  eye_tracking?: {
    left_direction: string;
    right_direction: string;
    horizontal_gaze: number;
    vertical_gaze: number;
    eye_openness_left: number;
    eye_openness_right: number;
    blink_probability: number;
  };
  face_tracking?: {
    state: string;
    face_present: boolean;
    face_locked: boolean;
    tracking_stable: boolean;
    tracking_confidence: number;
    frame_quality: number;
    face_size: number;
    face_distance: number;
  };
  anti_spoof_details?: {
    texture_score: number;
    reflection_score: number;
    moire_score: number;
    motion_consistency: number;
    landmark_stability: number;
    face_warp: number;
    depth_consistency: number;
    overall_spoof_risk: number;
  };
  telemetry?: {
    detection_confidence: number;
    face_confidence: number;
    embedding_quality: number;
    embedding_dimension: number;
    inference_time_ms: number;
    frame_processing_time_ms: number;
    identity_matching_time_ms: number;
  };
  identity_match?: number;
  liveness_score?: number;
  risk_score?: number;
  enrollment_progress?: {
    active: boolean;
    state: 'IDLE' | 'COLLECTING' | 'COVERAGE_INCOMPLETE' | 'READY';
    frame_sequence_id: number;
    valid_frames: number;
    required_frames: number;
    rejected_frames: number;
    last_reject_reason: string | null;
    pose_coverage: string[];
    expression_coverage: string[];
    missing_poses?: string[];
    missing_expressions?: string[];
    ready: boolean;
    quality_pass: boolean;
  };
  // Continuous liveness verification fields
  liveness_status?: string;
  liveness_warning?: string | null;
  result?: string;
  sequence_advanced?: boolean;
  current_challenge_index?: number;
  sequence_complete?: boolean;
  time_remaining?: number;
  active_challenge?: { id: string; label: string; instruction: string; icon: string } | null;
}

// ─────────────────────────────────────────────────────────────
// PREMIUM UI COMPONENTS
// ─────────────────────────────────────────────────────────────

   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <div style={{ fontSize: Math.max(18, size / 5), fontWeight: 800, color: displayColor, fontFamily: 'monospace' }}>{Number(score || 0).toFixed(1)}%</div>
        <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
function MetricBar({ label, value, max = 100, color = '#00ff88', suffix = '%' }: { label: string; value: number; max?: number; color?: string; suffix?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const barColor = pct >= 80 ? '#00ff88' : pct >= 50 ? '#ffb800' : '#ff3366';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: barColor, fontWeight: 700, fontFamily: 'monospace' }}>{Number(value || 0).toFixed(1)}{suffix}</span>
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          {Number((spoofScore * 100) || 0).toFixed(0)}%
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
  const [currentApiBase, setCurrentApiBase] = useState<string>('');

  // Developer Ecosystem Hooks
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logs, logEvent, downloadLogs, interpretSpoof } = useDiagnosticLogger();
  const [rawLandmarks, setRawLandmarks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [processingTime, setProcessingTime] = useState(0);

  // Debug HUD overlay additions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [diagnosticInfo, setDiagnosticInfo] = useState<{ url: string; status: number | string; body: string; reason?: string } | null>(null);

  useEffect(() => {
    async function performHealthCheck() {
      try {
        const baseUrl = await getApiBaseUrl();
        setCurrentApiBase(baseUrl);
        const res = await checkHealth();
        if (res.data && res.data.status === 'ok') {
          setBackendHealthy(true);
        } else {
          setBackendHealthy(false);
          setDiagnosticInfo({ url: `${baseUrl}/health`, status: res.status || 'unknown', body: JSON.stringify(res.data), reason: 'Health endpoint returned non-ok status' });
        }
      } catch (err: any) {
        console.warn('Backend health check failed', err);
        setBackendHealthy(false);
        const baseUrl = await getApiBaseUrl().catch(() => 'unknown-url');
        setCurrentApiBase(baseUrl);
        setDiagnosticInfo({ url: `${baseUrl}/health`, status: err.response?.status || 'network_error', body: err.response ? JSON.stringify(err.response.data) : (err.message || 'Connection Refused'), reason: parseNetworkError(err, `${baseUrl}/health`) });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rawYaw, setRawYaw] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [passiveLiveness, setPassiveLiveness] = useState<BiometricResponse['passive_liveness'] | null>(null);
  const [fraudDetection, setFraudDetection] = useState<BiometricResponse['fraud_detection'] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [poseValidation, setPoseValidation] = useState<BiometricResponse['pose_validation'] | null>(null);

  // Enterprise telemetry state
  const [eyeTracking, setEyeTracking] = useState<BiometricResponse['eye_tracking'] | null>(null);
  const [faceTracking, setFaceTracking] = useState<BiometricResponse['face_tracking'] | null>(null);
  const [antiSpoofDetails, setAntiSpoofDetails] = useState<BiometricResponse['anti_spoof_details'] | null>(null);
  const [telemetryData, setTelemetryData] = useState<BiometricResponse['telemetry'] | null>(null);
  const [securityEvents, setSecurityEvents] = useState<{time: string; event: string; status: 'secure' | 'warning' | 'critical'}[]>([]);
  const [verificationCount, setVerificationCount] = useState(0);
  const [unauthorizedAttempts, setUnauthorizedAttempts] = useState(0);
  const fpsCounterRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const [currentFps, setCurrentFps] = useState(0);

  // Enrollment states
    type Phase = 'IDLE' | 'ENROLLMENT' | 'ENROLLING' | 'ENROLLED' | 'COLLECTING' | 'COVERAGE_INCOMPLETE' | 'READY' | 'IDENTITY_VERIFYING' | 'IDENTITY_VERIFIED' | 'LIVENESS_CHALLENGES' | 'LIVENESS_VERIFIED' | 'ACCESS_GRANTED' | 'CONTINUOUS_MONITORING' | 'ACCESS_REVOKED' | 'FAILED';
  const [phase, setPhase] = useState<Phase>('IDLE');
  const phaseRef = useRef<Phase>('IDLE');
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const sessionGenerationRef = useRef<number>(0);
  const [enrolling, setEnrolling] = useState(false);
  
        const enrollRequestInFlightRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string>('');
  const lastSequenceIdRef = useRef<number>(-1);
  const [isStabilizing, setIsStabilizing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enrollmentSnapshot, setEnrollmentSnapshot] = useState<string | null>(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState<BiometricResponse['enrollment_progress'] | null>(null);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);

  // Sync refs with state to prevent stale closures
    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastMismatchIncrementRef = useRef<number>(0);

  // Consecutive frame verification & warnings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [consecutiveValidFrames, setConsecutiveValidFrames] = useState(0);
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [faceMissingDuration, setFaceMissingDuration] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [detectionStability, setDetectionStability] = useState(95.0);
  const noseHistoryRef = useRef<[number, number][]>([]);

  // Challenge sequence states
  const [challenges, setChallenges] = useState<{ id: string; label: string; instruction: string; icon: string }[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengePassed, setChallengePassed] = useState<boolean[]>([]);
  const challengeProgress = challenges.length > 0 ? Math.round((currentChallenge / challenges.length) * 100) : 0;
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [overallResult, setOverallResult] = useState<'pass' | 'fail' | null>(null);

  // State machine steps
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFacePrepared, setIsFacePrepared] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  const consecutiveValidFramesRef = useRef(0);
  const currentChallengeRef = useRef(0);

  // Visibility & Alignment states
  const faceVisibleStartRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transitioningRef = useRef(false);

  const [cameraStatus, setCameraStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [modelStatus, setModelStatus] = useState<'Loading' | 'Loaded' | 'Failed'>('Loading');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [faceConfidenceMetric, setFaceConfidenceMetric] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [trackingConfidence, setTrackingConfidence] = useState(1.0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lostFrames, setLostFrames] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recoveredFrames, setRecoveredFrames] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeSinceFaceSeen, setTimeSinceFaceSeen] = useState(0);


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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const now = Date.now();
      // Removed local challenge timeout logic. Backend handles challenge timeout / face lost states.
    }, 100);
    return () => clearInterval(interval);
  }, [streaming, overallResult, challenges.length, currentChallenge]);
  useEffect(() => { const t = setTimeout(() => setIsMounted(true), 0); return () => clearTimeout(t); }, []);

  const triggerSessionTermination = useCallback((reason: string) => {
    setSessionTerminated(true);
    setTerminationReason(reason);
    setOverallResult('fail');
    
    let eventType = 'SESSION_TERMINATED';
    let isSecurityEvent = false;
    const normReason = reason.toLowerCase();
    
    if (normReason.includes('multiple faces')) {
      eventType = 'MULTIPLE_FACE';
      isSecurityEvent = true;
    } else if (normReason.includes('spoof') || normReason.includes('replay') || normReason.includes('photo') || normReason.includes('deepfake')) {
      eventType = 'SPOOF_DETECTED';
      isSecurityEvent = true;
    } else if (normReason.includes('unauthorized') || normReason.includes('identity changed') || normReason.includes('mismatch')) {
      eventType = 'IDENTITY_MISMATCH';
      isSecurityEvent = true;
    } else if (normReason.includes('corrupt') || normReason.includes('invalid enrollment')) {
      eventType = 'CORRUPTED';
      isSecurityEvent = true;
    } else if (normReason.includes('face lost') || normReason.includes('no face') || normReason.includes('searching_for_face')) {
      eventType = 'NO_FACE_DETECTED';
    } else if (normReason.includes('frozen') || normReason.includes('camera lost') || normReason.includes('camera feed frozen')) {
      eventType = 'CAMERA_LOST';
    }
    
    livenessAPI.logEvent(sessionId, eventType, 'enterprise').catch(console.error);

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);

    if (isSecurityEvent) {
      setTimeout(() => { logout('/signin?reason=security_breach'); }, 3000);
    }
  }, [logout, sessionId]);

  const [isMonitoring, setIsMonitoring] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [monitoringAudit, setMonitoringAudit] = useState<{time: string, event: string, status: string}[]>([]);

  // Load enrollment status
  useEffect(() => {
    const loadEnrolled = async () => {
      try {
        const res = await livenessAPI.getEnrolledFace();
        if (res.data && res.data.enrolled) {
          // Found server-side enrolled identity
          setHasFaceEnrolled(true);
        }
      } catch (e) { console.warn('Failed to fetch enrolled face from backend', e); }
    };
    loadEnrolled();
  }, []);

  const isMonitoringRef = useRef(false);
  useEffect(() => { isMonitoringRef.current = isMonitoring; }, [isMonitoring]);

  // Frame processor
  const sendFrameToBackend = useCallback(async () => {
    const currentGeneration = sessionGenerationRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming || isProcessing || (overallResult && !isMonitoring)) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsProcessing(true);

    const videoRatio = video.videoWidth / video.videoHeight;
    canvas.width = 320;
    canvas.height = 320 / videoRatio;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    fpsCountRef.current++;
    if (now - lastFpsTime.current >= 1000) { fpsCountRef.current = 0; lastFpsTime.current = now; }

    const handleFrameInvalid = (data: BiometricResponse | null) => {
      if (!data || !data.face_present || data.detected_faces === 0 || data.landmark_count === 0) {
        // BUG 7 FIX: Only set FACE_LOST tracking state if past enrollment phase.
        // During enrollment, brief face drops (blinks, head movement) are normal
        // and shouldn't trigger the alarming FACE_LOST UI state.
        const isPostEnrollment = ['LIVENESS_CHALLENGES', 'CONTINUOUS_MONITORING', 'ACCESS_GRANTED', 'ACCESS_REVOKED'].includes(phaseRef.current);
        if (isPostEnrollment) {
          setFaceTrackingState('FACE_LOST');
          prevTrackingStateRef.current = 'FACE_LOST';
        }
        setDetectedFaces(0); setLandmarkCount(0); setConfidence(0);
        setRawLandmarks([]); // FIX: Clear raw landmarks to fix rendering desync
        setGazeDirection(null); setGazeAvailable(false); setFaceInsideGuide(false);
        faceVisibleStartRef.current = null; setFaceVisibleDuration(0); setSimilarity(0);
        setConsecutiveValidFrames(0); noseHistoryRef.current = []; setDetectionStability(0.0);
        
        const faceLostDuration = faceLostStartRef.current ? (Date.now() - faceLostStartRef.current) / 1000 : 0;
        if (faceLostStartRef.current === null) faceLostStartRef.current = Date.now();
        if (isMonitoring && faceLostDuration > 10.0) {
          triggerSessionTermination('Session Timeout (Face Lost)');
        }
      } else {
        setFaceTrackingState('FACE_PRESENT');
        prevTrackingStateRef.current = 'FACE_PRESENT';
        faceLostStartRef.current = null;
      }
    };

    try {
      if (currentGeneration !== sessionGenerationRef.current) { setIsProcessing(false); return; }
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      const activeChallengeId = phaseRef.current === 'CONTINUOUS_MONITORING' ? 'monitoring' : 
                                (currentChallenge >= challenges.length && challenges.length > 0) ? 'liveness_verified' : 
                                (phaseRef.current === 'LIVENESS_CHALLENGES' ? challenges[currentChallenge]?.id : undefined);
                                
      if (phaseRef.current === 'ENROLLMENT') {
        console.log(`[ENROLL FRONTEND]\nphase=${phaseRef.current}\nframeNumber=${fpsCounterRef.current}\nrequestStarted=${Date.now()}\nrequestCompleted=pending\nresponseReceived=pending\nresponseState=pending\nprogress=pending`);
      }
      
      const reqStart = Date.now();
      const res = await livenessAPI.processDemoFrame(base64Image, sessionId, activeChallengeId, 'enterprise');
      const reqEnd = Date.now();
      
      const data = res?.data;
      
      if (phaseRef.current === 'ENROLLMENT' && data) {
        console.log(`[ENROLL FRONTEND]\nphase=${phaseRef.current}\nframeNumber=${fpsCounterRef.current}\nrequestStarted=${reqStart}\nrequestCompleted=${reqEnd}\nresponseReceived=True\nresponseState=${data.enrollment_progress?.state}\nprogress=${data.enrollment_progress?.valid_frames}/${data.enrollment_progress?.required_frames}`);
      }
      
      if (currentGeneration !== sessionGenerationRef.current) { setIsProcessing(false); return; }
      setApiResponse(data);
      if (!data) { setIsProcessing(false); return; }

      if (data.status === "cv_engine_unavailable" || data.error?.includes("CV engine not available")) {
        setModelStatus("Failed"); setError("Face detection model failed to load on the server.");
      } else {
        setModelStatus("Loaded");
        if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
      }

      if (data.status === "CHALLENGE_FAILED") {
        setChallengeError("Challenge timeout. Please try again.");
        // Reset challenge timer for another attempt
        setChallengeTimer(30);
        return;
      } else if (data.liveness_warning && data.liveness_status !== "ok") {
        // Show continuous liveness warnings during challenges
        // These are non-terminal but block challenge advancement
        setChallengeError(data.liveness_warning);
      } else {
        setChallengeError(null);
      }

      if (data.result === 'pass') {
        // In Enterprise API (Continuous Monitoring), we don't set overallResult on challenge completion,
        // because the user must explicitly click "Enroll Current Face".
        
        // Log monitoring success periodically
        if (isMonitoring && (fpsCountRef.current % 5 === 0)) {
           setMonitoringAudit(prev => [{ time: new Date().toLocaleTimeString(), event: 'Identity Verified', status: 'secure' }, ...prev].slice(0, 50));
        }
      }
      
      // Enterprise terminal alerts exclusively from backend
      const terminalStatuses: Record<string, string> = {
        "MULTIPLE_FACES_DETECTED": "MULTIPLE FACES DETECTED",
        "REPLAY_ATTACK_DETECTED": "REPLAY ATTACK DETECTED",
        "DEEPFAKE_SUSPECTED": "DEEPFAKE SUSPECTED",
        "NO_FACE_DETECTED": "FACE LOST — NO FACE DETECTED",
        "FACE_LOST": "FACE LOST",
        // CAMERA_FEED_FROZEN removed: too many false positives with real webcams.
        // The backend now requires 10+ consecutive frozen frames with a stricter threshold.
        // If it still fires, we treat it as a non-fatal warning rather than killing the session.
        "UNAUTHORIZED_PERSON": "UNAUTHORIZED PERSON",
        "IDENTITY_CHANGED": "UNAUTHORIZED PERSON",
        "SECURITY_CHECK_FAILED": "SECURITY CHECK FAILED",
        "CHALLENGE_TIMEOUT_TERMINATED": "CHALLENGE TIMEOUT",
        "SPOOF_DETECTED": backendHealthy === false ? "VERIFICATION UNAVAILABLE" : "SPOOF DETECTED"
      };

      if (data.result === 'fail') {
        // BUG 12 FIX: Only terminate on fail if it's from a terminal status.
        // Non-terminal fails (e.g. transient quality issues, single bad frame)
        // should not kill the entire session.
        if (data.status && data.status in terminalStatuses) {
          triggerSessionTermination(terminalStatuses[data.status]);
          return;
        }
        // Non-terminal fail — ignore (transient quality/pose issue)
        console.warn('[MITRA] Non-terminal fail from backend, status:', data.status);
      }



      if (data.status && data.status in terminalStatuses) {
        triggerSessionTermination(terminalStatuses[data.status]);
        return;
      }
      // Non-fatal: skip frozen frames silently
      if (data.status === "CAMERA_FEED_FROZEN") {
        console.warn('[MITRA] Skipping CAMERA_FEED_FROZEN frame (non-fatal)');
        setIsProcessing(false);
        return;
      }
      
      if (data.status === 'IDENTITY_LOST') {
        setFaceTrackingState('FACE_RECOVERY');
        // The backend handles pausing challenge progression by returning challenge_passed = False
      } else if (data.liveness_status && data.liveness_status !== 'ok' && data.face_present) {
        // Non-terminal liveness issues with face still visible (blur, pose, not centered, etc.)
        // Update tracking state to show there's an issue but don't terminate
        if (['face_not_centered', 'face_too_small', 'face_too_large', 'pose_invalid'].includes(data.liveness_status)) {
          setFaceTrackingState('FACE_RECOVERY');
        }
      }


      // Update enterprise analytics
      if (data.enterprise_report) setEnterpriseReport(data.enterprise_report);
      if (data.face_quality !== undefined) setFaceQuality(data.face_quality * 100);
      if (data.pose_quality !== undefined) setPoseQuality(data.pose_quality * 100);
      if (data.lighting_quality !== undefined) setLightingQuality(data.lighting_quality * 100);
      if (data.landmark_geometry) setLandmarkGeometry(data.landmark_geometry);
      if (data.passive_liveness) setPassiveLiveness(data.passive_liveness);
      if (data.fraud_detection) setFraudDetection(data.fraud_detection);

      // Enterprise telemetry updates
      if (data.eye_tracking) setEyeTracking(data.eye_tracking);
      if (data.face_tracking) setFaceTracking(data.face_tracking);
      if (data.anti_spoof_details) setAntiSpoofDetails(data.anti_spoof_details);
      if (data.telemetry) setTelemetryData(data.telemetry);
      if (data.enrollment_progress) {
        let isLatest = true;
        if (data.enrollment_progress.frame_sequence_id !== undefined) {
          if (data.enrollment_progress.frame_sequence_id < lastSequenceIdRef.current) {
            isLatest = false;
          } else {
            lastSequenceIdRef.current = data.enrollment_progress.frame_sequence_id;
          }
        }
        
        if (isLatest) {
          setEnrollmentProgress(data.enrollment_progress);
          // Clear enrollment errors on new valid progress
          if (data.enrollment_progress.valid_frames > 0) {
            setEnrollmentError(null);
          }
          // Use backend state as single source of truth
          const backendState = data.enrollment_progress.state as Phase;
          if (backendState === 'CONTINUOUS_MONITORING' && !isMonitoring) {
            setIsMonitoring(true);
          }
          setPhase(prev => {
            if (prev === 'ENROLLING' && enrollRequestInFlightRef.current) return prev;
            // If we are showing a failure, don't immediately overwrite it with READY from the background loop
            if (prev === 'FAILED' && backendState === 'READY') return prev;
            
            // Reset stale data on transition to verification
            if (prev === 'ENROLLMENT' && backendState === 'IDENTITY_VERIFYING') {
              setSimilarity(0);
              setConfidence(0);
            }
            if (prev !== backendState && (backendState === 'LIVENESS_CHALLENGES' || backendState === 'CONTINUOUS_MONITORING')) {
              similarityHistoryRef.current = [];
            }
            return backendState;
          });
          console.log(`[STATE SYNC] backend_state=${backendState} in_flight=${enrollRequestInFlightRef.current}`);
        }
      }
      
      // FPS calculation
      fpsCounterRef.current++;
      const fpsNow = Date.now();
      if (fpsNow - lastFpsCalcRef.current >= 1000) {
        setCurrentFps(fpsCounterRef.current);
        fpsCounterRef.current = 0;
        lastFpsCalcRef.current = fpsNow;
      }
      
      // Track verification counts & security events
      if (data.similarity_score !== undefined && data.similarity_score > 0 && hasFaceEnrolled) {
        setVerificationCount(prev => prev + 1);
        if (data.similarity_score >= 0.80) {
          // Throttle security events to 1 per 3 seconds
          if (fpsNow % 3000 < 200) {
            setSecurityEvents(prev => [{ time: new Date().toLocaleTimeString(), event: 'Identity Verified', status: 'secure' as const }, ...prev].slice(0, 50));
          }
        } else if (data.similarity_score < 0.65) {
          setUnauthorizedAttempts(prev => prev + 1);
          setSecurityEvents(prev => [{ time: new Date().toLocaleTimeString(), event: 'Identity Mismatch', status: 'critical' as const }, ...prev].slice(0, 50));
        }
      }
      if (data.spoof_score > 0.4) {
        setSecurityEvents(prev => [{ time: new Date().toLocaleTimeString(), event: 'Spoof Attempt', status: 'critical' as const }, ...prev].slice(0, 50));
      }
      if (data.pose_validation) setPoseValidation(data.pose_validation);

      const isFacePresentAndValid = data.face_present && data.face_confidence > 0.50 && data.detected_faces === 1;
      const box = data.bbox;
      setBbox(box || null);
      if (data.ear !== undefined) setEar(data.ear);
      if (data.mar !== undefined) setMar(data.mar);
      const face_center_x = data.landmarks && data.landmarks[1] ? data.landmarks[1][0] : (box ? box.x + box.w / 2 : 0.5);
      const face_center_y = data.landmarks && data.landmarks[1] ? data.landmarks[1][1] : (box ? box.y + box.h / 2 : 0.5);
      const inside = box ? (Math.abs(face_center_x - 0.5) <= 0.25 && Math.abs(face_center_y - 0.5) <= 0.25) : false;

      // Ensure we immediately sync tracking state with backend face_present
      handleFrameInvalid(data);

      if (isFacePresentAndValid) {
        setFaceConfidenceMetric(data.face_confidence);
        setTrackingConfidence(Math.min(1.0, data.face_confidence + 0.1));
        
        lastFaceSeenTimeRef.current = Date.now(); setTimeSinceFaceSeen(0);

        if (hasFaceEnrolled && data.similarity_score !== undefined && data.similarity_score > 0) {
           similarityHistoryRef.current.push(data.similarity_score);
           if (similarityHistoryRef.current.length > 15) similarityHistoryRef.current.shift();
           const smoothedSim = similarityHistoryRef.current.reduce((a, b) => a + b, 0) / similarityHistoryRef.current.length;
           setSimilarity(smoothedSim);
           setLastMatchTime(Date.now());
        }

        setDetectedFaces(data.detected_faces); setLandmarkCount(data.landmark_count); setConfidence(data.face_confidence);
        
        const pose = processHeadPose(data.yaw, data.raw_yaw);
        setYaw(pose.correctedYaw); setRawYaw(pose.rawYaw); setYawDirection(pose.direction);
        setPitch(data.pitch); setRoll(data.roll);
        setSpoofScore(data.spoof_score); setDeepfakeRisk(data.deepfake_risk);
        setGazeDirection(data.gaze_direction); setGazeAvailable(data.gaze_available); setFaceInsideGuide(inside);
        
        setFraudDetection(data.fraud_detection);
        setRawLandmarks(data.landmarks || []);
        
        if (data.detected_faces > 1 && detectedFaces <= 1) {
          logEvent('MULTIPLE_FACES_DETECTED', { faces: data.detected_faces }, 'WARNING');
        }

        wasBlinkingRef.current = data.blink_detected ?? false;
        if (hasFaceEnrolled) { consecutiveValidFramesRef.current += 1; setConsecutiveValidFrames(consecutiveValidFramesRef.current); }

        if (faceVisibleStartRef.current === null) { faceVisibleStartRef.current = Date.now(); setFaceVisibleDuration(0); }
        else { setFaceVisibleDuration((Date.now() - faceVisibleStartRef.current) / 1000); }

        // State machine progression MUST run if face is present, regardless of perfectly centered or not
        if (phaseRef.current === 'LIVENESS_CHALLENGES') {
          
          if (currentChallenge === 0) {
            // First challenge is ALWAYS face centered
            if (data.face_confidence > 0.50 && inside && data.detected_faces === 1) {
              if (!centerTimerStartedRef.current) {
                centerTimerStartedRef.current = true; centerTimerStartTimeRef.current = Date.now();
              } else {
                const centeredDur = (Date.now() - centerTimerStartTimeRef.current) / 1000;
                setFaceVisibleDuration(centeredDur);
                if (centeredDur >= 1.5) { // Reduced to 1.5s for better UX
                  setIsFacePrepared(true);
                  setChallengePassed(prev => { const next = [...prev]; next[0] = true; return next; });
                  currentChallengeRef.current = 1; setCurrentChallenge(1);
                  stepStartTimeRef.current = Date.now();
                }
              }
            } else { centerTimerStartedRef.current = false; setFaceVisibleDuration(0); }
          } else {
            // BUG 4 FIX: Sync challenge index from backend instead of advancing locally.
            // The backend advances current_challenge_index in the liveness router (line 466)
            // and returns sequence_advanced=true. The frontend was ALSO advancing,
            // causing challenges to be double-advanced (skipping one).
            if (data.current_challenge_index !== undefined) {
              const backendIdx = data.current_challenge_index as number;
              if (backendIdx !== currentChallenge) {
                currentChallengeRef.current = backendIdx;
                setCurrentChallenge(backendIdx);
                stepStartTimeRef.current = Date.now();
              }
            }
            // Mark challenges as passed based on sequence_advanced flag from backend
            if (data.sequence_advanced && data.challenge_passed) {
              const passedIdx = ((data.current_challenge_index as number) ?? 1) - 1;
              if (passedIdx >= 0) {
                setChallengePassed(prev => { const next = [...prev]; next[passedIdx] = true; return next; });
              }
            }
          }
        } // End if phase === CHALLENGES
      }
    } catch (err: any) {
      console.warn('Frame processing failed', err);
      handleFrameInvalid(null);
    } finally {
      setIsProcessing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, sessionId, hasFaceEnrolled, currentChallenge, challenges, isProcessing, overallResult, isMonitoring, triggerSessionTermination, mismatchCount, isStabilizing]);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const animationLoop = useCallback((__timestamp: number) => {
    if (!streamingRef.current) return;
    const now = Date.now();
    const interval = isMonitoringRef.current ? 1500 : 100;
    if (now - lastFrameTimeRef.current >= interval) { sendFrameToBackendRef.current(); lastFrameTimeRef.current = now; }
    requestRef.current = requestAnimationFrame(animationLoop);
  }, []);

  useEffect(() => {
    if (streaming) { lastFrameTimeRef.current = Date.now(); requestRef.current = requestAnimationFrame(animationLoop); }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  useEffect(() => {
    if (!streaming) return;
    sessionTimeRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => { if (sessionTimeRef.current) clearInterval(sessionTimeRef.current); };
  }, [streaming]);

  useEffect(() => {
    if (!streaming || overallResult || !hasFaceEnrolled || currentChallenge >= challenges.length) return;
    setChallengeTimer(30);
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
      
      // Dead code timer for overallResult removed.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallResult, isMonitoring]);

  async function startCamera() {
    setError(null); faceVisibleStartRef.current = null; setFaceVisibleDuration(0);
    setSessionTime(0); setOverallResult(null); setSessionTerminated(false); setTerminationReason('');
    setModelStatus('Loading'); faceDetectionHistoryRef.current = []; similarityHistoryRef.current = [];
    setMismatchCount(0); 

    
    setShowReport(false); setIsMonitoring(false); setMonitoringAudit([]);
    if (typeof window !== 'undefined') sessionStorage.removeItem('mv_mismatch_count');
    consecutiveValidFramesRef.current = 0; currentChallengeRef.current = 0; setConsecutiveValidFrames(0);
    setEnrollmentError(null);
    enrollRequestInFlightRef.current = false;
    setPhase('IDLE');
    setFaceTrackingState('FACE_PRESENT'); prevTrackingStateRef.current = 'FACE_PRESENT';
    setLostFrames(0); setRecoveredFrames(0); setTimeSinceFaceSeen(0);
    setLastMatchTime(null);
    lastFaceSeenTimeRef.current = null; lostFramesRef.current = 0; recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0); setTrackingConfidence(1.0);
    setEnterpriseReport(null); setFaceQuality(0); setPoseQuality(0); setLightingQuality(0);
    setLandmarkGeometry(null); setPassiveLiveness(null); setFraudDetection(null); setPoseValidation(null);

    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    // Use a flag ref to avoid stale closure over modelStatus/streaming state
    const loadingCancelledRef = { cancelled: false };
    loadingTimeoutRef.current = setTimeout(() => {
      if (loadingCancelledRef.cancelled) return;
      // Check current DOM state directly to avoid stale closure
      const videoEl = videoRef.current;
      const hasStream = videoEl?.srcObject && (videoEl.srcObject as MediaStream).active;
      if (!hasStream) {
        setModelStatus('Failed'); setError('Biometric services failed to respond within 8 seconds. Check that the backend is running.'); stopCamera();
      }
    }, 8000);

    try {
      const sessionRes = await livenessAPI.startSession('enterprise');
      setSessionId(sessionRes.data.session_id);
      setChallenges(sessionRes.data.challenges);
      setChallengePassed(new Array(sessionRes.data.challenges.length).fill(false));
      setCurrentChallenge(0); setChallengeTimer(30);
    } catch {
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
    } catch (err: unknown) {
      if (!streaming) {
        const camErr = err as { name?: string; message?: string };
        let errorMsg = 'Camera access denied.';
        if (camErr.name === 'NotAllowedError') {
          errorMsg = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (camErr.name === 'NotFoundError') {
          errorMsg = 'No camera found. Please connect a camera and try again.';
        } else if (camErr.name === 'NotReadableError' || camErr.name === 'AbortError') {
          errorMsg = 'Camera is in use by another application. Please close it and try again.';
        } else if (camErr.message) {
          errorMsg = `Camera error: ${camErr.message}`;
        }
        setCameraStatus('Inactive'); setError(errorMsg);
        if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
        setModelStatus('Failed');
      }
    }
  }

  function stopCamera() {
    if (loadingTimeoutRef.current) { clearTimeout(loadingTimeoutRef.current); loadingTimeoutRef.current = null; }
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setStreaming(false); setCameraStatus('Inactive'); setOverallResult(null); setConfidence(0); setSimilarity(0);
    faceDetectionHistoryRef.current = []; similarityHistoryRef.current = [];
    setGazeDirection(null); setGazeAvailable(false); setFaceInsideGuide(false);
    faceVisibleStartRef.current = null; setFaceVisibleDuration(0); setChallenges([]); setChallengePassed([]);
    setSessionTerminated(false); setPhase('IDLE'); setTerminationReason(''); setShowReport(false);
    setFaceTrackingState('FACE_PRESENT'); prevTrackingStateRef.current = 'FACE_PRESENT';
    setIsMonitoring(false); setMonitoringAudit([]);
    setLostFrames(0); setRecoveredFrames(0); setTimeSinceFaceSeen(0);
    setSpoofScore(0); setDeepfakeRisk(0);
    setLastMatchTime(null); setRawYaw(0); setYawDirection('CENTER');
    setYaw(0); setPitch(0); setRoll(0);
    lastFaceSeenTimeRef.current = null; lostFramesRef.current = 0; recoveredFramesRef.current = 0;
    setFaceConfidenceMetric(0); setTrackingConfidence(1.0);
    setEnterpriseReport(null); setFaceQuality(0); setPoseQuality(0); setLightingQuality(0);
    setLandmarkGeometry(null); setPassiveLiveness(null); setFraudDetection(null); setPoseValidation(null);
    setEnrollmentError(null);
    enrollRequestInFlightRef.current = false;
    setPhase('IDLE');
  }

  const enrollFace = async () => {
    // === ATOMIC GUARD 1: Phase check ===
    if (phase !== 'ENROLLMENT' && phase !== 'READY') {
      console.log(`[ENROLL DEBUG] BLOCKED — phase=${phase}, expected ENROLLMENT or READY`);
      return;
    }


    // === ATOMIC GUARD 2: Removed. Backend readiness is validated by GUARD 5 (enrollmentProgress.ready). ===
    // Checking phaseRef.current against 'READY' was wrong — phaseRef.current is 'ENROLLMENT' when the button is visible.

    // === ATOMIC GUARD 3: Double-submission prevention ===
    if (enrollRequestInFlightRef.current) {
      console.log('[ENROLL DEBUG] BLOCKED — enrollment request already in-flight');
      return;
    }

    // === ATOMIC GUARD 4: Session exists ===
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      console.log('[ENROLL DEBUG] BLOCKED — no session_id');
      setEnrollmentError('Enrollment session unavailable. Restart enrollment.');
      return;
    }

    // === ATOMIC GUARD 5: Backend enrollment progress check ===
    if (!enrollmentProgress || !enrollmentProgress.ready || enrollmentProgress.valid_frames < 15) {
      console.log(`[ENROLL DEBUG] BLOCKED — backend not ready: valid=${enrollmentProgress?.valid_frames}/15 ready=${enrollmentProgress?.ready}`);
      return;
    }

    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === SET IN-FLIGHT GUARD ===
    enrollRequestInFlightRef.current = true;
    setEnrolling(true);
    setPhase('ENROLLING');
    setEnrollmentError(null);

    console.log(`[ENROLL DEBUG] SUBMITTING — session=${currentSessionId.substring(0, 8)} valid=${enrollmentProgress.valid_frames}/15 ready=${enrollmentProgress.ready}`);

    try {
      const videoRatio = video.videoWidth / video.videoHeight;
      canvas.width = 320; 
      canvas.height = 320 / videoRatio;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.80);
      setEnrollmentSnapshot(base64Image);
      
      const res = await livenessAPI.enrollFace(base64Image, undefined, currentSessionId);

      // Handle structured rejection response (success: false)
      if (res.data && res.data.success === false) {
        console.log(`[ENROLL DEBUG] REJECTED by backend — code=${res.data.code} state=${res.data.state} valid=${res.data.valid_embeddings}/${res.data.required_embeddings} msg=${res.data.message}`);
        
        if (res.data.code === 'SESSION_EXPIRED') {
          setEnrollmentError('Enrollment session expired. Restart enrollment.');
          setPhase('FAILED');
        } else if (res.data.code === 'ENROLLMENT_NOT_READY') {
          setEnrollmentError(res.data.message || `Collecting frames — ${res.data.valid_embeddings || 0}/15`);
          setPhase('COLLECTING');
        } else if (res.data.code === 'INSUFFICIENT_POSE_COVERAGE') {
          setEnrollmentError(res.data.message || 'Insufficient pose coverage.');
          setPhase('COLLECTING');
        } else if (res.data.code === 'INSUFFICIENT_EXPRESSION_COVERAGE') {
          setEnrollmentError(res.data.message || 'Insufficient expression coverage.');
          setPhase('COLLECTING');
        } else {
          setEnrollmentError(res.data.message || 'Enrollment not ready.');
          setPhase('FAILED');
        }
        return;
      }

      // Handle successful enrollment
      if (res.data && res.data.status === 'success') {
        console.log('[ENROLL DEBUG] SUCCESS — enrollment complete, waiting for IDENTITY_VERIFYING from backend');
        setIsStabilizing(true);
        
        // Drop in-flight flag FIRST so the state-machine loop can process
        // backend enrollment_progress.state = IDENTITY_VERIFYING on the next frame
        enrollRequestInFlightRef.current = false;
        
        await refreshUser();
        setEnrollmentSuccess(true);
        setHasFaceEnrolled(true);
        setEnrollmentError(null);
        // Do NOT force setPhase here — let backend state (enrollment_progress.state)
        // drive the transition to IDENTITY_VERIFYING on the next frame response.
        // setPhase('ENROLLED') is intentionally omitted.
      } else {
        console.log('[ENROLL DEBUG] FAILED — enrollment unsuccessful');
        setPhase('FAILED');
        setEnrollmentError('Enrollment failed: invalid response from backend.');
        enrollRequestInFlightRef.current = false;
      }
    } catch (err: unknown) {
      console.error('[ENROLL DEBUG] ERROR', err);
      setPhase('FAILED');
      const apiErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const errMsg = apiErr.response?.data?.message || apiErr.response?.data?.detail || 'Enrollment request failed. Please try again.';
      setEnrollmentError(errMsg);
    } finally { 
      setEnrolling(false);
      enrollRequestInFlightRef.current = false;
    }
  };

  const clearEnrollment = async () => {
    sessionGenerationRef.current += 1;
    stopCamera();
    
    try {
      await livenessAPI.clearEnrolledFace();
    } catch (e) { console.warn('Failed to clear enrolled face from backend', e); }

    setHasFaceEnrolled(false);
    localStorage.removeItem('enrolledEmbedding'); localStorage.removeItem('mv_enrolled_signature');
    setSimilarity(0); similarityHistoryRef.current = []; setConsecutiveValidFrames(0);
    setPhase('ENROLLMENT');
    setEnrollmentProgress(null);
    setCurrentChallenge(0); currentChallengeRef.current = 0;
    setChallengePassed([]);
    setApiResponse(null);
    setIsFacePrepared(false);
    centerTimerStartedRef.current = false;
    enrollRequestInFlightRef.current = false;
    setVerificationCount(0);
    setSecurityEvents([]);
    setUnauthorizedAttempts(0);
    setIsMonitoring(false);
    
    await refreshUser();
    setTimeout(() => { startCamera(); }, 100);
  };

  type EnterpriseState = 'FACE_DETECTED' | 'FACE_ENROLLED' | 'IDENTITY_MATCHED' | 'CHALLENGES_COMPLETED' | 'AUTHENTICATED' | 'MONITORING';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const enterpriseState = useMemo<EnterpriseState | null>(() => {
    if (!streaming || sessionTerminated) return null;
    const isFaceDetected = confidence > 0.50 && detectedFaces === 1 && faceInsideGuide;
    if (!isFaceDetected) return null;
    if (!hasFaceEnrolled) return 'FACE_DETECTED';
    if (similarity < 0.75) return 'FACE_ENROLLED';
    const isChallengesCompleted = challengePassed.length > 0 && challengePassed.every(Boolean);
    if (!isChallengesCompleted) return 'IDENTITY_MATCHED';
    if (isMonitoring) return 'MONITORING';
    const isAuthenticated = isChallengesCompleted && confidence > 0.50 && detectedFaces === 1 && faceInsideGuide && spoofScore < 0.45 && deepfakeRisk < 0.30 && similarity >= 0.75;
    if (isAuthenticated) return 'AUTHENTICATED';
    return 'CHALLENGES_COMPLETED';
  }, [streaming, sessionTerminated, confidence, detectedFaces, faceInsideGuide, hasFaceEnrolled, similarity, challengePassed, spoofScore, deepfakeRisk, isMonitoring]);

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
              <div style={{ fontSize: 28, fontWeight: 700, color: '#00ff88' }}>Robust</div>
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
                {phase === 'IDLE' || phase === 'ENROLLMENT' ? "Start the camera and align your face inside the oval." :
                 phase === 'COLLECTING' ? "Keep your face centered and hold still while high-quality frames are collected." :
                 phase === 'COVERAGE_INCOMPLETE' ? "Move your head to complete the required pose coverage." :
                 phase === 'READY' ? "15 high-quality frames collected. You can now enroll your face." :
                 phase === 'ENROLLING' ? "Enrolling your biometric profile..." :
                 phase === 'ENROLLED' ? "Biometric enrollment completed." :
                 phase === 'FAILED' ? (enrollmentError || "Enrollment failed. Please try again.") :
                 "Start the camera, align your face inside the oval, and click Enroll Current Face."}
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT — Camera Feed */}
          <div className="lg:col-span-8 flex flex-col gap-5">
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
                    enrollmentSuccess ? 'ENROLLMENT SUCCESSFUL' :
                    enrolling ? 'ENROLLING...' :
                    detectedFaces > 1 ? 'MULTIPLE FACES DETECTED' :
                    faceTrackingState === 'FACE_WARNING' || faceTrackingState === 'FACE_RECOVERY' ? 'FACE TRACKING LOST' :
                    confidence < 0.50 ? 'CONFIDENCE TOO LOW' :
                    !faceInsideGuide ? 'POSITION FACE INSIDE OVAL' :
                    phase === 'ENROLLMENT' ? 'READY TO ENROLL - CLICK BUTTON BELOW' :
                    phase === 'LIVENESS_CHALLENGES' ? `LIVENESS CHALLENGE ${currentChallenge + 1}/${challenges.length}` :
                    similarity < 0.75 ? 'IDENTITY MISMATCH' :
                    `VERIFYING IDENTITY... ${challengeTimer}s`
                  }
                  themeColor="#00ff88"
                />
              )}

              {/* Compact Verification Status Overlay */}
              {streaming && !overallResult && (
                <div style={{
                  position: 'absolute', bottom: 12, left: 12, zIndex: 20,
                  display: 'flex', flexDirection: 'column', gap: 3,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                  padding: '8px 12px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  pointerEvents: 'none'
                }}>
                  {[
                    { label: 'CAMERA', active: cameraStatus === 'Active', pass: cameraStatus === 'Active' },
                    { label: 'FACE DETECTED', active: detectedFaces > 0, pass: confidence > 0.5 && detectedFaces === 1 },
                    { label: 'LIVENESS', active: phase === 'LIVENESS_CHALLENGES' || phase === 'LIVENESS_VERIFIED' || phase === 'CONTINUOUS_MONITORING', pass: phase === 'LIVENESS_VERIFIED' || phase === 'CONTINUOUS_MONITORING' || phase === 'ACCESS_GRANTED' },
                    { label: 'IDENTITY', active: hasFaceEnrolled && similarity > 0, pass: similarity >= 0.75 },
                    { label: 'CONTINUOUS', active: isMonitoring, pass: isMonitoring && faceTrackingState === 'FACE_PRESENT' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: item.pass ? '#00ff88' : item.active ? '#ffb800' : '#334155',
                        boxShadow: item.pass ? '0 0 6px #00ff88' : item.active ? '0 0 4px #ffb800' : 'none'
                      }} />
                      <span style={{ color: item.pass ? '#00ff88' : item.active ? '#ffb800' : '#475569' }}>
                        {item.label}{item.pass ? ' ✓' : ''}
                      </span>
                    </div>
                  ))}
                </div>
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
                  {error && (
                    <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff6b8a', fontSize: 12, textAlign: 'center', maxWidth: 320 }}>
                      {error}
                    </div>
                  )}
                  <button onClick={startCamera} style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #00ff88, #00cc66)', color: '#000', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.03em', boxShadow: '0 0 30px rgba(0,255,136,0.2)' }}>
                    <Camera size={18} /> START VERIFICATION
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
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!hasFaceEnrolled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button 
                      onClick={enrollFace} 
                      disabled={phase !== 'READY'}
                      style={{ 
                        flex: 1, 
                        padding: '10px 0', 
                        borderRadius: 10, 
                        background: phase === 'READY' ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(100,100,100,0.3)', 
                        color: phase === 'READY' ? '#000' : '#94a3b8', 
                        fontWeight: 700, 
                        fontSize: 13, 
                        border: 'none', 
                        cursor: phase === 'READY' ? 'pointer' : 'not-allowed', 
                        transition: 'all 0.3s ease'
                      }}>
                      {phase === 'ENROLLING' ? 'ENROLLING...' : 
                       phase === 'READY' ? 'ENROLL CURRENT FACE' : 
                       phase === 'COVERAGE_INCOMPLETE' ? 'COVERAGE INCOMPLETE' : 
                       phase === 'FAILED' ? 'ENROLLMENT FAILED' : 
                       phase === 'ENROLLED' ? 'FACE ENROLLED ✓' : 
                       enrollmentProgress ? `COLLECTING FRAMES ${enrollmentProgress.valid_frames}/${enrollmentProgress.required_frames || 15}` : 
                       'COLLECTING FRAMES...'}
                    </button>
                    {/* Inline enrollment status / error display */}
                    {enrollmentError && (
                      <div style={{ 
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        background: 'rgba(255,51,102,0.06)', 
                        border: '1px solid rgba(255,51,102,0.2)', 
                        fontSize: 11, 
                        color: '#ff6b8a', 
                        fontWeight: 500,
                        textAlign: 'center'
                      }}>
                        {enrollmentError}
                      </div>
                    )}
                    {!enrollmentError && phase === 'COVERAGE_INCOMPLETE' && enrollmentProgress && (
                      <div className="absolute inset-x-4 bottom-28 flex flex-col items-center">
                        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-yellow-500/40 shadow-2xl flex flex-col items-center max-w-sm w-full">
                          <div className="text-yellow-400 font-bold tracking-widest mb-1 text-sm">ENROLLMENT ALMOST READY</div>
                          <div className="text-white/80 text-xs mb-3">
                            {Math.min(enrollmentProgress.valid_frames, enrollmentProgress.required_frames || 15)}/{enrollmentProgress.required_frames || 15} frames collected
                          </div>
                          
                          {enrollmentProgress.missing_poses && enrollmentProgress.missing_poses.length > 0 && (
                            <div className="text-white text-base font-semibold mb-3">
                              Please look <span className="text-yellow-400 uppercase">{enrollmentProgress.missing_poses[0]}</span>
                            </div>
                          )}
                          {!enrollmentProgress.missing_poses?.length && enrollmentProgress.missing_expressions && enrollmentProgress.missing_expressions.length > 0 && (
                            <div className="text-white text-base font-semibold mb-3">
                              Please <span className="text-yellow-400 uppercase">{enrollmentProgress.missing_expressions[0] === 'Neutral' ? 'return to a neutral expression' : 'smile'}</span>
                            </div>
                          )}

                          <div className="w-full flex gap-2 flex-wrap justify-center text-[10px] font-mono">
                            {['Front', 'Left 15', 'Right 15', 'Up', 'Down'].map(pose => {
                              const isMissing = enrollmentProgress.missing_poses?.includes(pose);
                              return (
                                <span key={pose} className={`px-2 py-1 rounded border ${isMissing ? 'border-yellow-500/30 text-yellow-500/50' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                  {isMissing ? '○' : '✓'} {pose}
                                </span>
                              );
                            })}
                            {['Neutral', 'Smile'].map(expr => {
                              const isMissing = enrollmentProgress.missing_expressions?.includes(expr);
                              return (
                                <span key={expr} className={`px-2 py-1 rounded border ${isMissing ? 'border-yellow-500/30 text-yellow-500/50' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                  {isMissing ? '○' : '✓'} {expr}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {!enrollmentError && phase === 'COLLECTING' && enrollmentProgress && (
                      <div className="absolute inset-x-4 bottom-28 flex flex-col items-center">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shadow-2xl flex flex-col items-center">
                          <div className="text-white/60 text-xs font-mono tracking-widest mb-2">COLLECTING HIGH-QUALITY FRAMES</div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300" 
                                style={{ width: `${Math.min(100, ((Math.min(enrollmentProgress.valid_frames, enrollmentProgress.required_frames || 15)) / (enrollmentProgress.required_frames || 15)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-blue-400 font-mono font-medium text-lg">
                              {Math.min(enrollmentProgress.valid_frames, enrollmentProgress.required_frames || 15)}/{enrollmentProgress.required_frames || 15}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : phase === 'ENROLLMENT' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ textAlign: 'center', color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>✓ Identity enrolled</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button disabled={true} style={{ flex: 2, padding: '10px 0', borderRadius: 10, background: '#334155', color: '#94a3b8', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'not-allowed' }}>
                        Processing...
                      </button>
                      <button onClick={clearEnrollment} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        Clear Enrollment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Simulate Threat button for pitch demo during continuous monitoring */}
                    {isMonitoring && phase === 'CONTINUOUS_MONITORING' && (
                      <button 
                        onClick={() => {
                          triggerSessionTermination('IDENTITY MISMATCH — UNAUTHORIZED PERSON DETECTED');
                          setSecurityEvents(prev => [
                            { time: new Date().toLocaleTimeString(), event: 'THREAT: Identity Mismatch', status: 'critical' as const },
                            { time: new Date().toLocaleTimeString(), event: 'SESSION TERMINATED', status: 'critical' as const },
                            { time: new Date().toLocaleTimeString(), event: 'ACCESS REVOKED', status: 'critical' as const },
                            ...prev
                          ].slice(0, 50));
                          setUnauthorizedAttempts(prev => prev + 1);
                        }}
                        style={{ 
                          padding: '10px 0', borderRadius: 10, 
                          background: 'rgba(255,51,102,0.15)', 
                          border: '1px solid rgba(255,51,102,0.4)', 
                          color: '#ff3366', fontWeight: 700, fontSize: 12, 
                          cursor: 'pointer', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          letterSpacing: '0.04em'
                        }}
                      >
                        <AlertTriangle size={14} /> SIMULATE THREAT (DEMO)
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={clearEnrollment} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        Clear Enrollment
                      </button>
                      <button onClick={stopCamera} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(100,100,100,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        Stop Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR — Security Metrics */}
          <div className="lg:col-span-4 flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)', position: 'sticky', top: 100 }}>
            {/* 3-Stage Workflow Indicator */}
            {streaming && !overallResult && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>Enterprise Verification Stages</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: (phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? '#00d4ff22' : '#334155', border: `1px solid ${(phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? '#00d4ff' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: (phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? '#00d4ff' : '#475569' }}>1</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: (phase === 'IDLE' || phase === 'ENROLLMENT' || phase === 'ENROLLED' || phase === 'COLLECTING' || phase === 'COVERAGE_INCOMPLETE' || phase === 'READY' || phase === 'ENROLLING') ? '#00d4ff' : '#94a3b8' }}>Enrollment</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'IDENTITY_VERIFYING' || phase === 'IDENTITY_VERIFIED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'IDENTITY_VERIFYING' ? '#ffb80022' : '#334155', border: `1px solid ${phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#475569' }}>2</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'IDENTITY_VERIFYING' ? '#ffb800' : '#94a3b8' }}>Identity</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'LIVENESS_CHALLENGES' || phase === 'LIVENESS_VERIFIED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff22' : '#334155', border: `1px solid ${phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#475569' }}>3</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'LIVENESS_CHALLENGES' ? '#00d4ff' : '#94a3b8' }}>Liveness</div>
                  </div>
                  <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.1)', marginLeft: 11, marginTop: -8, marginBottom: -8 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: (phase === 'CONTINUOUS_MONITORING' || phase === 'ACCESS_GRANTED') ? 1 : 0.5 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: phase === 'CONTINUOUS_MONITORING' ? '#00ff8822' : '#334155', border: `1px solid ${phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 10, color: phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#475569' }}>4</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: phase === 'CONTINUOUS_MONITORING' ? '#00ff88' : '#94a3b8' }}>Monitoring</div>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Progress */}
            {phase === 'ENROLLMENT' && enrollmentProgress && enrollmentProgress.active && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    BIOMETRIC ENROLLMENT
                  </div>
                  <div style={{ fontSize: 11, color: enrollmentProgress.ready ? '#00ff88' : '#ffb800', fontWeight: 700, fontFamily: 'monospace', background: enrollmentProgress.ready ? 'rgba(0,255,136,0.1)' : 'rgba(255,184,0,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                    {enrollmentProgress.ready ? 'READY' : 'COLLECTING'}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, fontWeight: 600, color: '#94a3b8' }}>
                    <span>Progress</span>
                    <span style={{ color: enrollmentProgress.ready ? '#00ff88' : '#e2e8f0' }}>{enrollmentProgress.valid_frames} / {enrollmentProgress.required_frames}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div 
                      animate={{ width: `${Math.min(100, (enrollmentProgress.valid_frames / enrollmentProgress.required_frames) * 100)}%` }} 
                      transition={{ duration: 0.5 }} 
                      style={{ height: '100%', borderRadius: 2, background: enrollmentProgress.ready ? '#00ff88' : 'linear-gradient(90deg, #ffb800, #00d4ff)' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: enrollmentProgress.ready ? 0 : 12 }}>
                  <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Accepted Frames</div>
                    <div style={{ fontSize: 16, color: '#00ff88', fontWeight: 700, fontFamily: 'monospace' }}>{enrollmentProgress.valid_frames}</div>
                  </div>
                  <div style={{ background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.2)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Rejected Frames</div>
                    <div style={{ fontSize: 16, color: '#ff3366', fontWeight: 700, fontFamily: 'monospace' }}>{enrollmentProgress.rejected_frames}</div>
                  </div>
                </div>

                {!enrollmentProgress.ready && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: enrollmentProgress.last_reject_reason ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,136,0.1)', border: `1px solid ${enrollmentProgress.last_reject_reason ? 'rgba(255,51,102,0.2)' : 'rgba(0,255,136,0.2)'}`, color: enrollmentProgress.last_reject_reason ? '#ff3366' : '#00ff88', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#94a3b8' }}>Last Frame:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 11 }}>
                      {enrollmentProgress.last_reject_reason ? (
                        <><span>✕</span><span>Rejected: {enrollmentProgress.last_reject_reason}</span></>
                      ) : (
                        <><span>✓</span><span>Accepted</span></>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Challenge Progress */}
                        {phase === 'IDENTITY_VERIFYING' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ffb800', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    IDENTITY VERIFICATION
                  </div>
                  <div className="pulse-dot" style={{ backgroundColor: '#ffb800' }} />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Analyzing live face against enrolled biometric template...
                </div>
              </div>
            )}
            
                        {phase === 'IDENTITY_VERIFIED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#00ff88' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    IDENTITY VERIFIED
                  </div>
                  <CheckCircle size={16} color="#00ff88" />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Live face matched enrolled template. Starting liveness challenges...
                </div>
              </div>
            )}
            
{phase === 'ACCESS_GRANTED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#00ff88' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#00ff88', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS GRANTED
                  </div>
                  <CheckCircle size={16} color="#00ff88" />
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                  Identity and liveness verified successfully. Initiating continuous monitoring...
                </div>
              </div>
            )}
            
            {phase === 'FAILED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS DENIED
                  </div>
                  <AlertTriangle size={16} color="#ef4444" />
                </div>
                <div style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.4, marginBottom: 12 }}>
                  Identity verification failed or security violation detected.
                </div>
              </div>
            )}
            
            {phase === 'ACCESS_REVOKED' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', flexShrink: 0, marginBottom: 12, borderColor: '#ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    ACCESS REVOKED
                  </div>
                  <AlertTriangle size={16} color="#ef4444" />
                </div>
                <div style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.4, marginBottom: 12 }}>
                  Session terminated due to security policy violation during continuous monitoring.
                </div>
              </div>
            )}
{phase === 'LIVENESS_CHALLENGES' && (
              <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', maxHeight: '400px', flexShrink: 0 }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>CHALLENGE SEQUENCE</div>
                    <div style={{ fontSize: 11, color: '#00d4ff', fontWeight: 700, fontFamily: 'monospace' }}>{challengeProgress}%</div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
                    <motion.div animate={{ width: `${challengeProgress}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #00d4ff, #00ff88)' }} />
                  </div>
                </div>
                
                {/* Scrollable List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1, paddingRight: 4, minHeight: 0 }}>
                  {challenges.map((ch, i) => (
                    <CheckBadge key={ch.id} label={`${ch.icon} ${ch.label}`} passed={challengePassed[i]} checking={i === currentChallenge && streaming && !overallResult} />
                  ))}
                </div>
                
                <div style={{ flexShrink: 0 }}>
                  {challengeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: 8, padding: '10px 12px', borderRadius: 8,
                        background: challengeError.toLowerCase().includes('spoof') || challengeError.toLowerCase().includes('unauthorized') || challengeError.toLowerCase().includes('mismatch') || challengeError.toLowerCase().includes('terminated')
                          ? 'rgba(255,51,102,0.15)' : 'rgba(255,184,0,0.15)',
                        border: `1px solid ${challengeError.toLowerCase().includes('spoof') || challengeError.toLowerCase().includes('unauthorized') || challengeError.toLowerCase().includes('mismatch') || challengeError.toLowerCase().includes('terminated')
                          ? 'rgba(255,51,102,0.4)' : 'rgba(255,184,0,0.4)'}`,
                        color: challengeError.toLowerCase().includes('spoof') || challengeError.toLowerCase().includes('unauthorized') || challengeError.toLowerCase().includes('mismatch') || challengeError.toLowerCase().includes('terminated')
                          ? '#ff3366' : '#ffb800',
                        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                      {challengeError}
                    </motion.div>
                  )}
                  {/* Show instructions explicitly */}
                  {challenges[currentChallenge] && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{challenges[currentChallenge].icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff' }}>{challenges[currentChallenge].label}</div>
                      <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 4 }}>{challenges[currentChallenge].instruction}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Time remaining: {challengeTimer}s</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, paddingBottom: 20 }}>
              {/* Identity Panel — Highest Priority */}
              <IdentityPanel
                similarity={similarity}
                identityMatch={similarity * 100}
                embeddingQuality={telemetryData?.embedding_quality ?? 0}
                lastVerifiedTime={lastMatchTime}
                status={similarity >= 0.80 ? 'VERIFIED' : similarity >= 0.65 ? 'UNCERTAIN' : hasFaceEnrolled ? 'UNAUTHORIZED' : 'PENDING'}
                verificationCount={verificationCount}
                unauthorizedAttempts={unauthorizedAttempts}
              />

              {/* Hex Threat Radar */}
              <HexThreatRadar
                spoofRisk={spoofScore}
                identityRisk={hasFaceEnrolled ? Math.max(0, 1 - similarity) : 0}
                replayRisk={fraudDetection?.replay_attack?.confidence ?? 0}
                deepfakeRisk={fraudDetection?.deepfake?.confidence ?? 0}
                photoRisk={fraudDetection?.printed_photo?.confidence ?? 0}
                sessionIntegrity={faceTracking?.tracking_stable ? 0.95 : 0.5}
              />

              {/* Face Quality */}
              <FaceQualityPanel
                faceQuality={faceQuality / 100}
                lighting={lightingQuality / 100}
                poseQuality={poseQuality / 100}
                blur={antiSpoofDetails?.face_warp ?? 0}
                confidence={confidence}
              />

              {/* Head Movement */}
              <HeadMovementPanel yaw={yaw} pitch={pitch} roll={roll} />

              {/* Eye Tracking */}
              <EyeTrackingPanel eyeData={eyeTracking ?? null} />

              {/* Face Tracking */}
              <FaceTrackingPanel tracking={faceTracking ?? null} />

              {/* Anti-Spoof Details */}
              <AntiSpoofPanel details={antiSpoofDetails ?? null} />

              {/* Security Events Log */}
              <SecurityEventsLog events={securityEvents} />

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

              {/* Authentication Timeline */}
              <AuthTimeline stages={[
                { label: 'Face Detection', complete: detectedFaces > 0 && confidence > 0.5, active: streaming && detectedFaces === 0 },
                { label: 'Biometric Enrollment', complete: hasFaceEnrolled, active: streaming && !hasFaceEnrolled && detectedFaces > 0 },
                { label: 'Identity Matching', complete: similarity >= 0.75, active: hasFaceEnrolled && similarity < 0.75 },
                { label: 'Challenge Verification', complete: challengePassed.length > 0 && challengePassed.every(Boolean), active: similarity >= 0.75 && !challengePassed.every(Boolean) },
                { label: 'Continuous Monitoring', complete: isMonitoring, active: challengePassed.every(Boolean) && !isMonitoring },
              ]} />

              {/* Live Telemetry */}
              <TelemetryPanel telemetry={telemetryData ?? null} fps={currentFps} />

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
                  { label: 'Identity Match', value: `${Number(enterpriseReport.identity_match_pct || 0).toFixed(2)}%`, color: '#00ff88' },
                  { label: 'Confidence', value: `${Number(enterpriseReport.confidence_pct || 0).toFixed(2)}%`, color: '#00d4ff' },
                  { label: 'Liveness', value: `${Number(enterpriseReport.liveness_pct || 0).toFixed(2)}%`, color: '#00ff88' },
                  { label: 'Spoof Probability', value: `${Number(enterpriseReport.spoof_probability_pct || 0).toFixed(2)}%`, color: enterpriseReport.spoof_probability_pct > 20 ? '#ff3366' : '#00ff88' },
                  { label: 'Fraud Score', value: `${Number(enterpriseReport.fraud_score || 0).toFixed(2)}%`, color: enterpriseReport.fraud_score > 20 ? '#ff3366' : '#00ff88' },
                  { label: 'Risk Score', value: `${Number(enterpriseReport.risk_score || 0).toFixed(2)}%`, color: enterpriseReport.risk_score > 30 ? '#ffb800' : '#00ff88' },
                  { label: 'Quality Score', value: `${Number(enterpriseReport.quality_score || 0).toFixed(2)}%`, color: '#00d4ff' },
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
                  Score: {Number(enterpriseReport.passive_liveness.score || 0).toFixed(1)}%
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
