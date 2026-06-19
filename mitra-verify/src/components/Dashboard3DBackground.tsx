'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Dashboard3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Scene Setup ──────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera Setup ─────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // ── Renderer Setup ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Performance Tiers (Responsive) ───────────────────────
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const particleCount = isMobile ? 15 : isTablet ? 30 : 60;
    const drawLines = !isMobile;

    // ── Layer 1: Subtle Mesh Grid ────────────────────────────
    const gridHelper = new THREE.GridHelper(30, 20, 0x00d4ff, 0x0a1024);
    gridHelper.position.y = -3.5;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.opacity = 0.12;
      gridHelper.material.transparent = true;
    }
    scene.add(gridHelper);

    // ── Layer 2 & 4: Floating Particles & Connections ────────
    const particlesGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 12;
      posArray[i + 1] = (Math.random() - 0.5) * 8;
      posArray[i + 2] = (Math.random() - 0.5) * 6;

      velocities.push(
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.003
      );
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // Connection lines
    let lineSegments: THREE.LineSegments | null = null;
    if (drawLines) {
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        transparent: true,
        opacity: 0.08
      });
      const lineGeom = new THREE.BufferGeometry();
      lineSegments = new THREE.LineSegments(lineGeom, lineMat);
      scene.add(lineSegments);
    }

    // ── Layer 3: Rotating SOC Wireframe Globe ─────────────────
    const globeGeom = new THREE.SphereGeometry(2.5, 20, 20);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x0033aa,
      wireframe: true,
      transparent: true,
      opacity: 0.07
    });
    const globe = new THREE.Mesh(globeGeom, globeMat);
    // Positioned off-center in background
    globe.position.set(2, 0, -2);
    scene.add(globe);

    // Globe nodes
    const globePointsMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15
    });
    const globePoints = new THREE.Points(globeGeom, globePointsMat);
    globePoints.position.copy(globe.position);
    scene.add(globePoints);

    // ── Biometric Facial Cloud ──────────────────────────────
    const facePointsCount = isMobile ? 30 : 80;
    const facePointsArray = new Float32Array(facePointsCount * 3);
    for (let i = 0; i < facePointsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / facePointsCount);
      const theta = Math.sqrt(facePointsCount * Math.PI) * phi;
      const x = Math.sin(phi) * Math.cos(theta) * 1.2;
      const y = Math.sin(phi) * Math.sin(theta) * 1.5;
      const z = Math.cos(phi) * 0.6;
      facePointsArray[i * 3] = x;
      facePointsArray[i * 3 + 1] = y;
      facePointsArray[i * 3 + 2] = Math.abs(z);
    }
    const faceGeom = new THREE.BufferGeometry();
    faceGeom.setAttribute('position', new THREE.BufferAttribute(facePointsArray, 3));
    const faceMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00ff88,
      transparent: true,
      opacity: 0.15
    });
    const facePointsSystem = new THREE.Points(faceGeom, faceMat);
    facePointsSystem.position.set(-2.5, 0.5, -1);
    scene.add(facePointsSystem);

    // ── Radar Scanning Rings ─────────────────────────────────
    const radarRings: { mesh: THREE.LineLoop; maxRadius: number; speed: number }[] = [];
    const ringCount = isMobile ? 1 : 2;
    for (let i = 0; i < ringCount; i++) {
      const ringGeom = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segments = 64;
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0));
      }
      ringGeom.setFromPoints(pts);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15
      });
      const ringMesh = new THREE.LineLoop(ringGeom, ringMat);
      ringMesh.position.set(2, 0, -2);
      ringMesh.rotation.x = Math.PI / 2.5;
      scene.add(ringMesh);

      radarRings.push({
        mesh: ringMesh,
        maxRadius: 4.5 + i * 2.0,
        speed: 0.008 + i * 0.004
      });
    }

    // ── Animation Loop ───────────────────────────────────────
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Globe rotations
      globe.rotation.y += 0.001;
      globe.rotation.x += 0.0005;
      globePoints.rotation.copy(globe.rotation);

      // Biometric pulse
      const pulse = 1 + 0.02 * Math.sin(time * 2);
      globe.scale.set(pulse, pulse, pulse);
      globePoints.scale.set(pulse, pulse, pulse);

      // Rotate grid helper
      gridHelper.rotation.y += 0.0003;

      // Slow morphing face cloud
      const facePositions = facePointsSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < facePointsCount; i++) {
        facePositions[i * 3 + 2] = Math.abs(Math.cos(time + i)) * 0.3 + 0.3;
      }
      facePointsSystem.geometry.attributes.position.needsUpdate = true;
      facePointsSystem.rotation.y = Math.sin(time * 0.2) * 0.15;

      // Update particles
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        if (Math.abs(positions[i * 3]) > 6) velocities[i * 3] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 4) velocities[i * 3 + 1] *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 3) velocities[i * 3 + 2] *= -1;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Connections
      if (drawLines && lineSegments) {
        const linePositions: number[] = [];
        for (let i = 0; i < particleCount; i++) {
          const xi = positions[i * 3];
          const yi = positions[i * 3 + 1];
          const zi = positions[i * 3 + 2];

          for (let j = i + 1; j < particleCount; j++) {
            const xj = positions[j * 3];
            const yj = positions[j * 3 + 1];
            const zj = positions[j * 3 + 2];

            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 2.5) {
              linePositions.push(xi, yi, zi);
              linePositions.push(xj, yj, zj);
            }
          }
        }
        lineSegments.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      }

      // Radar Scan scaling
      radarRings.forEach((ring) => {
        const currentScale = ring.mesh.scale.x + ring.speed;
        if (currentScale > ring.maxRadius) {
          ring.mesh.scale.set(0.1, 0.1, 0.1);
          if (ring.mesh.material instanceof THREE.Material) {
            ring.mesh.material.opacity = 0.15;
          }
        } else {
          ring.mesh.scale.set(currentScale, currentScale, currentScale);
          const opacity = 0.15 * (1 - currentScale / ring.maxRadius);
          if (ring.mesh.material instanceof THREE.Material) {
            ring.mesh.material.opacity = opacity;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // ── Window Resize ────────────────────────────────────────
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity: 0.05,
        filter: 'blur(4px)',
      }}
    >
      {/* Aurora Layer 5 - Drifting glows */}
      <style jsx global>{`
        @keyframes drift-aurora-cyan {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15%, -10%) scale(1.2); }
        }
        @keyframes drift-aurora-blue {
          0%, 100% { transform: translate(0, 0) scale(1.2); }
          50% { transform: translate(-10%, 15%) scale(0.9); }
        }
        @keyframes drift-aurora-violet {
          0%, 100% { transform: translate(0, 0) scale(0.9); }
          50% { transform: translate(10%, -15%) scale(1.1); }
        }
        .aurora-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0.15;
          pointer-events: none;
        }
        .aurora {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }
        .aurora-cyan {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.45) 0%, transparent 70%);
          top: -100px;
          left: -100px;
          animation: drift-aurora-cyan 20s infinite ease-in-out;
        }
        .aurora-blue {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 102, 255, 0.4) 0%, transparent 70%);
          bottom: -150px;
          right: -100px;
          animation: drift-aurora-blue 24s infinite ease-in-out;
        }
        .aurora-violet {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%);
          top: 30%;
          left: 40%;
          animation: drift-aurora-violet 18s infinite ease-in-out;
        }
      `}</style>
      <div className="aurora-container">
        <div className="aurora aurora-cyan"></div>
        <div className="aurora aurora-blue"></div>
        <div className="aurora aurora-violet"></div>
      </div>
    </div>
  );
}
