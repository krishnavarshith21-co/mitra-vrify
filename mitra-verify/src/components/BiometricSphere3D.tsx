'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Points, PointMaterial, Html } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Shield } from 'lucide-react';

// ─── CUSTOM SHADER FOR ELEGANT NEURAL ACTIVITY ─────────────────────────────
const nodeVertexShader = `
  uniform float time;
  varying float vAlpha;
  
  void main() {
    // Subtle, elegant pulse
    float pulse = sin(position.x * 2.0 + time * 1.0) * 
                  cos(position.y * 1.5 - time * 0.8) * 
                  sin(position.z * 2.5 + time * 1.2);
    
    // Base alpha 0.15, peaks gently to 0.8
    vAlpha = 0.15 + max(0.0, pulse * 0.65);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Smaller, more refined point size
    gl_PointSize = (15.0 * vAlpha) / -mvPosition.z;
  }
`;

const nodeFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 accentColor;
  varying float vAlpha;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Gentle shift to purple accent when active
    vec3 finalColor = mix(baseColor, accentColor, smoothstep(0.5, 0.9, vAlpha));
    
    // Soft glowing particle
    float strength = (0.5 - dist) * 2.0;
    gl_FragColor = vec4(finalColor, vAlpha * strength);
  }
`;

// ─── REFINED HIGH-DENSITY PLEXUS CORE ──────────────────────────────────────
function HollowPlexusCore() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // 5000+ nodes (Detail 6)
  const pointGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 6), []);
  const lineGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 5), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(lineGeometry, 5), [lineGeometry]);

  const shaderUniforms = useMemo(() => ({
    time: { value: 0 },
    baseColor: { value: new THREE.Color("#0088ff") },
    accentColor: { value: new THREE.Color("#8a2be2") }
  }), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02; // Very slow, elegant rotation
      groupRef.current.rotation.x += delta * 0.005;
    }
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (linesRef.current && linesRef.current.material) {
      // Extremely subtle connection lines
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = 0.03 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Delicate Neural Web Connections */}
      <lineSegments ref={linesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color="#0066cc" 
          transparent 
          opacity={0.03} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Massive Density Data Nodes with Custom Neural Shaders */}
      <points geometry={pointGeometry}>
        <shaderMaterial
          ref={shaderMaterialRef}
          vertexShader={nodeVertexShader}
          fragmentShader={nodeFragmentShader}
          uniforms={shaderUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── EXACTLY 2 MINIMAL ORBITAL RINGS ───────────────────────────────────────
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ring1Ref.current) {
      // Slow rotation for the large cyan ring
      ring1Ref.current.rotation.z += delta * 0.05;
    }
    if (ring2Ref.current) {
      // Independent rotation for the smaller purple ring
      ring2Ref.current.rotation.z -= delta * 0.08;
    }
  });

  return (
    <group>
      {/* Orbit Ring 1: Large, Cyan, Horizontal tilt */}
      <Torus 
        ref={ring1Ref as any}
        args={[4.4, 0.003, 32, 256]} 
        rotation={[Math.PI/2 - 0.2, 0, 0]}
      >
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Torus>

      {/* Orbit Ring 2: Slightly smaller, Purple-blue gradient, Different angle */}
      <Torus 
        ref={ring2Ref as any}
        args={[4.1, 0.002, 32, 256]} 
        rotation={[Math.PI/3, Math.PI/6, 0]}
      >
        <meshBasicMaterial 
          color="#8a2be2" 
          transparent 
          opacity={0.2} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Torus>
    </group>
  );
}

// ─── BACKGROUND PARALLAX PARTICLES ─────────────────────────────────────────
function BackgroundParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50; 
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50; 
      positions[i * 3 + 2] = -15 + (Math.random() - 0.5) * 10; 
    }
    return [positions];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.position.y += delta * 0.05; // Very slow, gentle movement
      if (pointsRef.current.position.y > 20) pointsRef.current.position.y = -20;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─── SOFT BACKGROUND VOLUMETRIC GLOW ───────────────────────────────────────
function RadialGlow() {
  return (
    <mesh position={[0, 0, -8]}>
      <planeGeometry args={[25, 25]} />
      <meshBasicMaterial 
        color="#004488" 
        transparent 
        opacity={0.05} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── 50% SMALLER INTEGRATED 3D CARD ────────────────────────────────────────
function IntegratedVerificationCard() {
  return (
    <Html 
      // Upper right, positioned so it never touches viewport edges and barely overlaps the sphere
      position={[3.8, 2.5, 1.0]} 
      scale={0.25} 
      transform 
      occlude 
      className="pointer-events-none"
    >
      <div className="bg-[#02050D]/80 backdrop-blur-3xl border border-[rgba(255,255,255,0.06)] rounded-xl p-6 shadow-[0_30px_60px_rgba(0,0,0,0.6)] w-64 transform transition-all">
        <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
           <div className="w-8 h-8 rounded bg-[#00d4ff]/5 flex items-center justify-center border border-[#00d4ff]/10">
             <Shield size={16} className="text-[#00d4ff]" />
           </div>
           <span className="text-xs font-medium text-slate-300 tracking-wide">Verification Engine</span>
        </div>
        <div className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
           <div className="flex items-center justify-between">
              <span>Liveness</span>
              <span className="text-white font-medium">PASS</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Blink</span>
              <span className="text-white font-medium">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Head Rotation</span>
              <span className="text-white font-medium">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Spoof Risk</span>
              <span className="text-[#00d4ff] font-medium">0.2%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Identity Match</span>
              <span className="text-[#00d4ff] font-medium animate-pulse">98.7%</span>
           </div>
        </div>
      </div>
    </Html>
  );
}

// ─── MAIN SCENE CONTAINER ──────────────────────────────────────────────────
function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Extremely subtle, elegant parallax
      const targetX = (state.pointer.x * Math.PI) / 24;
      const targetY = (state.pointer.y * Math.PI) / 24;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.01;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <RadialGlow />
      <BackgroundParticles />
      <HollowPlexusCore />
      <OrbitalRings />
      <IntegratedVerificationCard />
    </group>
  );
}

export default function BiometricSphere3D() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <SceneContainer />
        
        {/* Refined, softer postprocessing */}
        <EffectComposer multisampling={4}>
          <Bloom 
            luminanceThreshold={0.4} 
            luminanceSmoothing={0.9} 
            intensity={0.8} 
            mipmapBlur 
          />
          <DepthOfField 
            focusDistance={0.02} 
            focalLength={0.05} 
            bokehScale={2} 
            height={480} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
