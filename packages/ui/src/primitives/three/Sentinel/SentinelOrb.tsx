'use client';

/**
 * SentinelOrb
 *
 * The main orb component that can be dragged, thrown, and docked.
 */

import { Center } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion, useAnimation } from 'motion/react';
import React, { Suspense, useEffect, useCallback, useRef } from 'react';

import { useSentinelStore } from './sentinelStore';
import { useSentinelDependencies } from './SentinelProvider';
import { useThrowPhysics } from './useThrowPhysics';
import { SigilPlaceholder } from './SigilPlaceholder';

const DOCKED_SIZE = 38;
const SUMMONED_SIZE = 80;

export const SentinelOrb: React.FC = () => {
  const controls = useAnimation();
  const { GlyphRenderer } = useSentinelDependencies();
  const orbRef = useRef<HTMLDivElement>(null);
  const syncFrameRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<{ x: number; y: number } | null>(null);
  const openSyncRef = useRef<number | null>(null);

  const phase = useSentinelStore((s) => s.phase);
  const orbPosition = useSentinelStore((s) => s.orbPosition);
  const targetPosition = useSentinelStore((s) => s.targetPosition);
  const taskbarOrigin = useSentinelStore((s) => s.taskbarOrigin);
  const setPhase = useSentinelStore((s) => s.setPhase);
  const setOrbPosition = useSentinelStore((s) => s.setOrbPosition);
  const dockAt = useSentinelStore((s) => s.dockAt);
  const phaseRef = useRef(phase);
  const animationTokenRef = useRef(0);

  // Throw physics handlers
  const handlePositionUpdate = useCallback(
    (pos: { x: number; y: number }) => {
      setOrbPosition(pos);
      controls.set({
        x: pos.x - SUMMONED_SIZE / 2,
        y: pos.y - SUMMONED_SIZE / 2,
      });
    },
    [controls, setOrbPosition]
  );

  const handleSettle = useCallback(
    (position: { edge: 'top' | 'left' | 'right'; percent: number }) => {
      setPhase('docked');
      dockAt(position);
    },
    [setPhase, dockAt]
  );

  const { isDragging, startDrag, onPointerMove, endDrag } = useThrowPhysics({
    onPositionUpdate: handlePositionUpdate,
    onSettle: handleSettle,
  });

  // Handle drag start - switch to throwing phase
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (phase === 'open') {
        setPhase('throwing');
        startDrag(e);
      }
    },
    [phase, setPhase, startDrag]
  );

  // Derive current size based on phase
  const isDocked = phase === 'docked';
  const showSigilOnly = phase === 'summoning' || phase === 'dismissing';
  const currentSize = isDocked ? DOCKED_SIZE : SUMMONED_SIZE;
  const initialSize = phase === 'summoning' ? DOCKED_SIZE : currentSize;
  const initialCenter = phase === 'summoning' ? taskbarOrigin : orbPosition;

  const syncOrbPosition = useCallback(() => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const next = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const last = lastSyncedRef.current;
    if (last && Math.abs(last.x - next.x) < 0.25 && Math.abs(last.y - next.y) < 0.25) {
      return;
    }
    lastSyncedRef.current = next;
    setOrbPosition(next);
  }, [setOrbPosition]);

  const handleMotionUpdate = useCallback(
    () => {
      syncOrbPosition();
    },
    [syncOrbPosition]
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase === 'summoning') {
      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;
      controls.stop();
      controls.set({
        x: taskbarOrigin.x - DOCKED_SIZE / 2,
        y: taskbarOrigin.y - DOCKED_SIZE / 2,
        width: DOCKED_SIZE,
        height: DOCKED_SIZE,
      });
      lastSyncedRef.current = null;
      setOrbPosition(taskbarOrigin);
      // Animate from current position to center
      controls
        .start({
          x: targetPosition.x - SUMMONED_SIZE / 2,
          y: targetPosition.y - SUMMONED_SIZE / 2,
          width: SUMMONED_SIZE,
          height: SUMMONED_SIZE,
          transition: {
            type: 'spring',
            stiffness: 200,
            damping: 25,
            mass: 1,
            duration: 0.6,
          },
        })
        .then(() => {
          if (animationTokenRef.current !== token || phaseRef.current !== 'summoning') {
            return;
          }
          setOrbPosition(targetPosition);
          setPhase('open');
          requestAnimationFrame(() => syncOrbPosition());
        });
    } else if (phase === 'dismissing') {
      const token = animationTokenRef.current + 1;
      animationTokenRef.current = token;
      controls.stop();
      // Animate back to taskbar
      controls
        .start({
          x: taskbarOrigin.x - DOCKED_SIZE / 2,
          y: taskbarOrigin.y - DOCKED_SIZE / 2,
          width: DOCKED_SIZE,
          height: DOCKED_SIZE,
          transition: {
            type: 'spring',
            stiffness: 250,
            damping: 28,
            mass: 0.8,
            duration: 0.5,
          },
        })
        .then(() => {
          if (animationTokenRef.current !== token || phaseRef.current !== 'dismissing') {
            return;
          }
          setOrbPosition(taskbarOrigin);
          setPhase('docked');
          dockAt('taskbar');
        });
    }
  }, [
    phase,
    targetPosition,
    taskbarOrigin,
    controls,
    setPhase,
    setOrbPosition,
    dockAt,
  ]);

  useEffect(() => {
    if (phase !== 'summoning' && phase !== 'dismissing') {
      if (syncFrameRef.current) {
        cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      syncOrbPosition();
      syncFrameRef.current = requestAnimationFrame(tick);
    };

    syncFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (syncFrameRef.current) {
        cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }
    };
  }, [phase, syncOrbPosition]);

  useEffect(() => {
    if (phase !== 'open') {
      if (openSyncRef.current) {
        cancelAnimationFrame(openSyncRef.current);
        openSyncRef.current = null;
      }
      return;
    }

    let frames = 0;
    const tick = () => {
      syncOrbPosition();
      frames += 1;
      if (frames < 6) {
        openSyncRef.current = requestAnimationFrame(tick);
      }
    };

    openSyncRef.current = requestAnimationFrame(tick);
    const handleResize = () => syncOrbPosition();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (openSyncRef.current) {
        cancelAnimationFrame(openSyncRef.current);
        openSyncRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [phase, syncOrbPosition]);

  // Set initial position
  useEffect(() => {
    if (phase === 'docked') {
      controls.set({
        x: taskbarOrigin.x - DOCKED_SIZE / 2,
        y: taskbarOrigin.y - DOCKED_SIZE / 2,
        width: DOCKED_SIZE,
        height: DOCKED_SIZE,
      });
    }
  }, [taskbarOrigin, phase, controls]);

  // Determine cursor based on state
  const cursor = isDragging ? 'grabbing' : phase === 'open' ? 'grab' : 'pointer';

  return (
    <motion.div
      ref={orbRef}
      data-sentinel-orb="true"
      animate={controls}
      initial={{
        x: initialCenter.x - initialSize / 2,
        y: initialCenter.y - initialSize / 2,
        width: initialSize,
        height: initialSize,
      }}
      style={{
        position: 'fixed',
        zIndex: 9999,
        borderRadius: '50%',
        border: '1px solid rgba(212, 168, 75, 0.3)',
        background:
          'linear-gradient(160deg, rgba(0, 0, 0, 0.6), rgba(8, 8, 10, 0.85))',
        overflow: 'hidden',
        cursor,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        display: 'grid',
        placeItems: 'center',
        lineHeight: 0,
        touchAction: 'none',  // Prevent touch scrolling during drag
      }}
      onUpdate={handleMotionUpdate}
      onPointerDown={handlePointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 3]} intensity={0.8} />
        {showSigilOnly ? (
          <Center>
            <SigilPlaceholder scale={1.05} />
          </Center>
        ) : (
          <Suspense
            fallback={
              <Center>
                <SigilPlaceholder scale={1.05} />
              </Center>
            }
          >
            {GlyphRenderer && (
              <Center>
                <GlyphRenderer variant="sentinel" scale={0.85} />
              </Center>
            )}
          </Suspense>
        )}
      </Canvas>
    </motion.div>
  );
};

export default SentinelOrb;
