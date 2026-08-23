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
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
      {/* Corner Brackets - Animated Scale/Opacity */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 24, height: 24, borderTop: `3px solid ${activeColor}`, borderLeft: `3px solid ${activeColor}`, boxShadow: `-3px -3px 10px ${activeColor}30` }} />
          <div style={{ width: 24, height: 24, borderTop: `3px solid ${activeColor}`, borderRight: `3px solid ${activeColor}`, boxShadow: `3px -3px 10px ${activeColor}30` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 24, height: 24, borderBottom: `3px solid ${activeColor}`, borderLeft: `3px solid ${activeColor}`, boxShadow: `-3px 3px 10px ${activeColor}30` }} />
          <div style={{ width: 24, height: 24, borderBottom: `3px solid ${activeColor}`, borderRight: `3px solid ${activeColor}`, boxShadow: `3px 3px 10px ${activeColor}30` }} />
        </div>
      </motion.div>

      {/* Sweeping Scanner Line */}
      <motion.div
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
          boxShadow: `0 0 15px ${activeColor}, 0 0 30px ${activeColor}50`,
          opacity: 0.7,
        }}
      />

      {/* Conic Radar Sweep */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '70%',
        height: '70%',
        borderRadius: '50%',
        border: `1px solid ${activeColor}10`,
        boxShadow: `inset 0 0 50px ${activeColor}03`,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, ${activeColor}12, transparent 60%)`,
          }}
        />
      </div>

      {/* Target Bounding Box Reticle */}
      {bbox && (
        <div
          style={{
            position: 'absolute',
            left: `${(1.0 - bbox.x - bbox.w) * 100}%`,
            top: `${bbox.y * 100}%`,
            width: `${bbox.w * 100}%`,
            height: `${bbox.h * 100}%`,
            border: `1px solid ${activeColor}60`,
            boxShadow: `0 0 20px ${activeColor}20, inset 0 0 10px ${activeColor}10`,
            borderRadius: 12,
            transition: 'all 0.1s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Inner ring for depth */}
          <div style={{
            position: 'absolute',
            inset: 4,
            border: `1px dashed ${activeColor}30`,
            borderRadius: 8,
          }} />

          {/* Reticle Corners */}
          <div style={{ position: 'absolute', top: -3, left: -3, width: 12, height: 12, borderTop: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderTop: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 12, height: 12, borderBottom: `2px solid ${activeColor}`, borderLeft: `2px solid ${activeColor}` }} />
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderBottom: `2px solid ${activeColor}`, borderRight: `2px solid ${activeColor}` }} />
          
          {/* Crosshair extensions */}
          <div style={{ position: 'absolute', left: '50%', top: -8, width: 1, height: 5, background: activeColor }} />
          <div style={{ position: 'absolute', left: '50%', bottom: -8, width: 1, height: 5, background: activeColor }} />
          <div style={{ position: 'absolute', top: '50%', left: -8, width: 5, height: 1, background: activeColor }} />
          <div style={{ position: 'absolute', top: '50%', right: -8, width: 5, height: 1, background: activeColor }} />

          {/* HUD tag showing confidence */}
          <div style={{
            position: 'absolute',
            top: -26,
            left: 0,
            background: 'rgba(5, 8, 16, 0.9)',
            border: `1px solid ${activeColor}`,
            color: activeColor,
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 4,
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            boxShadow: `0 0 10px ${activeColor}30`
          }}>
            FACE DETECTION: {Number((confidence * 100) || 0).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Telemetry Metrics HUD Pane */}
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
        background: 'rgba(3,7,18,0.75)',
        backdropFilter: 'blur(8px)',
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${activeColor}30`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px ${activeColor}10`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ opacity: 0.6 }}>SYSTEM:</span>
          <span style={{ fontWeight: 700 }}>ONLINE</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ opacity: 0.6 }}>EAR (EYES):</span>
          <span>{Number(ear || 0).toFixed(3)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ opacity: 0.6 }}>MAR (MOUTH):</span>
          <span>{Number(mar || 0).toFixed(3)}</span>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        fontFamily: 'monospace',
        fontSize: 10,
        color: activeColor,
        background: 'rgba(3,7,18,0.75)',
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        borderRadius: 6,
        border: `1px solid ${activeColor}30`,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontWeight: 600,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px ${activeColor}10`
      }}>
        {challengeLabel}
      </div>
    </div>
  );
}
