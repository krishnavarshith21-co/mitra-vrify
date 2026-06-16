'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { usePathname } from 'next/navigation';

export default function Global3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const container = containerRef.current;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // ── Scene Setup ──────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera Setup ─────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    // ── Renderer Setup ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit to 1.5 for performance
    container.appendChild(renderer.domElement);

    // ── Performance Tiers (Responsive) ───────────────────────
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const particleCount = isMobile ? 20 : isTablet ? 40 : 80;
    const drawLines = !isMobile;

    // ── Layer 1: Cyber Grid System ───────────────────────────
    const gridHelper = new THREE.GridHelper(40, 24, 0x00d4ff, 0x0a1024);
    gridHelper.position.y = -3.5;
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.opacity = 0.08;
      gridHelper.material.transparent = true;
    }
    scene.add(gridHelper);

    // ── Layer 2: Floating Telemetry Particles ────────────────
    const particlesGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velocities: number[] = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 14;
      posArray[i + 1] = (Math.random() - 0.5) * 10;
      posArray[i + 2] = (Math.random() - 0.5) * 8;

      velocities.push(
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.002,
        (Math.random() - 0.5) * 0.002
      );
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.35,
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
        opacity: 0.05
      });
      const lineGeom = new THREE.BufferGeometry();
      lineSegments = new THREE.LineSegments(lineGeom, lineMat);
      scene.add(lineSegments);
    }

    // ── Layer 3: Rotating Wireframe Cyber Globe ──────────────
    const globeGeom = new THREE.SphereGeometry(2.8, 16, 16);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x0033aa,
      wireframe: true,
      transparent: true,
      opacity: 0.04
    });
    const globe = new THREE.Mesh(globeGeom, globeMat);
    globe.position.set(3, -0.5, -2);
    scene.add(globe);

    // Globe points/nodes
    const globePointsMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.1
    });
    const globePoints = new THREE.Points(globeGeom, globePointsMat);
    globePoints.position.copy(globe.position);
    scene.add(globePoints);

    // ── Animation Loop ───────────────────────────────────────
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Slow grid drift
      gridHelper.rotation.y += 0.0002;

      // Rotate globe
      globe.rotation.y += 0.0008;
      globe.rotation.x += 0.0004;
      globePoints.rotation.copy(globe.rotation);

      // Pulse globe slightly
      const pulse = 1 + 0.015 * Math.sin(time);
      globe.scale.set(pulse, pulse, pulse);
      globePoints.scale.set(pulse, pulse, pulse);

      // Update particles
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        // Boundaries
        if (Math.abs(positions[i * 3]) > 7) velocities[i * 3] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 5) velocities[i * 3 + 1] *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 4) velocities[i * 3 + 2] *= -1;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Update lines
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

      renderer.render(scene, camera);
    };

    animate();

    // ── Window Resize ────────────────────────────────────────
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
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

  // Conditionally disable the global backdrop on home page (which has its own big interactive canvas)
  if (pathname === '/') return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div className="aurora-container">
        <div className="aurora aurora-cyan"></div>
        <div className="aurora aurora-blue"></div>
        <div className="aurora aurora-violet"></div>
      </div>
    </div>
  );
}
