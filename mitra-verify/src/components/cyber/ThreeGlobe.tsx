'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

const GLOBE_RADIUS = 2;

function GlobeWireframe() {
  const globeRef = useRef<THREE.Mesh>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    globeRef.current.rotation.y = elapsed * 0.05;
    globeRef.current.rotation.x = elapsed * 0.02;

    pointsRef.current.rotation.y = elapsed * 0.05;
    pointsRef.current.rotation.x = elapsed * 0.02;
    
    glowRef.current.rotation.y = elapsed * 0.05;

    // Breath pulse
    const scale = 1 + Math.sin(elapsed * 1.5) * 0.015;
    globeRef.current.scale.set(scale, scale, scale);
    pointsRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group>
      {/* Core Wireframe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#0066ff"
          wireframe
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Surface Points */}
      <points ref={pointsRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <pointsMaterial
          color="#00d4ff"
          size={0.03}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Inner Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[GLOBE_RADIUS * 0.98, 32, 32]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function OrbitingSatellites() {
  const groupRef = useRef<THREE.Group>(null!);
  
  const satellites = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const radius = GLOBE_RADIUS + 0.5 + Math.random() * 1.5;
      const speed = 0.2 + Math.random() * 0.5;
      const angleOffset = Math.random() * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * Math.PI;
      return { radius, speed, angleOffset, tilt };
    });
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    groupRef.current.rotation.y = elapsed * 0.1;
    groupRef.current.rotation.x = Math.sin(elapsed * 0.05) * 0.2;
    
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const sat = satellites[i];
        const angle = elapsed * sat.speed + sat.angleOffset;
        child.position.x = Math.cos(angle) * sat.radius;
        child.position.z = Math.sin(angle) * sat.radius;
        child.position.y = Math.sin(angle) * sat.radius * Math.sin(sat.tilt);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {satellites.map((sat, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.06, 0]} />
          <meshBasicMaterial color="#00ff88" wireframe />
        </mesh>
      ))}
      
      {/* Orbit Rings */}
      {satellites.map((sat, i) => (
        <mesh key={`ring-${i}`} rotation-x={Math.PI / 2} rotation-y={sat.tilt}>
          <torusGeometry args={[sat.radius, 0.002, 16, 64]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function AttackRoutes() {
  const routes = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 8; i++) {
      // Random start and end points on the sphere
      const phi1 = Math.acos(-1 + (2 * i) / 8);
      const theta1 = Math.sqrt(8 * Math.PI) * phi1;
      
      const start = new THREE.Vector3().setFromSphericalCoords(GLOBE_RADIUS, phi1, theta1);
      const end = new THREE.Vector3().setFromSphericalCoords(GLOBE_RADIUS, phi1 + Math.random(), theta1 + Math.PI / 2);
      
      // Control point for arc
      const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(GLOBE_RADIUS + 1.2);
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      lines.push(curve.getPoints(50));
    }
    return lines;
  }, []);

  return (
    <group>
      {routes.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#ff3366"
          opacity={0.4}
          transparent
          lineWidth={1.5}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </group>
  );
}

function RadarSweep() {
  const radarRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    radarRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
  });

  return (
    <mesh ref={radarRef} rotation-x={Math.PI / 2}>
      <cylinderGeometry args={[GLOBE_RADIUS * 1.1, 0.01, GLOBE_RADIUS * 1.1, 32, 1, true, 0, Math.PI / 4]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
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
    
    // Pulse scale
    const pulse = 1 + Math.sin(elapsed * 2) * 0.02;
    ring1Ref.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[GLOBE_RADIUS * 1.3, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[GLOBE_RADIUS * 1.5, 0.008, 8, 48]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function ThreeGlobe() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 500, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', outline: 'none' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#7c3aed" />

        <group rotation={[0.2, -0.5, 0]}>
          <GlobeWireframe />
          <OrbitingSatellites />
          <AttackRoutes />
          <RadarSweep />
          <ScanningRings />
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
