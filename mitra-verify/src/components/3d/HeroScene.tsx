'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Stars,
  OrbitControls,
  Trail,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

// ─── Types ───────────────────────────────────────────────────────────────────
export type ScanPhase =
  | 'searching'
  | 'detected'
  | 'landmarks'
  | 'liveness'
  | 'identity'
  | 'granted';

const PHASE_ORDER: ScanPhase[] = [
  'searching',
  'detected',
  'landmarks',
  'liveness',
  'identity',
  'granted',
];

const PHASE_COLORS: Record<ScanPhase, string> = {
  searching: '#f59e0b',
  detected:  '#00d4ff',
  landmarks: '#00d4ff',
  liveness:  '#10b981',
  identity:  '#3b82f6',
  granted:   '#10b981',
};

const PHASE_LABELS: Record<ScanPhase, string> = {
  searching: 'SCANNING FOR SUBJECT',
  detected:  'FACE DETECTED',
  landmarks: 'MAPPING LANDMARKS',
  liveness:  'LIVENESS CHECK',
  identity:  'VERIFYING IDENTITY',
  granted:   'ACCESS GRANTED',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function phaseColor(phase: ScanPhase): THREE.Color {
  return hexToRgb(PHASE_COLORS[phase]);
}

// ─── Face Particle Cloud (478 points in face-oval layout) ────────────────────
function FaceParticles({ phase, isMobile }: { phase: ScanPhase; isMobile: boolean }) {
  const meshRef = useRef<THREE.Points>(null!);
  const COUNT = isMobile ? 150 : 478;

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    let seed = 12345;
    const lcg = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Generate face-oval shaped point cloud
    for (let i = 0; i < COUNT; i++) {
      // Parametric face oval: ellipsoid with noise
      const t = (i / COUNT) * Math.PI * 2;
      const layer = Math.floor(i / 30); // 0-15 vertical layers
      const yNorm = (layer / 16) * 2 - 1; // -1 to 1
      const yPos = yNorm * 1.35;

      // Ellipse radius at this y height — narrower at top and bottom
      const faceMask = Math.sqrt(Math.max(0, 1 - yNorm * yNorm * 0.6));
      const xRadius = 0.85 * faceMask;
      const zRadius = 0.45 * faceMask;

      const angle = t + (lcg() - 0.5) * 0.4;
      const r = 0.7 + lcg() * 0.3; // slight radial variance

      pos[i * 3 + 0] = Math.cos(angle) * xRadius * r + (lcg() - 0.5) * 0.05;
      pos[i * 3 + 1] = yPos + (lcg() - 0.5) * 0.1;
      pos[i * 3 + 2] = Math.sin(angle) * zRadius * r + (lcg() - 0.5) * 0.05;

      col[i * 3 + 0] = 0.0;
      col[i * 3 + 1] = 0.83;
      col[i * 3 + 2] = 1.0;
    }
    return { positions: pos, colors: col };
  }, [COUNT]);

  const targetColor = useMemo(() => phaseColor(phase), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    currentColor.current.lerp(targetColor, delta * 2);
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.color.copy(currentColor.current);
    meshRef.current.rotation.y += delta * 0.08;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Wireframe Face Sphere ────────────────────────────────────────────────────
function FaceSphere({ phase }: { phase: ScanPhase }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetColor = useMemo(() => phaseColor(phase), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    currentColor.current.lerp(targetColor, delta * 1.5);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(currentColor.current);
    mat.opacity = phase === 'granted' ? 0.25 : 0.12;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={PHASE_COLORS[phase]}
        wireframe
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Pulsing Granted Sphere ───────────────────────────────────────────────────
function GrantedPulse({ visible }: { visible: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current || !visible) return;
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 3) * 0.08;
    meshRef.current.scale.setScalar(scale);
    if (matRef.current) {
      matRef.current.opacity = 0.18 + Math.sin(t * 3) * 0.08;
    }
  });

  if (!visible) return null;
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.05, 32, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color="#10b981"
        transparent
        opacity={0.22}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Animated Scan Ring ───────────────────────────────────────────────────────
function ScanRing({ phase }: { phase: ScanPhase }) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const targetColor = useMemo(() => phaseColor(phase), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    currentColor.current.lerp(targetColor, delta * 2);
    groupRef.current.rotation.y += delta * 0.9;
    groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.3;
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.color.copy(currentColor.current);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer scan ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.008, 8, 80]} />
        <meshBasicMaterial color={PHASE_COLORS[phase]} transparent opacity={0.8} />
      </mesh>
      {/* Inner secondary ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.004, 8, 60]} />
        <meshBasicMaterial color={PHASE_COLORS[phase]} transparent opacity={0.4} />
      </mesh>
      {/* Scan line beam */}
      <Trail
        width={0.04}
        length={6}
        color={new THREE.Color(PHASE_COLORS[phase])}
        attenuation={(t) => t * t}
      >
        <mesh position={[1.35, 0, 0]}>
          <sphereGeometry args={[0.025]} />
          <meshBasicMaterial color={PHASE_COLORS[phase]} />
        </mesh>
      </Trail>
    </group>
  );
}

// ─── Volumetric Light Cone ────────────────────────────────────────────────────
function VolumetricLight({ phase }: { phase: ScanPhase }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetColor = useMemo(() => phaseColor(phase), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    currentColor.current.lerp(targetColor, delta * 1.5);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(currentColor.current);
    const pulse = 0.05 + Math.sin(clock.getElapsedTime() * 1.5) * 0.015;
    mat.opacity = pulse;
  });

  return (
    <mesh ref={meshRef} position={[0, 4.5, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[1.2, 4, 32, 1, true]} />
      <meshBasicMaterial
        color={PHASE_COLORS[phase]}
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Corner Brackets ─────────────────────────────────────────────────────────
function CornerBrackets({ phase }: { phase: ScanPhase }) {
  const groupRef = useRef<THREE.Group>(null!);
  const targetColor = useMemo(() => phaseColor(phase), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    currentColor.current.lerp(targetColor, delta * 2);
    // Subtle breathe
    const s = 1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.015;
    groupRef.current.scale.setScalar(s);
  });

  const corners = [
    [1.1, 1.45],
    [-1.1, 1.45],
    [1.1, -1.45],
    [-1.1, -1.45],
  ] as [number, number][];

  return (
    <group ref={groupRef}>
      {corners.map(([x, y], i) => (
        <group key={i} position={[x, y, 0.3]}>
          {/* Horizontal bar */}
          <mesh position={[x > 0 ? -0.08 : 0.08, 0, 0]}>
            <boxGeometry args={[0.22, 0.015, 0.015]} />
            <meshBasicMaterial color={PHASE_COLORS[phase]} />
          </mesh>
          {/* Vertical bar */}
          <mesh position={[0, y > 0 ? -0.08 : 0.08, 0]}>
            <boxGeometry args={[0.015, 0.22, 0.015]} />
            <meshBasicMaterial color={PHASE_COLORS[phase]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Holographic Panel ────────────────────────────────────────────────────────
interface HoloPanelProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  phase: ScanPhase;
  index: number;
}

function HoloPanel({ position, rotation = [0, 0, 0], phase, index }: HoloPanelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const lines = useMemo(() => {
    let seed = 98765;
    const lcg = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 6 }, (_, i) => ({
      width: 0.35 + lcg() * 0.45,
      y: 0.28 - i * 0.1,
      speed: 0.4 + lcg() * 0.6,
      delay: lcg() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7 + index) * 0.08;
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.3 + index) * 0.04;
  });

  const color = PHASE_COLORS[phase];

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Panel background */}
      <mesh>
        <planeGeometry args={[1.0, 0.8]} />
        <meshBasicMaterial color="#0a0f1e" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Panel border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.0, 0.8)]} />
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
      {/* Metric lines */}
      {lines.map((line, i) => (
        <DataLine key={i} {...line} color={color} phase={phase} />
      ))}
    </group>
  );
}

interface DataLineProps {
  width: number;
  y: number;
  speed: number;
  delay: number;
  color: string;
  phase: ScanPhase;
}

function DataLine({ width, y, speed, delay, color }: DataLineProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const animated = Math.abs(Math.sin(t * speed + delay));
    meshRef.current.scale.x = 0.3 + animated * 0.7;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.color.copy(targetColor);
    mat.opacity = 0.5 + animated * 0.5;
  });

  return (
    <mesh ref={meshRef} position={[-0.25, y, 0.001]}>
      <planeGeometry args={[width, 0.012]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

// ─── Floating Ambient Particles ───────────────────────────────────────────────
function AmbientParticles({ isMobile }: { isMobile: boolean }) {
  const COUNT = isMobile ? 80 : 300;
  const meshRef = useRef<THREE.Points>(null!);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sp = new Float32Array(COUNT);
    let seed = 54321;
    const lcg = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (lcg() - 0.5) * 14;
      pos[i * 3 + 1] = (lcg() - 0.5) * 10;
      pos[i * 3 + 2] = (lcg() - 0.5) * 8 - 2;
      sp[i] = 0.1 + lcg() * 0.3;
    }
    return { positions: pos, speeds: sp };
  }, [COUNT]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      posAttr.array[i * 3 + 1] += speeds[i] * 0.003;
      // Wrap particles that float too high
      if ((posAttr.array as Float32Array)[i * 3 + 1] > 5.5) {
        (posAttr.array as Float32Array)[i * 3 + 1] = -5.5;
      }
      // Gentle sway
      (posAttr.array as Float32Array)[i * 3] += Math.sin(t * speeds[i] + i) * 0.0005;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00d4ff"
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Phase HUD Text (Billboard using sprites) ─────────────────────────────────
function PhaseHUD({ phase }: { phase: ScanPhase }) {
  const meshRef = useRef<THREE.Sprite>(null!);

  // Create canvas texture for the phase text
  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 64);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = PHASE_COLORS[phase];
    ctx.textAlign = 'center';
    ctx.fillText(`● ${PHASE_LABELS[phase]}`, 256, 38);
    return new THREE.CanvasTexture(canvas);
  }, [phase]);

  useEffect(() => {
    if (meshRef.current && texture) {
      (meshRef.current.material as THREE.SpriteMaterial).map = texture;
      (meshRef.current.material as THREE.SpriteMaterial).needsUpdate = true;
    }
  }, [texture]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = -1.9 + Math.sin(t * 1.5) * 0.04;
    const mat = meshRef.current.material as THREE.SpriteMaterial;
    mat.opacity = 0.7 + Math.sin(t * 2) * 0.3;
  });

  if (!texture) return null;

  return (
    <sprite ref={meshRef} position={[0, -1.9, 0.5]} scale={[3.5, 0.44, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
function Scene({ phase, isMobile }: { phase: ScanPhase; isMobile: boolean }) {
  const [lowPerformance, setLowPerformance] = useState(false);
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    lastFrameTime.current = now;

    // Track deltas to calculate moving average FPS over last 60 frames
    frameTimes.current.push(delta);
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift();
    }

    if (frameTimes.current.length === 60) {
      const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / 60;
      const currentFps = 1000 / avgDelta;
      if (currentFps < 45 && !lowPerformance) {
        setLowPerformance(true);
        console.warn(`[HeroScene] Performance dropped below 45 FPS (${currentFps.toFixed(1)}). Disabling expensive Three.js bloom post-processing.`);
      }
    }
  });

  const isLowPerf = isMobile || lowPerformance;

  return (
    <>
      {/* Camera controls - subtle auto-rotate */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 2.8}
      />

      {/* Stars background */}
      <Stars radius={60} depth={40} count={2000} factor={2} saturation={0} fade speed={0.5} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 2]} intensity={1.5} color={PHASE_COLORS[phase]} />
      <pointLight position={[-3, 0, 2]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[3, 0, 2]} intensity={0.6} color="#8b5cf6" />

      {/* Volumetric light cone */}
      <VolumetricLight phase={phase} />

      {/* Core face sphere */}
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.15}>
        <group>
          <FaceSphere phase={phase} />
          <FaceParticles phase={phase} isMobile={isLowPerf} />
          <GrantedPulse visible={phase === 'granted'} />
          <ScanRing phase={phase} />
          <CornerBrackets phase={phase} />
          <PhaseHUD phase={phase} />
        </group>
      </Float>

      {/* Holographic side panels */}
      <HoloPanel
        position={[-2.6, 0.3, -0.5]}
        rotation={[0, 0.45, 0]}
        phase={phase}
        index={0}
      />
      <HoloPanel
        position={[2.6, 0.3, -0.5]}
        rotation={[0, -0.45, 0]}
        phase={phase}
        index={1}
      />
      <HoloPanel
        position={[0, 2.4, -1.2]}
        rotation={[-0.2, 0, 0]}
        phase={phase}
        index={2}
      />

      {/* Floating ambient particles */}
      <AmbientParticles isMobile={isLowPerf} />

      {/* Post-processing */}
      {!isLowPerf && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            intensity={2}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0008, 0.0008)}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      )}
    </>
  );
}

// ─── PhaseLabel Export ────────────────────────────────────────────────────────
export function PhaseLabel({ phase }: { phase: ScanPhase }) {
  const color = PHASE_COLORS[phase];
  const label = PHASE_LABELS[phase];

  return (
    <div className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase select-none">
      <span
        className="inline-block w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HeroScene({ phase: controlledPhase }: { phase?: ScanPhase }) {
  const [internalPhase, setInternalPhase] = useState<ScanPhase>('searching');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Auto-advance phases every 2.5s, loop (only if not controlled)
  useEffect(() => {
    if (controlledPhase) return;
    const timer = setInterval(() => {
      setPhaseIndex((prev) => {
        const next = (prev + 1) % PHASE_ORDER.length;
        setInternalPhase(PHASE_ORDER[next]);
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [controlledPhase]);

  const activePhase = controlledPhase || internalPhase;
  const activeIndex = controlledPhase ? PHASE_ORDER.indexOf(controlledPhase) : phaseIndex;

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={isMobile ? 1 : [1, 2]}
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 200 }}
        style={{ background: 'transparent' }}
      >
        <Scene phase={activePhase} isMobile={isMobile} />
      </Canvas>

      {/* Phase label overlay (HTML) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <PhaseLabel phase={activePhase} />
      </div>

      {/* Phase progress dots */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none z-10">
        {PHASE_ORDER.map((p, i) => (
          <div
            key={p}
            className="w-1.5 h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: i === activeIndex ? PHASE_COLORS[activePhase] : 'rgba(255,255,255,0.2)',
              boxShadow: i === activeIndex ? `0 0 6px ${PHASE_COLORS[activePhase]}` : 'none',
              transform: i === activeIndex ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
