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

  // High density Sphere (128x128 = 16k vertices) for detailed continents
  const pointGeometry = useMemo(() => new THREE.SphereGeometry(3.5, 128, 128), []);
  // Lower density Icosahedron for subtle background wireframe
  const lineGeometry = useMemo(() => new THREE.IcosahedronGeometry(3.5, 4), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(lineGeometry, 5), [lineGeometry]);

  const shaderUniforms = useMemo(() => ({
    time: { value: 0 }
  }), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotation matches the image orientation
      groupRef.current.rotation.y += delta * 0.05; 
      groupRef.current.rotation.x = 0.2; 
    }
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
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
    </group>
  );
}

// ─── 2 EXACT ORBIT RINGS WITH COMET NODES ──────────────────────────────────
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y -= delta * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= delta * 0.1;
      ring2Ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Ring 1: Wide, Cyan, Horizontal tilt */}
      <group ref={ring1Ref} rotation={[0.2, 0, -0.1]}>
        <Ring args={[5.2, 5.22, 128]}>
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        {/* Comet node */}
        <mesh position={[5.21, 0, 0]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Ring 2: Purple-blue, angled */}
      <group ref={ring2Ref} rotation={[0.5, 0.4, 0.8]}>
        <Ring args={[4.6, 4.62, 128]}>
          <meshBasicMaterial color="#8a2be2" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        {/* Comet node */}
        <mesh position={[-4.61, 0, 0]}>
          <circleGeometry args={[0.05, 16]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
      </group>
    </group>
  );
}

// ─── BACKGROUND PARALLAX PARTICLES ─────────────────────────────────────────
function BackgroundParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 1500;
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
      pointsRef.current.position.y += delta * 0.05;
      if (pointsRef.current.position.y > 20) pointsRef.current.position.y = -20;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
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
    <mesh position={[0, 0, -8]}>
      <planeGeometry args={[25, 25]} />
      <meshBasicMaterial 
        color="#0033aa" 
        transparent 
        opacity={0.05} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── REFINED EXACT VERIFICATION CARD MATCHING MOCKUP ───────────────────────
function IntegratedVerificationCard() {
  return (
    <Html 
      position={[3.2, 1.5, 2.0]} 
      scale={0.4} 
      transform 
      occlude="blending"
      className="pointer-events-none"
    >
      <div className="bg-[#020617]/90 backdrop-blur-3xl border border-white/10 rounded-[20px] p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] w-[320px] transform transition-all relative overflow-hidden">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20">
             <Shield size={20} className="text-[#00d4ff]" />
           </div>
           <span className="text-sm font-semibold text-white tracking-wide">Verification Engine</span>
        </div>
        
        <div className="space-y-5 text-xs font-mono uppercase tracking-widest text-slate-400">
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
              <span className="text-[#00d4ff] font-bold">0.2%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Identity Match</span>
              <span className="text-[#00d4ff] font-bold">98.7%</span>
           </div>
        </div>
      </div>
    </Html>
  );
}

// ─── BOTTOM LIVE FEED BADGE ────────────────────────────────────────────────
function LiveFeedBadge() {
  return (
    <Html 
      position={[4.0, -3.0, 1.5]} 
      scale={0.35} 
      transform 
      className="pointer-events-none"
    >
      <div className="bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <span className="w-3 h-3 rounded-full bg-[#00ff88] shadow-[0_0_12px_#00ff88] animate-pulse" />
        <span className="text-sm font-bold text-white uppercase tracking-widest">Live Feed Active</span>
        <Activity size={18} className="text-[#00d4ff] ml-2" />
      </div>
    </Html>
  );
}

// ─── MAIN SCENE CONTAINER ──────────────────────────────────────────────────
function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 24;
      const targetY = (state.pointer.y * Math.PI) / 24;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.02;
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
    <div className="w-full h-full absolute inset-0 pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <SceneContainer />
        
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
