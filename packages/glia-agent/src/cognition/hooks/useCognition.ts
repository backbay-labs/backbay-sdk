'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AVO, AnchorState } from '../../emotion/types.js';
import type { CognitionState, CognitionEvent } from '../types.js';
import { CognitionController, type CognitionControllerOptions, type EmotionTarget } from '../controller.js';

export interface UseCognitionOptions extends CognitionControllerOptions {
  onChange?: (state: CognitionState) => void;
  autoTick?: boolean;
}

export interface UseCognitionResult {
  state: CognitionState;
  emotion: EmotionTarget;
  handleEvent: (event: CognitionEvent) => void;
  tick: (deltaMs: number) => void;
  /** @deprecated Use handleEvent instead */
  emit: (event: CognitionEvent) => void;
}

/**
 * React hook for managing Glyph cognition state.
 *
 * Creates a CognitionController and provides reactive state updates.
 * Automatically handles RAF-based animation when autoTick is true (default).
 *
 * @example
 * ```tsx
 * const { state, emotion, emit, tick } = useCognition({
 *   initial: { mode: 'idle' },
 *   onChange: (state) => console.log('Cognition changed:', state),
 * });
 *
 * // Handle agent events
 * emit({ type: 'run.started', runId: 'r1' });
 *
 * // Access emotion bridge for rendering
 * console.log(emotion.anchor, emotion.avo);
 * ```
 */
export function useCognition(options: UseCognitionOptions = {}): UseCognitionResult {
  const { initial, onChange, autoTick = true } = options;

  // Create controller ref (stable across renders)
  const controllerRef = useRef<CognitionController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new CognitionController({ initial });
  }

  const controller = controllerRef.current;

  // State for React reactivity
  const [state, setState] = useState<CognitionState>(controller.getState());
  const [emotion, setEmotion] = useState<EmotionTarget>(
    controller.getEmotionTarget()
  );

  // Store onChange in ref to avoid effect dependency changes
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Subscribe to controller events
  useEffect(() => {
    const unsub = controller.on('change', (newState) => {
      setState({ ...newState });
      setEmotion(controller.getEmotionTarget());
      onChangeRef.current?.(newState);
    });

    return () => {
      unsub();
    };
  }, [controller]);

  // Auto-tick with RAF
  useEffect(() => {
    if (!autoTick) return;

    let lastTime = performance.now();
    let rafId: number;

    const tickFn = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      controller.tick(delta);

      rafId = requestAnimationFrame(tickFn);
    };

    rafId = requestAnimationFrame(tickFn);

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
  const handleEvent = useCallback(
    (event: CognitionEvent) => {
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

  // Deprecated alias for backwards compatibility
  const emit = handleEvent;

  return {
    state,
    emotion,
    handleEvent,
    tick,
    emit,
  };
}
