'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Activity, Fingerprint } from 'lucide-react';

// ─── ABSTRACT BIOMETRIC HEAD/FACE REPRESENTATION ────────────────────────────
function BiometricTarget() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create an egg-like/head-like shape using a distorted sphere or simple dense Icosahedron
  const headGeometry = useMemo(() => new THREE.IcosahedronGeometry(2.8, 16), []);
  const wireframeGeometry = useMemo(() => new THREE.IcosahedronGeometry(2.8, 3), []);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(wireframeGeometry, 15), [wireframeGeometry]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Very slow rotation
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dense Point Cloud Core */}
      <points geometry={headGeometry}>
        <pointsMaterial color="#00d4ff" size={0.03} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Structured Wireframe Shell */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#0066ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* Facial Landmark Nodes (Abstract points placed on the surface) */}
      <LandmarkNodes />
    </group>
  );
}

// ─── FACIAL LANDMARK POINTS ────────────────────────────────────────────────
function LandmarkNodes() {
  const nodesRef = useRef<THREE.Group>(null);
  const nodePositions = useMemo(() => {
    const pos = [];
    // Abstract landmark locations (eyes, nose, mouth layout on a sphere)
    pos.push([1.0, 0.5, 2.5]); // Right eye
    pos.push([-1.0, 0.5, 2.5]); // Left eye
    pos.push([0, -0.2, 2.7]); // Nose
    pos.push([0.8, -1.2, 2.3]); // Mouth right
    pos.push([-0.8, -1.2, 2.3]); // Mouth left
    pos.push([0, -1.4, 2.4]); // Chin
    pos.push([1.5, 1.0, 2.0]); // Brow right
    pos.push([-1.5, 1.0, 2.0]); // Brow left
    return pos;
  }, []);

  useFrame((state) => {
    if (nodesRef.current) {
      // Gentle pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      nodesRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={nodesRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={new THREE.Vector3(...pos)}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
          {/* Node connections could be drawn but points give a cleaner look */}
        </mesh>
      ))}
    </group>
  );
}

// ─── SWEEPING LASER SCANNER ────────────────────────────────────────────────
function ScannerPlane() {
  const planeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planeRef.current) {
      // Sweep up and down the "face"
      planeRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 3;
    }
  });

  return (
    <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial 
        color="#00d4ff" 
        transparent 
        opacity={0.1} 
        blending={THREE.AdditiveBlending} 
        side={THREE.DoubleSide} 
        depthWrite={false} 
      />
      {/* Leading edge of the scanner */}
      <mesh position={[0, 0, 0]}>
         <ringGeometry args={[0, 4, 64]} />
         <meshBasicMaterial color="#00e5ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
}

// ─── HUD DATA RINGS ────────────────────────────────────────────────────────
function HudRings() {
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z -= delta * 0.1;
    if (ring2Ref.current) ring2Ref.current.rotation.z += delta * 0.05;
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      {/* Ring 1 */}
      <group ref={ring1Ref}>
        <mesh>
          <ringGeometry args={[4.2, 4.22, 128, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color="#1677FF" transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[4.2, 0, 0]}>
           <circleGeometry args={[0.08, 16]} />
           <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Ring 2 */}
      <group ref={ring2Ref} rotation={[0, 0.2, 0]}>
        <mesh>
          <ringGeometry args={[4.5, 4.51, 128, 1, Math.PI, Math.PI * 1.8]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ─── VOLUMETRIC GLOW ───────────────────────────────────────────────────────
function AmbientGlow() {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#0033aa" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── FLOATING UI OVERLAYS ──────────────────────────────────────────────────
function LiveSystemPanel() {
  return (
    <Html 
      position={[5.5, 3.5, 1.0]} 
      scale={1} 
      transform 
      occlude="blending"
      className="pointer-events-none z-50"
    >
      <div className="bg-[rgba(2,6,23,0.75)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] w-[240px] relative overflow-hidden transform-gpu">
        {/* Glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1677FF]/50 to-transparent" />
        
        <div className="flex items-center gap-3 mb-5">
           <div className="w-8 h-8 rounded-lg bg-[#1677FF]/10 flex items-center justify-center border border-[#1677FF]/20">
             <Shield size={16} className="text-[#1677FF]" />
           </div>
           <span className="text-xs font-bold text-white tracking-wide">Verification Engine</span>
        </div>
        
        <div className="space-y-3.5 text-[10px] font-mono uppercase tracking-widest text-slate-300">
           <div className="flex items-center justify-between">
              <span>Face Match</span>
              <span className="text-[#00D26A] font-bold">99.98%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Liveness</span>
              <span className="text-[#00D26A] font-bold">Passed</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Head Rotation</span>
              <span className="text-[#00D26A] font-bold">Passed</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Blink Detection</span>
              <span className="text-[#00D26A] font-bold">Passed</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Spoof Risk</span>
              <span className="text-[#00E5FF] font-bold">0.02%</span>
           </div>
           <div className="flex items-center justify-between">
              <span>Confidence</span>
              <span className="text-[#00E5FF] font-bold">99.94%</span>
           </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#00D26A] shadow-[0_0_10px_#00D26A] animate-pulse" />
             <span className="text-[#00D26A] text-[9px] font-bold uppercase tracking-widest">System Active</span>
           </div>
        </div>
      </div>
    </Html>
  );
}

function FeedBadge() {
  return (
    <Html 
      position={[-5.0, -3.5, 1.5]} 
      scale={0.9} 
      transform 
      className="pointer-events-none z-50"
    >
      <div className="bg-[rgba(2,6,23,0.8)] backdrop-blur-xl border border-white/[0.08] rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.8)] transform-gpu">
        <Fingerprint size={14} className="text-[#00E5FF]" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">Biometric Feed Encrypted</span>
        <Activity size={12} className="text-[#1677FF] ml-1" />
      </div>
    </Html>
  );
}

// ─── MAIN SCENE ────────────────────────────────────────────────────────────
function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 64; 
      const targetY = (state.pointer.y * Math.PI) / 64;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.01;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <AmbientGlow />
      <BiometricTarget />
      <ScannerPlane />
      <HudRings />
      <LiveSystemPanel />
      <FeedBadge />
    </group>
  );
}

export default function BiometricScanner3D() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 11], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <group position={[0, 0, 0]} scale={0.75}>
          <SceneContainer />
        </group>
      </Canvas>
    </div>
  );
}
