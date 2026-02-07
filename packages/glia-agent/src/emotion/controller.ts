// packages/bb-ui/src/emotion/controller.ts

import type {
  AVO,
  AnchorState,
  TransitionOptions,
  EasingFunction,
  EmotionEvent,
  MicroExpressionConfig,
  VisualState,
} from './types.js';
import { ANCHOR_STATES, DEFAULT_AVO, DEFAULT_MICRO_CONFIG, clampAVO } from './constants.js';
import { blendAVO, computeVisualState } from './mapping.js';
import { ease, getTransitionConfig } from './transitions.js';
import { applyMicroExpression } from './micro-expressions.js';

type EventHandler<T> = (data: T) => void;

interface EmotionControllerEvents {
  change: AVO;
  transitionStart: { from: AVO; to: AVO };
  transitionEnd: AVO;
  anchorReached: AnchorState;
}

export interface EmotionControllerOptions {
  initial?: Partial<AVO>;
  initialAnchor?: AnchorState;
  microExpressions?: boolean | MicroExpressionConfig;
}

interface TransitionState {
  from: AVO;
  to: AVO;
  duration: number;
  easing: EasingFunction;
  elapsed: number;
  onComplete?: () => void;
}

/**
 * EmotionController manages the emotional state lifecycle for the Glyph character.
 *
 * It handles:
 * - AVO dimension state (Arousal, Valence, Openness)
 * - Smooth transitions between states with configurable easing
 * - Micro-expression overlays for natural movement
 * - Event-driven state changes from agent behaviors
 * - Visual state computation for rendering
 */
export class EmotionController {
  private _dimensions: AVO;
  private _transition: TransitionState | null = null;
  private _microConfig: MicroExpressionConfig;
  private _time: number = 0;
  private _listeners: Map<keyof EmotionControllerEvents, Set<EventHandler<unknown>>> = new Map();
  private _disposed: boolean = false;

  constructor(options: EmotionControllerOptions = {}) {
    // Initialize dimensions from anchor, custom values, or default
    if (options.initialAnchor) {
      this._dimensions = { ...ANCHOR_STATES[options.initialAnchor] };
    } else if (options.initial) {
      this._dimensions = clampAVO(options.initial);
    } else {
      this._dimensions = { ...DEFAULT_AVO };
    }

    // Initialize micro-expression config
    if (options.microExpressions === false) {
      this._microConfig = { ...DEFAULT_MICRO_CONFIG, enabled: false };
    } else if (typeof options.microExpressions === 'object') {
      this._microConfig = { ...DEFAULT_MICRO_CONFIG, ...options.microExpressions };
    } else {
      this._microConfig = { ...DEFAULT_MICRO_CONFIG };
    }
  }

  /**
   * Get current base dimensions (without micro-expressions)
   */
  getDimensions(): AVO {
    return { ...this._dimensions };
  }

  /**
   * Get current dimensions with micro-expressions applied
   */
  getAnimatedDimensions(): AVO {
    return applyMicroExpression(this._dimensions, this._microConfig, this._time);
  }

  /**
   * Get computed visual state for rendering
   */
  getVisualState(): VisualState {
    return computeVisualState(this.getAnimatedDimensions());
  }

  /**
   * Set dimensions immediately (no transition)
   * Values are clamped to valid 0-1 range
   */
  setDimensions(dims: Partial<AVO>): void {
    this._dimensions = clampAVO({ ...this._dimensions, ...dims });
    this._transition = null;
    this._emit('change', this._dimensions);
  }

  /**
   * Transition to target dimensions over time
   * Auto-calculates duration and easing if not specified
   */
  transitionTo(target: Partial<AVO>, options: TransitionOptions = {}): void {
    const from = { ...this._dimensions };
    const to = clampAVO({ ...this._dimensions, ...target });

    const autoConfig = getTransitionConfig(from, to);

    this._transition = {
      from,
      to,
      duration: options.duration ?? autoConfig.duration,
      easing: options.easing ?? autoConfig.easing,
      elapsed: 0,
      onComplete: options.onComplete,
    };

    this._emit('transitionStart', { from, to });
  }

  /**
   * Transition to a named anchor state
   * Emits anchorReached when transition completes
   */
  transitionToAnchor(anchor: AnchorState, options: TransitionOptions = {}): void {
    this.transitionTo(ANCHOR_STATES[anchor], {
      ...options,
      onComplete: () => {
        this._emit('anchorReached', anchor);
        options.onComplete?.();
      },
    });
  }

  /**
   * Handle emotion events from agent behaviors
   * Maps event types to appropriate anchor transitions
   */
  handleEvent(event: EmotionEvent): void {
    const intensity = event.intensity ?? 0.5;

    switch (event.type) {
      case 'input_received':
        this.transitionToAnchor('listening');
        break;
      case 'processing_start':
        this.transitionToAnchor('thinking');
        break;
      case 'processing_complete':
        this.transitionToAnchor('responding');
        break;
      case 'error_occurred':
        this.transitionToAnchor(intensity > 0.7 ? 'error' : 'concerned');
        break;
      case 'success':
        this.transitionToAnchor(intensity > 0.7 ? 'proud' : 'satisfied');
        break;
      case 'user_idle':
        this.transitionToAnchor('idle', { duration: 2000 });
        break;
      case 'interrupt':
        this.setDimensions({ arousal: Math.min(this._dimensions.arousal + 0.2, 1) });
        break;
    }
  }

  /**
   * Blend toward target dimensions by a factor (0-1)
   * Useful for continuous input-driven changes
   */
  blendToward(target: Partial<AVO>, factor: number): void {
    const to = clampAVO({ ...this._dimensions, ...target });
    this._dimensions = blendAVO(this._dimensions, to, factor);
    this._emit('change', this._dimensions);
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this._transition !== null;
  }

  /**
   * Cancel current transition, keeping current position
   */
  cancelTransition(): void {
    this._transition = null;
  }

  /**
   * Subscribe to controller events
   * Returns unsubscribe function
   */
  on<K extends keyof EmotionControllerEvents>(
    event: K,
    handler: EventHandler<EmotionControllerEvents[K]>
  ): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(handler as EventHandler<unknown>);

    return () => {
      this._listeners.get(event)?.delete(handler as EventHandler<unknown>);
    };
  }

  /**
   * Update tick - call each frame with delta time in milliseconds
   * Advances transitions and micro-expression time
   */
  tick(deltaMs: number): void {
    if (this._disposed) return;

    this._time += deltaMs / 1000;

    if (this._transition) {
      this._transition.elapsed += deltaMs;
      // Handle duration 0 as immediate transition
      const progress = this._transition.duration <= 0
        ? 1
        : Math.min(this._transition.elapsed / this._transition.duration, 1);
      const easedProgress = ease(this._transition.easing, progress);

      this._dimensions = blendAVO(this._transition.from, this._transition.to, easedProgress);
      this._emit('change', this._dimensions);

      if (progress >= 1) {
        const onComplete = this._transition.onComplete;
        this._transition = null;
        this._emit('transitionEnd', this._dimensions);
        onComplete?.();
      }
    }
  }

  /**
   * Dispose controller and clean up resources
   */
  dispose(): void {
    this._disposed = true;
    this._listeners.clear();
    this._transition = null;
  }

  private _emit<K extends keyof EmotionControllerEvents>(
    event: K,
    data: EmotionControllerEvents[K]
  ): void {
    this._listeners.get(event)?.forEach((handler) => handler(data));
  }
}
