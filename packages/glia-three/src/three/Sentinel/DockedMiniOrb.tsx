'use client';

/**
 * DockedMiniOrb
 *
 * A small orb that appears at the edge of the screen when Sentinel is docked
 * (not in the taskbar). Clicking it summons the full Sentinel.
 */

import { Center } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { useSentinelStore } from './sentinelStore';
import { useSentinelDependencies } from './SentinelProvider';
import { SigilPlaceholder } from './SigilPlaceholder';

const ORB_SIZE = 32;
const EDGE_OFFSET = 16;

const subtlePulse = keyframes`
  0%, 100% {
    box-shadow: 0 2px 12px rgba(212, 168, 75, 0.3),
                0 0 16px rgba(212, 168, 75, 0.15);
  }
  50% {
    box-shadow: 0 2px 16px rgba(212, 168, 75, 0.45),
                0 0 24px rgba(212, 168, 75, 0.25);
  }
`;

const OrbContainer = styled(motion.div)`
  position: fixed;
  z-index: 9999;
  width: ${ORB_SIZE}px;
  height: ${ORB_SIZE}px;
  border-radius: 50%;
  border: 1px solid rgba(212, 168, 75, 0.4);
  background: linear-gradient(160deg, rgba(0, 0, 0, 0.65), rgba(8, 8, 10, 0.9));
  overflow: hidden;
  cursor: pointer;
  animation: ${subtlePulse} 3s ease-in-out infinite;
`;

export const DockedMiniOrb: React.FC = () => {
  const phase = useSentinelStore((s) => s.phase);
  const dockedPosition = useSentinelStore((s) => s.dockedPosition);
  const summon = useSentinelStore((s) => s.summon);
  const setTaskbarOrigin = useSentinelStore((s) => s.setTaskbarOrigin);
  const setOrbPosition = useSentinelStore((s) => s.setOrbPosition);

  const { GlyphRenderer } = useSentinelDependencies();

  const [position, setPosition] = useState({ left: 0, top: 0 });

  // Calculate position based on dockedPosition
  useEffect(() => {
    if (dockedPosition === 'taskbar') return;

    const calculatePosition = () => {
      const { edge, percent } = dockedPosition;

      let left = 0;
      let top = 0;

      const width = typeof window !== 'undefined' ? window.innerWidth : 800;
      const height = typeof window !== 'undefined' ? window.innerHeight : 600;

      switch (edge) {
        case 'top':
          left = percent * width;
          top = EDGE_OFFSET;
          break;
        case 'left':
          left = EDGE_OFFSET;
          top = percent * height;
          break;
        case 'right':
          left = width - EDGE_OFFSET;
          top = percent * height;
          break;
      }

      setPosition({ left, top });
    };

    calculatePosition();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [dockedPosition]);

  const handleClick = useCallback(() => {
    // Set taskbar origin to current position before summoning
    const origin = { x: position.left, y: position.top };
    setTaskbarOrigin(origin);
    setOrbPosition(origin);
    summon();
  }, [summon, setTaskbarOrigin, setOrbPosition, position]);

  // Only render when docked at an edge (not taskbar)
  if (phase !== 'docked' || dockedPosition === 'taskbar') {
    return null;
  }

  return (
    <OrbContainer
      style={{
        left: position.left - ORB_SIZE / 2,
        top: position.top - ORB_SIZE / 2,
      }}
      onClick={handleClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 3]} intensity={0.8} />
        <Suspense
          fallback={
            <Center>
              <SigilPlaceholder scale={0.85} />
            </Center>
          }
        >
          {GlyphRenderer && (
            <Center>
              <GlyphRenderer variant="sentinel" scale={0.7} />
            </Center>
          )}
        </Suspense>
      </Canvas>
    </OrbContainer>
  );
};

export default DockedMiniOrb;
