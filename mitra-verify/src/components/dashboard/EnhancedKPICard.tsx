'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import AnimatedCounter from '@/components/cyber/AnimatedCounter';

interface EnhancedKPICardProps {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color?: string;
  sparklineData?: number[];
}

export default function EnhancedKPICard({ 
  label, 
  value, 
  unit, 
  delta, 
  icon: Icon, 
  color = '#00d4ff',
  sparklineData = []
}: EnhancedKPICardProps) {

  // Prepare dummy data for the sparkline if not provided to make it look active
  const data = useMemo(() => {
    if (sparklineData.length > 0) {
      return sparklineData.map((val, i) => ({ value: val, index: i }));
    }
    // Generate some random noise based on the value to simulate trend
    return Array.from({ length: 10 }).map((_, i) => ({
      index: i,
      value: value > 0 ? value * (0.8 + Math.random() * 0.4) : Math.random() * 10
    }));
  }, [sparklineData, value]);

  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className="premium-glass spotlight-card p-5 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Background Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none transition-opacity group-hover:opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            <Icon size={18} color={color} />
          </div>
          
          {delta !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: isPositive ? '#00ff88' : '#ff3366', boxShadow: `0 0 8px ${isPositive ? '#00ff88' : '#ff3366'}` }} />
              <span style={{ fontSize: 12, color: isPositive ? '#00ff88' : '#ff3366', fontWeight: 600 }}>
                {isPositive ? '+' : ''}{delta}%
              </span>
            </div>
          )}
        </div>
        
        <div>
          <div className="text-3xl font-bold text-white tracking-tight flex items-baseline">
            <AnimatedCounter value={value} />
            {unit && <span className="text-sm ml-1 text-slate-400 font-medium">{unit}</span>}
          </div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
