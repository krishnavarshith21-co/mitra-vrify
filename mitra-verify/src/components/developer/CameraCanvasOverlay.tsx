import React, { useRef, useEffect } from 'react';

interface CameraCanvasOverlayProps {
  landmarks: any[];
  bbox: any;
  yaw: number;
  pitch: number;
  roll: number;
  trackingState: string;
  videoWidth: number;
  videoHeight: number;
}

export function CameraCanvasOverlay({ landmarks, bbox, yaw, pitch, roll, trackingState, videoWidth, videoHeight }: CameraCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // Draw Bounding Box
    if (bbox) {
      const x = bbox.x * canvas.width;
      const y = bbox.y * canvas.height;
      const w = bbox.w * canvas.width;
      const h = bbox.h * canvas.height;
      
      ctx.strokeStyle = trackingState === 'TRACKING' ? '#00ffcc' : '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      
      // Draw text above box
      ctx.fillStyle = trackingState === 'TRACKING' ? '#00ffcc' : '#ff0000';
      ctx.font = '14px monospace';
      ctx.fillText(`State: ${trackingState}`, x, y - 5);
    }

    // Draw all 468 landmarks faintly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    landmarks.forEach((lm) => {
      // Invert X because the video is usually scaleX(-1) in these demo apps, 
      // but mediapipe returns coordinates as if it wasn't inverted, or it already accounts for it.
      // We assume coordinates from backend are 0-1 mapped to the image we sent.
      const px = lm[0] * canvas.width;
      const py = lm[1] * canvas.height;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw prominent landmarks (Eyes, Nose, Mouth)
    const highlightPoint = (idx: number, color: string) => {
      if (landmarks[idx]) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(landmarks[idx][0] * canvas.width, landmarks[idx][1] * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    };
    
    // Left Eye, Right Eye, Nose Tip
    highlightPoint(33, '#ff00ff');
    highlightPoint(263, '#ff00ff');
    highlightPoint(1, '#00ff00');
    
    // Mouth upper, lower
    highlightPoint(13, '#ffff00');
    highlightPoint(14, '#ffff00');

    // Draw Head Pose Crosshairs (Axis lines originating from nose tip)
    if (landmarks[1]) {
      const nx = landmarks[1][0] * canvas.width;
      const ny = landmarks[1][1] * canvas.height;
      
      const axisLength = 50;
      
      // Pitch (Up/Down) -> mapped roughly to Y axis change
      ctx.strokeStyle = '#ff0000'; // Red for Pitch
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx, ny - Math.sin(pitch * Math.PI / 180) * axisLength);
      ctx.stroke();
      
      // Yaw (Left/Right) -> mapped to X axis change
      ctx.strokeStyle = '#00ff00'; // Green for Yaw
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx - Math.sin(yaw * Math.PI / 180) * axisLength, ny);
      ctx.stroke();
      
      // Roll (Tilt) -> angle
      ctx.strokeStyle = '#0000ff'; // Blue for Roll
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(
        nx + Math.cos(roll * Math.PI / 180) * axisLength, 
        ny + Math.sin(roll * Math.PI / 180) * axisLength
      );
      ctx.stroke();
    }

  }, [landmarks, bbox, yaw, pitch, roll, trackingState, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        transform: 'scaleX(-1)' // Mirror to match video if video is mirrored
      }}
    />
  );
}
