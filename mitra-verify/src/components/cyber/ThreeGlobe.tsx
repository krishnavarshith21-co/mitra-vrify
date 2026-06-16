'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function GlobeWireframe() {
  const globeRef = useRef<THREE.Mesh>(null!);
  const pointsRef = useRef<THREE.Points>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    globeRef.current.rotation.y = elapsed * 0.05;
    globeRef.current.rotation.x = elapsed * 0.02;

    pointsRef.current.rotation.y = elapsed * 0.05;
    pointsRef.current.rotation.x = elapsed * 0.02;

    // Breath pulse
    const scale = 1 + Math.sin(elapsed * 1.5) * 0.02;
    globeRef.current.scale.set(scale, scale, scale);
    pointsRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group>
      {/* Globe Wireframe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2, 24, 24]} />
        <meshBasicMaterial
          color="#0066ff"
          wireframe
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Globe Nodes/Points */}
      <points ref={pointsRef}>
        <sphereGeometry args={[2, 24, 24]} />
        <pointsMaterial
          color="#00d4ff"
          size={0.04}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function ScanningRings() {
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Rotating scans
    ring1Ref.current.rotation.x = elapsed * 0.2;
    ring1Ref.current.rotation.y = elapsed * 0.1;

    ring2Ref.current.rotation.y = -elapsed * 0.15;
    ring2Ref.current.rotation.z = elapsed * 0.08;
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.3, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.5, 0.008, 8, 48]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export default function ThreeGlobe() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#7c3aed" />

        <GlobeWireframe />
        <ScanningRings />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Holographic grid HUD overlay borders */}
      <div style={{
        position: 'absolute',
        inset: 12,
        border: '1px solid rgba(0, 212, 255, 0.08)',
        borderRadius: 12,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 8, height: 8, borderTop: '1px solid #00d4ff', borderLeft: '1px solid #00d4ff' }} />
          <div style={{ width: 8, height: 8, borderTop: '1px solid #00d4ff', borderRight: '1px solid #00d4ff' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 8, height: 8, borderBottom: '1px solid #00d4ff', borderLeft: '1px solid #00d4ff' }} />
          <div style={{ width: 8, height: 8, borderBottom: '1px solid #00d4ff', borderRight: '1px solid #00d4ff' }} />
        </div>
      </div>
    </div>
  );
}
