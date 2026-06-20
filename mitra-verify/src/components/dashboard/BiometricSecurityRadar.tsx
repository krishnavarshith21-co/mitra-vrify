'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BiometricSecurityRadar() {
  const [data, setData] = useState<{
    face: number;
    liveness: number;
    spoof: number;
    identity: number;
    attention: number;
    confidence: number;
  } | null>(null);

  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const res = await fetch('/api/events');
        const events = await res.json();
        if (Array.isArray(events) && events.length > 0) {
          const ev = events[0];
          setData({
            face: ev.faceDetectedFlag ? 100 : 0,
            liveness: ev.confidence * 100,
            spoof: ev.spoofFlag ? 10 : 100,
            identity: ev.identityMatchedFlag ? 100 : (ev.status === 'NO FACE DETECTED' ? 0 : 50),
            attention: (ev.attentionScore || 0) * 100,
            confidence: ev.confidence * 100,
          });
        }
      } catch (err) {
        console.error('Failed to fetch radar events', err);
      }
    };

    fetchRadarData();
    const interval = setInterval(fetchRadarData, 2000);
    return () => clearInterval(interval);
  }, []);

  const size = 280;
  const center = size / 2;
  const radius = (size / 2) - 40;
  const numAxes = 5;

  const getPoint = (val: number, index: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = (val / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const labels = [
    { name: 'FACE', val: data?.face },
    { name: 'LIVENESS', val: data?.liveness },
    { name: 'ANTI-SPOOF', val: data?.spoof },
    { name: 'IDENTITY', val: data?.identity },
    { name: 'ATTENTION', val: data?.attention },
  ];

  const polygonPoints = data 
    ? labels.map((l, i) => {
        const p = getPoint(l.val || 0, i);
        return `${p.x},${p.y}`;
      }).join(' ')
    : '';

  const axesLines = Array.from({ length: numAxes }).map((_, i) => {
    const end = getPoint(100, i);
    return <line key={`axis-${i}`} x1={center} y1={center} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
  });

  const concentricRings = [20, 40, 60, 80, 100].map((pct, idx) => {
    const pts = Array.from({ length: numAxes }).map((_, i) => {
      const p = getPoint(pct, i);
      return `${p.x},${p.y}`;
    }).join(' ');
    return (
      <polygon key={`ring-${idx}`} points={pts} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    );
  });

  const threatScore = data ? Math.max(0, 100 - (data.spoof + data.liveness) / 2).toFixed(1) : '0.0';
  const riskIndex = data ? (data.spoof < 50 ? 'HIGH' : data.face === 0 ? 'MODERATE' : 'LOW') : 'N/A';

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-full flex items-center justify-center overflow-hidden bg-black/40 border border-white/5" style={{ boxShadow: 'inset 0 0 60px rgba(0, 212, 255, 0.05)' }}>
        
        {/* Particle Field Background */}
        <div className="absolute inset-0 z-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[spin_60s_linear_infinite]" />

        {/* Outer rotating scan ring */}
        <div 
          className="absolute inset-0 z-0 origin-center rounded-full"
          style={{
            background: 'conic-gradient(from 90deg at 50% 50%, transparent 0deg, transparent 270deg, rgba(0, 212, 255, 0.15) 360deg)',
            animation: 'radar-sweep 4s infinite linear'
          }}
        />

        {!data ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-ping mb-3" />
            <p className="text-[#00d4ff] text-xs font-mono uppercase tracking-widest text-center px-4">Waiting for<br/>Verification Data</p>
          </div>
        ) : null}

        <svg width={size} height={size} className="relative z-10 overflow-visible">
          {concentricRings}
          {axesLines}

          <AnimatePresence>
            {data && (
              <motion.polygon
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                points={polygonPoints}
                fill="rgba(0, 212, 255, 0.15)"
                stroke="#00d4ff"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.4))' }}
              />
            )}
          </AnimatePresence>

          {/* Dots on axes */}
          {data && labels.map((l, i) => {
            const p = getPoint(l.val || 0, i);
            return (
              <motion.circle
                key={`dot-${i}`}
                initial={{ r: 0 }}
                animate={{ r: 4 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                cx={p.x}
                cy={p.y}
                fill="#00ff88"
                style={{ filter: 'drop-shadow(0 0 5px rgba(0,255,136,0.8))' }}
              />
            );
          })}

          {/* Pulsing center node */}
          <circle cx={center} cy={center} r="3" fill="#fff" className="animate-pulse" />

          {/* Labels */}
          {labels.map((l, i) => {
            // Push labels out slightly further than the 100% mark
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const r = radius + 20;
            const px = center + r * Math.cos(angle);
            const py = center + r * Math.sin(angle);
            
            // Adjust alignment based on angle
            let anchor: "middle" | "start" | "end" = "middle";
            if (Math.cos(angle) > 0.1) anchor = "start";
            else if (Math.cos(angle) < -0.1) anchor = "end";

            return (
              <g key={`label-${i}`}>
                <text x={px} y={py} textAnchor={anchor} fill="#94a3b8" fontSize="9" fontWeight="600" letterSpacing="0.05em" className="font-mono">
                  {l.name}
                </text>
                {data && (
                  <text x={px} y={py + 12} textAnchor={anchor} fill={l.val === 100 ? '#00ff88' : '#fff'} fontSize="10" fontWeight="700" className="font-mono">
                    {Math.round(l.val || 0)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Metrics Footer */}
      <div className="w-full mt-6 grid grid-cols-3 gap-2">
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Threat</div>
          <div className={`font-mono font-semibold text-sm ${parseFloat(threatScore) > 20 ? 'text-[#ff3366]' : 'text-[#00ff88]'}`}>
            {threatScore}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Confidence</div>
          <div className="font-mono font-semibold text-sm text-[#00d4ff]">
            {data ? data.confidence.toFixed(1) : '0.0'}%
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Risk</div>
          <div className={`font-mono font-semibold text-sm ${riskIndex === 'HIGH' ? 'text-[#ff3366]' : riskIndex === 'LOW' ? 'text-[#00ff88]' : 'text-[#ffb800]'}`}>
            {riskIndex}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
