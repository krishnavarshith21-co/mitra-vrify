'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function TiltCard({ children, className = '', style = {} }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(
      window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rX = -((mouseY - height / 2) / (height / 2)) * 6;
    const rY = ((mouseX - width / 2) / (width / 2)) * 6;

    const gX = (mouseX / width) * 100;
    const gY = (mouseY / height) * 100;

    setRotateX(rX);
    setRotateY(rY);
    setGlareX(gX);
    setGlareY(gY);
  };

  const handleMouseEnter = () => {
    if (!isMobile) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={!isMobile ? {
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformPerspective: 1000,
      } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.5 }}
      className={`glass card-hover ${className}`}
      style={{
        ...style,
        position: 'relative',
        transformStyle: isMobile ? undefined : 'preserve-3d',
      }}
    >
      {/* Dynamic reflections glare overlay — desktop only */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle 200px at ${glareX}% ${glareY}%, rgba(0, 212, 255, 0.06), transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 1,
            borderRadius: 'inherit'
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </motion.div>
  );
}
