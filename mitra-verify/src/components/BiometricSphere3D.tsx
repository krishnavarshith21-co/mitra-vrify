'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Points, PointMaterial, Ring, Html, Line } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Shield } from 'lucide-react';

// ─── CUSTOM SHADER FOR NEURAL ACTIVITY PULSES ───────────────────────────────
const nodeVertexShader = `
  uniform float time;
  varying float vAlpha;
  
  void main() {
    // Generate dynamic pulsing "data packets" traveling through nodes
    float pulse = sin(position.x * 4.0 + time * 2.0) * 
                  cos(position.y * 3.0 - time * 1.5) * 
                  sin(position.z * 5.0 + time * 2.5);
    
    // Base alpha 0.2, peaks to 1.0
    vAlpha = 0.2 + max(0.0, pulse * 0.8);
    
    // Add tiny movement/jitter to active nodes
    vec3 pos = position;
    if (pulse > 0.8) {
      pos += normal * 0.05 * sin(time * 10.0);
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (25.0 * vAlpha) / -mvPosition.z;
  }
`;

const nodeFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 accentColor;
  varying float vAlpha;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    // Shift color to purple accent when highly active
    vec3 finalColor = mix(baseColor, accentColor, smoothstep(0.6, 1.0, vAlpha));
    
    // Soft glowing particle
    float strength = (0.5 - dist) * 2.0;
    gl_FragColor = vec4(finalColor, vAlpha * strength);
  }
`;

// ─── MASSIVE HIGH-DENSITY PLEXUS CORE ──────────────────────────────────────
function HollowPlexusCore() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // 5000+ nodes (Detail 6 Icosahedron yields ~10k vertices)
  const pointGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 6), []);
  const lineGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 5), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(lineGeometry, 5), [lineGeometry]);

  const shaderUniforms = useMemo(() => ({
    time: { value: 0 },
    baseColor: { value: new THREE.Color("#00d4ff") },
    accentColor: { value: new THREE.Color("#8a2be2") }
  }), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
      groupRef.current.rotation.x += delta * 0.01;
    }
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (linesRef.current && linesRef.current.material) {
      // Subtle pulsing for the connection lines as well
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = 0.08 + Math.sin(state.clock.elapsedTime * 3) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Intense Neural Web Connections */}
      <lineSegments ref={linesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color="#0088ff" 
          transparent 
          opacity={0.1} 
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

// ─── 10 ADVANCED ORBITAL RINGS WITH GLOW TRAILS ─────────────────────────────
function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const speed = (i % 2 === 0 ? 1 : -1) * (0.04 + i * 0.01);
        child.rotation.x += delta * speed * 0.3;
        child.rotation.y += delta * speed;
        child.rotation.z += delta * speed * 0.2;
      });
    }
  });

  // 10 diverse rings acting as data orbits passing around the 3.5 radius sphere
  const rings = [
    { radius: 4.0, tube: 0.003, color: "#ffffff", opacity: 0.2, rotation: [Math.PI/3, 0, 0] },
    { radius: 4.2, tube: 0.006, color: "#00d4ff", opacity: 0.15, rotation: [0, Math.PI/4, 0] },
    { radius: 4.4, tube: 0.002, color: "#8a2be2", opacity: 0.3, rotation: [-Math.PI/4, 0, Math.PI/6] },
    { radius: 4.7, tube: 0.008, color: "#0088ff", opacity: 0.1, rotation: [Math.PI/2, Math.PI/8, 0] },
    { radius: 5.0, tube: 0.002, color: "#ffffff", opacity: 0.25, rotation: [0, -Math.PI/3, 0] },
    { radius: 5.3, tube: 0.004, color: "#8a2be2", opacity: 0.2, rotation: [Math.PI/6, Math.PI/2, 0] },
    { radius: 5.6, tube: 0.001, color: "#00d4ff", opacity: 0.4, rotation: [-Math.PI/3, Math.PI/5, Math.PI/4] },
    { radius: 5.9, tube: 0.005, color: "#ffffff", opacity: 0.1, rotation: [0, 0, Math.PI/2] },
    { radius: 6.2, tube: 0.002, color: "#8a2be2", opacity: 0.25, rotation: [Math.PI/8, Math.PI/3, 0] },
    { radius: 6.5, tube: 0.003, color: "#00d4ff", opacity: 0.15, rotation: [-Math.PI/2, 0, Math.PI/6] },
  ];

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <Torus 
          key={i} 
          args={[ring.radius, ring.tube, 32, 256]} 
          rotation={ring.rotation as [number, number, number]}
        >
          <meshBasicMaterial 
            color={ring.color} 
            transparent 
            opacity={ring.opacity} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Torus>
      ))}
    </group>
  );
}

// ─── HOLOGRAPHIC GROUND PROJECTION & FOG ────────────────────────────────────
function GroundProjection() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z -= delta * 0.08;
      groupRef.current.children.forEach((child: any) => {
        if (child.material) {
           child.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
        }
      });
    }
  });

  return (
    <group position={[0, -5.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ambient floor glow */}
      <Ring args={[0.5, 7.0, 128]}>
         <meshBasicMaterial 
           color="#0088ff" 
           transparent 
           opacity={0.02} 
           side={THREE.DoubleSide} 
           blending={THREE.AdditiveBlending}
           depthWrite={false}
         />
      </Ring>
      <group ref={groupRef}>
        <Ring args={[4.0, 4.02, 128]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
        </Ring>
        <Ring args={[4.8, 4.82, 128]}>
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </Ring>
        <Ring args={[5.8, 5.81, 128]}>
          <lineBasicMaterial color="#8a2be2" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
        </Ring>
      </group>
      <mesh position={[0, 0, 0.1]}>
         <circleGeometry args={[2.5, 64]} />
         <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── FOREGROUND & BACKGROUND PARALLAX PARTICLES ────────────────────────────
function ParticleSystem({ count, size, color, depth, speed }: { count: number, size: number, color: string, depth: number, speed: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50; 
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50; 
      positions[i * 3 + 2] = depth + (Math.random() - 0.5) * 10; 
    }
    return [positions];
  }, [count, depth]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.position.y += delta * speed;
      pointsRef.current.rotation.y += delta * 0.01;
      // Loop particles
      if (pointsRef.current.position.y > 20) pointsRef.current.position.y = -20;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─── BACKGROUND VOLUMETRIC RADIAL GLOW ─────────────────────────────────────
function RadialGlow() {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial 
        color="#0066ff" 
        transparent 
        opacity={0.03} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── FURTHER REDUCED INTEGRATED 3D CARD ────────────────────────────────────
function IntegratedVerificationCard() {
  return (
    <Html 
      // Repositioned further out to upper right so it integrates but doesn't block the globe
      position={[3.8, 2.8, 0]} 
      // Size reduced by another 40% (scale 0.45 down to 0.35)
      scale={0.35} 
      transform 
      occlude 
      className="pointer-events-none"
    >
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.05] rounded-2xl p-6 shadow-[0_40px_80px_rgba(0,0,0,0.9)] w-64 transform transition-all">
        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
           <div className="w-8 h-8 rounded bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
             <Shield size={16} className="text-[#00d4ff]" />
           </div>
           <span className="text-xs font-bold text-white tracking-wide shadow-black drop-shadow-md">Verification Engine</span>
        </div>
        <div className="space-y-4 text-[10px] font-mono uppercase tracking-widest text-slate-300 shadow-black drop-shadow-md">
           <div className="flex items-center justify-between">
              <span>Liveness</span>
              <span className="text-[#00ff88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">PASS</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Blink</span>
              <span className="text-[#00ff88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Head Rotation</span>
              <span className="text-[#00ff88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Spoof Risk</span>
              <span className="text-[#00d4ff] font-bold">0.2%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Identity Match</span>
              <span className="text-[#00d4ff] font-bold animate-pulse">98.7%</span>
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
      // Very subtle interpolation for parallax
      const targetX = (state.pointer.x * Math.PI) / 12;
      const targetY = (state.pointer.y * Math.PI) / 12;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <RadialGlow />
      {/* Background Neural Stream */}
      <ParticleSystem count={4000} size={0.08} color="#8a2be2" depth={-25} speed={0.2} />
      
      <HollowPlexusCore />
      <OrbitalRings />
      <GroundProjection />
      
      {/* Foreground Scan Pulses */}
      <ParticleSystem count={1500} size={0.04} color="#00d4ff" depth={5} speed={0.4} />
      
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
        
        {/* Cinematic Postprocessing */}
        <EffectComposer multisampling={4}>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={2.0} 
            mipmapBlur 
          />
          {/* Depth of field for strong cinematic depth - foreground blurs slightly, deep background blurs heavily */}
          <DepthOfField 
            focusDistance={0.01} 
            focalLength={0.05} 
            bokehScale={3} 
            height={480} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
