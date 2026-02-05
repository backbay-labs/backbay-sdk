'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AVO,
  AnchorState,
  TransitionOptions,
  EmotionEvent,
  VisualState,
  MicroExpressionConfig,
} from '../types.js';
import { EmotionController } from '../controller.js';

export interface UseEmotionOptions {
  /** Initial dimensions */
  initial?: Partial<AVO>;
  /** Initial anchor state (overrides initial) */
  initialAnchor?: AnchorState;
  /** Enable micro-expressions (boolean or config object) */
  microExpressions?: boolean | MicroExpressionConfig;
  /** Callback on dimension change */
  onChange?: (dimensions: AVO) => void;
  /** Auto-tick with requestAnimationFrame (default: true) */
  autoTick?: boolean;
}

export interface UseEmotionResult {
  /** Current dimensions (with micro-expressions if enabled) */
  dimensions: AVO;
  /** Base dimensions (without micro-expressions) */
  baseDimensions: AVO;
  /** Computed visual properties */
  visualState: VisualState;
  /** Set dimensions instantly */
  set: (dimensions: Partial<AVO>) => void;
  /** Transition to dimensions */
  transition: (dimensions: Partial<AVO>, options?: TransitionOptions) => void;
  /** Transition to anchor state */
  goTo: (anchor: AnchorState, options?: TransitionOptions) => void;
  /** Handle emotion event */
  emit: (event: EmotionEvent) => void;
  /** Currently transitioning */
  isTransitioning: boolean;
  /** Manual tick (if autoTick disabled) */
  tick: (deltaMs: number) => void;
}

/**
 * React hook for managing Glyph emotion state.
 *
 * Creates an EmotionController and provides reactive state updates.
 * Automatically handles RAF-based animation when autoTick is true (default).
 *
 * @example
 * ```tsx
 * const { dimensions, visualState, goTo, emit } = useEmotion({
 *   initialAnchor: 'idle',
 *   onChange: (dims) => console.log('Emotion changed:', dims),
 * });
 *
 * // Transition to a named state
 * goTo('thinking');
 *
 * // Handle agent events
 * emit({ type: 'processing_complete' });
 *
 * // Apply visual state to rendering
 * <mesh scale={visualState.scaleFactor}>
 *   <meshStandardMaterial color={`hsl(${visualState.coreHue}, 80%, 50%)`} />
 * </mesh>
 * ```
 */
export function useEmotion(options: UseEmotionOptions = {}): UseEmotionResult {
  const {
    initial,
    initialAnchor,
    microExpressions = true,
    onChange,
    autoTick = true,
  } = options;

  // Create controller ref (stable across renders)
  const controllerRef = useRef<EmotionController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new EmotionController({
      initial,
      initialAnchor,
      microExpressions,
    });
  }

  const controller = controllerRef.current;

  // State for React reactivity
  const [dimensions, setDimensions] = useState<AVO>(controller.getAnimatedDimensions());
  const [baseDimensions, setBaseDimensions] = useState<AVO>(controller.getDimensions());
  const [visualState, setVisualState] = useState<VisualState>(controller.getVisualState());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Store onChange in ref to avoid effect dependency changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Subscribe to controller events
  useEffect(() => {
    const unsub = controller.on('change', (dims) => {
      setBaseDimensions({ ...dims });
      setDimensions(controller.getAnimatedDimensions());
      setVisualState(controller.getVisualState());
      onChangeRef.current?.(dims);
    });

    const unsubStart = controller.on('transitionStart', () => {
      setIsTransitioning(true);
    });

    const unsubEnd = controller.on('transitionEnd', () => {
      setIsTransitioning(false);
    });

    return () => {
      unsub();
      unsubStart();
      unsubEnd();
    };
  }, [controller]);

  // Auto-tick with RAF
  useEffect(() => {
    if (!autoTick) return;

    let lastTime = performance.now();
    let rafId: number;

    const tick = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      controller.tick(delta);
      setDimensions(controller.getAnimatedDimensions());
      setVisualState(controller.getVisualState());

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [controller, autoTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  // Stable callbacks
  const set = useCallback(
    (dims: Partial<AVO>) => {
      controller.setDimensions(dims);
    },
    [controller]
  );

  const transition = useCallback(
    (dims: Partial<AVO>, opts?: TransitionOptions) => {
      controller.transitionTo(dims, opts);
    },
    [controller]
  );

  const goTo = useCallback(
    (anchor: AnchorState, opts?: TransitionOptions) => {
      controller.transitionToAnchor(anchor, opts);
    },
    [controller]
  );

  const emit = useCallback(
    (event: EmotionEvent) => {
      controller.handleEvent(event);
    },
    [controller]
  );

  const tick = useCallback(
    (deltaMs: number) => {
      controller.tick(deltaMs);
    },
    [controller]
  );

  return {
    dimensions,
    baseDimensions,
    visualState,
    set,
    transition,
    goTo,
    emit,
    isTransitioning,
    tick,
  };
}
