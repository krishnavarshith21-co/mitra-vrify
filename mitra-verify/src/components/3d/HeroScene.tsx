'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Types & Configuration ───────────────────────────────────────────────────
export type ScanPhase =
  | 'searching'
  | 'detected'
  | 'landmarks'
  | 'liveness'
  | 'identity'
  | 'granted';

const THEME = {
  cyan: '#00d4ff',
  green: '#00ff88',
  purple: '#7c3aed',
  blue: '#3b82f6',
};

const PHASE_COLORS: Record<ScanPhase, string> = {
  searching: THEME.cyan,
  detected:  THEME.cyan,
  landmarks: THEME.cyan,
  liveness:  THEME.purple,
  identity:  THEME.blue,
  granted:   THEME.green,
};

// ─── Utility Components ─────────────────────────────────────────────────────

// Orbiting Rings
function OrbitRings({ phase }: { phase: ScanPhase }) {
  const ringRef1 = useRef<THREE.Group>(null!);
  const ringRef2 = useRef<THREE.Group>(null!);
  const ringRef3 = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (ringRef1.current) ringRef1.current.rotation.z -= delta * 0.2;
    if (ringRef2.current) {
      ringRef2.current.rotation.x += delta * 0.15;
      ringRef2.current.rotation.y += delta * 0.1;
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.x -= delta * 0.1;
      ringRef3.current.rotation.z += delta * 0.3;
    }
  });

  const color = new THREE.Color(PHASE_COLORS[phase]);

  return (
    <group>
      {/* Outer Ring */}
      <group ref={ringRef1}>
        <mesh>
          <ringGeometry args={[2.5, 2.52, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Middle Rotated Ring */}
      <group ref={ringRef2} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <ringGeometry args={[2.2, 2.21, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Inner Fast Ring */}
      <group ref={ringRef3} rotation={[0, Math.PI / 4, 0]}>
        <mesh>
          <ringGeometry args={[1.9, 1.93, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// Wireframe Sphere
function CoreSphere({ phase }: { phase: ScanPhase }) {
  const sphereRef = useRef<THREE.Mesh>(null!);
  
  useFrame((_, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.05;
      sphereRef.current.rotation.x += delta * 0.02;
    }
  });

  const color = new THREE.Color(PHASE_COLORS[phase]);

  return (
    <mesh ref={sphereRef}>
      <icosahedronGeometry args={[1.6, 2]} />
      <meshBasicMaterial 
        color={color} 
        wireframe 
        transparent 
        opacity={0.15} 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Facial Landmark Point Cloud & Neural Connections
function FacialMesh({ phase }: { phase: ScanPhase }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const COUNT = 478;

  // Generate Face Points and Connections
  const { positions, colors, sizes, linePositions, lineOpacities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const siz = new Float32Array(COUNT);
    
    let seed = 1234;
    const lcg = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const pointVectors: THREE.Vector3[] = [];

    // Construct Face Shape
    for (let i = 0; i < COUNT; i++) {
      const t = (i / COUNT) * Math.PI * 2;
      const layer = Math.floor(i / 30); 
      const yNorm = (layer / 16) * 2 - 1; 
      const yPos = yNorm * 1.5;

      const faceMask = Math.sqrt(Math.max(0, 1 - yNorm * yNorm * 0.6));
      const xRadius = 0.9 * faceMask;
      const zRadius = 0.6 * faceMask;

      const angle = t + (lcg() - 0.5) * 0.4;
      const r = 0.8 + lcg() * 0.2;

      const x = Math.cos(angle) * xRadius * r + (lcg() - 0.5) * 0.05;
      const y = yPos + (lcg() - 0.5) * 0.1;
      const z = Math.sin(angle) * zRadius * r + (lcg() - 0.5) * 0.05;

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      col[i * 3 + 0] = 1.0;
      col[i * 3 + 1] = 1.0;
      col[i * 3 + 2] = 1.0;
      siz[i] = 1.5 + lcg() * 1.5;

      pointVectors.push(new THREE.Vector3(x, y, z));
    }

    // Build neural connections between close points
    const lines: number[] = [];
    const lOpacities: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      let connections = 0;
      for (let j = i + 1; j < COUNT; j++) {
        if (connections > 2) break;
        const dist = pointVectors[i].distanceTo(pointVectors[j]);
        if (dist < 0.25 && lcg() > 0.4) {
          lines.push(
            pointVectors[i].x, pointVectors[i].y, pointVectors[i].z,
            pointVectors[j].x, pointVectors[j].y, pointVectors[j].z
          );
          lOpacities.push(1 - (dist / 0.25), 1 - (dist / 0.25)); // Fade based on distance
          connections++;
        }
      }
    }

    return { 
      positions: pos, 
      colors: col, 
      sizes: siz,
      linePositions: new Float32Array(lines),
      lineOpacities: new Float32Array(lOpacities)
    };
  }, [COUNT]);

  const targetColor = useMemo(() => new THREE.Color(PHASE_COLORS[phase]), [phase]);
  const currentColor = useRef(new THREE.Color(PHASE_COLORS['searching']));

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Smooth color transition
    currentColor.current.lerp(targetColor, delta * 3);
    
    // Update Points
    const pMat = pointsRef.current.material as THREE.PointsMaterial;
    pMat.color.copy(currentColor.current);
    
    // Update Lines
    if (linesRef.current) {
      const lMat = linesRef.current.material as THREE.LineBasicMaterial;
      lMat.color.copy(currentColor.current);
    }

    // Gentle float and rotation
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
    if (linesRef.current) {
      linesRef.current.rotation.y = pointsRef.current.rotation.y;
    }
  });

  return (
    <group>
      {/* The points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* The neural lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineOpacities, 1]} />
        </bufferGeometry>
        <lineBasicMaterial 
          transparent 
          opacity={0.15} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

// Vertical Scanning Beam
function ScanningBeam({ phase }: { phase: ScanPhase }) {
  const beamRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!beamRef.current) return;
    const time = state.clock.getElapsedTime();
    // Sweeps up and down
    beamRef.current.position.y = Math.sin(time * 2) * 1.5;
  });

  const color = new THREE.Color(PHASE_COLORS[phase]);

  return (
    <mesh ref={beamRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 4]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.1} 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      {/* Edge highlight */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(4, 4)]} />
        <lineBasicMaterial color={color} transparent opacity={0.8} />
      </lineSegments>
    </mesh>
  );
}

// Floating HUD Panels (Iron Man Style)
function HUDPanels({ phase }: { phase: ScanPhase }) {
  return (
    <>
      {/* Top Left Panel */}
      <Html position={[-2.8, 1.5, 0]} center className="pointer-events-none">
        <div className="flex flex-col gap-1.5 p-3 bg-[#030712]/60 backdrop-blur-md border border-[#00d4ff]/30 rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.15)] min-w-[160px] transform transition-all duration-300">
          <div className="text-[10px] uppercase tracking-widest text-[#00d4ff] font-bold border-b border-[#00d4ff]/20 pb-1 mb-1">
            System Telemetry
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Landmarks</span>
            <span className="text-white font-bold">{phase === 'searching' ? '---' : '478 PTS'}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Vector Map</span>
            <span className="text-white font-bold">ACTIVE</span>
          </div>
        </div>
      </Html>

      {/* Bottom Right Panel */}
      <Html position={[2.8, -1.2, 0]} center className="pointer-events-none">
        <div className="flex flex-col gap-1.5 p-3 bg-[#030712]/60 backdrop-blur-md border border-[#00ff88]/30 rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.15)] min-w-[160px] transform transition-all duration-300">
          <div className="text-[10px] uppercase tracking-widest text-[#00ff88] font-bold border-b border-[#00ff88]/20 pb-1 mb-1">
            Security Status
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Liveness</span>
            <span className={`font-bold \${phase === 'liveness' || phase === 'identity' || phase === 'granted' ? 'text-[#00ff88]' : 'text-slate-500'}`}>
              {phase === 'liveness' || phase === 'identity' || phase === 'granted' ? 'PASS' : 'PENDING'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Match</span>
            <span className={`font-bold \${phase === 'granted' ? 'text-[#00d4ff]' : 'text-slate-500'}`}>
              {phase === 'granted' ? '99.98%' : '---'}
            </span>
          </div>
        </div>
      </Html>

      {/* Top Right Floating Status */}
      <Html position={[2.2, 2.0, 0]} center className="pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#030712]/80 backdrop-blur-md border border-white/10 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4ff]"></span>
          </span>
          <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">
            {phase.toUpperCase()}
          </span>
        </div>
      </Html>
    </>
  );
}

// ─── Main Scene Export ──────────────────────────────────────────────────────
export default function HeroScene({ phase = 'detected' }: { phase?: ScanPhase }) {
  // Mobile detection for scaling
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#030712']} />
        
        {/* Environment Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={PHASE_COLORS[phase]} />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#00d4ff" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <group scale={isMobile ? 0.7 : 1.1}>
            {/* Holographic Components */}
            <CoreSphere phase={phase} />
            <OrbitRings phase={phase} />
            <FacialMesh phase={phase} />
            <ScanningBeam phase={phase} />
            
            {/* HTML HUD Overlays */}
            {!isMobile && <HUDPanels phase={phase} />}
          </group>
        </Float>

        {/* Post Processing: Premium Bloom */}
        <EffectComposer multisampling={4}>
          <Bloom 
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9} 
            intensity={1.5} 
            mipmapBlur
          />
        </EffectComposer>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
