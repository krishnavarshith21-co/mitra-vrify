'use client';

import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
}

export default function AnimatedCounter({ value, duration = 1.2 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Strip non-numerical parts to get raw number
  const rawString = (value ?? '0').toString();
  const hasPercent = rawString.includes('%');
  const hasMs = rawString.includes('ms');
  
  const numValue = useMemo(() => {
    const cleaned = rawString.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }, [rawString]);

  useEffect(() => {
    const controls = animate(0, numValue, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        setDisplayValue(latest);
      },
    });
    return () => controls.stop();
  }, [numValue, duration]);

  // Format the output matching the input type
  const formatted = (() => {
    if (typeof value === 'number') {
      return Math.round(displayValue).toLocaleString();
    }
    if (hasPercent) {
      return `${displayValue.toFixed(1)}%`;
    }
    if (hasMs) {
      return `${Math.round(displayValue)}ms`;
    }
    if (rawString.includes('.')) {
      return displayValue.toFixed(1);
    }
    return Math.round(displayValue).toLocaleString();
  })();

  // Use useMemo to avoid re-running cleanup on every tick
  function useMemo<T>(factory: () => T, deps: any[]): T {
    return React.useMemo(factory, deps);
  }

  return <span>{formatted}</span>;
}
