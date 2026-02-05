/**
 * useGestureRecognizer - Hook for capturing speakeasy gesture sequences
 *
 * Recognizes:
 * - Tap sequences (single, double, triple+)
 * - Hold gestures (with configurable threshold)
 * - Radial drags (angle calculation, notch detection)
 * - Flicks (direction + velocity)
 *
 * Outputs a GestureSequence with timing data for verification.
 */

import { useCallback, useRef, useState } from 'react';
import {
  DEFAULT_GESTURE_CONFIG,
  type GestureRecognizerConfig,
  type GestureRecognizerState,
  type GestureSequence,
  type GestureStep,
  type Point,
} from '../types.js';

interface UseGestureRecognizerOptions {
  /** Configuration overrides */
  config?: Partial<GestureRecognizerConfig>;
  /** Center point of the orb (for radial calculations) */
  centerRef: React.RefObject<HTMLElement | null>;
  /** Called when a complete gesture sequence is detected */
  onGestureComplete?: (sequence: GestureSequence) => void;
  /** Called when gesture recognition starts */
  onGestureStart?: () => void;
  /** Called on each gesture step */
  onGestureStep?: (step: GestureStep) => void;
}

interface UseGestureRecognizerReturn {
  /** Current recognizer state */
  state: GestureRecognizerState;
  /** Accumulated steps */
  steps: GestureStep[];
  /** Whether actively capturing */
  isCapturing: boolean;
  /** Bind these to your target element */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  /** Start capturing a new gesture sequence */
  startCapture: () => void;
  /** End capture and get the sequence */
  endCapture: () => Promise<GestureSequence | null>;
  /** Reset without emitting */
  reset: () => void;
}

/**
 * Calculate distance between two points
 */
function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Calculate angle from center to point (degrees, 0 = right, CCW positive)
 */
function angleFromCenter(center: Point, point: Point): number {
  const dx = point.x - center.x;
  const dy = center.y - point.y; // Flip Y for standard math coords
  const radians = Math.atan2(dy, dx);
  return ((radians * 180) / Math.PI + 360) % 360;
}

/**
 * Determine region (center vs edge) based on distance from center
 */
function getRegion(center: Point, point: Point, threshold: number): 'center' | 'edge' {
  return distance(center, point) < threshold ? 'center' : 'edge';
}

/**
 * Calculate rhythm hash from timing intervals (anti-replay)
 */
async function calculateRhythmHash(timings: number[]): Promise<string> {
  const data = new TextEncoder().encode(timings.join(','));
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('[Speakeasy] crypto.subtle is required');
  }
  const hashBuffer = await subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useGestureRecognizer(
  options: UseGestureRecognizerOptions
): UseGestureRecognizerReturn {
  const config = { ...DEFAULT_GESTURE_CONFIG, ...options.config };
  const { centerRef, onGestureComplete, onGestureStart, onGestureStep } = options;

  // State
  const [state, setState] = useState<GestureRecognizerState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    startTime: null,
    steps: [],
    pendingTapCount: 0,
  });

  // Refs for tracking across events
  const stepsRef = useRef<GestureStep[]>([]);
  const timingsRef = useRef<number[]>([]);
  const captureStartRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ point: Point; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartAngleRef = useRef<number | null>(null);
  const notchesHitRef = useRef<Set<number>>(new Set());

  /**
   * Get center point of the orb
   */
  const getCenter = useCallback((): Point => {
    if (!centerRef.current) {
      return { x: 0, y: 0 };
    }
    const rect = centerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, [centerRef]);

  /**
   * Add a step to the sequence
   */
  const addStep = useCallback(
    (step: GestureStep) => {
      stepsRef.current.push(step);
      timingsRef.current.push(Date.now() - (captureStartRef.current || Date.now()));
      setState((s) => ({ ...s, steps: [...stepsRef.current] }));
      onGestureStep?.(step);
    },
    [onGestureStep]
  );

  /**
   * Start capturing a new gesture sequence
   */
  const startCapture = useCallback(() => {
    stepsRef.current = [];
    timingsRef.current = [];
    captureStartRef.current = Date.now();
    tapCountRef.current = 0;
    setState({
      isActive: true,
      startPoint: null,
      currentPoint: null,
      startTime: Date.now(),
      steps: [],
      pendingTapCount: 0,
    });
    onGestureStart?.();
  }, [onGestureStart]);

  /**
   * End capture and return the sequence
   */
  const endCapture = useCallback(async (): Promise<GestureSequence | null> => {
    const captureStart = captureStartRef.current;
    if (!captureStart) return null;

    // Flush any pending taps
    if (tapCountRef.current > 0 && tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      const center = getCenter();
      const lastPoint = pointerStartRef.current?.point || center;
      const region = getRegion(center, lastPoint, (centerRef.current?.clientWidth || 64) / 3);
      addStep({ type: 'tap', count: tapCountRef.current, region });
      tapCountRef.current = 0;
    }

    const totalDurationMs = Date.now() - captureStart;
    const rhythmHash = await calculateRhythmHash(timingsRef.current);

    const sequence: GestureSequence = {
      steps: [...stepsRef.current],
      totalDurationMs,
      rhythmHash,
      timestamp: captureStart,
    };

    onGestureComplete?.(sequence);
    captureStartRef.current = null;
    pointerStartRef.current = null;
    isDraggingRef.current = false;
    dragStartAngleRef.current = null;
    notchesHitRef.current.clear();
    setState((s) => ({
      ...s,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      startTime: null,
      pendingTapCount: 0,
    }));
    return sequence;
  }, [getCenter, centerRef, addStep, onGestureComplete]);

  /**
   * Reset without emitting
   */
  const reset = useCallback(() => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    stepsRef.current = [];
    timingsRef.current = [];
    captureStartRef.current = null;
    pointerStartRef.current = null;
    tapCountRef.current = 0;
    isDraggingRef.current = false;
    dragStartAngleRef.current = null;
    notchesHitRef.current.clear();
    setState({
      isActive: false,
      startPoint: null,
      currentPoint: null,
      startTime: null,
      steps: [],
      pendingTapCount: 0,
    });
  }, []);

  /**
   * Handle pointer down
   */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isActive) return;

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture isn't supported
      }

      const point = { x: e.clientX, y: e.clientY };
      const now = Date.now();

      pointerStartRef.current = { point, time: now };
      isDraggingRef.current = false;
      notchesHitRef.current.clear();

      const center = getCenter();
      dragStartAngleRef.current = angleFromCenter(center, point);
      const notch = Math.floor(dragStartAngleRef.current / config.radialNotchDegrees);
      notchesHitRef.current.add(notch);

      setState((s) => ({ ...s, startPoint: point, currentPoint: point }));
    },
    [state.isActive, config.radialNotchDegrees, getCenter]
  );

  /**
   * Handle pointer move
   */
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isActive || !pointerStartRef.current) return;

      const point = { x: e.clientX, y: e.clientY };
      const center = getCenter();
      const dist = distance(pointerStartRef.current.point, point);

      // Check if this is now a drag
      if (!isDraggingRef.current && dist > config.dragMinDistancePx) {
        isDraggingRef.current = true;
      }

      // Track radial notches during drag
      if (isDraggingRef.current && dragStartAngleRef.current !== null) {
        const currentAngle = angleFromCenter(center, point);
        const notch = Math.floor(currentAngle / config.radialNotchDegrees);
        notchesHitRef.current.add(notch);
      }

      setState((s) => ({ ...s, currentPoint: point }));
    },
    [state.isActive, config, getCenter]
  );

  /**
   * Handle pointer up
   */
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isActive || !pointerStartRef.current) return;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture wasn't active
      }

      const point = { x: e.clientX, y: e.clientY };
      const now = Date.now();
      const duration = now - pointerStartRef.current.time;
      const dist = distance(pointerStartRef.current.point, point);
      const center = getCenter();

      if (isDraggingRef.current) {
        // Was a drag - check for radial or flick
        const velocity = dist / duration;

        if (velocity > config.flickMinVelocity && duration < config.tapMaxDurationMs * 2) {
          // Flick
          const dx = point.x - pointerStartRef.current.point.x;
          const dy = point.y - pointerStartRef.current.point.y;
          let direction: 'up' | 'down' | 'left' | 'right';
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }
          addStep({ type: 'flick', direction, velocity });
        } else if (notchesHitRef.current.size > 1) {
          // Radial drag
          const fromAngle = dragStartAngleRef.current || 0;
          const toAngle = angleFromCenter(center, point);
          addStep({
            type: 'radial_drag',
            fromAngle,
            toAngle,
            notches: notchesHitRef.current.size,
          });
        }
      } else if (duration >= config.holdMinDurationMs && dist < config.tapMaxMovementPx) {
        // Hold
        const region = getRegion(center, point, (centerRef.current?.clientWidth || 64) / 3);
        addStep({
          type: 'hold',
          durationMs: duration,
          region,
        });
      } else if (duration < config.tapMaxDurationMs && dist < config.tapMaxMovementPx) {
        // Tap
        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }

        const timeSinceLastTap = now - lastTapTimeRef.current;
        if (timeSinceLastTap < config.tapIntervalMs) {
          tapCountRef.current++;
        } else {
          // Emit previous tap sequence if any
          if (tapCountRef.current > 0) {
            const region = getRegion(center, point, (centerRef.current?.clientWidth || 64) / 3);
            addStep({ type: 'tap', count: tapCountRef.current, region });
          }
          tapCountRef.current = 1;
        }
        lastTapTimeRef.current = now;

        // Wait for potential multi-tap
        tapTimeoutRef.current = setTimeout(() => {
          if (tapCountRef.current > 0) {
            const region = getRegion(center, point, (centerRef.current?.clientWidth || 64) / 3);
            addStep({ type: 'tap', count: tapCountRef.current, region });
            tapCountRef.current = 0;
          }
        }, config.tapIntervalMs);

        setState((s) => ({ ...s, pendingTapCount: tapCountRef.current }));
      }

      // Reset pointer tracking
      pointerStartRef.current = null;
      isDraggingRef.current = false;
      dragStartAngleRef.current = null;
      notchesHitRef.current.clear();
      setState((s) => ({ ...s, startPoint: null, currentPoint: null }));
    },
    [state.isActive, config, getCenter, centerRef, addStep]
  );

  /**
   * Handle pointer cancel
   */
  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture wasn't active
    }
    pointerStartRef.current = null;
    isDraggingRef.current = false;
    setState((s) => ({ ...s, startPoint: null, currentPoint: null }));
  }, []);

  return {
    state,
    steps: state.steps,
    isCapturing: state.isActive,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    startCapture,
    endCapture,
    reset,
  };
}

export default useGestureRecognizer;
