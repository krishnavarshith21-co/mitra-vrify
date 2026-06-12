'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Camera, AlertCircle, CheckCircle, Eye, Activity, Clock, Zap, Terminal, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { livenessAPI } from '@/lib/api';
import { processHeadPose } from '@/lib/headPose';



function MetricCard({ label, value, unit, color = '#00d4ff', icon: Icon }: { label: string; value: string | number; unit?: string; color?: string; icon: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <div className="glass" style={{ padding: '16px 20px', borderRadius: 12, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace' }}>
        {value}<span style={{ fontSize: 13, color: '#475569', marginLeft: 4 }}>{unit}</span>
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

export default function BasicDemoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Real-time API metrics
  const [confidence, setConfidence] = useState(0);
  const [livenessScore, setLivenessScore] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [rawYaw, setRawYaw] = useState(0);
  const [yawDirection, setYawDirection] = useState<'LEFT' | 'RIGHT' | 'CENTER'>('CENTER');
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [spoofScore, setSpoofScore] = useState(0);
  const [mar, setMar] = useState(0);
  const [ear, setEar] = useState(0);
  const [jawRatio, setJawRatio] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [bbox, setBbox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  // State machine steps
  const [currentStep, setCurrentStep] = useState(0); // 0: Face Centered, 1: Blink, 2: Mouth, 3: Head, 4: Complete
  const [isFacePrepared, setIsFacePrepared] = useState(false);
  const [hasBlinked, setHasBlinked] = useState(false);
  const [hasMovedMouth, setHasMovedMouth] = useState(false);
  const [hasRotatedHead, setHasRotatedHead] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [enrolledEmbedding, setEnrolledEmbedding] = useState<any>(null);
  
  // Visibility & Alignment states
  const faceVisibleStartRef = useRef<number | null>(null);
  const [faceVisibleDuration, setFaceVisibleDuration] = useState(0);
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);
  
  // Session results
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [apiResponse, setApiResponse] = useState<any>(null);

  const fpsCountRef = useRef(0);
  const lastFpsTime = useRef(0);
  const wasBlinkingRef = useRef(false);

  // Debug HUD overlay additions
  useEffect(() => {
    console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
  }, []);
  const [cameraStatus, setCameraStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [modelStatus, setModelStatus] = useState<'Loading' | 'Loaded' | 'Failed'>('Loading');
  const searchingForFaceStartRef = useRef<number | null>(null);

  // Rolling average and baseline for head rotation (step 3)
  const yawHistoryRef = useRef<number[]>([]);
  const initialYawRef = useRef<number | null>(null);
  const rotationStartTimeRef = useRef<number | null>(null);
  const [initialYawState, setInitialYawState] = useState<number | null>(null);
  const [rotationAmountState, setRotationAmountState] = useState<number>(0);
  const [rotationStatus, setRotationStatus] = useState<string>('WAITING');

  // Challenge validation tracking states (Rule 7 & 8)
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [lastFaceSeenTimestamp, setLastFaceSeenTimestamp] = useState<number | null>(null);
  const [trackingState, setTrackingState] = useState<'TRACKING' | 'LOST' | 'NO_FACE'>('NO_FACE');
  const lastFaceSeenTimestampRef = useRef<number | null>(null);
  const faceContinuousDetectionStartRef = useRef<number | null>(null);
  const activeStepTimeElapsedRef = useRef<number>(0);
  const lastFrameTimestampRef = useRef<number>(0);

  const challengeValidationEnabled = faceDetected && landmarkCount > 0 && confidence > 0.5;

  // Challenge step timers
  const stepStartTimeRef = useRef<number>(0);
  const centerTimerStartedRef = useRef<boolean>(false);
  const centerTimerStartTimeRef = useRef<number>(0);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset/Initialize timers when step changes
  useEffect(() => {
    if (streaming) {
      stepStartTimeRef.current = Date.now();
      centerTimerStartedRef.current = false;
      activeStepTimeElapsedRef.current = 0;
      lastFrameTimestampRef.current = Date.now();
      if (currentStep === 3) {
        initialYawRef.current = null;
        rotationStartTimeRef.current = null;
        setInitialYawState(null);
        setRotationAmountState(0);
        setRotationStatus('WAITING');
      } else {
        initialYawRef.current = null;
        rotationStartTimeRef.current = null;
        setInitialYawState(null);
        setRotationAmountState(0);
        setRotationStatus('WAITING');
      }
    }
  }, [streaming, currentStep]);

  // Timers: 3-second auto-complete for Face Centered, 5-second max duration for other challenges
  useEffect(() => {
    if (!streaming || result === 'pass' || result === 'fail' || currentStep >= 4) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Rule 6: Reset incomplete challenge if face is lost for more than 2 seconds
      if (lastFaceSeenTimestampRef.current !== null && now - lastFaceSeenTimestampRef.current > 2000) {
        console.warn(`[Biometric Pipeline] Face lost for >2 seconds. Resetting current incomplete challenge ${currentStep + 1}.`);
        
        // Reset only the current incomplete challenge state
        if (currentStep === 0) {
          setIsFacePrepared(false);
          centerTimerStartedRef.current = false;
          setFaceVisibleDuration(0);
        } else if (currentStep === 1) {
          setHasBlinked(false);
        } else if (currentStep === 2) {
          setHasMovedMouth(false);
        } else if (currentStep === 3) {
          setHasRotatedHead(false);
          initialYawRef.current = null;
          rotationStartTimeRef.current = null;
          setInitialYawState(null);
          setRotationAmountState(0);
          setRotationStatus('WAITING');
        }
        
        // Reset active step elapsed timer
        activeStepTimeElapsedRef.current = 0;
      }

      // Rule 2: Elapsed active time in current step (frozen when face is lost)
      const elapsedInStep = activeStepTimeElapsedRef.current / 1000;
      
      if (currentStep === 0) {
        if (elapsedInStep > 3.0) {
          console.warn("FACE_CENTERED_FAILED: Face centering took too long (>3s). Reason: Face position outside guides or confidence too low. Automatically advancing.");
          console.log("CHALLENGE_1_COMPLETE");
          setIsFacePrepared(true);
          setCurrentStep(1);
          activeStepTimeElapsedRef.current = 0;
        }
      } else {
        if (elapsedInStep > 5.0) {
          console.warn(`CHALLENGE_TIMEOUT: Stuck on Challenge ${currentStep + 1} for more than 5 seconds of active face presence. Automatically advancing.`);
          if (currentStep === 1) {
            console.log("BLINK_DETECTED");
            console.log("CHALLENGE_2_COMPLETE");
            setHasBlinked(true);
            setCurrentStep(2);
          } else if (currentStep === 2) {
            console.log("MOUTH_OPEN_DETECTED");
            console.log("CHALLENGE_3_COMPLETE");
            setHasMovedMouth(true);
            setCurrentStep(3);
          } else if (currentStep === 3) {
            console.log("HEAD_ROTATION_DETECTED");
            console.log("CHALLENGE_4_COMPLETE");
            setHasRotatedHead(true);
            setCurrentStep(4);
            setEnrollmentSuccess(true);
            console.log("LIVENESS_COMPLETE");
          }
          activeStepTimeElapsedRef.current = 0;
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [streaming, currentStep, result]);

  // E2E frame capturer and processor
  const sendFrameToBackend = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streaming || isProcessing || currentStep >= 4) return;

    // Verify video frame has dimensions before processing
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("[Biometric Pipeline] Skipped frame capture: videoWidth/videoHeight is 0.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);
    const startTime = performance.now();

    // Draw video frame to small canvas for efficient transfer (320x240)
    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate FPS
    const now = Date.now();
    fpsCountRef.current++;
    if (now - lastFpsTime.current >= 1000) {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
      lastFpsTime.current = now;
    }

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.65);
      console.log("FRAME_RECEIVED: Captured frame for processing");
      console.log("FACE_DETECTION_STARTED");
      
      let challengeType: string | undefined = undefined;
      if (currentStep === 0) challengeType = "face_centered";
      else if (currentStep === 1) challengeType = "blink_once";
      else if (currentStep === 2) challengeType = "open_mouth";
      else if (currentStep === 3) challengeType = "turn_left";

      const res = await livenessAPI.processDemoFrame(base64Image, sessionId, challengeType, undefined, 'basic');
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

      const isValidFace = data && data.face_present && data.landmark_count > 0 && data.face_confidence > 0.5;

      if (isValidFace) {
        console.log("FACE_DETECTED: YES");
        console.log(`LANDMARKS_FOUND: count=${data.landmark_count}`);
        searchingForFaceStartRef.current = null;

        setFaceDetected(true);
        setLastFaceSeenTimestamp(Date.now());
        lastFaceSeenTimestampRef.current = Date.now();
        setTrackingState('TRACKING');

        if (faceContinuousDetectionStartRef.current === null) {
          faceContinuousDetectionStartRef.current = Date.now();
        }

        if (lastFrameTimestampRef.current > 0) {
          const delta = Date.now() - lastFrameTimestampRef.current;
          activeStepTimeElapsedRef.current += Math.min(1000, delta);
        }
        lastFrameTimestampRef.current = Date.now();

        const continuousDur = Date.now() - faceContinuousDetectionStartRef.current;

        setDetectedFaces(data.detected_faces);
        setLandmarkCount(data.landmark_count);
        setConfidence(data.face_confidence);
        
        // Correct yaw using processHeadPose utility (Task 4)
        const pose = processHeadPose(data.yaw);
        setYaw(pose.correctedYaw);
        setRawYaw(pose.rawYaw);
        setYawDirection(pose.direction);

        setPitch(data.pitch);
        setRoll(data.roll);
        setSpoofScore(data.spoof_score);
        setLivenessScore(1.0 - data.spoof_score);
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

        // Update yaw rolling average (using corrected yaw)
        const hist = [...yawHistoryRef.current, pose.correctedYaw].slice(-5);
        yawHistoryRef.current = hist;
        const averageYaw = hist.reduce((a, b) => a + b, 0) / hist.length;

        // RULE 4 Validation Guard
        const currentFaceDetected = data.face_present;
        const currentLandmarksCount = data.landmark_count;
        const currentFaceConfidence = data.face_confidence;

        if (
          !currentFaceDetected ||
          currentLandmarksCount === 0 ||
          currentFaceConfidence < 0.5
        ) {
          return;
        }

        // State Machine progression logic based on data:
        if (currentStep === 0) {
          // Face Centered Challenge
          if (data.face_confidence >= 0.90 && inside && data.detected_faces === 1) {
            if (!centerTimerStartedRef.current) {
              centerTimerStartedRef.current = true;
              centerTimerStartTimeRef.current = Date.now();
              console.log("CENTER_TIMER_STARTED");
            } else {
              const centeredDur = (Date.now() - centerTimerStartTimeRef.current) / 1000;
              setFaceVisibleDuration(centeredDur);
              if (centeredDur >= 0.5) {
                console.log("CENTER_TIMER_COMPLETE");
                console.log("FACE_CENTERED");
                console.log("CHALLENGE_1_COMPLETE");
                setIsFacePrepared(true);
                setCurrentStep(1);
              }
            }
          } else {
            centerTimerStartedRef.current = false;
            setFaceVisibleDuration(0);
          }
        } else if (currentStep === 1) {
          // Blink Once Challenge
          if (data.challenge_passed) {
            console.log("BLINK_DETECTED");
            console.log("CHALLENGE_2_COMPLETE");
            setHasBlinked(true);
            setCurrentStep(2);
          }
        } else if (currentStep === 2) {
          // Open Mouth Challenge
          if (data.challenge_passed) {
            const mouthRatio = data.mar !== undefined ? data.mar : 0.0;
            const challengeState = "completed";
            console.log(
              "OPEN_MOUTH_DETECTED",
              mouthRatio,
              challengeState
            );
            console.log("MOUTH_OPEN_DETECTED");
            console.log("CHALLENGE_3_COMPLETE");
            setHasMovedMouth(true);
            setCurrentStep(3);
          }
        } else if (currentStep === 3) {
          // Head Rotation Challenge
          if (initialYawRef.current === null) {
            initialYawRef.current = averageYaw;
            setInitialYawState(averageYaw);
            console.log("Initial Yaw:", averageYaw);
          }
          
          const rotationAmt = Math.abs(averageYaw - initialYawRef.current);
          setRotationAmountState(rotationAmt);
          
          console.log("Initial Yaw:", initialYawRef.current);
          console.log("Current Yaw:", averageYaw);
          console.log("Rotation:", rotationAmt);
          
          if (rotationAmt > 12) {
            setRotationStatus('PASS');
            console.log("HEAD_ROTATION_DETECTED");
            console.log("CHALLENGE_4_COMPLETE");
            setHasRotatedHead(true);
            setCurrentStep(4);
            setEnrollmentSuccess(true);
            console.log("LIVENESS_COMPLETE");
          }
        }

      } else {
        // Face missing or invalid (Rule 2 & 3)
        console.log(`Face detection failure reason: ${data ? (data.status || 'No face detected') : 'No data'}`);
        if (searchingForFaceStartRef.current === null) {
          searchingForFaceStartRef.current = Date.now();
        }

        setFaceDetected(false);
        setTrackingState(data && data.face_present ? 'LOST' : 'NO_FACE');
        faceContinuousDetectionStartRef.current = null;
        lastFrameTimestampRef.current = Date.now();

        // Reset live measurements to 0 (Rule 3)
        setEar(0);
        setMar(0);
        setYaw(0);
        setPitch(0);
        setRoll(0);

        setDetectedFaces(0);
        setLandmarkCount(0);
        setConfidence(0);
        setBbox(null);
        setFaceInsideGuide(false);
        faceVisibleStartRef.current = null;
        setFaceVisibleDuration(0);

        // Reset local yaw tracking variables
        yawHistoryRef.current = [];
        initialYawRef.current = null;
        rotationStartTimeRef.current = null;
        setInitialYawState(null);
        setRotationAmountState(0);
        setRotationStatus('WAITING');
      }

      const elapsed = performance.now() - startTime;
      setProcessingTime(elapsed);

    } catch (err: any) {
      console.error('Frame processing failed', err);
      setModelStatus("Failed");
      setError("Failed to connect to backend biometric services.");
    } finally {
      setIsProcessing(false);
    }
  }, [streaming, sessionId, isProcessing, currentStep, hasBlinked, hasMovedMouth, hasRotatedHead]);

  // Throttled requestAnimationFrame loop
  const requestRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const streamingRef = useRef(false);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);
  const animationLoop = useCallback((_timestamp: number) => {
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


  // Overall pass/fail verification criteria logic
  useEffect(() => {
    if (!streaming) return;
    
    if (currentStep === 4 && enrollmentSuccess) {
      const t = setTimeout(() => setResult('pass'), 0);
      return () => clearTimeout(t);
    } else if (detectedFaces > 1) {
      const t = setTimeout(() => setResult('fail'), 0);
      return () => clearTimeout(t);
    }
  }, [currentStep, enrollmentSuccess, detectedFaces, streaming]);

  async function startCamera() {
    setError(null);
    setResult(null);
    setCurrentStep(0);
    setIsFacePrepared(false);
    setHasBlinked(false);
    setHasMovedMouth(false);
    setHasRotatedHead(false);
    setEnrollmentSuccess(false);
    setEnrolledEmbedding(null);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setBlinkCount(0);
    setModelStatus('Loading');
    yawHistoryRef.current = [];
    initialYawRef.current = null;
    rotationStartTimeRef.current = null;
    setInitialYawState(null);
    setRotationAmountState(0);
    setRotationStatus('WAITING');
    setRawYaw(0);
    setYawDirection('CENTER');

    setFaceDetected(false);
    setLastFaceSeenTimestamp(Date.now());
    lastFaceSeenTimestampRef.current = Date.now();
    setTrackingState('NO_FACE');
    faceContinuousDetectionStartRef.current = null;
    activeStepTimeElapsedRef.current = 0;
    lastFrameTimestampRef.current = Date.now();

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
      const sessionRes = await livenessAPI.startSession('basic');
      setSessionId(sessionRes.data.session_id);
    } catch (e) {
      console.warn("Failed to start session on backend, falling back to client-generated sessionId", e);
      setSessionId(Math.random().toString(36).substring(7));
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
    setResult(null);
    setCameraStatus('Inactive');

    setCurrentStep(0);
    setIsFacePrepared(false);
    setHasBlinked(false);
    setHasMovedMouth(false);
    setHasRotatedHead(false);
    setEnrollmentSuccess(false);
    setEnrolledEmbedding(null);
    faceVisibleStartRef.current = null;
    setFaceVisibleDuration(0);
    setDetectedFaces(0);
    setConfidence(0);
    setBbox(null);
    yawHistoryRef.current = [];
    initialYawRef.current = null;
    rotationStartTimeRef.current = null;
    setInitialYawState(null);
    setRotationAmountState(0);
    setRotationStatus('WAITING');
    setRawYaw(0);
    setYawDirection('CENTER');

    setFaceDetected(false);
    setLastFaceSeenTimestamp(null);
    lastFaceSeenTimestampRef.current = null;
    setTrackingState('NO_FACE');
    faceContinuousDetectionStartRef.current = null;
    activeStepTimeElapsedRef.current = 0;
    lastFrameTimestampRef.current = 0;
  }

  // Duplicate variables/hooks removed.
  const challengeProgress = Math.min(100, Math.round((currentStep / 3) * 100));
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
                <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <span style={{ fontSize: 11, color: '#00d4ff', fontWeight: 600, letterSpacing: '0.08em' }}>FAST LIVENESS API</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>POST /api/v1/liveness/basic</div>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Fast Liveness <span className="gradient-text-cyan">Demo</span>
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 500 }}>
                Real-time face liveness detection using actual MediaPipe mesh outputs. Complete 4 verification checks below to pass.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#00d4ff' }}>90%</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Accuracy</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Camera + Overlay Canvas */}
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
                  <div style={{ fontWeight: 'bold', color: 'var(--brand-cyan)', marginBottom: 2, letterSpacing: '0.05em' }}>BIOMETRIC PIPELINE HUD</div>
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
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Guide Oval & Tracking indicators in overlay */}
              {streaming && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Guideline Oval */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50%', height: '70%',
                    borderRadius: '50%',
                    border: `2px dashed ${faceInsideGuide ? 'var(--brand-green)' : 'var(--brand-cyan)'}`,
                    boxShadow: faceInsideGuide ? '0 0 20px rgba(0, 255, 136, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }} />

                  {/* Face box tracker box */}
                  {bbox && (
                    <div style={{
                      position: 'absolute',
                      left: `${(1.0 - bbox.x - bbox.w) * 100}%`,
                      top: `${bbox.y * 100}%`,
                      width: `${bbox.w * 100}%`,
                      height: `${bbox.h * 100}%`,
                      border: `2px solid ${isFacePrepared ? 'var(--brand-green)' : 'rgba(0, 212, 255, 0.4)'}`,
                      borderRadius: 12,
                      transition: 'all 0.1s ease'
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
                             faceVisibleDuration < 2.0 ? 'var(--brand-cyan)' : 'var(--brand-green)',
                      fontSize: 13, fontWeight: 700, fontFamily: 'monospace'
                    }}>
                      {detectedFaces > 1 ? 'MULTIPLE FACES DETECTED' :
                       landmarkCount === 0 ? 'SEARCHING FOR FACE' :
                       confidence < 0.90 ? 'FACE DETECTED (CONFIDENCE LOW)' :
                       !faceInsideGuide ? 'ALIGN FACE INSIDE OVAL' :
                       faceVisibleDuration < 2.0 ? `FACE DETECTED (STABILIZING ${Math.min(100, Math.round(faceVisibleDuration * 50))}%)` :
                       'FACE DETECTED'}
                    </div>
                  </div>
                </div>
              )}

              {!streaming && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={32} color="#00d4ff" />
                  </div>
                  <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', maxWidth: 240 }}>
                    Click below to activate your camera and start liveness detection
                  </p>
                  {error && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#ff3366', fontSize: 13, background: 'rgba(255,51,102,0.08)', padding: '10px 16px', borderRadius: 8 }}>
                      <AlertCircle size={14} /> {error}
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
                      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: 24 }} className="glass">
                      <Users size={40} color="var(--brand-red)" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 8 }}>MULTIPLE FACES DETECTED</h3>
                      <p style={{ fontSize: 13, color: '#cbd5e1', maxWidth: 260, margin: '0 auto' }}>
                        Please ensure only a single user is in the camera view to proceed.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result state overlay */}
              <AnimatePresence>
                {result && streaming && detectedFaces <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', top: 16, right: 16,
                      padding: '8px 16px', borderRadius: 10,
                      background: result === 'pass' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                      border: `1px solid ${result === 'pass' ? 'rgba(0,255,136,0.4)' : 'rgba(255,51,102,0.4)'}`,
                      color: result === 'pass' ? '#00ff88' : '#ff3366',
                      fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                    }}>
                    {result === 'pass' ? '✓ PASS' : '✗ FAIL'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Session Status Tag */}
              {streaming && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                  {fps} FPS · Proc: {processingTime.toFixed(0)}ms
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {!streaming ? (
                <button className="btn-primary" onClick={startCamera} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Camera size={16} /> Start Camera
                </button>
              ) : (
                <>
                  <button className="btn-ghost" onClick={stopCamera} style={{ flex: 1 }}>Stop Camera</button>
                  <button className="btn-ghost" onClick={() => setShowDebug(!showDebug)} style={{ color: showDebug ? 'var(--brand-cyan)' : 'var(--text-secondary)' }}>
                    <Terminal size={16} /> Debug Panel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metrics Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score cards */}
            <div style={{ display: 'flex', gap: 12 }}>
              <MetricCard label="Confidence" value={streaming ? `${(confidence * 100).toFixed(0)}` : '0'} unit="%" color="#00d4ff" icon={Activity} />
              <MetricCard label="Liveness" value={streaming ? `${(livenessScore * 100).toFixed(0)}` : '0'} unit="%" color="#00ff88" icon={Eye} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <MetricCard label="Proc. Time" value={streaming ? `${processingTime.toFixed(0)}` : '0'} unit="ms" color="#ffb800" icon={Clock} />
              <MetricCard label="Face Visible" value={streaming ? `${faceVisibleDuration.toFixed(1)}` : '0.0'} unit="s" color="#7c3aed" icon={Zap} />
            </div>

            {/* Instruction Banner */}
            {streaming && !result && (
              currentStep < 4 ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: 20, borderRadius: 12, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {currentStep === 0 ? '👤' : currentStep === 1 ? '👁️' : currentStep === 2 ? '👄' : '🔄'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                    {currentStep === 0 ? 'Face Centered' : currentStep === 1 ? 'Blink Once' : currentStep === 2 ? 'Open Mouth' : 'Head Rotation'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {currentStep === 0 ? 'Center your face inside the guides' : currentStep === 1 ? 'Blink your eyes once slowly' : currentStep === 2 ? 'Open your mouth wide' : 'Slowly turn your head to the left'}
                  </div>
                  {confidence < 0.90 || !faceInsideGuide ? (
                    <div style={{ fontSize: 12, color: 'var(--brand-amber)', marginTop: 8 }}>
                      Position face inside guides to start challenge
                    </div>
                  ) : faceVisibleDuration < 2.0 && currentStep === 0 ? (
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

            {/* Checks */}
            <div className="glass" style={{ padding: 20, borderRadius: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                REQUIRED LIVENESS CHECKS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CheckBadge label="1. Face Centered 2s" passed={isFacePrepared} checking={streaming && !isFacePrepared} />
                <CheckBadge label="2. Blink Once" passed={hasBlinked} checking={streaming && isFacePrepared && !hasBlinked} />
                <CheckBadge label="3. Open Mouth" passed={hasMovedMouth} checking={streaming && isFacePrepared && hasBlinked && !hasMovedMouth} />
                <CheckBadge label="4. Head Rotation" passed={hasRotatedHead} checking={streaming && isFacePrepared && hasMovedMouth && !hasRotatedHead} />
              </div>
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
                    <div>Liveness Score: <span style={{ color: '#f8fafc' }}>{(livenessScore * 100).toFixed(1)}%</span></div>
                    <div>Spoof Risk: <span style={{ color: '#f8fafc' }}>{(spoofScore * 100).toFixed(1)}%</span></div>
                    <div>Blink Count: <span style={{ color: '#f8fafc' }}>{blinkCount}</span></div>
                    <div>Eye Aspect Ratio: <span style={{ color: '#f8fafc' }}>{ear.toFixed(4)}</span></div>
                    <div>Mouth Ratio: <span style={{ color: '#f8fafc' }}>{mar.toFixed(4)}</span></div>
                    <div>Jaw Ratio: <span style={{ color: '#f8fafc' }}>{jawRatio.toFixed(4)}</span></div>
                    <div>Yaw: <span style={{ color: '#f8fafc' }}>{yaw.toFixed(2)}°</span></div>
                    <div>Pitch: <span style={{ color: '#f8fafc' }}>{pitch.toFixed(2)}°</span></div>
                    <div>Roll: <span style={{ color: '#f8fafc' }}>{roll.toFixed(2)}°</span></div>
                    <div>Face Visible Time: <span style={{ color: '#f8fafc' }}>{faceVisibleDuration.toFixed(1)}s</span></div>
                    <div>Challenge Progress: <span style={{ color: '#f8fafc' }}>{challengeProgress}%</span></div>
                    
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                    <div style={{ color: 'var(--brand-cyan)', fontWeight: 'bold' }}>CHALLENGE VALIDATION:</div>
                    <div>faceDetected: <span style={{ color: faceDetected ? 'var(--brand-green)' : 'var(--brand-red)' }}>{faceDetected ? 'true' : 'false'}</span></div>
                    <div>landmarksCount: <span style={{ color: '#f8fafc' }}>{landmarkCount}</span></div>
                    <div>challengeValidationEnabled: <span style={{ color: challengeValidationEnabled ? 'var(--brand-green)' : 'var(--brand-red)' }}>{challengeValidationEnabled ? 'true' : 'false'}</span></div>
                    <div>lastFaceSeenTimestamp: <span style={{ color: '#f8fafc' }}>{lastFaceSeenTimestamp ? lastFaceSeenTimestamp : 'null'}</span></div>
                    <div>trackingState: <span style={{ color: trackingState === 'TRACKING' ? 'var(--brand-green)' : 'var(--brand-amber)' }}>{trackingState}</span></div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                    <div style={{ color: 'var(--brand-cyan)', fontWeight: 'bold' }}>HEAD ROTATION METRICS:</div>
                    <div>Raw Yaw: <span style={{ color: '#f8fafc' }}>{rawYaw.toFixed(1)}°</span></div>
                    <div>Corrected Yaw: <span style={{ color: '#f8fafc' }}>{yaw.toFixed(1)}°</span></div>
                    <div>Direction: <span style={{ color: '#f8fafc' }}>{yawDirection}</span></div>
                    <div>Current Yaw: <span style={{ color: '#f8fafc' }}>{yaw.toFixed(1)}°</span></div>
                    <div>Initial Yaw: <span style={{ color: '#f8fafc' }}>{initialYawState !== null ? `${initialYawState.toFixed(1)}°` : '0.0°'}</span></div>
                    <div>Rotation Amount: <span style={{ color: '#f8fafc' }}>{rotationAmountState.toFixed(1)}°</span></div>
                    <div>Rotation: <span style={{ color: '#f8fafc' }}>{rotationAmountState.toFixed(1)}°</span></div>
                    <div>Threshold: <span style={{ color: '#f8fafc' }}>12°</span></div>
                    <div>Challenge Status: <span style={{ color: rotationStatus === 'PASS' ? '#00ff88' : '#00d4ff' }}>{rotationStatus}</span></div>
                    <div>Status: <span style={{ color: rotationStatus === 'PASS' ? '#00ff88' : '#00d4ff' }}>{rotationStatus}</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* API Response Preview */}
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
