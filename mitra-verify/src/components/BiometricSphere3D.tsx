'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Points, PointMaterial, Ring, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Shield, Activity } from 'lucide-react';

// ─── SHADER NOISE FUNCTIONS ────────────────────────────────────────────────
const snoiseGLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0; 
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

const nodeVertexShader = `
  ${snoiseGLSL}
  
  uniform float time;
  varying float vAlpha;
  varying float vIsLand;
  
  void main() {
    // Generate pseudo-continents using 3D noise
    float noiseVal = snoise(position * 0.7 + time * 0.02);
    
    // Add fine detail noise
    float detailNoise = snoise(position * 2.0 - time * 0.05);
    noiseVal += detailNoise * 0.3;
    
    // Threshold to separate landmasses and oceans
    float isLand = smoothstep(0.1, 0.4, noiseVal);
    
    vIsLand = isLand;
    
    // Land gets bright pulsing alpha, oceans stay very dim
    float pulse = sin(position.x * 5.0 + time * 2.0) * 0.5 + 0.5;
    vAlpha = mix(0.05, 0.6 + pulse * 0.4, isLand);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Land points are much larger
    float pSize = mix(3.0, 22.0, isLand);
    gl_PointSize = (pSize * vAlpha) / -mvPosition.z;
  }
`;

const nodeFragmentShader = `
  varying float vAlpha;
  varying float vIsLand;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    vec3 oceanColor = vec3(0.0, 0.1, 0.3); // Deep dim blue
    vec3 landColor = vec3(0.0, 0.8, 1.0);  // Bright electric cyan
    
    vec3 finalColor = mix(oceanColor, landColor, vIsLand);
    
    float strength = (0.5 - dist) * 2.0;
    gl_FragColor = vec4(finalColor, vAlpha * strength);
  }
`;

// ─── CONTINENT-MAPPED GLOBE CORE ───────────────────────────────────────────
function HollowPlexusCore() {
  const groupRef = useRef<THREE.Group>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Extremely dense sphere for "thousands of tiny glowing nodes"
  const pointGeometry = useMemo(() => new THREE.SphereGeometry(3.5, 180, 180), []);
  // Lower density Icosahedron for subtle background wireframe
  const lineGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 6), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(lineGeometry, 5), [lineGeometry]);

  const shaderUniforms = useMemo(() => ({
    time: { value: 0 }
  }), []);

  // Core glow reference for breathing effect
  const coreGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // 20 second rotation (2*PI / 20 ≈ 0.31 rad/sec)
      // Since it runs every frame (60fps), delta is ~0.016s. 
      groupRef.current.rotation.y += delta * 0.05; 
      groupRef.current.rotation.x = 0.15; 
    }
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime * 0.3; // Slowed down shader
    }
    if (coreGlowRef.current) {
      // Very soft, slow breathing glow
      const material = coreGlowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.03 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Subtle connection lines */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial 
          color="#0066cc" 
          transparent 
          opacity={0.08} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Procedural Continent Shader Points */}
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

      {/* Soft Breathing Core Glow */}
      <mesh ref={coreGlowRef}>
        <sphereGeometry args={[3.3, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── 2 EXACT ORBIT RINGS WITH COMET NODES ──────────────────────────────────
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const dataPacket1Ref = useRef<THREE.Mesh>(null);
  const dataPacket2Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime * 0.2; // Very slow
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z -= delta * 0.02;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z += delta * 0.015;
    }

    // Data packets moving along the rings slowly
    if (dataPacket1Ref.current) {
      dataPacket1Ref.current.position.x = Math.cos(time * 0.5) * 4.2;
      dataPacket1Ref.current.position.y = Math.sin(time * 0.5) * 4.2;
    }
    if (dataPacket2Ref.current) {
      dataPacket2Ref.current.position.x = Math.cos(time * 0.8 + Math.PI) * 3.9;
      dataPacket2Ref.current.position.y = Math.sin(time * 0.8 + Math.PI) * 3.9;
    }
  });

  return (
    <group rotation={[1.4, 0.2, 0]}>
      {/* Ring 1: Horizontal, cyan glow, tightly around globe */}
      <group ref={ring1Ref}>
        <Ring args={[4.2, 4.22, 128]}>
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        {/* Data Packet */}
        <mesh ref={dataPacket1Ref}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Ring 2: Slightly smaller, tilted, purple-blue glow */}
      <group ref={ring2Ref} rotation={[0.15, 0.2, 0]}>
        <Ring args={[3.9, 3.92, 128]}>
          <meshBasicMaterial color="#8a2be2" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        {/* Data Packet */}
        <mesh ref={dataPacket2Ref}>
          <circleGeometry args={[0.05, 16]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

// ─── BACKGROUND PARALLAX PARTICLES ─────────────────────────────────────────
function BackgroundParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 400; // Minimal tiny particles
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30; 
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30; 
      positions[i * 3 + 2] = -5 + (Math.random() - 0.5) * 5; 
    }
    return [positions];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.position.y += delta * 0.02; // Very slow movement
      if (pointsRef.current.position.y > 15) pointsRef.current.position.y = -15;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#00d4ff"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─── HOLOGRAPHIC GROUND PROJECTION & CORE BEAM ──────────────────────────────
function GroundProjection() {
  return (
    <group position={[0, -4.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Intense center beam source */}
      <mesh position={[0, 0, 0.1]}>
         <circleGeometry args={[1.5, 64]} />
         <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
         <circleGeometry args={[0.5, 64]} />
         <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Deep floor rings */}
      <Ring args={[2.5, 2.52, 128]}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </Ring>
      <Ring args={[3.5, 3.52, 128]}>
        <meshBasicMaterial color="#0066ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </Ring>
      <Ring args={[4.5, 4.51, 128]}>
        <meshBasicMaterial color="#8a2be2" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </Ring>
    </group>
  );
}

// ─── BACKGROUND RADIAL GLOW ────────────────────────────────────────────────
function RadialGlow() {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[15, 15]} />
      <meshBasicMaterial 
        color="#0066ff" 
        transparent 
        opacity={0.15} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── REFINED EXACT VERIFICATION CARD MATCHING MOCKUP ───────────────────────
function IntegratedVerificationCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useFrame((state) => {
    if (containerRef.current) {
      // Floating animation (very slow)
      const yOffset = Math.sin(state.clock.elapsedTime * 0.8) * 3;
      
      // Slight parallax based on pointer
      const xParallax = (state.pointer.x * 5);
      const yParallax = (state.pointer.y * 5);

      containerRef.current.style.transform = `translate3d(${xParallax}px, calc(${yOffset}px + ${yParallax}px), 0)`;
    }
  });

  return (
    <Html 
      position={[4.8, 3.8, 1.0]} 
      scale={0.9} 
      transform 
      occlude="blending"
      className="pointer-events-none z-50"
    >
      <div 
        ref={containerRef}
        className="bg-[rgba(2,6,15,0.7)] backdrop-blur-xl border border-[rgba(0,212,255,0.08)] rounded-[20px] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] w-[190px] relative overflow-hidden transform-gpu"
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/30 to-transparent" />
        
        <div className="flex items-center gap-2 mb-4">
           <div className="w-6 h-6 rounded bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20">
             <Shield size={12} className="text-[#00d4ff]" />
           </div>
           <span className="text-[10px] font-bold text-white tracking-wider">Verification Engine</span>
        </div>
        
        <div className="space-y-2.5 text-[8px] font-mono uppercase tracking-widest text-slate-300">
           <div className="flex items-center justify-between">
              <span>Liveness</span>
              <span className="text-[#00ff88] font-bold">PASS</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Blink</span>
              <span className="text-[#00ff88] font-bold">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Head Rotation</span>
              <span className="text-[#00ff88] font-bold">VERIFIED</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Spoof Risk</span>
              <span className="text-[#00d4ff] font-bold">0.1%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Identity Match</span>
              <span className="text-[#00d4ff] font-bold">99.8%</span>
           </div>
        </div>
      </div>
    </Html>
  );
}

// ─── BOTTOM LIVE FEED BADGE ────────────────────────────────────────────────
function LiveFeedBadge() {
  const containerRef = useRef<HTMLDivElement>(null);

  useFrame((state) => {
    if (containerRef.current) {
      // Very slow float
      const yOffset = Math.cos(state.clock.elapsedTime * 0.8) * 2;
      containerRef.current.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    }
  });

  return (
    <Html 
      position={[4.8, -4.0, 1.5]} 
      scale={0.9} 
      transform 
      className="pointer-events-none z-50"
    >
      <div 
        ref={containerRef}
        className="bg-[rgba(2,6,15,0.7)] backdrop-blur-xl border border-[rgba(0,212,255,0.08)] rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_24px_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] transform-gpu"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
        <span className="text-[8px] font-bold text-white uppercase tracking-widest whitespace-nowrap">Live Feed Active</span>
        <Activity size={10} className="text-[#00d4ff] ml-1" />
      </div>
    </Html>
  );
}

// ─── MAIN SCENE CONTAINER ──────────────────────────────────────────────────
function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 48; // Even more subtle
      const targetY = (state.pointer.y * Math.PI) / 48;
      
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
      <GroundProjection />
      <IntegratedVerificationCard />
      <LiveFeedBadge />
    </group>
  );
}

export default function BiometricSphere3D() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <group position={[0, 0, 0]} scale={0.62}>
          <SceneContainer />
        </group>
        
        {/* Cinematic Postprocessing matching mockup */}
        <EffectComposer multisampling={4}>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={1.2} 
            mipmapBlur 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
