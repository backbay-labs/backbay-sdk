'use client';

/**
 * SentinelTether
 *
 * An SVG line connecting the Sentinel orb to its taskbar origin.
 * Visible during summoning phase, fades out during open phase.
 */

import { motion } from 'motion/react';
import React from 'react';

import { useSentinelStore } from './sentinelStore';

export const SentinelTether: React.FC = () => {
  const phase = useSentinelStore((s) => s.phase);
  const orbPosition = useSentinelStore((s) => s.orbPosition);
  const taskbarOrigin = useSentinelStore((s) => s.taskbarOrigin);

  const start = taskbarOrigin;
  const end = orbPosition;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const safeDistance = distance || 1;
  const normal = { x: -dy / safeDistance, y: dx / safeDistance };
  const steps = Math.max(6, Math.min(24, Math.round(safeDistance / 28)));
  const baseAmp = Math.min(5.5, Math.max(1.5, safeDistance * 0.015));
  const jitterSeed = Math.sin((start.x + start.y) * 0.015);
  const freq = 3 + Math.floor(safeDistance / 160);
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const t = steps === 0 ? 0 : index / steps;
    let offset = 0;
    if (index > 0 && index < steps) {
      const phaseA = t * Math.PI * (2 + freq) + jitterSeed * 2.7;
      const phaseB = t * Math.PI * (3.5 + freq * 1.4) + jitterSeed * 4.1;
      const wobble = Math.sin(phaseA);
      const chisel = Math.sign(Math.sin(phaseB));
      const amp = baseAmp * (0.45 + 0.55 * Math.sin(t * Math.PI * 2 + jitterSeed));
      offset = (wobble * 0.6 + chisel * 0.4) * amp;
      offset = Math.round(offset * 2) / 2;
    }
    return {
      x: start.x + dx * t + normal.x * offset,
      y: start.y + dy * t + normal.y * offset,
    };
  });
  const pointsAttr = points.map((point) => `${point.x},${point.y}`).join(' ');
  const dash = Math.max(10, Math.min(24, safeDistance * 0.115));
  const gap = Math.max(16, Math.min(34, safeDistance * 0.19));
  const dashArray = `${dash} ${gap}`;
  const sparkDashArray = `${Math.max(2.5, dash * 0.35)} ${Math.max(10, gap * 1.4)}`;

  // Only render during summoning or open phases
  if (phase === 'docked' || phase === 'dismissing' || phase === 'throwing' || phase === 'avatar') {
    return null;
  }

  // Determine opacity based on phase
  const targetOpacity = phase === 'summoning' ? 1 : 0;
  const gradientId = 'sentinel-tether-gradient';
  const filterId = 'sentinel-tether-glow';

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      <defs>
        {/* Linear gradient from gold core to warm flare */}
        <linearGradient
          id={gradientId}
          x1={taskbarOrigin.x}
          y1={taskbarOrigin.y}
          x2={orbPosition.x}
          y2={orbPosition.y}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9f6420" stopOpacity={0.95} />
          <stop offset="15%" stopColor="#e1a341" stopOpacity={0.98} />
          <stop offset="35%" stopColor="#ffd48a" stopOpacity={0.95} />
          <stop offset="55%" stopColor="#fff0c9" stopOpacity={0.9} />
          <stop offset="75%" stopColor="#efb95f" stopOpacity={0.78} />
          <stop offset="100%" stopColor="#b9792a" stopOpacity={0.5} />
        </linearGradient>

        {/* Glow filter */}
        <filter id={filterId} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="blur" />
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 0.85 0 0 0
              0 0 0.45 0 0
              0 0 0 1 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.polyline
        points={pointsAttr}
        stroke="rgba(212, 168, 75, 0.32)"
        strokeWidth={4.1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${filterId})`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: targetOpacity }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      <motion.polyline
        points={pointsAttr}
        stroke={`url(#${gradientId})`}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${filterId})`}
        initial={{ opacity: 1 }}
        animate={{ opacity: targetOpacity }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      <motion.polyline
        points={pointsAttr}
        stroke="rgba(255, 234, 184, 0.9)"
        strokeWidth={1.05}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={dashArray}
        filter={`url(#${filterId})`}
        initial={{ opacity: 0.55, strokeDashoffset: 0 }}
        animate={{ opacity: targetOpacity, strokeDashoffset: -safeDistance }}
        transition={{
          opacity: { duration: 0.75, ease: 'easeOut' },
          strokeDashoffset: { duration: 7.8, repeat: Infinity, ease: 'linear' },
        }}
      />
      <motion.polyline
        points={pointsAttr}
        stroke="rgba(255, 241, 210, 0.9)"
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={sparkDashArray}
        filter={`url(#${filterId})`}
        initial={{ opacity: 0.35, strokeDashoffset: 0 }}
        animate={{ opacity: targetOpacity, strokeDashoffset: -safeDistance * 1.6 }}
        transition={{
          opacity: { duration: 0.75, ease: 'easeOut' },
          strokeDashoffset: { duration: 10.6, repeat: Infinity, ease: 'linear' },
        }}
      />
      <motion.circle
        cx={orbPosition.x}
        cy={orbPosition.y}
        r={5}
        fill="rgba(212, 168, 75, 0.9)"
        filter={`url(#${filterId})`}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: targetOpacity, scale: [1, 1.18, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
};

export default SentinelTether;
