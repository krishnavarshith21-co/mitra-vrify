'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BiometricScannerOverlayProps {
  faceInside: boolean;
  confidence: number;
  detectedFaces: number;
  bbox?: { x: number; y: number; w: number; h: number } | null;
  ear?: number;
  mar?: number;
  challengeLabel?: string;
  themeColor?: string;
}

export default function BiometricScannerOverlay({
  faceInside,
  confidence,
  detectedFaces,
  bbox,
  ear = 0,
  mar = 0,
  challengeLabel = 'SCANNING PIPELINE',
  themeColor = '#00d4ff'
}: BiometricScannerOverlayProps) {
  const activeColor = detectedFaces > 1 ? '#ff3366' : faceInside ? '#00ff88' : themeColor;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Corner Brackets */}
      <div style={{ position: 'absolute', inset: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 20, height: 20, borderTop: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ width: 20, height: 20, borderTop: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 20, height: 20, borderBottom: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ width: 20, height: 20, borderBottom: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
        </div>
      </div>

      {/* Sweeping Scanner Line */}
      <motion.div
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
          boxShadow: `0 0 10px ${activeColor}`,
          opacity: 0.6,
        }}
      />

      {/* Scanning Rings / Radar Sweep in the background */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%',
        height: '80%',
        borderRadius: '50%',
        border: `1px solid ${activeColor}15`,
        boxShadow: `inset 0 0 40px ${activeColor}08`,
      }}>
        {/* Sweep effect */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${activeColor}15, transparent 50%)`,
          }}
        />
      </div>

      {/* Target Face Bounding Box (mirrored if needed, standard overlay is relative to container) */}
      {bbox && (
        <div
          style={{
            position: 'absolute',
            left: `${(1.0 - bbox.x - bbox.w) * 100}%`,
            top: `${bbox.y * 100}%`,
            width: `${bbox.w * 100}%`,
            height: `${bbox.h * 100}%`,
            border: `2px solid ${activeColor}`,
            boxShadow: `0 0 12px ${activeColor}40`,
            borderRadius: 12,
            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Target Reticle corners */}
          <div style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, borderTop: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, borderTop: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, borderBottom: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, borderBottom: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
          
          {/* Tag displaying confidence */}
          <div style={{
            position: 'absolute',
            top: -24,
            left: 0,
            background: activeColor,
            color: '#000',
            fontSize: 9,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'monospace'
          }}>
            CONF: {(confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Left/Right telemetry metrics bars */}
      <div style={{
        position: 'absolute',
        top: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'monospace',
        fontSize: 10,
        color: activeColor,
        background: 'rgba(3,7,18,0.6)',
        backdropFilter: 'blur(4px)',
        padding: 8,
        borderRadius: 8,
        border: `1px solid ${activeColor}20`
      }}>
        <div>SYS: ONLINE</div>
        <div>EAR: {ear.toFixed(3)}</div>
        <div>MAR: {mar.toFixed(3)}</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        fontFamily: 'monospace',
        fontSize: 10,
        color: activeColor,
        background: 'rgba(3,7,18,0.6)',
        backdropFilter: 'blur(4px)',
        padding: '6px 12px',
        borderRadius: 6,
        border: `1px solid ${activeColor}20`,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        {challengeLabel}
      </div>
    </div>
  );
}
