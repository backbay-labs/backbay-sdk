/**
 * useThrowPhysics Hook
 *
 * Provides physics simulation for throwing the Sentinel orb
 * and calculating edge docking positions.
 */

import { useCallback, useRef, useState } from 'react';

import type { ThrowPhysicsOptions, ThrowPhysicsReturn, Edge } from './types';

const PHYSICS = {
  friction: 0.98,
  bounceDamping: 0.6,
  gravity: 0.15,
  minVelocity: 0.5,
  edgePadding: 16,
};

interface VelocityPoint {
  x: number;
  y: number;
  time: number;
}

export function useThrowPhysics(options: ThrowPhysicsOptions): ThrowPhysicsReturn {
  const { onPositionUpdate, onSettle, edgePadding = PHYSICS.edgePadding } = options;

  const [isDragging, setIsDragging] = useState(false);
  const velocityHistory = useRef<VelocityPoint[]>([]);
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  const calculateVelocity = useCallback((): { vx: number; vy: number } => {
    const history = velocityHistory.current;
    if (history.length < 2) return { vx: 0, vy: 0 };

    const now = performance.now();
    const recentPoints = history.filter((p) => now - p.time < 100);

    if (recentPoints.length < 2) {
      const last = history[history.length - 1];
      const prev = history[history.length - 2];
      const dt = Math.max(last.time - prev.time, 1);
      return {
        vx: ((last.x - prev.x) / dt) * 16,
        vy: ((last.y - prev.y) / dt) * 16,
      };
    }

    const first = recentPoints[0];
    const last = recentPoints[recentPoints.length - 1];
    const dt = Math.max(last.time - first.time, 1);

    return {
      vx: ((last.x - first.x) / dt) * 16,
      vy: ((last.y - first.y) / dt) * 16,
    };
  }, []);

  const determineEdge = useCallback(
    (x: number, y: number): { edge: Edge; percent: number } => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 800;
      const height = typeof window !== 'undefined' ? window.innerHeight : 600;

      const distToTop = y;
      const distToLeft = x;
      const distToRight = width - x;

      const minDist = Math.min(distToTop, distToLeft, distToRight);

      if (minDist === distToTop) {
        const percent = Math.max(0, Math.min(1, x / width));
        return { edge: 'top', percent };
      } else if (minDist === distToLeft) {
        const percent = Math.max(0, Math.min(1, y / height));
        return { edge: 'left', percent };
      } else {
        const percent = Math.max(0, Math.min(1, y / height));
        return { edge: 'right', percent };
      }
    },
    []
  );

  const runPhysicsLoop = useCallback(
    (initialVx: number, initialVy: number) => {
      let vx = initialVx;
      let vy = initialVy;
      let x = currentPosition.current.x;
      let y = currentPosition.current.y;

      const width = typeof window !== 'undefined' ? window.innerWidth : 800;
      const height = typeof window !== 'undefined' ? window.innerHeight : 600;

      const step = () => {
        vx *= PHYSICS.friction;
        vy *= PHYSICS.friction;
        vy += PHYSICS.gravity;

        x += vx;
        y += vy;

        let hitEdge = false;

        if (x < edgePadding) {
          x = edgePadding;
          vx = -vx * PHYSICS.bounceDamping;
          hitEdge = true;
        } else if (x > width - edgePadding) {
          x = width - edgePadding;
          vx = -vx * PHYSICS.bounceDamping;
          hitEdge = true;
        }

        if (y < edgePadding) {
          y = edgePadding;
          vy = -vy * PHYSICS.bounceDamping;
          hitEdge = true;
        } else if (y > height - edgePadding) {
          y = height - edgePadding;
          vy = -vy * PHYSICS.bounceDamping;
          hitEdge = true;
        }

        currentPosition.current = { x, y };
        onPositionUpdate({ x, y });

        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed < PHYSICS.minVelocity && hitEdge) {
          animationFrameId.current = null;
          const settlePosition = determineEdge(x, y);
          onSettle(settlePosition);
          return;
        }

        if (speed < PHYSICS.minVelocity * 0.1) {
          animationFrameId.current = null;
          const settlePosition = determineEdge(x, y);
          onSettle(settlePosition);
          return;
        }

        animationFrameId.current = requestAnimationFrame(step);
      };

      animationFrameId.current = requestAnimationFrame(step);
    },
    [edgePadding, onPositionUpdate, onSettle, determineEdge]
  );

  const startDrag = useCallback((e: React.PointerEvent) => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    setIsDragging(true);
    velocityHistory.current = [];

    const point: VelocityPoint = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
    velocityHistory.current.push(point);
    currentPosition.current = { x: e.clientX, y: e.clientY };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const point: VelocityPoint = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      };

      velocityHistory.current.push(point);
      if (velocityHistory.current.length > 5) {
        velocityHistory.current.shift();
      }

      currentPosition.current = { x: e.clientX, y: e.clientY };
      onPositionUpdate({ x: e.clientX, y: e.clientY });
    },
    [isDragging, onPositionUpdate]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const { vx, vy } = calculateVelocity();

      if (Math.abs(vx) < PHYSICS.minVelocity && Math.abs(vy) < PHYSICS.minVelocity) {
        const settlePosition = determineEdge(currentPosition.current.x, currentPosition.current.y);
        onSettle(settlePosition);
        return;
      }

      runPhysicsLoop(vx, vy);
    },
    [isDragging, calculateVelocity, determineEdge, onSettle, runPhysicsLoop]
  );

  return {
    isDragging,
    startDrag,
    onPointerMove,
    endDrag,
  };
}
