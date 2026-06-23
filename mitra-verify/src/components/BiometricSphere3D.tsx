'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial, Line, Ring } from '@react-three/drei';
import * as THREE from 'three';

// ─── PLEXUS CORE NETWORK ────────────────────────────────────────────────────
function PlexusCore() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate a highly detailed Icosahedron to serve as our plexus geometry
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2.5, 4), []);

  // For LineSegments, we need edges
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 15), [geometry]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x += delta * 0.02;
      
      // Gentle pulsing scale
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
      groupRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner subtle glow sphere */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.04} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Connection Lines */}
      <lineSegments ref={linesRef} geometry={edgesGeometry}>
        <lineBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Nodes / Particles */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial 
          size={0.035} 
          color="#00ff88" 
          transparent 
          opacity={0.8}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── ADVANCED ORBITAL SYSTEM ────────────────────────────────────────────────
function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Each ring rotates independently
      groupRef.current.children.forEach((child, i) => {
        const speed = (i % 2 === 0 ? 1 : -1) * (0.05 + i * 0.02);
        child.rotation.x += delta * speed * 0.5;
        child.rotation.y += delta * speed;
      });
    }
  });

  const rings = [
    { radius: 3.2, tube: 0.004, color: "#00d4ff", opacity: 0.4, rotation: [Math.PI/3, 0, 0] },
    { radius: 3.5, tube: 0.008, color: "#00ff88", opacity: 0.2, rotation: [0, Math.PI/4, 0] },
    { radius: 3.8, tube: 0.003, color: "#7c3aed", opacity: 0.5, rotation: [-Math.PI/4, 0, Math.PI/6] },
    { radius: 4.1, tube: 0.012, color: "#00d4ff", opacity: 0.1, rotation: [Math.PI/2, Math.PI/8, 0] },
    { radius: 4.5, tube: 0.005, color: "#0066ff", opacity: 0.3, rotation: [0, -Math.PI/3, 0] },
  ];

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <Torus 
          key={i} 
          args={[ring.radius, ring.tube, 16, 128]} 
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

// ─── HOLOGRAPHIC GROUND PROJECTION ──────────────────────────────────────────
function GroundProjection() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z -= delta * 0.1;
      // Pulse opacity
      groupRef.current.children.forEach((child: any) => {
        if (child.material) {
           child.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
      });
    }
  });

  return (
    <group position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <Ring args={[0.5, 3.5, 64]}>
         <meshBasicMaterial 
           color="#00d4ff" 
           transparent 
           opacity={0.05} 
           side={THREE.DoubleSide} 
           blending={THREE.AdditiveBlending}
           depthWrite={false}
         />
      </Ring>
      <group ref={groupRef}>
        <Ring args={[2.8, 2.85, 64]}>
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </Ring>
        <Ring args={[3.3, 3.32, 64]}>
          <meshBasicMaterial color="#00ff88" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
        </Ring>
        <Ring args={[4.0, 4.01, 128]}>
          <lineBasicMaterial color="#7c3aed" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </Ring>
      </group>
      {/* Central projector light */}
      <mesh position={[0, 0, 0.1]}>
         <circleGeometry args={[1, 32]} />
         <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── BACKGROUND PARTICLES ───────────────────────────────────────────────────
function BackgroundDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5; // Push backward
    }
    return [positions];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.02;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#00d4ff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// ─── MAIN SCENE ─────────────────────────────────────────────────────────────
function SceneContainer() {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth Parallax Interactivity
  useFrame((state) => {
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 8;
      const targetY = (state.pointer.y * Math.PI) / 8;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <PlexusCore />
      <OrbitalRings />
      <GroundProjection />
      <BackgroundDust />
    </group>
  );
}

export default function BiometricSphere3D() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#00ff88" />
        <pointLight position={[0, -5, 0]} intensity={2} color="#00d4ff" /> {/* Underlight */}
        
        <SceneContainer />
      </Canvas>
    </div>
  );
}
