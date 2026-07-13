import React, { useEffect, useState, useRef } from 'react';

interface AdvancedDebugPanelProps {
  telemetry: {
    cameraStatus: string;
    detectedFaces: number;
    trackingState: string;
    landmarkCount: number;
    ear: number;
    blinkDetected: boolean;
    mar: number;
    mouthOpen: boolean;
    yaw: number;
    pitch: number;
    roll: number;
    confidence: number;
    identityScore: number;
    cosineSimilarity: number;
    livenessScore: number;
    spoofScore: number;
    deepfakeRisk: number;
    currentChallenge: number | string;
    challengeProgress: number;
    challengeTimeout: number;
    processingTime: number;
    apiVersion: string;
    verificationState: string;
    fraudDetection?: any;
    bbox?: any;
  };
  onDownloadReport: () => void;
}

export function AdvancedDebugPanel({ telemetry, onDownloadReport }: AdvancedDebugPanelProps) {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const [memory, setMemory] = useState<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    
    const measureFps = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      const delta = now - lastFpsTimeRef.current;
      
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
        
        // Try to get memory
        if ((performance as any).memory) {
          setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1048576));
        }
      }
      animationFrameId = requestAnimationFrame(measureFps);
    };
    
    animationFrameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      top: '80px',
      width: '320px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#00ffcc',
      border: '1px solid #00ffcc',
      borderRadius: '8px',
      padding: '12px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
      zIndex: 9999,
      boxShadow: '0 0 10px rgba(0,255,204,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>Advanced Telemetry</h3>
        <span style={{ backgroundColor: '#00ffcc', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{telemetry.apiVersion}</span>
      </div>

      {/* Performance Section */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#aaa', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>System Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <div>Render FPS: <span style={{ color: '#fff' }}>{fps}</span></div>
          <div>API Latency: <span style={{ color: '#fff' }}>{telemetry.processingTime}ms</span></div>
          {memory && <div>Memory: <span style={{ color: '#fff' }}>{memory} MB</span></div>}
        </div>
      </div>

      {/* Camera & Tracking */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#aaa', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Vision Pipeline</div>
        <div>Camera: <span style={{ color: telemetry.cameraStatus.includes('Active') ? '#0f0' : '#f00' }}>{telemetry.cameraStatus}</span></div>
        <div>Detected Faces: <span style={{ color: telemetry.detectedFaces > 1 ? '#f00' : '#fff' }}>{telemetry.detectedFaces}</span></div>
        <div>Tracking State: <span style={{ color: '#fff' }}>{telemetry.trackingState}</span></div>
        <div>Landmarks: <span style={{ color: '#fff' }}>{telemetry.landmarkCount}/478</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
          <div>Blink EAR: <span style={{ color: '#fff' }}>{telemetry.ear.toFixed(3)}</span></div>
          <div>Blinking: <span style={{ color: telemetry.blinkDetected ? '#0f0' : '#fff' }}>{telemetry.blinkDetected ? 'YES' : 'NO'}</span></div>
          <div>Mouth MAR: <span style={{ color: '#fff' }}>{telemetry.mar.toFixed(3)}</span></div>
          <div>Mouth Open: <span style={{ color: telemetry.mouthOpen ? '#0f0' : '#fff' }}>{telemetry.mouthOpen ? 'YES' : 'NO'}</span></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '4px' }}>
          <div>Y: <span style={{ color: '#fff' }}>{telemetry.yaw.toFixed(1)}°</span></div>
          <div>P: <span style={{ color: '#fff' }}>{telemetry.pitch.toFixed(1)}°</span></div>
          <div>R: <span style={{ color: '#fff' }}>{telemetry.roll.toFixed(1)}°</span></div>
        </div>
      </div>

      {/* Security & Biometrics */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#aaa', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Security Engine</div>
        <div>Verification State: <span style={{ color: '#0f0', fontWeight: 'bold' }}>{telemetry.verificationState}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Liveness Score:</span>
          <span style={{ color: telemetry.livenessScore > 0.5 ? '#0f0' : '#f00' }}>{(telemetry.livenessScore * 100).toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#333', marginTop: '2px' }}>
          <div style={{ width: `${telemetry.livenessScore * 100}%`, height: '100%', backgroundColor: telemetry.livenessScore > 0.5 ? '#0f0' : '#f00' }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span>Spoof Risk:</span>
          <span style={{ color: telemetry.spoofScore > 0.5 ? '#f00' : '#0f0' }}>{(telemetry.spoofScore * 100).toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '4px', backgroundColor: '#333', marginTop: '2px' }}>
          <div style={{ width: `${telemetry.spoofScore * 100}%`, height: '100%', backgroundColor: telemetry.spoofScore > 0.5 ? '#f00' : '#0f0' }} />
        </div>

        {telemetry.fraudDetection && (
           <div style={{ marginTop: '8px', padding: '4px', backgroundColor: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', fontSize: '10px' }}>
             <div style={{ color: '#ff4444', marginBottom: '2px', fontWeight: 'bold' }}>Sub-Signals:</div>
             {telemetry.fraudDetection.printed_photo?.detected && <div>[!] Printed Photo ({telemetry.fraudDetection.printed_photo.confidence.toFixed(2)})</div>}
             {telemetry.fraudDetection.replay_attack?.detected && <div>[!] Screen Replay ({telemetry.fraudDetection.replay_attack.confidence.toFixed(2)})</div>}
             {telemetry.fraudDetection.deepfake?.detected && <div>[!] Jitter/Deepfake ({telemetry.fraudDetection.deepfake.confidence.toFixed(2)})</div>}
             {telemetry.fraudDetection.ai_generated?.detected && <div>[!] AI Symmetry ({telemetry.fraudDetection.ai_generated.confidence.toFixed(2)})</div>}
             {telemetry.fraudDetection.screen_reflection?.detected && <div>[!] Reflection ({telemetry.fraudDetection.screen_reflection.confidence.toFixed(2)})</div>}
           </div>
        )}
      </div>

      {/* Identity */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#aaa', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Identity</div>
        <div>Confidence: <span style={{ color: '#fff' }}>{(telemetry.confidence * 100).toFixed(1)}%</span></div>
        <div>Cosine Sim: <span style={{ color: '#fff' }}>{(telemetry.cosineSimilarity * 100).toFixed(1)}%</span></div>
        <div>Identity Match: <span style={{ color: telemetry.identityScore > 0.75 ? '#0f0' : '#faa' }}>{(telemetry.identityScore * 100).toFixed(1)}%</span></div>
      </div>

      {/* Challenge Progress */}
      {telemetry.currentChallenge !== '' && telemetry.currentChallenge !== -1 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: '#aaa', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Challenge Logic</div>
          <div>Active: <span style={{ color: '#fff' }}>{telemetry.currentChallenge}</span></div>
          <div>Progress: <span style={{ color: '#fff' }}>{telemetry.challengeProgress}%</span></div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#333', marginTop: '2px' }}>
            <div style={{ width: `${telemetry.challengeProgress}%`, height: '100%', backgroundColor: '#00ffcc' }} />
          </div>
          <div>Timeout In: <span style={{ color: '#fff' }}>{telemetry.challengeTimeout.toFixed(1)}s</span></div>
        </div>
      )}

      <button 
        onClick={onDownloadReport}
        style={{
          width: '100%',
          padding: '8px',
          marginTop: '10px',
          backgroundColor: '#00ffcc',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Download Session JSON
      </button>

    </div>
  );
}
