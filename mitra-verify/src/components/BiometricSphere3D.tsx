'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function CoreSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 32, 32]}>
      <meshStandardMaterial 
        color="#00d4ff" 
        wireframe={true} 
        transparent 
        opacity={0.15} 
        emissive="#00d4ff"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
}

function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.2;
      ring1Ref.current.rotation.y += delta * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= delta * 0.15;
      ring2Ref.current.rotation.y += delta * 0.4;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y -= delta * 0.1;
      ring3Ref.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <group>
      <Torus ref={ring1Ref} args={[2.8, 0.01, 16, 100]}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </Torus>
      <Torus ref={ring2Ref} args={[3.2, 0.01, 16, 100]}>
        <meshBasicMaterial color="#00ff88" transparent opacity={0.2} />
      </Torus>
      <Torus ref={ring3Ref} args={[3.6, 0.005, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.4} />
      </Torus>
    </group>
  );
}

function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate 478 points distributed on a sphere
  const [positions] = useMemo(() => {
    const count = 478;
    const positions = new Float32Array(count * 3);
    const radius = 2.05; // Slightly larger than core sphere

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    return [positions];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      // Gentle pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      pointsRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#00ff88"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  // Mouse interaction for parallax
  useFrame((state) => {
    if (groupRef.current) {
      // Smoothly interpolate group rotation towards mouse position
      const targetX = (state.pointer.x * Math.PI) / 10;
      const targetY = (state.pointer.y * Math.PI) / 10;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <CoreSphere />
      <OrbitalRings />
      <ParticleNetwork />
    </group>
  );
}

export default function BiometricSphere3D() {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ff88" />
        
        <SceneContainer />
      </Canvas>
    </div>
  );
}
