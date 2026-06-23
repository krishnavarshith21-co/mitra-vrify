'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Ring, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Base continuous rotation
      const baseRotationY = t * 0.1; // Slow continuous spin
      const baseRotationX = 0.2 + Math.sin(t * 0.2) * 0.05; // Extremely gentle rocking
      
      // Mouse tracking offset
      const mouseOffsetX = (state.pointer.x * Math.PI) / 8;
      const mouseOffsetY = (state.pointer.y * Math.PI) / 8;
      
      // Smoothly interpolate towards the combined target rotation
      const targetRotationX = baseRotationX + mouseOffsetY;
      const targetRotationY = baseRotationY + mouseOffsetX;
      
      groupRef.current.rotation.x += 0.02 * (targetRotationX - groupRef.current.rotation.x);
      groupRef.current.rotation.y += 0.02 * (targetRotationY - groupRef.current.rotation.y);
    }
    if (ringRef.current) {
      // Rotate the main ring smoothly and slowly
      ringRef.current.rotation.z -= delta * 0.1;
      
      const targetRingX = -Math.PI / 3 + Math.sin(t * 0.3) * 0.05 + (state.pointer.y * 0.1);
      const targetRingY = Math.PI / 6 + Math.cos(t * 0.2) * 0.05 + (state.pointer.x * 0.1);
      
      ringRef.current.rotation.x += 0.02 * (targetRingX - ringRef.current.rotation.x);
      ringRef.current.rotation.y += 0.02 * (targetRingY - ringRef.current.rotation.y);
    }
    if (glowRingRef.current) {
      // Rotate the glow ring in the opposite direction
      glowRingRef.current.rotation.z += delta * 0.15;
      
      const targetRingX = -Math.PI / 3 + Math.sin(t * 0.3) * 0.05 + (state.pointer.y * 0.1);
      const targetRingY = Math.PI / 6 + Math.cos(t * 0.2) * 0.05 + (state.pointer.x * 0.1);
      
      glowRingRef.current.rotation.x += 0.02 * (targetRingX - glowRingRef.current.rotation.x);
      glowRingRef.current.rotation.y += 0.02 * (targetRingY - glowRingRef.current.rotation.y);
    }
  });

  return (
    <group ref={groupRef} scale={1.0}>
      
      {/* Base Sphere Wireframe (Lat/Lon grid) */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#1677FF" wireframe transparent opacity={0.2} />
      </mesh>

      {/* Sphere Points (Vertices) */}
      <points>
        <sphereGeometry args={[2, 32, 32]} />
        <pointsMaterial size={0.03} color="#00E5FF" transparent opacity={0.6} sizeAttenuation />
      </points>

      {/* Outer Glow Sphere */}
      <mesh>
        <sphereGeometry args={[1.98, 32, 32]} />
        <meshBasicMaterial color="#001133" transparent opacity={0.6} />
      </mesh>

      {/* Tilted Cyan Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
         <ringGeometry args={[2.4, 2.42, 64]} />
         <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Second Fainter Ring to simulate glow */}
      <mesh ref={glowRingRef} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
         <ringGeometry args={[2.35, 2.47, 64]} />
         <meshBasicMaterial color="#00E5FF" transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

    </group>
  );
}

export default function BiometricCore3D() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-auto cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <OrbitControls enableZoom={false} enablePan={false} />
        <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.1}>
          <WireframeGlobe />
        </Float>
      </Canvas>
    </div>
  );
}
